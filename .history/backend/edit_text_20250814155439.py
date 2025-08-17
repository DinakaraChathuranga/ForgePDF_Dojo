import sys, json, fitz, pikepdf
from pikepdf import Pdf, PdfImage

def extract_text_with_positions(pdf_path):
    """Extract text with positions for editing"""
    try:
        doc = fitz.open(pdf_path)
        text_blocks = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if "lines" in block:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text_blocks.append({
                                "page": page_num + 1,
                                "text": span["text"],
                                "bbox": span["bbox"],  # [x0, y0, x1, y1]
                                "font": span["font"],
                                "size": span["size"],
                                "color": span["color"]
                            })
        
        doc.close()
        return {"success": True, "text_blocks": text_blocks}
    except Exception as e:
        return {"success": False, "message": f"Error extracting text: {e}"}

def replace_text_in_pdf(pdf_path, replacements_json, output_path):
    """Replace text in PDF using redaction and overlay"""
    try:
        replacements = json.loads(replacements_json)
        doc = fitz.open(pdf_path)
        
        for replacement in replacements:
            page_num = replacement["page"] - 1
            old_text = replacement["old_text"]
            new_text = replacement["new_text"]
            bbox = replacement["bbox"]
            
            if 0 <= page_num < len(doc):
                page = doc[page_num]
                
                # Create redaction annotation to hide old text
                redact_annot = page.add_redact_annot(bbox)
                page.apply_redactions()
                
                # Add new text at the same position
                page.insert_text(
                    (bbox[0], bbox[1] + bbox[3] - bbox[1]),  # Position text
                    new_text,
                    fontsize=replacement.get("size", 12),
                    color=replacement.get("color", (0, 0, 0))
                )
        
        doc.save(output_path)
        doc.close()
        return {"success": True, "message": "Text replaced successfully"}
    except Exception as e:
        return {"success": False, "message": f"Error replacing text: {e}"}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "Insufficient arguments"}))
    elif sys.argv[1] == "extract":
        result = extract_text_with_positions(sys.argv[2])
        print(json.dumps(result))
    elif sys.argv[1] == "replace":
        result = replace_text_in_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
        print(json.dumps(result))
    else:
        print(json.dumps({"success": False, "message": "Invalid operation"}))
