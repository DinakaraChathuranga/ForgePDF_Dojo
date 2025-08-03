import sys
import os
import json
from PyPDF2 import PdfMerger

def merge_pdfs(file_paths_str, output_path):
    try:
        merger = PdfMerger()
        file_paths = file_paths_str.split(',')

        if len(file_paths) < 2:
            return {"success": False, "message": "Please select at least two PDF files to merge."}

        for pdf_path in file_paths:
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
            else:
                return {"success": False, "message": f"File not found: {pdf_path}"}

        with open(output_path, 'wb') as f:
            merger.write(f)
        merger.close()
        
        return {"success": True, "message": f"Successfully merged {len(file_paths)} files into {os.path.basename(output_path)}"}

    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_paths_str = sys.argv[1]
    output_path = sys.argv[2]
    result = merge_pdfs(file_paths_str, output_path)
    # Ensure the output is a valid JSON string
    print(json.dumps(result))
