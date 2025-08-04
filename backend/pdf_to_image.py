import sys
import os
import json
import fitz

def pdf_to_image(file_path, output_dir):
    try:
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=300)
            pix.save(os.path.join(output_dir, f"page_{i + 1}.png"))
        
        return {"success": True, "message": f"Successfully converted {len(doc)} pages to images."}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    output_dir = sys.argv[2]
    result = pdf_to_image(file_path, output_dir)
    print(json.dumps(result))