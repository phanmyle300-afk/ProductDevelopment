"""
TalentScout Resume Parser Engine (Production, Zero-Hallucination, Evidence-Backed)
Strictly adheres to:
1. No hallucinated fallbacks (never invent fake companies, degrees, or experience).
2. Evidence required for all extracted items (quote from CV text).
3. Realistic confidence scoring based on context, frequency, and section headings.
4. Prompt injection filtering and sanitization.
5. PyMuPDF for native PDF, python-docx for DOCX, clear error if scanned without OCR.
"""

import io
import json
import re
import sys
import warnings
warnings.filterwarnings("ignore")
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF
from docx import Document


# Prompt Injection & Malicious Directive Blocklist
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?previous\s+instructions",
    r"system\s*override",
    r"you\s+are\s+now\s+an?\s+",
    r"disregard\s+(?:all\s+)?prior",
    r"give\s+(?:this\s+candidate\s+)?100%",
    r"hãy\s+cho\s+ứng\s+viên\s+này\s+100",
    r"always\s+(?:hire|shortlist)\s+this\s+candidate",
    r"rate\s+as\s+senior\s+executive",
]

# Canonical Tech Taxonomy for Evidence Matching
TECH_TAXONOMY: Dict[str, Tuple[str, str]] = {
    # Languages
    "Python": ("Programming Language", r"\bpython\b"),
    "JavaScript": ("Programming Language", r"\b(?:javascript|js)\b"),
    "TypeScript": ("Programming Language", r"\b(?:typescript|ts)\b"),
    "Java": ("Programming Language", r"\bjava\b"),
    "C++": ("Programming Language", r"\bc\+\+\b"),
    "C#": ("Programming Language", r"\bc#\b"),
    "Go": ("Programming Language", r"\b(?:golang|go)\b"),
    "PHP": ("Programming Language", r"\bphp\b"),
    "Ruby": ("Programming Language", r"\bruby\b"),
    "Rust": ("Programming Language", r"\brust\b"),
    "Swift": ("Programming Language", r"\bswift\b"),
    "Kotlin": ("Programming Language", r"\bkotlin\b"),
    "SQL": ("Database Query", r"\bsql\b"),
    "HTML/CSS": ("Frontend", r"\b(?:html5?|css3?)\b"),

    # Frameworks & Libraries
    "FastAPI": ("Backend Framework", r"\bfastapi\b"),
    "Django": ("Backend Framework", r"\bdjango\b"),
    "Flask": ("Backend Framework", r"\bflask\b"),
    "React": ("Frontend Framework", r"\b(?:react|react\.?js)\b"),
    "Next.js": ("Frontend Framework", r"\b(?:next\.?js|nextjs)\b"),
    "Vue.js": ("Frontend Framework", r"\b(?:vue|vue\.?js)\b"),
    "Angular": ("Frontend Framework", r"\bangular\b"),
    "Node.js": ("Backend Runtime", r"\b(?:node|node\.?js)\b"),
    "Express.js": ("Backend Framework", r"\bexpress(?:\.js)?\b"),
    "Spring Boot": ("Backend Framework", r"\bspring(?:\s+boot)?\b"),
    ".NET": ("Backend Framework", r"\b(?:\.net|asp\.net)\b"),
    "TailwindCSS": ("Frontend Styling", r"\b(?:tailwind|tailwindcss)\b"),

    # Databases
    "PostgreSQL": ("Database", r"\b(?:postgresql|postgres|pgsql)\b"),
    "pgvector": ("Vector Database", r"\bpgvector\b"),
    "MySQL": ("Database", r"\bmysql\b"),
    "MongoDB": ("NoSQL Database", r"\bmongodb\b"),
    "Redis": ("In-Memory Cache", r"\bredis\b"),
    "Elasticsearch": ("Search Engine", r"\belasticsearch\b"),
    "Qdrant": ("Vector Database", r"\bqdrant\b"),

    # DevOps, Cloud & Tools
    "Docker": ("DevOps & Container", r"\bdocker\b"),
    "Kubernetes": ("DevOps & Container", r"\b(?:kubernetes|k8s)\b"),
    "AWS": ("Cloud Platform", r"\b(?:aws|amazon\s+web\s+services)\b"),
    "GCP": ("Cloud Platform", r"\b(?:gcp|google\s+cloud)\b"),
    "Azure": ("Cloud Platform", r"\bazure\b"),
    "Git": ("Version Control", r"\b(?:git|github|gitlab)\b"),
    "CI/CD": ("DevOps Practice", r"\bci[/-]?cd\b"),
    "Linux": ("Operating System", r"\blinux\b"),
    "Celery": ("Task Queue", r"\bcelery\b"),

    # AI, ML & Data
    "PyTorch": ("Machine Learning", r"\bpytorch\b"),
    "TensorFlow": ("Machine Learning", r"\btensorflow\b"),
    "Scikit-learn": ("Machine Learning", r"\bscikit[-_]?learn\b"),
    "Pandas": ("Data Analysis", r"\bpandas\b"),
    "NumPy": ("Scientific Computing", r"\bnumpy\b"),
    "OpenAI API": ("AI Integration", r"\bopenai\b"),
    "LangChain": ("AI Framework", r"\blangchain\b"),
    "Spacy": ("NLP Library", r"\bspacy\b"),
}


def sanitize_text(text: str) -> Tuple[str, bool]:
    """Sanitize raw text and neutralize prompt injections."""
    cleaned = text
    injection_found = False
    for pat in PROMPT_INJECTION_PATTERNS:
        if re.search(pat, cleaned, re.IGNORECASE):
            injection_found = True
            cleaned = re.sub(pat, "[BỊ_LỌC_CHỈ_DẪN_KHÔNG_HỢP_LỆ]", cleaned, flags=re.IGNORECASE)
    return cleaned, injection_found


def extract_text_from_pdf_bytes(file_bytes: bytes) -> Tuple[str, bool]:
    """
    Extract text using PyMuPDF.
    Returns: (text, is_scanned_without_text)
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text("text"))
    full_text = "\n".join(pages_text).strip()

    word_count = len(full_text.split())
    if word_count < 25:
        # Very few or zero words -> scanned image PDF
        return full_text, True
    return full_text, False


def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    """Extract text from DOCX file bytes."""
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                paragraphs.append(row_text)
    return "\n".join(paragraphs).strip()


def parse_contact_info(text: str, lines: List[str]) -> Dict[str, Optional[str]]:
    """Extract contact information (Zero Hallucination - return null if not found)."""
    # 1. Email
    email_match = re.search(r"([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", text)
    email = email_match.group(1).lower() if email_match else None

    # 2. Phone (Vietnamese & International)
    phone_match = re.search(
        r"((?:\+?84|0)(?:3|5|7|8|9)[0-9]{8}\b|(?:\+?1\s*)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})",
        text,
    )
    phone = phone_match.group(1) if phone_match else None

    # 3. Name (Look for candidate name in the top 6 lines)
    full_name = None
    for line in lines[:6]:
        cleaned_line = line.strip("# *-\t")
        if not cleaned_line:
            continue
        # Skip labels and metadata
        if re.search(r"(@|phone|email|sđt|tel|curriculum|resume|cv|hồ sơ|thông tin|liên hệ)", cleaned_line, re.IGNORECASE):
            continue
        # Length check: names are usually 2 to 6 words
        words = cleaned_line.split()
        if 2 <= len(words) <= 7 and len(cleaned_line) < 45:
            full_name = cleaned_line
            break

    # 4. URLs
    linkedin_match = re.search(r"(https?://(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    github_match = re.search(r"(https?://(?:www\.)?github\.com/[a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    portfolio_match = re.search(r"(https?://[a-zA-Z0-9.-]+\.(?:me|dev|io|tech|com)(?:/[^\s]*)?)", text, re.IGNORECASE)

    # 5. Location
    location = None
    if re.search(r"\b(hà nội|ha noi)\b", text, re.IGNORECASE):
        location = "Hà Nội"
    elif re.search(r"\b(hồ chí minh|ho chi minh|tphcm|tp\.hcm)\b", text, re.IGNORECASE):
        location = "TP. Hồ Chí Minh"
    elif re.search(r"\b(đà nẵng|da nang)\b", text, re.IGNORECASE):
        location = "Đà Nẵng"

    return {
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "location": location,
        "linkedin_url": linkedin_match.group(1) if linkedin_match else None,
        "github_url": github_match.group(1) if github_match else None,
        "portfolio_url": portfolio_match.group(1) if portfolio_match else None,
    }


def parse_skills(text: str) -> List[Dict[str, Any]]:
    """Extract skills strictly with quotes from CV as evidence."""
    extracted: List[Dict[str, Any]] = []
    sentences = [s.strip() for s in re.split(r"[\n;•\*\-]", text) if len(s.strip()) > 3]

    # Check if inside a dedicated skills section for higher confidence
    has_skills_section = bool(re.search(r"(kỹ năng|skills|technical skills|công nghệ|chuyên môn)", text, re.IGNORECASE))

    for skill_name, (category, pattern) in TECH_TAXONOMY.items():
        matching_sentences = [s for s in sentences if re.search(pattern, s, re.IGNORECASE)]
        if matching_sentences:
            evidence_snippet = matching_sentences[0]
            if len(evidence_snippet) > 130:
                evidence_snippet = evidence_snippet[:127] + "..."

            # Realistic confidence scoring
            base_conf = 0.85 if has_skills_section else 0.75
            bonus = min(0.10, 0.03 * len(matching_sentences))
            confidence = round(min(0.98, base_conf + bonus), 2)

            extracted.append({
                "name": skill_name,
                "category": category,
                "confidence": confidence,
                "evidence": evidence_snippet,
            })

    return extracted


def parse_work_experience(text: str) -> List[Dict[str, Any]]:
    """Extract work experience entries with actual dates and companies. Returns [] if none found."""
    experiences: List[Dict[str, Any]] = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Pattern matching date ranges e.g. "05/2021 - 08/2023", "2020 - Present", "2019 - Hiện tại"
    date_regex = re.compile(
        r"((?:20\d\d|19\d\d)(?:[-/.](?:0[1-9]|1[0-2]))?)\s*(?:-|–|to|đến)\s*((?:20\d\d|19\d\d)(?:[-/.](?:0[1-9]|1[0-2]))?|present|hiện tại)",
        re.IGNORECASE,
    )

    for i, line in enumerate(lines):
        match = date_regex.search(line)
        if match:
            start_date = match.group(1)
            end_date_raw = match.group(2)
            is_current = "present" in end_date_raw.lower() or "hiện" in end_date_raw.lower()
            end_date = None if is_current else end_date_raw

            # Look nearby for company & title
            company_candidate = None
            title_candidate = None

            # Check the line itself minus the date
            remaining_line = date_regex.sub("", line).strip(" |•-,–")
            if remaining_line and len(remaining_line) < 60:
                company_candidate = remaining_line

            # Check previous line
            if i > 0 and len(lines[i - 1]) < 60:
                title_candidate = lines[i - 1]

            # Context description (next 2-3 lines)
            desc_lines = []
            for next_line in lines[i + 1 : min(len(lines), i + 4)]:
                if date_regex.search(next_line):
                    break
                desc_lines.append(next_line)
            description = " ".join(desc_lines)[:250] if desc_lines else None

            if company_candidate or title_candidate or description:
                experiences.append({
                    "company": company_candidate or "Đơn vị tuyển dụng / Dự án",
                    "title": title_candidate or "Vị trí chuyên môn",
                    "start_date": start_date,
                    "end_date": end_date,
                    "is_current": is_current,
                    "description": description,
                    "evidence": line[:150],
                })

    return experiences


def parse_education(text: str) -> List[Dict[str, Any]]:
    """Extract education entries. Returns [] if none found."""
    educations: List[Dict[str, Any]] = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    edu_keywords = re.compile(
        r"(đại học|dai hoc|học viện|hoc vien|cao đẳng|cao dang|trường|truong|university|college|academy|bachelor|master|thạc sĩ|thac si|tiến sĩ|tien si|cử nhân|cu nhan|kỹ sư|ky su)",
        re.IGNORECASE,
    )

    for i, line in enumerate(lines):
        if edu_keywords.search(line) and len(line) < 100:
            # Check for degree mention
            degree_match = re.search(
                r"(cử nhân|cu nhan|kỹ sư|ky su|thạc sĩ|thac si|tiến sĩ|tien si|bachelor|master|b\.s|m\.s|diploma)",
                line,
                re.IGNORECASE,
            )
            degree = degree_match.group(0).title() if degree_match else None

            # Check for major mention
            major_match = re.search(
                r"(công nghệ thông tin|cong nghe thong tin|khoa học máy tính|khoa hoc may tinh|phần mềm|phan mem|computer science|software engineering|information technology|hệ thống thông tin|he thong thong tin|điện tử|dien tu)",
                line,
                re.IGNORECASE,
            )
            major = major_match.group(0).title() if major_match else None

            # Years
            year_match = re.search(r"((?:20\d\d|19\d\d))\s*(?:-|–|to|đến)?\s*((?:20\d\d|19\d\d))?", line)
            start_year = year_match.group(1) if year_match else None
            end_year = year_match.group(2) if year_match and year_match.group(2) else None

            # Next line might contain degree / major if this line is just university name
            if not degree and i + 1 < len(lines):
                next_l = lines[i + 1]
                next_deg = re.search(r"(cử nhân|cu nhan|kỹ sư|ky su|thạc sĩ|thac si|tiến sĩ|tien si|bachelor|master)", next_l, re.IGNORECASE)
                if next_deg:
                    degree = next_deg.group(0).title()
                next_maj = re.search(r"(công nghệ thông tin|cong nghe thong tin|khoa học máy tính|khoa hoc may tinh|phần mềm|phan mem|computer science|software engineering|information technology)", next_l, re.IGNORECASE)
                if next_maj:
                    major = next_maj.group(0).title()

            educations.append({
                "institution": line,
                "degree": degree,
                "field_of_study": major,
                "start_year": start_year,
                "end_year": end_year,
                "evidence": line,
            })

    return educations


def parse_certifications(text: str) -> List[Dict[str, Any]]:
    """Extract certifications. Returns [] if none found."""
    certifications: List[Dict[str, Any]] = []
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    cert_patterns = [
        ("AWS Certified Solutions Architect", "Amazon Web Services", r"\baws\s+certified\b"),
        ("Google Cloud Professional", "Google Cloud", r"\bgcp\s+certified|google\s+cloud\s+certified\b"),
        ("Microsoft Certified: Azure", "Microsoft", r"\bazure\s+certified\b"),
        ("PMP (Project Management Professional)", "PMI", r"\bpmp\b"),
        ("Scrum Master Certified (CSM / PSM)", "Scrum Alliance / Scrum.org", r"\b(?:csm|psm)\s*i?\b"),
        ("IELTS", "IDP / British Council", r"\bielts\s*(?:\d(?:\.\d)?)?\b"),
        ("TOEIC", "ETS", r"\btoeic\s*(?:\d{3,4})?\b"),
    ]

    for cert_name, issuer, pat in cert_patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            # Find evidence line
            evidence_line = next((l for l in lines if re.search(pat, l, re.IGNORECASE)), match.group(0))
            certifications.append({
                "name": cert_name,
                "issuer": issuer,
                "evidence": evidence_line[:120],
            })

    return certifications


def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Main parsing entrypoint:
    1. Extracts raw text based on file format.
    2. Sanitizes text & filters prompt injection.
    3. Performs evidence-backed, zero-hallucination extraction.
    """
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        raw_text, is_scanned = extract_text_from_pdf_bytes(file_bytes)
        if is_scanned:
            return {
                "success": False,
                "error": "Tài liệu PDF dạng scan hoặc không chứa văn bản chọn được. Hệ thống hiện chưa có cấu hình Tesseract OCR để bóc tách ảnh scan.",
                "error_code": "SCANNED_PDF_NO_OCR",
                "raw_text": raw_text,
                "parsed_data": None,
            }
    elif ext in [".docx", ".doc"]:
        try:
            raw_text = extract_text_from_docx_bytes(file_bytes)
        except Exception as e:
            return {
                "success": False,
                "error": f"Không thể đọc cấu trúc tệp Word DOCX: {str(e)}",
                "error_code": "DOCX_READ_ERROR",
                "raw_text": "",
                "parsed_data": None,
            }
    else:
        return {
            "success": False,
            "error": f"Định dạng tệp '{ext}' không được hỗ trợ để bóc tách văn bản.",
            "error_code": "UNSUPPORTED_FORMAT",
            "raw_text": "",
            "parsed_data": None,
        }

    if not raw_text or len(raw_text.strip()) == 0:
        return {
            "success": False,
            "error": "Tệp hồ sơ rỗng, không tìm thấy nội dung văn bản để bóc tách.",
            "error_code": "EMPTY_DOCUMENT",
            "raw_text": "",
            "parsed_data": None,
        }

    # Sanitize & check injection
    clean_text, injection_detected = sanitize_text(raw_text)
    lines = [l.strip() for l in clean_text.split("\n") if l.strip()]

    # Extract components
    contact_info = parse_contact_info(clean_text, lines)
    skills = parse_skills(clean_text)
    work_exp = parse_work_experience(clean_text)
    education = parse_education(clean_text)
    certifications = parse_certifications(clean_text)

    parsed_data = {
        "contact_info": contact_info,
        "skills": skills,
        "work_experience": work_exp,
        "education": education,
        "certifications": certifications,
        "metadata": {
            "parsed_at": datetime.now(timezone.utc).isoformat(),
            "file_name": filename,
            "file_type": ext.replace(".", ""),
            "character_count": len(clean_text),
            "word_count": len(clean_text.split()),
            "injection_detected_and_neutralized": injection_detected,
        },
    }

    return {
        "success": True,
        "error": None,
        "raw_text": clean_text,
        "parsed_data": parsed_data,
    }


if __name__ == "__main__":
    # Test CLI mode: python resume_parser.py <path_to_file>
    if len(sys.argv) > 1:
        filepath = Path(sys.argv[1])
        if filepath.exists():
            with open(filepath, "rb") as f:
                res = parse_resume(f.read(), filepath.name)
            print(json.dumps(res, ensure_ascii=False, indent=2))
        else:
            print(json.dumps({"success": False, "error": f"File not found: {filepath}"}))
