"""Assemble rostra.html from src/. Run: python3 build.py"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
SCRIPTS = ["data.js", "engine.js", "ui.js", "kit.js", "art.js", "pages-core.js", "pages-more.js", "viva.js", "gym.js", "app.js"]
STYLES = ["styles.css", "kit.css", "art.css", "viva.css", "gym.css", "polish.css"]

css = "\n".join((SRC / name).read_text() for name in STYLES)
js = "\n".join((SRC / name).read_text() for name in SCRIPTS)
assert "</script" not in js.lower(), "inline script must not contain a closing script tag"

page = (
    "<title>Rostra Speech Coach</title>\n"
    '<meta name="description" content="Analyze your speeches on ethos, pathos and logos, prepare new ones with a coach, and level up.">\n'
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800'
    '&family=GFS+Didot&display=swap">\n'
    "<style>\n" + css + "\n</style>\n"
    '<div id="root"></div>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>\n'
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>\n'
    '<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js"></script>\n'
    "<script>\n" + js + "\n</script>\n"
)
(ROOT / "rostra.html").write_text(page)
print(f"rostra.html: {len(page):,} bytes")
