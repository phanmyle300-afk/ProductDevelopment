import logging
import re
import sys
from typing import Any, Dict


# Regex patterns for PII redaction per AGENTS.md Zero-PII requirement
EMAIL_PATTERN = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
PHONE_PATTERN = re.compile(r"(?:\+?84|0)[3|5|7|8|9][0-9]{8}")
CCCD_PATTERN = re.compile(r"\b\d{12}\b|\b\d{9}\b")
BEARER_PATTERN = re.compile(r"Bearer\s+[\w\-\.]+", re.IGNORECASE)


class PIIRedactingFilter(logging.Filter):
    """
    Filter to automatically redact personally identifiable information (PII)
    and authorization tokens from all log records.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.redact(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self.redact(str(v)) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self.redact(str(arg)) for arg in record.args)
        return True

    @staticmethod
    def redact(text: str) -> str:
        text = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", text)
        text = PHONE_PATTERN.sub("[REDACTED_PHONE]", text)
        text = CCCD_PATTERN.sub("[REDACTED_ID_CARD]", text)
        text = BEARER_PATTERN.sub("Bearer [REDACTED_TOKEN]", text)
        return text


def setup_logging() -> logging.Logger:
    """Configures structured JSON-like standard logging with PII protection."""
    logger = logging.getLogger("talentscout")
    logger.setLevel(logging.INFO)

    # Console Handler
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt='{"timestamp":"%(asctime)s", "level":"%(levelname)s", "logger":"%(name)s", "message":"%(message)s"}'
        )
        handler.setFormatter(formatter)
        handler.addFilter(PIIRedactingFilter())
        logger.addHandler(handler)

    return logger


logger = setup_logging()
