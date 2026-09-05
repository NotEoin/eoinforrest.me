#!/usr/bin/env python3
"""
Builds public/Eoin-Forrest-CV.pdf from src/data/cv.json.

    python3 tools/build-cv-pdf.py

The page at /cv and this PDF read the same JSON, so the two cannot drift. The
only deliberate differences are the contact block: the email is assembled at
runtime in the browser so it stays out of the prerendered HTML, and the phone
number is here and nowhere else - on the page it would just be a line waiting
to be harvested, and anyone who wants it has already downloaded the CV.

No dependencies. The PDF is written by hand against the base-14 fonts, which
every reader has built in, so the file stays small, the text extracts cleanly
for applicant tracking systems, and nothing has to be embedded. Metrics come
from the URW Nimbus Sans AFMs, which are metrically identical to Helvetica; if
they are missing, a built-in width table is used instead.

Content is ASCII by rule. The build asserts it and refuses to write a PDF
containing so much as one smart quote.
"""

import json
import re
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "data" / "cv.json"
OUT = ROOT / "public" / "Eoin-Forrest-CV.pdf"

# --------------------------------------------------------------- contact
# PDF only. See the module docstring.
NAME = "Eoin Forrest"
EMAIL = "Forrest.Eoin@gmail.com"
PHONE = "07484 835722"
LINKS = "linkedin.com/in/eoin-forrest | github.com/NotEoin | eoinforrest.me"
LOCATION = "London / Newcastle | open to relocation | UK and Irish citizen (no visa sponsorship required)"

# ------------------------------------------------------------ page setup
PW, PH = 595.276, 841.890          # A4
ML, MR = 52.0, 52.0
MT, MB = 44.0, 38.0
CW = PW - ML - MR                  # content width
COL_GAP = 26.0
COL_W = (CW - COL_GAP) / 2

# ----------------------------------------------------------- typography
F_REG, F_BOLD, F_ITAL = "F1", "F2", "F3"

NAME_SIZE = 20.0
CONTACT_SIZE = 8.6
SECTION_SIZE = 8.4
HEAD_SIZE = 10.2
META_SIZE = 8.6
BODY_SIZE = 9.4
BODY_LEAD = 12.2
MODULE_SIZE = 8.8
MODULE_ROW = 18.6      # one module: name, then its bar, then the gap

INK = 0.10          # headings
BODY_INK = 0.22     # running text
META_INK = 0.42     # dates, stacks, the contact block
RULE = 0.78         # hairlines
BAR = 0.30          # the filled part of a module bar

# ------------------------------------------------------------- metrics
AFM_DIR = Path("/usr/share/fonts/type1/urw-base35")
AFM_FILES = {
    F_REG: "NimbusSans-Regular.afm",
    F_BOLD: "NimbusSans-Bold.afm",
    F_ITAL: "NimbusSans-Italic.afm",
}

# ASCII 32-126 by PostScript glyph name, so a width lookup is exact rather
# than dependent on which encoding vector the AFM happens to use.
GLYPHS = (
    "space exclam quotedbl numbersign dollar percent ampersand quotesingle "
    "parenleft parenright asterisk plus comma hyphen period slash "
    "zero one two three four five six seven eight nine "
    "colon semicolon less equal greater question at "
    "A B C D E F G H I J K L M N O P Q R S T U V W X Y Z "
    "bracketleft backslash bracketright asciicircum underscore grave "
    "a b c d e f g h i j k l m n o p q r s t u v w x y z "
    "braceleft bar braceright asciitilde"
).split()
assert len(GLYPHS) == 95

# Helvetica widths for ASCII 32-126, per Adobe's AFM. The fallback when the
# URW metrics are not installed; identical numbers, just frozen here.
FALLBACK = {
    F_REG: [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
            556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
            1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
            667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
            333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
            556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584],
    F_BOLD: [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
             556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
             975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
             667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
             333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
             611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584],
}
FALLBACK[F_ITAL] = FALLBACK[F_REG]


def load_widths():
    """{font: [width per ASCII 32-126]} in 1/1000 em."""
    widths = {}
    for font, filename in AFM_FILES.items():
        path = AFM_DIR / filename
        if not path.exists():
            widths[font] = list(FALLBACK[font])
            continue
        by_name = {}
        for line in path.read_text(errors="replace").splitlines():
            if not line.startswith("C "):
                continue
            wx = name = None
            for field in line.split(";"):
                field = field.strip()
                if field.startswith("WX "):
                    wx = float(field[3:])
                elif field.startswith("N "):
                    name = field[2:].strip()
            if name is not None and wx is not None:
                by_name[name] = wx
        widths[font] = [by_name.get(g, FALLBACK[font][i]) for i, g in enumerate(GLYPHS)]
    return widths


WIDTHS = load_widths()


def measure(text, font, size, tracking=0.0):
    table = WIDTHS[font]
    total = 0.0
    for ch in text:
        total += table[ord(ch) - 32]
    return total * size / 1000.0 + tracking * len(text)


# ---------------------------------------------------------- inline runs
BOLD_SPLIT = re.compile(r"(\*\*.+?\*\*)", re.S)


def runs_of(text):
    """'plain **bold** plain' -> [(font, 'plain '), (F_BOLD, 'bold'), ...]"""
    out = []
    for part in BOLD_SPLIT.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            out.append((F_BOLD, part[2:-2]))
        else:
            out.append((F_REG, part))
    return out


def wrap(text, width, size):
    """Greedy wrap over bold-aware runs. Returns lines of [(font, word)]."""
    words = []
    for font, chunk in runs_of(text):
        for i, word in enumerate(chunk.split(" ")):
            if word == "":
                continue
            words.append((font, word))
    lines, line, used = [], [], 0.0
    for font, word in words:
        w = measure(word, font, size)
        space = measure(" ", font, size) if line else 0.0
        if line and used + space + w > width:
            lines.append(line)
            line, used = [(font, word)], w
        else:
            line.append((font, word))
            used += space + w
    if line:
        lines.append(line)
    return lines


def esc(text):
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


# ------------------------------------------------------------- document
class Doc:
    def __init__(self):
        self.pages = []
        self.ops = []
        self.y = 0.0
        self._new_page()

    def _new_page(self):
        if self.ops:
            self.pages.append(self.ops)
        self.ops = []
        self.y = PH - MT

    def need(self, height):
        """Break the page if `height` will not fit below the cursor."""
        if self.y - height < MB:
            self._new_page()
            return True
        return False

    def finish(self):
        self.pages.append(self.ops)
        return self.pages

    # -- primitives ------------------------------------------------------
    def text(self, s, x, y, font, size, ink=BODY_INK, tracking=0.0):
        if not s:
            return
        # Tc belongs to the text state, which BT/ET does not reset - so it is
        # written on every run, or tracking from one heading silently spaces
        # out the rest of the document.
        self.ops.append(
            f"BT {ink:.3f} g {tracking} Tc /{font} {size} Tf "
            f"1 0 0 1 {x:.2f} {y:.2f} Tm ({esc(s)}) Tj ET"
        )

    def rule(self, x, y, width, ink=RULE, thickness=0.5):
        self.ops.append(
            f"{ink:.3f} G {thickness} w {x:.2f} {y:.2f} m {x + width:.2f} {y:.2f} l S"
        )

    def line_runs(self, line, x, y, size):
        """Draw one wrapped line, word by word, at its own font."""
        cursor = x
        for i, (font, word) in enumerate(line):
            if i:
                cursor += measure(" ", font, size)
            self.text(word, cursor, y, font, size)
            cursor += measure(word, font, size)

    # -- blocks ----------------------------------------------------------
    def paragraph(self, text, x=ML, width=CW, size=BODY_SIZE, lead=BODY_LEAD, gap=0.0):
        lines = wrap(text, width, size)
        self.need(len(lines) * lead)
        for line in lines:
            self.y -= size
            self.line_runs(line, x, self.y, size)
            self.y -= lead - size
        self.y -= gap

    def height_of(self, text, width, size=BODY_SIZE, lead=BODY_LEAD):
        return len(wrap(text, width, size)) * lead

    def section(self, title):
        self.need(46)
        self.y -= 14
        self.text(title.upper(), ML, self.y, F_BOLD, SECTION_SIZE, INK, tracking=1.5)
        self.y -= 6
        self.rule(ML, self.y, CW, ink=0.55, thickness=0.7)
        self.y -= 10

    def heading(self, text, size=HEAD_SIZE):
        self.y -= size
        self.text(text, ML, self.y, F_BOLD, size, INK)
        self.y -= 3

    def meta(self, text):
        self.y -= META_SIZE
        self.text(text, ML, self.y, F_REG, META_SIZE, META_INK)
        self.y -= 4

    def entry(self, title, meta, body, size=HEAD_SIZE):
        """A titled entry that never splits: no heading stranded at a page
        foot with its prose on the next page."""
        self.need(size + 3 + META_SIZE + 4 + 1 + self.height_of(body, CW))
        self.heading(title, size=size)
        self.meta(meta)
        self.y -= 1
        self.paragraph(body)


# -------------------------------------------------------------- content
def check_ascii(node, path="cv.json"):
    if isinstance(node, str):
        for i, ch in enumerate(node):
            if not (32 <= ord(ch) <= 126):
                raise SystemExit(
                    f"non-ASCII character {ch!r} (U+{ord(ch):04X}) at {path}, offset {i}:\n"
                    f"  {node[max(0, i - 40):i + 40]}"
                )
    elif isinstance(node, list):
        for i, item in enumerate(node):
            check_ascii(item, f"{path}[{i}]")
    elif isinstance(node, dict):
        for key, value in node.items():
            if key.startswith("_"):
                continue
            check_ascii(value, f"{path}.{key}")


def module_column(doc, rows, x, width, top):
    """Name left, mark right, and a bar under each. Returns the ending y."""
    y = top
    for name, mark in rows:
        y -= MODULE_SIZE
        mark_text = str(mark)
        mark_w = measure(mark_text, F_REG, MODULE_SIZE)
        doc.text(name, x, y, F_REG, MODULE_SIZE, BODY_INK)
        doc.text(mark_text, x + width - mark_w, y, F_REG, MODULE_SIZE, INK)
        y -= 4.2
        doc.rule(x, y, width, ink=0.86, thickness=0.6)
        doc.rule(x, y, width * mark / 100.0, ink=BAR, thickness=0.6)
        y -= MODULE_ROW - MODULE_SIZE - 4.2
    return y


def module_grid(doc, groups):
    """The full transcript, year by year: two year blocks to a row, each one
    whole inside its own column so no year is ever split across the gutter."""
    label_h = 12.0
    for i in range(0, len(groups), 2):
        pair = groups[i:i + 2]
        doc.need(label_h + max(len(g["rows"]) for g in pair) * MODULE_ROW)
        top, ends = doc.y, []
        for j, group in enumerate(pair):
            x = ML + j * (COL_W + COL_GAP)
            doc.text(group["year"].upper(), x, top - 8, F_BOLD, 7.4, META_INK, tracking=1.0)
            ends.append(module_column(doc, group["rows"], x, COL_W, top - label_h))
        doc.y = min(ends)
        if i + 2 < len(groups):
            doc.y -= 12


def build():
    data = json.loads(CONTENT.read_text())
    check_ascii(data)
    for label, value in (("NAME", NAME), ("EMAIL", EMAIL), ("PHONE", PHONE),
                         ("LINKS", LINKS), ("LOCATION", LOCATION)):
        check_ascii(value, f"build-cv-pdf.py:{label}")

    doc = Doc()

    # header -------------------------------------------------------------
    doc.y -= NAME_SIZE
    doc.text(NAME, ML, doc.y, F_BOLD, NAME_SIZE, INK, tracking=0.2)
    doc.y -= 12
    doc.text(f"{EMAIL} | {PHONE} | {LINKS}", ML, doc.y, F_REG, CONTACT_SIZE, META_INK)
    doc.y -= 10.5
    doc.text(LOCATION, ML, doc.y, F_REG, CONTACT_SIZE, META_INK)
    doc.y -= 9
    doc.rule(ML, doc.y, CW, ink=0.55, thickness=0.7)
    doc.y -= 13

    doc.paragraph(data["summary"], size=9.7, lead=12.7)

    # education ----------------------------------------------------------
    doc.section("Education")
    for i, entry in enumerate(data["education"]):
        if i:
            doc.y -= 7
        doc.entry(entry["qualification"], entry["meta"], entry["detail"])

    doc.y -= 10
    module_grid(doc, data["modules"])

    # skills -------------------------------------------------------------
    doc.section("Technical skills")
    for group, items in data["skills"]:
        doc.paragraph(f"**{group}:** " + ", ".join(items), gap=2.6)

    # projects -----------------------------------------------------------
    doc.section("Projects")
    for i, project in enumerate(data["projects"]):
        if i:
            doc.y -= 8
        doc.entry(project["name"], project["stack"], project["body"], size=9.9)
    doc.y -= 8
    doc.paragraph(data["moreProjects"], size=8.9, lead=11.4)

    # experience ---------------------------------------------------------
    doc.section("Work experience")
    for i, job in enumerate(data["experience"]):
        if i:
            doc.y -= 7
        doc.entry(f"{job['role']}, {job['org']}", job["dates"], job["body"], size=9.9)

    # additional ---------------------------------------------------------
    doc.section("Additional")
    for label, body in data["additional"]:
        doc.paragraph(f"**{label}:** {body}", gap=2.6)
    doc.y -= 6
    doc.paragraph(data["closing"], size=8.9, lead=11.4)

    write_pdf(doc.finish())


# ------------------------------------------------------------ pdf output
def write_pdf(pages):
    objects = {}
    font_ids = {F_REG: 4, F_BOLD: 5, F_ITAL: 6}
    base = {F_REG: "Helvetica", F_BOLD: "Helvetica-Bold", F_ITAL: "Helvetica-Oblique"}

    first_page_obj = 7
    page_ids = [first_page_obj + 2 * i for i in range(len(pages))]

    objects[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    objects[2] = f"<< /Type /Pages /Count {len(pages)} /Kids [{kids}] >>".encode()
    objects[3] = (
        "<< /Font << "
        + " ".join(f"/{name} {oid} 0 R" for name, oid in font_ids.items())
        + " >> >>"
    ).encode()
    for name, oid in font_ids.items():
        objects[oid] = (
            f"<< /Type /Font /Subtype /Type1 /BaseFont /{base[name]} "
            f"/Encoding /WinAnsiEncoding >>"
        ).encode()

    for i, (pid, ops) in enumerate(zip(page_ids, pages)):
        stream = zlib.compress("\n".join(ops).encode("ascii"))
        objects[pid] = (
            f"<< /Type /Page /Parent 2 0 R /Resources 3 0 R "
            f"/MediaBox [0 0 {PW:.3f} {PH:.3f}] /Contents {pid + 1} 0 R >>"
        ).encode()
        objects[pid + 1] = (
            f"<< /Length {len(stream)} /Filter /FlateDecode >>\nstream\n".encode()
            + stream
            + b"\nendstream"
        )

    info_id = max(objects) + 1
    objects[info_id] = (
        f"<< /Title ({NAME} - CV) /Author ({NAME}) "
        f"/Subject (Curriculum vitae) /Creator (tools/build-cv-pdf.py) >>"
    ).encode()

    out = bytearray(b"%PDF-1.4\n")
    offsets = {}
    for oid in sorted(objects):
        offsets[oid] = len(out)
        out += f"{oid} 0 obj\n".encode() + objects[oid] + b"\nendobj\n"

    xref_at = len(out)
    count = max(objects) + 1
    out += f"xref\n0 {count}\n".encode()
    out += b"0000000000 65535 f \n"
    for oid in range(1, count):
        out += f"{offsets[oid]:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {count} /Root 1 0 R /Info {info_id} 0 R >>\n"
        f"startxref\n{xref_at}\n%%EOF\n"
    ).encode()

    OUT.write_bytes(bytes(out))
    print(f"{OUT.relative_to(ROOT)}: {len(pages)} pages, {len(out) / 1024:.1f} kB")


if __name__ == "__main__":
    sys.exit(build())
