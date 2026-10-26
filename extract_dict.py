import fitz
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'C:\Users\GEILER M\Downloads\DICCIONARIO ESPAÑOL-EMBERA 2020.pdf'
doc = fitz.open(pdf_path)

all_entries = []

for page_idx in range(len(doc)):
    page = doc[page_idx]
    words = page.get_text("words")
    
    # Filter watermark letter or huge title
    valid_words = []
    for w in words:
        x0, y0, x1, y1, text, b_no, l_no, w_no = w
        height = y1 - y0
        if height > 40: # Big watermark letters
            continue
        # Title of dict on page 0
        if page_idx == 0 and y0 < 150:
            continue
        valid_words.append(w)
        
    left_words = [w for w in valid_words if w[0] < 330]
    right_words = [w for w in valid_words if w[0] >= 330]
    
    # Group left into lines
    left_lines = {}
    for w in left_words:
        y_mid = (w[1] + w[3]) / 2
        matched_y = None
        for y in left_lines:
            if abs(y - y_mid) < 7:
                matched_y = y
                break
        if matched_y is None:
            matched_y = y_mid
            left_lines[matched_y] = []
        left_lines[matched_y].append(w)
        
    # Group right into lines
    right_lines = {}
    for w in right_words:
        y_mid = (w[1] + w[3]) / 2
        matched_y = None
        for y in right_lines:
            if abs(y - y_mid) < 7:
                matched_y = y
                break
        if matched_y is None:
            matched_y = y_mid
            right_lines[matched_y] = []
        right_lines[matched_y].append(w)
        
    # For each left line, find matching right line closest in vertical center
    for y_left in sorted(left_lines.keys()):
        sp_words = sorted(left_lines[y_left], key=lambda item: item[0])
        sp = " ".join([w[4] for w in sp_words]).strip()
        
        # Match right line
        best_y_right = None
        min_diff = 12 # max acceptable vertical distance
        for y_right in right_lines.keys():
            diff = abs(y_left - y_right)
            if diff < min_diff:
                min_diff = diff
                best_y_right = y_right
                
        if best_y_right is not None:
            em_words = sorted(right_lines[best_y_right], key=lambda item: item[0])
            em = " ".join([w[4] for w in em_words]).strip()
            if sp and em and sp != "DICCIONARIO" and em != "español-embera":
                all_entries.append({
                    "spanish": sp,
                    "embera": em,
                    "page": page_idx + 1
                })

print(f"Extracted {len(all_entries)} dictionary entries across {len(doc)} pages!")
with open("dictionary.json", "w", encoding="utf-8") as f:
    json.dump(all_entries, f, ensure_ascii=False, indent=2)

# Print 10 samples
for e in all_entries[:10]:
    print(f"[{e['page']}] {e['spanish']} = {e['embera']}")
