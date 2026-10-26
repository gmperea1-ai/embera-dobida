import fitz
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = r'C:\Users\GEILER M\Downloads\DICCIONARIO ESPAÑOL-EMBERA 2020.pdf'
doc = fitz.open(pdf_path)

print(f"Total pages: {len(doc)}")

# Test page 1 blocks
p1 = doc[0]
blocks = p1.get_text("blocks")
for b in blocks:
    # b: (x0, y0, x1, y1, text, block_no, block_type)
    print(f"Block: x0={b[0]:.1f}, x1={b[2]:.1f}, text={b[4].strip()[:60]}...")
