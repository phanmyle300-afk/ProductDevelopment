#!/usr/bin/env python3
import sys
import json
import warnings
warnings.filterwarnings("ignore")
from pathlib import Path

# Add backend to path so we can import services
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.resume_parser import parse_resume

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing file path argument"}, ensure_ascii=False))
        sys.exit(1)

    filepath = Path(sys.argv[1])
    original_filename = sys.argv[2] if len(sys.argv) > 2 else filepath.name

    if not filepath.exists():
        print(json.dumps({"success": False, "error": f"File not found: {filepath}"}, ensure_ascii=False))
        sys.exit(1)

    try:
        with open(filepath, "rb") as f:
            file_bytes = f.read()
        res = parse_resume(file_bytes, original_filename)
        print(json.dumps(res, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Lỗi nội bộ trong quá trình bóc tách: {str(e)}",
            "error_code": "INTERNAL_PARSER_EXCEPTION"
        }, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
