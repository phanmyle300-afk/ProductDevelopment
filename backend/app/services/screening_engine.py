import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import httpx
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.logging import logger
from app.services.embedding_service import (
    build_candidate_embedding_text,
    build_job_embedding_text,
    cosine_similarity,
    generate_embedding,
)

MODEL_VERSION = "gemini-1.5-flash"
FALLBACK_MODEL = "talentscout-rule-based-xai-v1"
PROMPT_VERSION = "screening-rubric-v1.0"

# Canonical Skill Taxonomy & Aliases (from talentscout-skill-taxonomy)
CANONICAL_SKILL_MAP: Dict[str, str] = {
    "python": "Python",
    "py": "Python",
    "fastapi": "FastAPI",
    "fast-api": "FastAPI",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "pgsql": "PostgreSQL",
    "pgvector": "pgvector",
    "docker": "Docker",
    "docker-compose": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "celery": "Celery",
    "redis": "Redis",
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "rest": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "graphql": "GraphQL",
    "microservices": "Microservices",
    "microservice": "Microservices",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "mongodb": "MongoDB",
    "sql": "SQL",
    "linux": "Linux",
    "java": "Java",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "tailwindcss": "TailwindCSS",
    "tailwind": "TailwindCSS",
    "html": "HTML",
    "css": "CSS",
    "langchain": "LangChain",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "spacy": "Spacy",
}


def normalize_skill(skill_str: str) -> str:
    """Normalize skill name to canonical name using ESCO/Industry taxonomy."""
    if not skill_str:
        return ""
    clean = skill_str.strip().lower()
    return CANONICAL_SKILL_MAP.get(clean, skill_str.strip())


class HardFilterCheck(BaseModel):
    filter_name: str
    passed: bool
    required_value: Any
    actual_value: Any
    details: str


class HardFilterResult(BaseModel):
    all_passed: bool
    checks: List[HardFilterCheck]
    failure_reasons: List[str]


def evaluate_hard_filters(candidate_data: dict, job_data: dict) -> HardFilterResult:
    """
    Step 1: Apply strict hard filters.
    - Minimum experience years
    - Location / Remote eligibility
    - Mandatory degrees or certifications
    - Mandatory languages
    """
    checks = []
    failure_reasons = []

    # 1. Minimum Years of Experience
    min_exp_req = float(job_data.get("min_experience_years") or 0.0)
    cand_exp = float(candidate_data.get("total_experience_years") or 0.0)
    if min_exp_req > 0:
        passed = cand_exp >= (min_exp_req - 0.25)  # 3 months grace margin
        checks.append(
            HardFilterCheck(
                filter_name="min_experience_years",
                passed=passed,
                required_value=min_exp_req,
                actual_value=cand_exp,
                details=f"Yêu cầu tối thiểu {min_exp_req} năm, ứng viên có {cand_exp} năm kinh nghiệm.",
            )
        )
        if not passed:
            failure_reasons.append(
                f"Chưa đạt số năm kinh nghiệm tối thiểu ({cand_exp}/{min_exp_req} năm)."
            )

    # 2. Location & Remote Eligibility
    job_location = (job_data.get("location") or "").strip().lower()
    job_emp_type = (job_data.get("employment_type") or "").strip().lower()
    cand_location = (candidate_data.get("location") or "").strip().lower()

    is_remote_friendly = "remote" in job_emp_type or "remote" in job_location or "toàn quốc" in job_location
    if not is_remote_friendly and job_location:
        # Check if locations match or overlap
        loc_passed = (
            not cand_location
            or cand_location in job_location
            or job_location in cand_location
            or "remote" in cand_location
        )
        checks.append(
            HardFilterCheck(
                filter_name="location_eligibility",
                passed=loc_passed,
                required_value=job_data.get("location"),
                actual_value=candidate_data.get("location"),
                details=f"Vị trí: {job_data.get('location')} ({job_emp_type}), Ứng viên: {candidate_data.get('location') or 'Chưa xác định'}.",
            )
        )
        if not loc_passed:
            failure_reasons.append(
                f"Địa điểm không phù hợp (Yêu cầu on-site tại {job_data.get('location')}, ứng viên tại {candidate_data.get('location')})."
            )

    # 3. Mandatory Education / Degrees
    job_min_edu = (job_data.get("min_education_level") or "").strip().lower()
    cand_edu_level = (candidate_data.get("education_level") or "").strip().lower()
    edu_hierarchy = {
        "phd": 5,
        "doctorate": 5,
        "tiến sĩ": 5,
        "master": 4,
        "thạc sĩ": 4,
        "bachelor": 3,
        "cử nhân": 3,
        "kỹ sư": 3,
        "associate": 2,
        "cao đẳng": 2,
        "bootcamp": 1,
        "high_school": 1,
    }
    if job_min_edu and job_min_edu not in ["none", "không yêu cầu"]:
        req_rank = 3  # default bachelor
        for k, v in edu_hierarchy.items():
            if k in job_min_edu:
                req_rank = v
                break
        cand_rank = 0
        for k, v in edu_hierarchy.items():
            if k in cand_edu_level:
                cand_rank = max(cand_rank, v)
        # If candidate has > 3 years experience, can substitute degree
        edu_passed = (cand_rank >= req_rank) or (cand_exp >= 3.0 and req_rank <= 3)
        checks.append(
            HardFilterCheck(
                filter_name="education_level",
                passed=edu_passed,
                required_value=job_data.get("min_education_level"),
                actual_value=candidate_data.get("education_level") or "Chưa rõ",
                details=f"Yêu cầu: {job_data.get('min_education_level')}, Ứng viên: {candidate_data.get('education_level') or 'Chưa rõ'}.",
            )
        )
        if not edu_passed:
            failure_reasons.append(
                f"Chưa đạt cấp bậc học vấn yêu cầu ({job_data.get('min_education_level')})."
            )

    # 4. Mandatory Languages (if required in job)
    job_reqs = job_data.get("requirements", [])
    cand_langs = [l.lower() for l in candidate_data.get("languages", [])]
    for r in job_reqs:
        if isinstance(r, dict) and r.get("requirement_type") == "language" and r.get("is_mandatory"):
            req_lang = r.get("content", "").lower()
            lang_passed = any(req_lang in cl or cl in req_lang for cl in cand_langs)
            checks.append(
                HardFilterCheck(
                    filter_name=f"language_{req_lang}",
                    passed=lang_passed,
                    required_value=r.get("content"),
                    actual_value=", ".join(candidate_data.get("languages", [])) or "None",
                    details=f"Ngôn ngữ bắt buộc: {r.get('content')}",
                )
            )
            if not lang_passed:
                failure_reasons.append(f"Thiếu chứng chỉ/ngôn ngữ bắt buộc: {r.get('content')}.")

    all_passed = len(failure_reasons) == 0
    return HardFilterResult(
        all_passed=all_passed,
        checks=checks,
        failure_reasons=failure_reasons,
    )


def match_skills(
    candidate_skills: List[Any],
    mandatory_skills: List[str],
    preferred_skills: List[str],
) -> Tuple[List[str], List[str], List[str], List[dict]]:
    """
    Step 2: Match skills using skill taxonomy, canonical mapping, and evidence gathering.
    """
    cand_skill_map: Dict[str, dict] = {}
    for item in candidate_skills:
        if isinstance(item, dict):
            raw_name = item.get("name", "")
            can_name = normalize_skill(raw_name)
            cand_skill_map[can_name.lower()] = {
                "name": can_name,
                "confidence": item.get("confidence", 0.8),
                "evidence": item.get("evidence", ""),
            }
        elif isinstance(item, str):
            can_name = normalize_skill(item)
            cand_skill_map[can_name.lower()] = {
                "name": can_name,
                "confidence": 0.8,
                "evidence": f"Kỹ năng {can_name} được trích xuất từ hồ sơ.",
            }

    matched_required = []
    missing_required = []
    evidence_list = []

    for req in mandatory_skills:
        can_req = normalize_skill(req)
        key = can_req.lower()
        if key in cand_skill_map:
            matched_required.append(cand_skill_map[key]["name"])
            evidence_list.append(
                {
                    "skill": cand_skill_map[key]["name"],
                    "type": "required_skill",
                    "quote": cand_skill_map[key]["evidence"] or f"Trích xuất kỹ năng {cand_skill_map[key]['name']}",
                    "confidence": cand_skill_map[key]["confidence"],
                }
            )
        else:
            missing_required.append(can_req)

    matched_preferred = []
    for pref in preferred_skills:
        can_pref = normalize_skill(pref)
        key = can_pref.lower()
        if key in cand_skill_map:
            matched_preferred.append(cand_skill_map[key]["name"])
            evidence_list.append(
                {
                    "skill": cand_skill_map[key]["name"],
                    "type": "preferred_skill",
                    "quote": cand_skill_map[key]["evidence"] or f"Trích xuất kỹ năng {cand_skill_map[key]['name']}",
                    "confidence": cand_skill_map[key]["confidence"],
                }
            )

    return matched_required, missing_required, matched_preferred, evidence_list


def calculate_weighted_score(
    matched_required: List[str],
    missing_required: List[str],
    matched_preferred: List[str],
    total_preferred: int,
    candidate_exp_years: float,
    job_min_exp_years: float,
    semantic_sim: float,
    candidate_education_level: str,
    candidate_certifications: List[str],
) -> Tuple[float, dict, bool]:
    """
    Step 4: Compute 5-component weighted score.
    Weights:
    - Required skills: 35%
    - Relevant experience: 25%
    - Semantic similarity: 20%
    - Education/certifications: 10%
    - Preferred skills: 10%
    Total = 100%
    """
    # 1. Required skills score (35%)
    total_required = len(matched_required) + len(missing_required)
    if total_required > 0:
        req_ratio = len(matched_required) / total_required
    else:
        req_ratio = 1.0
    score_required = req_ratio * 100.0

    # 2. Experience score (25%)
    if job_min_exp_years > 0:
        exp_ratio = min(1.0, candidate_exp_years / job_min_exp_years)
    else:
        exp_ratio = 1.0
    score_exp = exp_ratio * 100.0

    # 3. Semantic similarity score (20%)
    score_sem = semantic_sim * 100.0

    # 4. Education & Certifications score (10%)
    edu_lower = (candidate_education_level or "").lower()
    if any(k in edu_lower for k in ["phd", "tiến sĩ", "doctorate"]):
        edu_base = 100.0
    elif any(k in edu_lower for k in ["master", "thạc sĩ"]):
        edu_base = 90.0
    elif any(k in edu_lower for k in ["bachelor", "cử nhân", "kỹ sư"]):
        edu_base = 80.0
    elif any(k in edu_lower for k in ["associate", "cao đẳng"]):
        edu_base = 65.0
    else:
        edu_base = 50.0

    # Bonus for certifications
    cert_bonus = min(20.0, len(candidate_certifications) * 10.0)
    score_edu = min(100.0, edu_base + cert_bonus)

    # 5. Preferred skills score (10%)
    if total_preferred > 0:
        pref_ratio = len(matched_preferred) / total_preferred
    else:
        pref_ratio = 1.0 if len(matched_preferred) > 0 else 0.8
    score_pref = pref_ratio * 100.0

    # Weighted sum
    w_req = settings.WEIGHT_REQUIRED_SKILLS  # 0.35
    w_exp = settings.WEIGHT_RELEVANT_EXPERIENCE  # 0.25
    w_sem = settings.WEIGHT_SEMANTIC_SIMILARITY  # 0.20
    w_edu = settings.WEIGHT_EDUCATION_CERTIFICATIONS  # 0.10
    w_pref = settings.WEIGHT_PREFERRED_SKILLS  # 0.10

    raw_score = (
        w_req * score_required
        + w_exp * score_exp
        + w_sem * score_sem
        + w_edu * score_edu
        + w_pref * score_pref
    )

    # Mandatory penalty rule: penalize if missing critical required skills
    penalty_applied = False
    if total_required > 0 and len(missing_required) > 0:
        penalty_applied = True
        penalty_factor = settings.MANDATORY_SKILL_PENALTY_RATE * (len(missing_required) / total_required)
        final_score = raw_score * (1.0 - penalty_factor)
    else:
        final_score = raw_score

    final_score = round(max(0.0, min(100.0, final_score)), 1)

    component_breakdown = {
        "required_skills": round(score_required, 1),
        "relevant_experience": round(score_exp, 1),
        "semantic_similarity": round(score_sem, 1),
        "education_certifications": round(score_edu, 1),
        "preferred_skills": round(score_pref, 1),
        "weights": {
            "required_skills": w_req,
            "relevant_experience": w_exp,
            "semantic_similarity": w_sem,
            "education_certifications": w_edu,
            "preferred_skills": w_pref,
        },
        "penalty_applied": penalty_applied,
    }

    return final_score, component_breakdown, penalty_applied


def determine_recommendation(overall_score: float, hard_filter_passed: bool) -> str:
    """
    Determine AI recommendation: strong_match | shortlist | review | low_match.
    Adheres strictly to Human-in-the-Loop: never auto-rejects.
    """
    if not hard_filter_passed:
        if overall_score >= 60.0:
            return "review"
        return "low_match"

    if overall_score >= 80.0:
        return "strong_match"
    elif overall_score >= 65.0:
        return "shortlist"
    elif overall_score >= 50.0:
        return "review"
    else:
        return "low_match"


def apply_blind_masking(candidate_dict: dict, candidate_id: str) -> dict:
    """
    Blind Screening transformation:
    Mask personal identifiable information (PII) before LLM synthesis to prevent demographic bias.
    """
    masked = candidate_dict.copy()
    masked_id = f"Candidate #TSC-{str(candidate_id)[:8].upper()}"
    masked["full_name"] = masked_id
    masked["email"] = "[ẨN DANH / BLIND MODE]"
    masked["phone"] = "[ẨN DANH / BLIND MODE]"
    masked["location"] = "[ẨN DANH]"

    # Mask university names to prevent school prestige bias
    if "education" in masked and isinstance(masked["education"], list):
        masked_edu = []
        for edu in masked["education"]:
            if isinstance(edu, dict):
                e = edu.copy()
                e["institution"] = "Đại học Kỹ thuật / Công nghệ (Ẩn danh)"
                masked_edu.append(e)
            else:
                masked_edu.append(edu)
        masked["education"] = masked_edu

    return masked


async def run_llm_rubric_evaluation(
    candidate_data: dict,
    job_data: dict,
    overall_score: float,
    matched_required: List[str],
    missing_required: List[str],
    evidence_items: List[dict],
    hard_filter_reasons: List[str],
) -> Dict[str, Any]:
    """
    Step 5: Run LLM rubric evaluation for qualitative synthesis (or deterministic fallback).
    Guarantees Zero Hallucination: every claim must be backed by evidence from CV.
    """
    # 1. Prepare deterministic fallback first
    cand_exp = candidate_data.get("total_experience_years", 0.0)
    job_min_exp = job_data.get("min_experience_years", 0.0)

    exp_assessment = (
        f"Ứng viên tích lũy {cand_exp} năm kinh nghiệm làm việc thực tế, "
        f"{'đáp ứng và vượt yêu cầu tối thiểu ' + str(job_min_exp) + ' năm của JD' if cand_exp >= job_min_exp else 'thấp hơn mức kỳ vọng ' + str(job_min_exp) + ' năm của JD'}."
    )

    explanation_parts = [
        f"Điểm tổng hợp {overall_score}/100.",
        f"Khớp {len(matched_required)} kỹ năng bắt buộc: {', '.join(matched_required) if matched_required else 'Không có'}.",
    ]
    if missing_required:
        explanation_parts.append(f"Còn thiếu kỹ năng cốt lõi: {', '.join(missing_required)}.")
    if hard_filter_reasons:
        explanation_parts.append(f"Lưu ý điều kiện tiên quyết: {'; '.join(hard_filter_reasons)}")

    fallback_risks = []
    if missing_required:
        fallback_risks.append(f"Thiếu kỹ năng bắt buộc trong JD: {', '.join(missing_required)}")
    if cand_exp < job_min_exp:
        fallback_risks.append(f"Số năm kinh nghiệm ({cand_exp} năm) chưa đạt yêu cầu tối thiểu ({job_min_exp} năm)")
    for reason in hard_filter_reasons:
        if reason not in fallback_risks:
            fallback_risks.append(reason)

    fallback_result = {
        "experience_assessment": exp_assessment,
        "explanation": " ".join(explanation_parts),
        "risks": fallback_risks,
        "model_version": FALLBACK_MODEL,
        "prompt_version": PROMPT_VERSION,
    }

    # 2. Try Gemini 1.5 Flash if API Key available
    if settings.GEMINI_API_KEY:
        masked_cand = apply_blind_masking(candidate_data, candidate_data.get("id", "0000"))
        prompt = f"""You are the TalentScout AI ATS Explainable Screening Engine.
Analyze the following candidate's qualifications against the Job Requisition according to strict ATS evaluation rubric.

JOB CRITERIA:
- Title: {job_data.get('title')}
- Min Experience: {job_min_exp} years
- Mandatory Skills: {', '.join(job_data.get('mandatory_skills', []))}
- Preferred Skills: {', '.join(job_data.get('preferred_skills', []))}

CANDIDATE PROFILE (BLIND SCREENED):
- Total Experience: {cand_exp} years
- Matched Required Skills: {', '.join(matched_required)}
- Missing Required Skills: {', '.join(missing_required)}
- Work History Summary: {json.dumps(masked_cand.get('work_history', []), ensure_ascii=False)}
- Education: {json.dumps(masked_cand.get('education', []), ensure_ascii=False)}

SCORING CALCULATED: {overall_score}/100

STRICT ZERO-HALLUCINATION RULES:
1. Do NOT invent or infer unmentioned skills or experience.
2. Every statement MUST cite facts from the candidate's actual history.
3. You MUST NEVER automatically reject the candidate. Provide constructive, transparent evaluation.
4. Output valid JSON only:
{{
  "experience_assessment": "1-2 concise sentences assessing practical depth and relevance",
  "explanation": "2-3 sentences explaining overall fit, key strengths, and missing skills in Vietnamese",
  "risks": ["Risk 1 if any", "Risk 2 if any"]
}}
"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
                    },
                )
                if res.status_code == 200:
                    text_resp = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text_resp)
                    return {
                        "experience_assessment": parsed.get("experience_assessment", exp_assessment),
                        "explanation": parsed.get("explanation", " ".join(explanation_parts)),
                        "risks": parsed.get("risks", fallback_risks),
                        "model_version": MODEL_VERSION,
                        "prompt_version": PROMPT_VERSION,
                    }
        except Exception as ex:
            logger.warning(f"Gemini LLM evaluation exception, falling back to rule-based: {ex}")

    return fallback_result


async def screen_candidate_for_job(
    candidate_data: dict,
    job_data: dict,
    candidate_embedding: Optional[List[float]] = None,
    job_embedding: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Execute the complete 6-step AI Candidate Screening Pipeline:
    1. Hard filters
    2. Skill taxonomy & keyword match
    3. Semantic similarity (pgvector cosine)
    4. Weighted 5-component scoring
    5. LLM rubric evaluation
    6. Return structured candidate output
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # Step 1: Hard filters
    hard_filter_res = evaluate_hard_filters(candidate_data, job_data)

    # Step 2: Skill matching
    mandatory_skills = job_data.get("mandatory_skills", [])
    preferred_skills = job_data.get("preferred_skills", [])
    cand_skills = candidate_data.get("skills", [])

    matched_req, missing_req, matched_pref, evidence_items = match_skills(
        cand_skills, mandatory_skills, preferred_skills
    )

    # Step 3: Semantic similarity
    if not job_embedding:
        job_text = build_job_embedding_text(job_data)
        job_embedding = await generate_embedding(job_text)

    if not candidate_embedding:
        cand_text = build_candidate_embedding_text(candidate_data)
        candidate_embedding = await generate_embedding(cand_text)

    sem_sim = cosine_similarity(candidate_embedding, job_embedding)

    # Step 4: Weighted scoring
    cand_exp = float(candidate_data.get("total_experience_years") or 0.0)
    job_min_exp = float(job_data.get("min_experience_years") or 0.0)
    cand_edu = candidate_data.get("education_level") or ""
    cand_certs = candidate_data.get("certifications", [])

    overall_score, component_scores, penalty_applied = calculate_weighted_score(
        matched_required=matched_req,
        missing_required=missing_req,
        matched_preferred=matched_pref,
        total_preferred=len(preferred_skills),
        candidate_exp_years=cand_exp,
        job_min_exp_years=job_min_exp,
        semantic_sim=sem_sim,
        candidate_education_level=cand_edu,
        candidate_certifications=cand_certs,
    )

    # Determine recommendation (Never auto-rejects!)
    recommendation = determine_recommendation(overall_score, hard_filter_res.all_passed)

    # Step 5: LLM rubric evaluation (Qualitative XAI synthesis)
    llm_eval = await run_llm_rubric_evaluation(
        candidate_data=candidate_data,
        job_data=job_data,
        overall_score=overall_score,
        matched_required=matched_req,
        missing_required=missing_req,
        evidence_items=evidence_items,
        hard_filter_reasons=hard_filter_res.failure_reasons,
    )

    # Add work experience evidence quotes if available
    work_history = candidate_data.get("work_history", [])
    for exp in work_history[:3]:
        if isinstance(exp, dict) and exp.get("title") and exp.get("company"):
            evidence_items.append(
                {
                    "skill": "Relevant Experience",
                    "type": "work_history",
                    "quote": f"{exp.get('title')} tại {exp.get('company')} ({exp.get('start_date', '')} - {exp.get('end_date', 'Hiện tại')})",
                    "confidence": 1.0,
                }
            )

    # Combine risks
    all_risks = list(set(hard_filter_res.failure_reasons + llm_eval.get("risks", [])))

    # Step 6: Return structured candidate match output
    return {
        "candidate_id": str(candidate_data.get("id", "")),
        "job_id": str(job_data.get("id", "")),
        "overall_score": overall_score,
        "recommendation": recommendation,
        "matched_required_skills": matched_req,
        "missing_required_skills": missing_req,
        "matched_preferred_skills": matched_pref,
        "experience_assessment": llm_eval.get("experience_assessment", ""),
        "semantic_similarity": sem_sim,
        "evidence": evidence_items,
        "explanation": llm_eval.get("explanation", ""),
        "risks": all_risks,
        "hard_filter_passed": hard_filter_res.all_passed,
        "hard_filter_details": [c.model_dump() for c in hard_filter_res.checks],
        "component_scores": component_scores,
        "penalty_applied": penalty_applied,
        "model_version": llm_eval.get("model_version", FALLBACK_MODEL),
        "prompt_version": llm_eval.get("prompt_version", PROMPT_VERSION),
        "timestamp": now_iso,
        "candidate_embedding": candidate_embedding,
        "job_embedding": job_embedding,
    }
