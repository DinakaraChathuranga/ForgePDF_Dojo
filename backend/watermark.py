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

        with fitz.open(input_path) as doc:
            for page in doc:
                # Create a shape to draw on
                shape = page.new_shape()

                # Manually calculate the center of the page rectangle
                page_rect = page.rect
                center_point = fitz.Point(page_rect.width / 2, page_rect.height / 2)

                # --- Set Shape Properties (The Robust Method) ---
                # These properties are set on the shape before drawing
                shape.fill_color = (0.8, 0.8, 0.8)  # Set fill color to gray
                shape.stroke_opacity = 0.5          # Set transparency for the text outline
                shape.fill_opacity = 0.5            # Set transparency for the text fill

                # Insert the text using the shape's properties
                # Note: We no longer pass color or opacity here
                shape.insert_text(
                    center_point,
                    text,
                    fontname="helv",
                    fontsize=font_size,
                    rotate=angle,
                    align=fitz.TEXT_ALIGN_CENTER
                )

                # Apply the shape with its properties to the page
                shape.commit()

            doc.save(output_path)
        return {"success": True, "message": "Watermark added successfully."}
        
    except Exception as e:
        # Provide a more detailed error message for debugging
        return {"success": False, "message": f"An error occurred in the watermark script: {str(e)}"}

if __name__ == "__main__":
    result = add_watermark(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(result))
