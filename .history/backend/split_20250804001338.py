import sys
import os
import json
from PyPDF2 import PdfReader, PdfWriter

def split_pdf(file_path, page_ranges_str, output_path):
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()

        # Parse page ranges (e.g., "1,3,5")
        pages_to_include = set()
        pages = page_ranges_str.split(',')
        for p in pages:
            p = p.strip()
            if p: # Ensure not an empty string
                pages_to_include.add(int(p) - 1) # Convert to 0-based index

        # Add specified pages to the writer
        for i in sorted(list(pages_to_include)):
            if 0 <= i < len(reader.pages):
                writer.add_page(reader.pages[i])

        if len(writer.pages) == 0:
            return {"success": False, "message": "No valid pages were selected. Please check your page range."}

        with open(output_path, 'wb') as f:
            writer.write(f)
        
        return {"success": True, "message": f"Successfully split PDF and saved to {os.path.basename(output_path)}"}

    except FileNotFoundError:
        return {"success": False, "message": f"Error: The file was not found at {file_path}"}
    except ValueError:
        return {"success": False, "message": "Invalid page format. Please ensure you are providing a comma-separated list of numbers."}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    page_ranges_str = sys.argv[2]
    output_path = sys.argv[3]
    result = split_pdf(file_path, page_ranges_str, output_path)
    print(json.dumps(result))