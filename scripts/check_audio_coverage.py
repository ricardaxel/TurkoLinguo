"""Check which A1 words have a native recording on Wikimedia Commons.

Sources checked:
  1. Lingua Libre Turkish recordings (Category:Lingua_Libre_pronunciation-tur),
     file names like "LL-Q256 (tur)-Speaker-word.wav".
  2. Classic Wiktionary-style files "Tr-<word>.ogg".

Usage: python3 scripts/check_audio_coverage.py data/a1_theme_words.txt data/audio_coverage.tsv
"""
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict

API = "https://commons.wikimedia.org/w/api.php"
UA = "TurkoLinguoCoverageCheck/0.1 (personal language-learning research script; python-urllib)"
LL_RE = re.compile(r"^File:LL-Q256 \(tur\)-(?P<speaker>[^-]+)-(?P<word>.+)\.(wav|ogg|mp3|flac)$")


def api(params, retries=6):
    params = {**params, "format": "json", "maxlag": "5"}
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers={"User-Agent": UA})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == retries - 1:
                raise
            wait = int(e.headers.get("Retry-After") or 0) or 2 ** (attempt + 2)
            print(f"  rate-limited, waiting {wait}s", file=sys.stderr)
            time.sleep(wait)


def norm(w):
    # Turkish-aware lowercasing: I -> ı, İ -> i
    w = unicodedata.normalize("NFC", w).replace("I", "ı").replace("İ", "i")
    return w.lower().strip()


def lingua_libre_index():
    index = defaultdict(list)  # word -> [file titles]
    params = {"action": "query", "list": "categorymembers", "cmtitle": "Category:Lingua_Libre_pronunciation-tur",
              "cmtype": "file", "cmlimit": "500"}
    while True:
        data = api(params)
        for m in data["query"]["categorymembers"]:
            match = LL_RE.match(m["title"])
            if match:
                index[norm(match["word"])].append(m["title"])
        if "continue" not in data:
            return index
        params.update(data["continue"])
        time.sleep(0.2)


def existing_tr_files(words):
    found = {}
    words = list(words)
    for i in range(0, len(words), 50):
        batch = {f"File:Tr-{w}.ogg": w for w in words[i:i + 50]}
        data = api({"action": "query", "titles": "|".join(batch)})
        pages = data["query"]["pages"].values()
        # titles may be normalized (first letter uppercased)
        normalized = {n["to"]: n["from"] for n in data["query"].get("normalized", [])}
        for p in pages:
            if "missing" not in p:
                orig = normalized.get(p["title"], p["title"])
                found[batch[orig]] = p["title"]
        time.sleep(0.2)
    return found


def main(words_path, out_path):
    rows = []
    with open(words_path, encoding="utf-8") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                theme, word = line.rstrip("\n").split("\t")
                rows.append((theme, word))

    ll = lingua_libre_index()
    print(f"Lingua Libre Turkish recordings indexed: {sum(map(len, ll.values()))} files, {len(ll)} distinct words")
    tr = existing_tr_files(w for _, w in rows)

    by_theme = defaultdict(lambda: [0, 0])
    missing = []
    with open(out_path, "w", encoding="utf-8") as out:
        out.write("theme\tword\tlingua_libre_files\ttr_ogg\n")
        for theme, word in rows:
            ll_files = ll.get(norm(word), [])
            tr_file = tr.get(word, "")
            ok = bool(ll_files or tr_file)
            by_theme[theme][0] += ok
            by_theme[theme][1] += 1
            if not ok:
                missing.append(word)
            out.write(f"{theme}\t{word}\t{len(ll_files)}\t{tr_file}\n")

    covered = sum(c for c, _ in by_theme.values())
    print(f"Covered: {covered}/{len(rows)} ({100 * covered / len(rows):.0f}%)")
    for theme in sorted(by_theme, key=lambda t: int(t[1:])):
        c, n = by_theme[theme]
        print(f"  {theme:>4}: {c}/{n}")
    print("Missing:", ", ".join(missing))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
