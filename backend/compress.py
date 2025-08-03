import sys, json, fitz, os
def compress_pdf(in_path, out_path):
    try:
        initial = os.path.getsize(in_path)
        with fitz.open(in_path) as doc:
            doc.save(out_path, garbage=4, deflate=True, clean=True)
        final = os.path.getsize(out_path)
        reduction = (initial - final) / initial * 100 if initial > 0 else 0
        return {"success": True, "message": f"Compressed by {reduction:.1f}%. New size: {final/1024:.1f} KB"}
    except Exception as e: return {"success": False, "message": f"Error: {e}"}
if __name__ == "__main__": print(json.dumps(compress_pdf(sys.argv[1], sys.argv[2])))
