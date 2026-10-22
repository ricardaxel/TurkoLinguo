"""Validate TurkoLinguo content (see docs/CONTENT_FORMAT.md).

Usage (from the project root, Python is in WSL):
    wsl python3 -I scripts/validate_content.py [--strict] [--release] [content_dir]

Exit code 0 = no errors (warnings allowed unless --strict).
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import jsonschema
import yaml

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "schema" / "content.schema.json"

# directory (or file) → $def name in the schema
KINDS = {
    "course.yaml": "course",
    "grammar": "grammar",
    "lessons": "lesson",
    "packs": "packFile",
    "lexicon": "lexiconFile",
    "sentences": "sentencesFile",
    "morphology/suffixes.yaml": "suffixesFile",
    "morphology/tests.yaml": "morphTestsFile",
    "media/assets.yaml": "assetsFile",
    "checkpoints": "checkpoint",
}

ID_RE = re.compile(r"^(w\.[^\s.]+(\.[a-z0-9_]+)?|s\.[A-Za-z0-9_]+\.[0-9]{3}|img\.[a-z0-9_]+\.\S+|aud\.[a-z0-9_]+\.\S+"
                   r"|sfx\.[a-z0-9_]+|g\.L[0-9]+\.[a-z0-9_]+(\.[a-z0-9_]+)?|T[0-9]+b?(\.p[0-9]+)?)$")
CHOICE_TYPES = {"pick_suffix", "picture_choose", "listen_choose", "contrast_pair"}
TYPED_TYPES = {"type_form", "translate_to_tr", "dictation", "spot_error", "qa", "mini_dialogue"}
PUNCT_RE = re.compile(r"[.,!?;:…\"“”«»]")


def tr_lower(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def error(self, where, msg):
        self.errors.append(f"ERROR   {where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"warning {where}: {msg}")


def kind_for(rel):
    rel = rel.as_posix()
    if rel in KINDS:
        return KINDS[rel]
    top = rel.split("/")[0]
    return KINDS.get(top) if top in ("grammar", "lessons", "packs", "lexicon", "sentences", "checkpoints") else None


def walk_strings(node, path=""):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from walk_strings(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from walk_strings(v, f"{path}[{i}]")
    elif isinstance(node, str):
        yield path, node


def balanced(pattern):
    depth = {"(": 0, "{": 0}
    pairs = {")": "(", "}": "{"}
    for ch in pattern:
        if ch in depth:
            depth[ch] += 1
        elif ch in pairs:
            depth[pairs[ch]] -= 1
            if depth[pairs[ch]] < 0:
                return False
    return all(v == 0 for v in depth.values())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("content_dir", nargs="?", default=str(ROOT / "content"))
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    ap.add_argument("--release", action="store_true", help="also require all media to be ready")
    args = ap.parse_args()

    content = Path(args.content_dir)
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    rep = Report()

    # ---------- 1. load + schema + NFC ----------
    docs = {}  # kind -> list of (relpath, data)
    for path in sorted(content.rglob("*.yaml")):
        rel = path.relative_to(content)
        kind = kind_for(rel)
        if kind is None:
            rep.warn(rel, "unknown file location, not validated")
            continue
        try:
            data = yaml.safe_load(path.read_text(encoding="utf-8"))
        except yaml.YAMLError as e:
            rep.error(rel, f"YAML parse error: {e}")
            continue
        validator = jsonschema.Draft202012Validator({"$ref": f"#/$defs/{kind}", **schema})
        for err in sorted(validator.iter_errors(data), key=lambda e: list(e.absolute_path)):
            loc = "/".join(map(str, err.absolute_path)) or "(root)"
            rep.error(rel, f"schema: at {loc}: {err.message[:300]}")
        for p, s in walk_strings(data):
            if unicodedata.normalize("NFC", s) != s:
                rep.error(rel, f"text not NFC-normalised at {p}: {s!r}")
        docs.setdefault(kind, []).append((rel, data))

    if "course" not in docs:
        rep.error(content, "course.yaml not found")
    if rep.errors:  # later checks rely on schema-valid data
        return finish(rep, args)

    # ---------- 2. registries + unique IDs ----------
    reg = {}  # id -> (kind, relpath, obj)

    def register(id_, kind, rel, obj):
        if id_ in reg:
            rep.error(rel, f"duplicate ID {id_} (also in {reg[id_][1]})")
        else:
            reg[id_] = (kind, rel, obj)

    course_rel, course = docs["course"][0]
    for rel, g in docs.get("grammar", []):
        register(g["id"], "grammar", rel, g)
        for p in g.get("patterns", []):
            register(p["id"], "pattern", rel, p)
            if not p["id"].startswith(g["id"] + "."):
                rep.error(rel, f"pattern {p['id']} must start with {g['id']}.")
    for rel, lesson in docs.get("lesson", []):
        register(lesson["id"], "lesson", rel, lesson)
        for sess in lesson["sessions"].values():
            for item in sess.get("items", []):
                register(item["id"], "item", rel, item)
    for rel, cp in docs.get("checkpoint", []):
        register(cp["id"], "checkpoint", rel, cp)
        for item in cp["items"]:
            register(item["id"], "item", rel, item)
    for rel, pf in docs.get("packFile", []):
        register(pf["id"], "theme", rel, pf)
        for p in pf["packs"]:
            register(p["id"], "pack", rel, p)
    for kind, key in (("lexiconFile", "word"), ("sentencesFile", "sentence"), ("suffixesFile", "suffix"), ("assetsFile", "asset")):
        for rel, arr in docs.get(kind, []):
            for obj in arr or []:
                register(obj["id"], key, rel, obj)

    # ---------- 3. course order ----------
    order = [l for u in course["units"] for l in u["lessons"]]
    index = {l: i for i, l in enumerate(order)}
    for l in course["lessons"]:
        if l not in index:
            rep.error(course_rel, f"{l} is defined but not placed in any unit")
    for l in order:
        if l not in course["lessons"]:
            rep.error(course_rel, f"{l} is placed in a unit but not defined")
    grammar_lesson = {meta["grammar"]: index.get(l, 10**6) for l, meta in course["lessons"].items()}
    for l, meta in course["lessons"].items():
        if "file" in meta and not (content / meta["file"]).exists():
            rep.error(course_rel, f"{l}: file {meta['file']} not found")
    for gid, (kind, rel, _) in [(k, v) for k, v in reg.items() if v[0] == "grammar"]:
        if gid not in grammar_lesson:
            rep.error(rel, f"grammar point {gid} is not assigned to any lesson in course.yaml")

    # ---------- 4. references resolve ----------
    all_docs = [(rel, data) for lst in docs.values() for rel, data in lst]
    for rel, data in all_docs:
        for p, s in walk_strings(data):
            # grammar points of lessons not written yet are known from course.yaml only
            if ID_RE.match(s) and s not in reg and s not in grammar_lesson:
                rep.error(rel, f"unresolved reference {s} at {p}")

    # ---------- 5. known-material checks ----------
    # when was each word introduced? (position index; packs sit between lessons → index + 0.5)
    intro = {}

    def introduce(wid, pos, where):
        if wid not in intro or pos < intro[wid][0]:
            intro[wid] = (pos, where)

    for rel, pf in docs.get("packFile", []):
        for p in pf["packs"]:
            for w in p["words"]:
                introduce(w, index[p["unlock_after"]] + 0.5, p["id"])
    for rel, lesson in docs.get("lesson", []):
        for w in lesson.get("new_words", []):
            introduce(w, index[lesson["id"]], lesson["id"])

    not_introduced = {}  # relpath -> set of word IDs (reported once per file)

    def check_words(words, pos, where, rel):
        for w in words:
            entry = reg.get(w)
            if entry and entry[2].get("pos") == "name":
                continue
            if w not in intro:
                not_introduced.setdefault(rel, set()).add(w)
            elif intro[w][0] > pos:
                rep.error(rel, f"{where}: word {w} is used before it is introduced ({intro[w][1]})")

    def check_grammar(tags, pos, where, rel):
        for g in tags:
            if g not in grammar_lesson:
                rep.error(rel, f"{where}: unknown grammar point {g}")
            elif grammar_lesson[g] > pos:
                rep.error(rel, f"{where}: uses {g}, which is taught later ({order[grammar_lesson[g]]})")

    def check_sentence(sid, pos, where, rel):
        s = reg.get(sid, (None, None, None))[2]
        if not s:
            return
        if not s.get("phrase"):
            check_grammar(s["grammar"], pos, f"{where} → {sid}", rel)
        check_words(s["words"], pos, f"{where} → {sid}", rel)

    def check_item(item, pos, rel):
        where = item["id"]
        check_grammar(item["grammar"], pos, where, rel)
        if "pattern" in item and not item["pattern"].startswith(item["grammar"][0] + "."):
            rep.warn(rel, f"{where}: pattern {item['pattern']} doesn't belong to main grammar {item['grammar'][0]}")
        if "base" in item:
            check_words([item["base"]], pos, where, rel)
        for sfx in [item.get("suffix")] + item.get("suffixes", []):
            if sfx and sfx in reg:
                check_grammar([reg[sfx][2]["introduced_by"]], pos, f"{where} ({sfx})", rel)
        sids = [item.get("sentence"), item.get("question")] + [t.get("sentence") for t in item.get("turns", [])]
        for sid in filter(None, sids):
            check_sentence(sid, pos, where, rel)
        # item-level consistency
        if item["type"] in CHOICE_TYPES and item.get("answer") not in item.get("options", []):
            rep.error(rel, f"{where}: answer {item.get('answer')!r} is not one of the options")
        if item["type"] == "build_word" and sorted(item["answer"].split("·")) != sorted(item["tiles"]):
            rep.error(rel, f"{where}: answer segments don't match the tiles")
        if item["type"] == "spot_error" and item["error"] not in item["text"]:
            rep.error(rel, f"{where}: error token {item['error']!r} not found in text")
        elif item["type"] == "spot_error" and item.get("sentence") in reg:
            fixed = item["text"].replace(item["error"], item["answer"], 1)
            model = reg[item["sentence"]][2]["tr"]
            norm = lambda t: " ".join(PUNCT_RE.sub(" ", tr_lower(t)).split())
            if norm(fixed) != norm(model):
                rep.error(rel, f"{where}: the corrected text {fixed!r} doesn't match its sentence {item['sentence']} ({model!r})")
        if item["type"] == "translate_to_tr" and "word_bank" in item and item.get("sentence") in reg:
            tokens = PUNCT_RE.sub("", reg[item["sentence"]][2]["tr"]).split()
            bank = {tr_lower(t) for t in item["word_bank"]}
            missing = [t for t in tokens if tr_lower(t) not in bank]
            if missing:
                rep.error(rel, f"{where}: word bank lacks {missing}")
        patterns = list(item.get("answers", [])) + [a for t in item.get("turns", []) for a in t.get("answers", [])]
        spoken = list(item.get("spoken", [])) + [a for t in item.get("turns", []) for a in t.get("spoken", [])]
        for a in patterns + spoken:
            if not balanced(a):
                rep.error(rel, f"{where}: unbalanced () or {{}} in answer pattern {a!r}")
        if spoken and item["type"] not in TYPED_TYPES:
            rep.error(rel, f"{where}: spoken variants only apply to typed answers, not {item['type']}")

    for rel, lesson in docs.get("lesson", []):
        lid = lesson["id"]
        pos = index[lid]
        if course["lessons"][lid]["grammar"] != lesson["grammar"]:
            rep.error(rel, f"lesson grammar {lesson['grammar']} differs from course.yaml")
        learn = lesson["sessions"]["learn"]
        for i, card in enumerate(learn["cards"]):
            for sid in card.get("sentences", []):
                check_sentence(sid, pos, f"card {i + 1}", rel)
        for sess in lesson["sessions"].values():
            for item in sess.get("items", []):
                check_item(item, pos, rel)

    # checkpoints: everything taught up to the unit's last lesson, but not the packs that
    # pre-teach the next unit (those sit at last lesson + 0.5)
    units = {u["id"]: u for u in course["units"]}
    for rel, cp in docs.get("checkpoint", []):
        unit = units.get(cp["unit"])
        if not unit:
            rep.error(rel, f"unknown unit {cp['unit']}")
            continue
        if unit.get("checkpoint") != cp["id"]:
            rep.error(rel, f"{cp['id']} is not the checkpoint of {cp['unit']} in course.yaml")
        pos = index[unit["lessons"][-1]] + 0.25
        for sid in cp["intro"].get("sentences", []):
            check_sentence(sid, pos, f"{cp['id']} intro", rel)
        for item in cp["items"]:
            if not item["id"].startswith(cp["id"] + ".check."):
                rep.error(rel, f"{item['id']}: checkpoint items are named {cp['id']}.check.NN")
            check_item(item, pos, rel)

    for rel, pf in docs.get("packFile", []):
        for p in pf["packs"]:
            pos = index[p["unlock_after"]] + 0.5
            for sid in p.get("frames", []):
                check_sentence(sid, pos, f"{p['id']} frame", rel)
            if len(p["words"]) != 8:
                rep.warn(rel, f"{p['id']}: {len(p['words'])} words (target is 8)")

    for rel, words in not_introduced.items():
        rep.warn(rel, f"{len(words)} word(s) used but not introduced in any pack or lesson yet: {', '.join(sorted(words))}")

    # ---------- 6. release checks ----------
    if args.release:
        for mid, (kind, rel, obj) in reg.items():
            if kind == "asset" and obj["status"] != "ready":
                rep.error(rel, f"{mid}: status is {obj['status']}, must be ready for release")
        for sid, (kind, rel, obj) in reg.items():
            if kind == "sentence" and obj.get("native_required"):
                a = reg.get(obj.get("audio"), (None, None, {}))[2]
                if not a or a.get("source") not in ("own", "lingualibre"):
                    rep.error(rel, f"{sid}: native audio required")

    return finish(rep, args)


def finish(rep, args):
    for line in rep.warnings + rep.errors:
        print(line)
    n_err = len(rep.errors) + (len(rep.warnings) if args.strict else 0)
    print(f"\n{len(rep.errors)} error(s), {len(rep.warnings)} warning(s)")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
