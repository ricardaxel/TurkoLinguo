"""Compile content/*.yaml into one JSON bundle for the app.

Runs the validator first and stops if it reports errors.

Usage (from the project root, or `npm run content` in app/):
    wsl python3 -I scripts/build_content.py [out_path]
"""
import json
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
DEFAULT_OUT = ROOT / "app" / "src" / "content" / "content.json"


def load(rel):
    return yaml.safe_load((CONTENT / rel).read_text(encoding="utf-8"))


def by_id(items):
    return {item["id"]: item for item in items}


def load_dir(name):
    out = []
    for path in sorted((CONTENT / name).glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        out.extend(data if isinstance(data, list) else [data])
    return out


def main():
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUT

    check = subprocess.run([sys.executable, "-I", str(ROOT / "scripts" / "validate_content.py")])
    if check.returncode != 0:
        sys.exit("Content has errors; bundle not written.")

    bundle = {
        "version": 1,
        "course": load("course.yaml"),
        "grammar": by_id(load_dir("grammar")),
        "lessons": by_id(load_dir("lessons")),
        "checkpoints": by_id(load_dir("checkpoints")) if (CONTENT / "checkpoints").exists() else {},
        "packs": by_id(load_dir("packs")),
        "lexicon": by_id(load_dir("lexicon")),
        "sentences": by_id(load_dir("sentences")),
        "suffixes": by_id(load("morphology/suffixes.yaml")),
        "morphTests": load("morphology/tests.yaml"),
        "assets": by_id(load("media/assets.yaml")),
        "talkFrame": load("talk/partner_frame.yaml"),
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Wrote {out_path.relative_to(ROOT)} ({out_path.stat().st_size // 1024} KB, "
          f"{len(bundle['lessons'])} lesson(s), {len(bundle['checkpoints'])} checkpoint(s), {len(bundle['sentences'])} sentences, {len(bundle['lexicon'])} words)")


if __name__ == "__main__":
    main()
