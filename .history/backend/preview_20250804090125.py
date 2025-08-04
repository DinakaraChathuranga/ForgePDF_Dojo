import sys
import os
import fitz  # PyMuPDF
import json

def get_preview(file_path, page_num_str, output_dir):
    try:
        # Check if the file exists and is a valid PDF
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"The file '{os.path.basename(file_path)}' was not found.")
        
        doc = fitz.open(file_path)
        page_num = int(page_num_str)
        total_pages = len(doc)

        # Generate thumbnails for all pages
        if page_num == -1:
            file_paths = []
            for i in range(total_pages):
                page = doc.load_page(i)
                # Use a lower DPI for thumbnails to improve performance
                pix = page.get_pixmap(dpi=96)
                output_path = os.path.join(output_dir, f"preview_{i}.png")
                pix.save(output_path)
                file_paths.append(output_path)
            doc.close()
            return {"success": True, "filePaths": file_paths, "pageCount": total_pages}
        
        # Generate a single high-quality preview
        else:
            if not 0 <= page_num < total_pages:
                raise ValueError(f"Invalid page number: {page_num + 1}. The document has {total_pages} pages.")
            
            page = doc.load_page(page_num)
            # Use a higher DPI for single page previews
            pix = page.get_pixmap(dpi=150)
            output_path = os.path.join(output_dir, "preview_page.png")
            pix.save(output_path)
            doc.close()
            return {"success": True, "filePath": output_path, "pageCount": total_pages}

    except Exception as e:
        # Return a detailed error message in JSON format
        return {"success": False, "message": f"Python Error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 4:
        # Ensure the script is called with the correct number of arguments
        error_msg = {"success": False, "message": "Internal Error: Incorrect number of arguments passed to preview.py"}
        print(json.dumps(error_msg))
    else:
        file_path = sys.argv[1]
        page_num = sys.argv[2]
        output_dir = sys.argv[3]
        result = get_preview(file_path, page_num, output_dir)
        print(json.dumps(result))