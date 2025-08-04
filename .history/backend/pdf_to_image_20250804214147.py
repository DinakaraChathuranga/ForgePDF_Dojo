# pdf_to_image.py (FIXED)
import sys
import os
import json
import fitz

def pdf_to_image(file_path, output_dir):
    try:
        if not os.path.exists(file_path):
            return {"success": False, "message": "PDF file does not exist."}
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        doc = fitz.open(file_path)
        saved = 0
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=150)
            image_path = os.path.join(output_dir, f"page_{i + 1}.png")
            pix.save(image_path)
            saved += 1
        
        if saved == 0:
            return {"success": False, "message": "No pages were converted."}
        return {"success": True, "message": f"Successfully converted {saved} pages to images."}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    output_dir = sys.argv[2]
    result = pdf_to_image(file_path, output_dir)
    print(json.dumps(result))
