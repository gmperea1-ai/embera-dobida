import fitz
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'C:\Users\GEILER M\Downloads\DICCIONARIO ESPAÑOL-EMBERA 2020.pdf'
doc = fitz.open(pdf_path)

def parse_page(page):
    words = page.get_text("words")
    # Filter out header title if present (y0 < 100 on page 1 or y0 < 50 on others)
    # Filter out big letter watermark on the right
    rows = {}
    for w in words:
        x0, y0, x1, y1, text, b_no, l_no, w_no = w
        if y0 < 70 or y0 > 560: # top and bottom margins
            continue
        # Group by approx y0 (within 5 pixels)
        matched_y = None
        for y in rows:
            if abs(y - y0) < 6:
                matched_y = y
                break
        if matched_y is None:
            matched_y = y0
            rows[matched_y] = []
        rows[matched_y].append((x0, text))
    
    # Sort rows by y
    sorted_y = sorted(rows.keys())
    entries = []
    for y in sorted_y:
        row_words = sorted(rows[y], key=lambda item: item[0])
        # separate by x threshold (approx 340-370)
        left = [w[1] for w in row_words if w[0] < 350]
        right = [w[1] for w in row_words if w[0] >= 350 and w[0] < 750]
        sp = " ".join(left).strip()
        em = " ".join(right).strip()
        if sp and em:
            entries.append({"spanish": sp, "embera": em})
    return entries

# Test on page 1 and page 2
entries_p1 = parse_page(doc[0])
print(f"Page 1 found {len(entries_p1)} entries:")
for e in entries_p1[:10]:
    print(f"  {e['spanish']}  -->  {e['embera']}")

entries_p2 = parse_page(doc[1])
print(f"\nPage 2 found {len(entries_p2)} entries:")
for e in entries_p2[:10]:
    print(f"  {e['spanish']}  -->  {e['embera']}")
