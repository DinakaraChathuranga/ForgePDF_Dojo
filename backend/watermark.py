import sys, json, fitz
def add_watermark(in_path, out_path, opts_json):
    try:
        opts = json.loads(opts_json)
        text = opts.get("text", "WATERMARK")
        size_map = {"small": 25, "medium": 50, "large": 75}
        font_size = size_map.get(opts.get("size", "medium"), 50)
        rotations = {"diagonal": 45, "horizontal": 0, "vertical": 90}
        doc = fitz.open(in_path)
        for page in doc:
            writer = fitz.TextWriter(page.rect, color=(0.8, 0.8, 0.8), opacity=0.5)
            writer.fill_textbox(page.rect, text, font=fitz.Font("helv"), fontsize=font_size, rotate=rotations.get(opts["orientation"], 45), align=fitz.TEXT_ALIGN_CENTER)
            writer.write_text(page)
        doc.save(out_path)
        return {"success": True, "message": "Watermark added successfully."}
    except Exception as e: return {"success": False, "message": f"Error: {e}"}
if __name__ == "__main__": print(json.dumps(add_watermark(sys.argv[1], sys.argv[2], sys.argv[3])))
