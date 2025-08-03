import sys
import os
from PyPDF2 import PdfReader, PdfWriter

def rotate_pdf(file_path, rotation_angle, output_path):
    try:
        angle = int(rotation_angle)
        if angle not in [90, 180, 270]:
            return {"success": False, "message": "Invalid rotation angle. Please choose 90, 180, or 270."}

        reader = PdfReader(file_path)
        writer = PdfWriter()

        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)

        with open(output_path, 'wb') as f:
            writer.write(f)
            
        return {"success": True, "message": f"Successfully rotated PDF and saved to {os.path.basename(output_path)}"}

    except FileNotFoundError:
        return {"success": False, "message": f"Error: The file was not found at {file_path}"}
    except Exception as e:
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}

if __name__ == "__main__":
    file_path = sys.argv[1]
    rotation_angle = sys.argv[2]
    output_path = sys.argv[3]
    result = rotate_pdf(file_path, rotation_angle, output_path)
    print(result)
