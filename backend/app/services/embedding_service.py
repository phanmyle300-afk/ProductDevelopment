import hashlib
import math
import re
from typing import List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

EMBEDDING_DIM = 1536


def _deterministic_local_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    Generate a deterministic 1536-D unit-normalized vector from text tokens and n-grams.
    Ensures pgvector compatibility and reproducible cosine similarity even without external API keys.
    """
    if not text or not text.strip():
        return [0.0] * dim

    vec = [0.0] * dim
    clean_text = text.lower()

    # Extract word tokens (length >= 2)
    words = re.findall(r"\b[\w\+\#\.\-]{2,}\b", clean_text)
    for word in words:
        # Multiple hash seeds for distributed projection
        for seed in range(3):
            h = int(hashlib.sha256(f"{seed}:{word}".encode("utf-8")).hexdigest()[:8], 16)
            idx = h % dim
            sign = 1.0 if (h >> 3) & 1 else -1.0
            # Higher weight for domain keywords
            weight = 1.5 if len(word) > 4 else 1.0
            vec[idx] += sign * weight

    # Extract character 3-grams for subword morphology
    for i in range(len(clean_text) - 2):
        ngram = clean_text[i : i + 3]
        h = int(hashlib.md5(ngram.encode("utf-8")).hexdigest()[:8], 16)
        idx = h % dim
        sign = 1.0 if (h >> 2) & 1 else -1.0
        vec[idx] += sign * 0.3

    # Normalize to unit vector (L2 norm)
    sq_sum = sum(x * x for x in vec)
    if sq_sum > 0.0:
        norm = math.sqrt(sq_sum)
        vec = [round(x / norm, 6) for x in vec]
    else:
        vec[0] = 1.0

    return vec


async def generate_embedding(text: str) -> List[float]:
    """
    Generate a 1536-D embedding vector with fallback:
    1. OpenAI text-embedding-3-small (if OPENAI_API_KEY configured)
    2. Deterministic unit-normalized local feature projection
    """
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM

    # 1. Cloud Provider: OpenAI text-embedding-3-small
    if settings.OPENAI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"model": "text-embedding-3-small", "input": text[:8000]},
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["data"][0]["embedding"]
                else:
                    logger.warning(f"OpenAI embedding error {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"OpenAI embedding exception, falling back to local: {e}")

    # 2. Local fallback
    return _deterministic_local_embedding(text, dim=EMBEDDING_DIM)


def cosine_similarity(vec1: Optional[List[float]], vec2: Optional[List[float]]) -> float:
    """
    Calculate cosine similarity between two vectors.
    Returns float clamped to [0.0, 1.0].
    """
    if not vec1 or not vec2:
        return 0.0
    if len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    sim = dot_product / (norm_a * norm_b)
    # Clamp to [0.0, 1.0] for ATS relevance score
    return max(0.0, min(1.0, round(sim, 4)))


def build_candidate_embedding_text(candidate_data: dict) -> str:
    """Compose rich textual representation of candidate for embedding."""
    parts = []
    if candidate_data.get("summary"):
        parts.append(f"Summary: {candidate_data['summary']}")

    skills = candidate_data.get("skills", [])
    if skills:
        skill_names = [s.get("name") if isinstance(s, dict) else str(s) for s in skills]
        parts.append(f"Skills: {', '.join(skill_names)}")

    work_history = candidate_data.get("work_history", [])
    for exp in work_history:
        if isinstance(exp, dict):
            parts.append(
                f"Experience: {exp.get('title', '')} at {exp.get('company', '')}. {exp.get('description', '')}"
            )

    education = candidate_data.get("education", [])
    for edu in education:
        if isinstance(edu, dict):
            parts.append(
                f"Education: {edu.get('degree', '')} {edu.get('major', '')} at {edu.get('institution', '')}"
            )

    return " \n ".join(parts)


def build_job_embedding_text(job_data: dict) -> str:
    """Compose rich textual representation of job for embedding."""
    parts = []
    if job_data.get("title"):
        parts.append(f"Title: {job_data['title']}")
    if job_data.get("department"):
        parts.append(f"Department: {job_data['department']}")
    if job_data.get("description"):
        parts.append(f"Description: {job_data['description']}")
    if job_data.get("mandatory_skills"):
        parts.append(f"Required Skills: {', '.join(job_data['mandatory_skills'])}")
    if job_data.get("preferred_skills"):
        parts.append(f"Preferred Skills: {', '.join(job_data['preferred_skills'])}")
    return " \n ".join(parts)
