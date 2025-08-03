import sys
import os
import fitz  # PyMuPDF
import json

def generate_preview(file_path, page_num, output_dir):
    try:
        page_num = int(page_num)
        doc = fitz.open(file_path)

        if not (0 <= page_num < len(doc)):
            return {"success": False, "message": "Page number is out of range."}

        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=150)  # Higher DPI for better quality
        
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        output_file = os.path.join(output_dir, f"preview_{page_num + 1}.png")
        pix.save(output_file)
        
        return {
            "success": True, 
            "filePath": output_file, 
            "pageCount": len(doc)
        }

    except FileNotFoundError:
        return {"success": False, "message": f"Error: The file was not found at {file_path}"}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    page_num_str = sys.argv[2]
    output_dir = sys.argv[3]
    result = generate_preview(file_path, page_num_str, output_dir)
    print(json.dumps(result))
