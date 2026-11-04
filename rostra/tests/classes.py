"""List CSS classes used in src/*.js but defined nowhere in src/*.css. Run: python3 tests/classes.py [file.js ...]"""
import pathlib, re, sys

SRC = pathlib.Path(__file__).resolve().parent.parent / "src"
css = "\n".join(p.read_text() for p in SRC.glob("*.css"))
defined = set(re.findall(r"\.(-?[A-Za-z_][\w-]*)", css))
names = sys.argv[1:] or sorted(p.name for p in SRC.glob("*.js"))
HOOK = re.compile(r"className=(\"[^\"]*\"|\$\{)")
for name in names:
    text = (SRC / name).read_text()
    used = set()
    for m in HOOK.finditer(text):
        if m.group(1).startswith('"'):
            used.update(m.group(1).strip('"').split())
            continue
        depth, i = 1, m.end()          # className=${...}: pull class-like words from string literals inside
        while i < len(text) and depth:
            depth += {"{": 1, "}": -1}.get(text[i], 0)
            i += 1
        for lit in re.findall(r"'([^']*)'|`([^`]*)`|\"([^\"]*)\"", text[m.end():i]):
            for s in lit:
                used.update(w for w in re.split(r"\s+", re.sub(r"\$\{[^}]*\}", " ", s)) if re.fullmatch(r"[a-zA-Z][\w-]*", w))
    missing = sorted(c for c in used if c not in defined)
    print(f"{name}: {len(used)} classes, {len(missing)} undefined")
    if missing:
        print("   " + " ".join(missing))
