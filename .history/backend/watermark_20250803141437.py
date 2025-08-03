import sys
import json
import fitz  # PyMuPDF
import math

def add_watermark(input_path, output_path, options_json):
    try:
        options = json.loads(options_json)
        text = options.get("text", "WATERMARK")
        orientation = options.get("orientation", "diagonal")
        size_map = {"small": 25, "medium": 50, "large": 75}
        font_size = size_map.get(options.get("size", "medium"), 50)
        
        rotations = {"diagonal": 45, "horizontal": 0, "vertical": 90}
        angle = rotations.get(orientation, 45)

        doc = fitz.open(input_path)
        
        for page in doc:
            # --- Universal Compatibility Method ---
            
            # 1. Use TextWriter, which is a fundamental object
            # Set opacity and color on the TextWriter itself
            tw = fitz.TextWriter(page.rect, opacity=0.5, color=(0.5, 0.5, 0.5))
            
            # 2. Define the font
            font = fitz.Font("helv")
            
            # 3. Manually calculate the page center
            page_rect = page.rect
            center_x = page_rect.width / 2
            center_y = page_rect.height / 2
            
            # 4. Create the rotation matrix from scratch
            angle_rad = math.radians(angle)
            cos_a = math.cos(angle_rad)
            sin_a = math.sin(angle_rad)
            # This matrix will rotate the text around the page's center
            mat = fitz.Matrix(cos_a, sin_a, -sin_a, cos_a, center_x, center_y)

            # 5. Calculate the starting position of the text to make it centered
            # We start from a point of (0,0) relative to the rotation center
            text_width = font.text_length(text, fontsize=font_size)
            start_pos = fitz.Point(-text_width / 2, font_size / 4)

            # 6. Add the text at the calculated starting position using only basic arguments
            tw.append(start_pos, text, font=font, fontsize=font_size)
            
            # 7. Write the text to the page, applying the final transformation matrix
            # This is the key step for older library versions
            tw.write_text(page, transform=mat)

        doc.save(output_path)
        doc.close()
        return {"success": True, "message": "Watermark added successfully."}
        
    except Exception as e:
        return {"success": False, "message": f"An error occurred in the watermark script: {str(e)}"}

if __name__ == "__main__":
    result = add_watermark(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(result))
