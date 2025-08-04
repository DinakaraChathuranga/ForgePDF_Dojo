import sys
import os
import json
from PyPDF2 import PdfReader, PdfWriter

def rotate_pdf(file_path, rotations_json_str, output_path):
    try:
        # Load the JSON string into a Python dictionary
        # The keys will be page numbers (as strings), and values will be rotation angles
        rotations = json.loads(rotations_json_str)
        
        reader = PdfReader(file_path)
        writer = PdfWriter()

        for i, page in enumerate(reader.pages):
            page_num_str = str(i + 1)
            # Check if this page needs rotation
            if page_num_str in rotations:
                angle = int(rotations[page_num_str])
                # The rotate() method adds to any existing rotation
                page.rotate(angle)
            writer.add_page(page)

        with open(output_path, 'wb') as f:
            writer.write(f)
            
        return {"success": True, "message": f"Successfully rotated pages and saved to {os.path.basename(output_path)}"}

    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred in rotate.py: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    rotations_json = sys.argv[2] # This is now a JSON string
    output_path = sys.argv[3]
    result = rotate_pdf(file_path, rotations_json, output_path)
    print(json.dumps(result))