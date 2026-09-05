#!/usr/bin/env python3
"""Regenerate the self-hosted webfonts in public/fonts and src/styles/fonts.css.

Google Fonts serves a different CSS per user agent; we ask as a modern browser
so we get woff2, then keep only the latin and latin-ext subsets — the site is
English and the other twenty-odd blocks are dead weight.

Run from the project root when a weight or family changes in the CSS below:

    python3 tools/fetch-fonts.py
"""

import pathlib
import re
import urllib.request

FAMILIES = (
    "family=Geist:wght@300;400;500;600;700"
    "&family=Geist+Mono:wght@400;500"
    "&family=Fraunces:ital,opsz,wght@1,9..144,500"
)
KEEP_SUBSETS = ("latin", "latin-ext")
UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

root = pathlib.Path(__file__).resolve().parent.parent
out_dir = root / "public" / "fonts"
css_path = root / "src" / "styles" / "fonts.css"


def main() -> None:
    url = f"https://fonts.googleapis.com/css2?{FAMILIES}&display=swap"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req).read().decode()

    out_dir.mkdir(parents=True, exist_ok=True)
    blocks = re.findall(r"(?:/\*\s*([\w-]+)\s*\*/\s*)?@font-face\s*\{(.*?)\}", css, re.S)

    kept = []
    for subset, body in blocks:
        if subset not in KEEP_SUBSETS:
            continue
        family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", body).group(1)
        style = re.search(r"font-style:\s*(\w+)", body).group(1)
        remote = re.search(r"url\((https://[^)]+)\)", body).group(1)

        slug = family.lower().replace(" ", "-")
        italic = "-italic" if style == "italic" else ""
        name = f"{slug}-{weight}{italic}-{subset}.woff2"
        urllib.request.urlretrieve(remote, out_dir / name)
        kept.append(re.sub(r"url\(https://[^)]+\)", f"url(/fonts/{name})", body).strip())

    css_path.write_text(
        "/* Self-hosted subset of the Google Fonts build — latin and latin-ext only.\n"
        "   Regenerate with tools/fetch-fonts.py if a weight or family changes. */\n\n"
        + "\n\n".join("@font-face {\n  " + b + "\n}" for b in kept)
        + "\n"
    )
    print(f"wrote {len(kept)} font-face blocks and {len(kept)} woff2 files")


if __name__ == "__main__":
    main()
