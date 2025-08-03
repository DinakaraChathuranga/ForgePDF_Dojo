Set-Content -Path "backend/protect.py" -Value @"
import sys, json, pikepdf
def protect_pdf(in_path, out_path, password):
    try:
        with pikepdf.Pdf.open(in_path) as pdf:
            pdf.save(out_path, encryption=pikepdf.Encryption(owner=password, user=password, R=6))
        return {"success": True, "message": "PDF successfully protected."}
    except Exception as e: return {"success": False, "message": f"Error: {e}"}
if __name__ == "__main__": print(json.dumps(protect_pdf(sys.argv[1], sys.argv[2], sys.argv[3])))
