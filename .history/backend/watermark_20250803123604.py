import sys
import json
import fitz  # PyMuPDF

def add_watermark(input_path, output_path, options_json):
    try:
        options = json.loads(options_json)
        text = options.get("text", "WATERMARK")
        orientation = options.get("orientation", "diagonal")
        size_map = {"small": 25, "medium": 50, "large": 75}
        font_size = size_map.get(options.get("size", "medium"), 50)
        
        # Define rotation angles
        rotations = {"diagonal": 45, "horizontal": 0, "vertical": 90}
        angle = rotations.get(orientation, 45)

        doc = fitz.open(input_path)
        
        for page in doc:
            # --- Text insertion logic for rotated text ---
            # Create a Shape to measure the text block
            shape = page.new_shape()
            
            # Get the center of the page
            page_center = page.rect.center
            
            # Insert the text with rotation
            shape.insert_text(
                page_center,
                text,
                fontname="helv",
                fontsize=font_size,
                rotate=angle,
                color=(0.8, 0.8, 0.8), # Gray color
                opacity=0.5,
                align=fitz.TEXT_ALIGN_CENTER
            )

            # Apply the shape to the page
            shape.commit()

        doc.save(output_path)
        doc.close()
        return {"success": True, "message": "Watermark added successfully."}
        
    except Exception as e:
        return {"success": False, "message": f"Error adding watermark: {str(e)}"}

if __name__ == "__main__":
    result = add_watermark(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(result))