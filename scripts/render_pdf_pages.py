import sys
import fitz

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
start = int(sys.argv[3])
end = int(sys.argv[4])
zoom = float(sys.argv[5]) if len(sys.argv) > 5 else 2.2

rotate = int(sys.argv[6]) if len(sys.argv) > 6 else 0

doc = fitz.open(pdf_path)
mat = fitz.Matrix(zoom, zoom).prerotate(rotate)
for i in range(start - 1, min(end, len(doc))):
    page = doc[i]
    pix = page.get_pixmap(matrix=mat)
    out_path = f"{out_dir}/page_{i+1:03d}.png"
    pix.save(out_path)
    print(out_path)
