import sys
import os
from PyPDF2 import PdfReader, PdfWriter

def split_pdf(file_path, page_ranges_str, output_path):
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()

        # Parse page ranges (e.g., "1-3, 5, 8-10")
        pages_to_include = set()
        ranges = page_ranges_str.split(',')
        for r in ranges:
            r = r.strip()
            if '-' in r:
                start, end = map(int, r.split('-'))
                for i in range(start, end + 1):
                    pages_to_include.add(i - 1) # Convert to 0-based index
            else:
                pages_to_include.add(int(r) - 1) # Convert to 0-based index

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
        return {"success": False, "message": "Invalid page range format. Please use numbers, commas, and hyphens only (e.g., 1-3, 5)."}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    page_ranges_str = sys.argv[2]
    output_path = sys.argv[3]
    result = split_pdf(file_path, page_ranges_str, output_path)
    print(result)
