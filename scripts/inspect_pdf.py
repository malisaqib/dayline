"""Compare a downloaded edition PDF with the web stories and check for clipping.

Usage: python -I scripts/inspect_pdf.py tmp/journey/<host>
Reads edition.pdf and stories.json from that directory, renders page PNGs next to them.
"""
import json
import sys
from pathlib import Path

import pymupdf

MARGIN_PT = 20


def main(directory: str) -> int:
    out = Path(directory)
    stories = json.loads((out / "stories.json").read_text(encoding="utf8"))["stories"]
    doc = pymupdf.open(out / "edition.pdf")
    text = " ".join(" ".join(page.get_text().split()) for page in doc)
    links = [link["uri"] for page in doc for link in page.get_links() if link.get("uri")]
    failures = 0

    positions = [text.find(" ".join(s["title"].split())) for s in stories]
    in_order = all(p >= 0 for p in positions) and positions == sorted(positions)
    print(f"{'PASS' if in_order else 'FAIL'} PDF contains all {len(stories)} web headlines in the same order (positions {positions})")
    failures += 0 if in_order else 1

    links_match = links == [s["href"] for s in stories]
    print(f"{'PASS' if links_match else 'FAIL'} PDF source links match web links in order ({len(links)} links)")
    failures += 0 if links_match else 1

    for page in doc:
        width, height = page.rect.width, page.rect.height
        blocks = page.get_text("blocks")
        outside = [b for b in blocks if b[0] < MARGIN_PT or b[1] < MARGIN_PT or b[2] > width - MARGIN_PT or b[3] > height - 10]
        ok = not outside
        print(f"{'PASS' if ok else 'FAIL'} page {page.number + 1}: {len(blocks)} text blocks inside margins")
        failures += 0 if ok else 1
        page.get_pixmap(dpi=80).save(out / f"pdf-page{page.number + 1}.png")

    print(f"pages: {doc.page_count}")

    after_path = out / "edition-after-feedback.pdf"
    if after_path.exists():
        after = " ".join(" ".join(p.get_text().split()) for p in pymupdf.open(after_path))
        same = after == text
        print(f"{'PASS' if same else 'FAIL'} PDF text identical before and after feedback")
        failures += 0 if same else 1
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
