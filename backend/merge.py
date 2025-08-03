import sys, json, pikepdf
def merge_pdfs(paths_json, out_path):
    try:
        paths = json.loads(paths_json)
        if len(paths) < 2: return {"success": False, "message": "Select at least two PDFs."}
        pdf = pikepdf.Pdf.new()
        for file in paths:
            with pikepdf.Pdf.open(file) as src: pdf.pages.extend(src.pages)
        pdf.save(out_path)
        return {"success": True, "message": f"Successfully merged {len(paths)} files!"}
    except Exception as e: return {"success": False, "message": f"Error: {e}"}
if __name__ == "__main__": print(json.dumps(merge_pdfs(sys.argv[1], sys.argv[2])))