import sys
import os
import json
import fitz

def image_to_pdf(image_paths_str, output_path):
    try:
        image_paths = image_paths_str.split(',')
        doc = fitz.open()

        for image_path in image_paths:
            img = fitz.open(image_path)
            rect = img[0].rect
            pdf_bytes = img.convert_to_pdf()
            img.close()
            
            img_pdf = fitz.open("pdf", pdf_bytes)
            page = doc.new_page(width=rect.width, height=rect.height)
            page.show_pdf_page(rect, img_pdf, 0)

        doc.save(output_path)
        doc.close()
        
        return {"success": True, "message": f"Successfully converted {len(image_paths)} images to a PDF."}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    image_paths_str = sys.argv[1]
    output_path = sys.argv[2]
    result = image_to_pdf(image_paths_str, output_path)
    print(json.dumps(result))