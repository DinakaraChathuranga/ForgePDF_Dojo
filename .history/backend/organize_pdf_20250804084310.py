import sys
import os
import json
from PyPDF2 import PdfReader, PdfWriter

def organize_pdf(file_path, page_order_str, pages_to_delete_str, output_path):
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()

        page_order = [int(p) - 1 for p in page_order_str.split(',')]
        pages_to_delete = {int(p) - 1 for p in pages_to_delete_str.split(',')} if pages_to_delete_str else set()

        for page_num in page_order:
            if page_num not in pages_to_delete:
                writer.add_page(reader.pages[page_num])

        with open(output_path, 'wb') as f:
            writer.write(f)
            
        return {"success": True, "message": f"Successfully organized PDF and saved to {os.path.basename(output_path)}"}

    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    page_order_str = sys.argv[2]
    pages_to_delete_str = sys.argv[3]
    output_path = sys.argv[4]
    result = organize_pdf(file_path, page_order_str, pages_to_delete_str, output_path)
    print(json.dumps(result))