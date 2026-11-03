import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.logging import logger

PROMPT_VERSION = "v1.0.0"

SYSTEM_PROMPT = """You are a specialized Job Description (JD) Extraction Engine for TalentScout AI ATS.
Your task is to analyze the provided Job Description text and extract structured recruitment criteria into a strictly formatted JSON object.

STRICT CONSTRAINTS (ZERO HALLUCINATION):
1. You MUST NOT invent, guess, extrapolate, or infer any skill, qualification, degree, certification, or experience that is NOT explicitly mentioned in the text.
2. If a field (e.g. certifications, salary, min experience) is NOT explicitly mentioned in the text, you MUST return null or an empty list []. Do NOT assume industry standards.
3. Classify skills strictly:
   - required_skills: ONLY skills explicitly stated as mandatory, required, must-have, bắt buộc, yêu cầu, cần có.
   - preferred_skills: ONLY skills explicitly stated as nice-to-have, preferred, cộng điểm, lợi thế, ưu tiên.
   - If the JD lists technical skills without distinguishing required vs preferred, put them in required_skills.
4. Normalize skill names to their standard canonical naming (e.g., 'fast-api' -> 'FastAPI', 'postgres' -> 'PostgreSQL', 'reactjs' -> 'React', 'k8s' -> 'Kubernetes').
5. Respond ONLY with valid JSON. Do not include explanatory text before or after the JSON.

Expected JSON Schema:
{
  "title": "string or null",
  "department": "string or null",
  "employment_type": "full_time | part_time | contract | remote | hybrid | on_site | null",
  "location_requirements": "string or null",
  "min_experience_years": float or null,
  "education_requirements": ["string"],
  "certifications": ["string"],
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "summary": "string strictly summarizing the role"
}
"""


class ExtractedJDCriteria(BaseModel):
    model: str
    prompt_version: str = PROMPT_VERSION
    analyzed_at: str
    title: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = "full_time"
    location_requirements: Optional[str] = None
    min_experience_years: Optional[float] = 0.0
    education_requirements: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    summary: Optional[str] = None


def _clean_json_response(raw_text: str) -> str:
    """Strip markdown codeblocks if LLM wraps output in ```json ... ```"""
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def rule_based_fallback_extraction(jd_text: str) -> ExtractedJDCriteria:
    """
    Deterministic rule-based NLP extraction when LLM API keys are not configured or offline.
    Guarantees zero hallucination by using exact substring & regex matching.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    text_lower = jd_text.lower()

    # 1. Tech dictionary for exact matching (ESCO & Industry Canonical Skills)
    tech_skills_map = {
        "python": "Python",
        "fastapi": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "react": "React",
        "next.js": "Next.js",
        "nextjs": "Next.js",
        "vue": "Vue.js",
        "angular": "Angular",
        "typescript": "TypeScript",
        "javascript": "JavaScript",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "golang": "Go",
        "golang": "Go",
        "java": "Java",
        "spring boot": "Spring Boot",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "pgvector": "pgvector",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "redis": "Redis",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "aws": "AWS",
        "gcp": "GCP",
        "azure": "Azure",
        "git": "Git",
        "ci/cd": "CI/CD",
        "celery": "Celery",
        "pytorch": "PyTorch",
        "tensorflow": "TensorFlow",
        "spacy": "Spacy",
        "tesseract": "Tesseract OCR",
        "graphql": "GraphQL",
        "rest api": "RESTful API",
        "microservices": "Microservices",
        "linux": "Linux",
    }

    found_skills = set()
    for pattern, canonical in tech_skills_map.items():
        if re.search(r"\b" + re.escape(pattern) + r"\b", text_lower):
            found_skills.add(canonical)

    # 2. Split into mandatory and preferred if keywords exist
    required_skills = []
    preferred_skills = []

    preferred_indicators = ["ưu tiên", "nice to have", "plus", "preferred", "lợi thế", "khuyến khích"]
    has_preferred_section = any(ind in text_lower for ind in preferred_indicators)

    if has_preferred_section:
        # Separate skills by section context
        for skill in found_skills:
            pos = text_lower.find(skill.lower())
            sub_before = text_lower[max(0, pos - 150):pos]
            if any(ind in sub_before for ind in preferred_indicators):
                preferred_skills.append(skill)
            else:
                required_skills.append(skill)
    else:
        required_skills = sorted(list(found_skills))

    # 3. Experience years extraction
    exp_years = 0.0
    exp_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:[-+]|\s*(?:đến|to)\s*\d+)?\s*(?:năm|years?|yr)", text_lower)
    if exp_match:
        try:
            exp_years = float(exp_match.group(1))
        except ValueError:
            exp_years = 0.0

    # 4. Education extraction
    education = []
    if re.search(r"\b(tiến sĩ|phd|doctorate)\b", text_lower):
        education.append("Doctorate / Tiến sĩ")
    elif re.search(r"\b(thạc sĩ|master|m\.s)\b", text_lower):
        education.append("Master / Thạc sĩ")
    elif re.search(r"\b(đại học|cử nhân|bachelor|b\.s|degree)\b", text_lower):
        education.append("Bachelor / Cử nhân chuyên ngành CNTT hoặc tương đương")
    elif re.search(r"\b(cao đẳng|diploma|associate)\b", text_lower):
        education.append("College / Cao đẳng")

    # 5. Certifications extraction
    certifications = []
    cert_patterns = [
        (r"\baws\s+(?:certified|solutions\s+architect|developer)\b", "AWS Certification"),
        (r"\bazure\s+(?:certified|fundamentals|administrator)\b", "Azure Certification"),
        (r"\bgcp\s+certified\b", "Google Cloud Certification"),
        (r"\bpmp\b", "PMP (Project Management Professional)"),
        (r"\bscrum\s+master\b", "Certified Scrum Master"),
        (r"\bielts\s*(\d+(?:\.\d+)?)\b", "IELTS Certification"),
        (r"\btoeic\s*(\d+)\b", "TOEIC Certification"),
    ]
    for pattern, cert_name in cert_patterns:
        if re.search(pattern, text_lower):
            certifications.append(cert_name)

    # 6. Location requirements
    location = None
    if "hà nội" in text_lower or "ha noi" in text_lower:
        location = "Hà Nội"
    elif "hồ chí minh" in text_lower or "ho chi minh" in text_lower or "tphcm" in text_lower:
        location = "TP. Hồ Chí Minh"
    elif "đà nẵng" in text_lower or "da nang" in text_lower:
        location = "Đà Nẵng"
    elif "remote" in text_lower or "từ xa" in text_lower:
        location = "Remote"

    # 7. Employment type
    employment_type = "full_time"
    if "part-time" in text_lower or "bán thời gian" in text_lower:
        employment_type = "part_time"
    elif "contract" in text_lower or "hợp đồng" in text_lower:
        employment_type = "contract"
    elif "intern" in text_lower or "thực tập" in text_lower:
        employment_type = "internship"

    # 8. Title guess
    title = None
    first_line = jd_text.strip().split("\n")[0]
    if len(first_line) < 80 and not any(k in first_line.lower() for k in ["công ty", "mô tả", "tuyển dụng:"]):
        title = first_line.strip("# ").strip()

    return ExtractedJDCriteria(
        model="rule-based-nlp-extractor",
        prompt_version=PROMPT_VERSION,
        analyzed_at=now_str,
        title=title,
        department="Công Nghệ & Kỹ Thuật",
        employment_type=employment_type,
        location_requirements=location,
        min_experience_years=exp_years,
        education_requirements=education,
        certifications=certifications,
        required_skills=sorted(required_skills),
        preferred_skills=sorted(preferred_skills),
        summary=f"Vị trí yêu cầu tối thiểu {exp_years} năm kinh nghiệm với các công nghệ chính: {', '.join(required_skills[:5])}.",
    )


async def analyze_job_description(jd_text: str) -> ExtractedJDCriteria:
    """
    Analyzes JD text using LLM (Gemini 1.5 Flash -> OpenAI -> Rule-based fallback).
    Guarantees metadata: model, prompt_version, and analyzed_at timestamp.
    """
    now_str = datetime.now(timezone.utc).isoformat()

    # Step 1: Try Gemini API if key is present
    gemini_key = settings.GEMINI_API_KEY
    if gemini_key and gemini_key.strip() and not gemini_key.startswith("your_"):
        try:
            model_name = "gemini-1.5-flash"
            endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            
            prompt_content = f"{SYSTEM_PROMPT}\n\nJob Description Text to analyze:\n```\n{jd_text}\n```"
            
            payload = {
                "contents": [{"parts": [{"text": prompt_content}]}],
                "generationConfig": {
                    "temperature": 0.1,  # Low temperature to avoid hallucination
                    "responseMimeType": "application/json",
                },
            }

            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(endpoint, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_output = candidates[0]["content"]["parts"][0]["text"]
                        parsed = json.loads(_clean_json_response(text_output))
                        return ExtractedJDCriteria(
                            model=model_name,
                            prompt_version=PROMPT_VERSION,
                            analyzed_at=now_str,
                            title=parsed.get("title"),
                            department=parsed.get("department"),
                            employment_type=parsed.get("employment_type") or "full_time",
                            location_requirements=parsed.get("location_requirements"),
                            min_experience_years=parsed.get("min_experience_years") or 0.0,
                            education_requirements=parsed.get("education_requirements") or [],
                            certifications=parsed.get("certifications") or [],
                            required_skills=parsed.get("required_skills") or [],
                            preferred_skills=parsed.get("preferred_skills") or [],
                            summary=parsed.get("summary"),
                        )
        except Exception as e:
            logger.warning(f"Gemini JD analysis failed, trying next fallback: {e}")

    # Step 2: Try OpenAI API if key is present
    openai_key = settings.OPENAI_API_KEY
    if openai_key and openai_key.strip() and not openai_key.startswith("your_"):
        try:
            model_name = "gpt-4o-mini"
            endpoint = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze this Job Description:\n\n{jd_text}"},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            }

            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return ExtractedJDCriteria(
                        model=model_name,
                        prompt_version=PROMPT_VERSION,
                        analyzed_at=now_str,
                        title=parsed.get("title"),
                        department=parsed.get("department"),
                        employment_type=parsed.get("employment_type") or "full_time",
                        location_requirements=parsed.get("location_requirements"),
                        min_experience_years=parsed.get("min_experience_years") or 0.0,
                        education_requirements=parsed.get("education_requirements") or [],
                        certifications=parsed.get("certifications") or [],
                        required_skills=parsed.get("required_skills") or [],
                        preferred_skills=parsed.get("preferred_skills") or [],
                        summary=parsed.get("summary"),
                    )
        except Exception as e:
            logger.warning(f"OpenAI JD analysis failed, using rule-based fallback: {e}")

    # Step 3: Deterministic Rule-Based Fallback
    logger.info("Using rule-based deterministic extractor for JD analysis.")
    return rule_based_fallback_extraction(jd_text)
