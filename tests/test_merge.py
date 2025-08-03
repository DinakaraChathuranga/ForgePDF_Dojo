import json
import fitz
from merge import merge_pdfs

def test_merge_pdfs(make_pdf, tmp_path):
    pdf1 = make_pdf("a.pdf", "A")
    pdf2 = make_pdf("b.pdf", "B")
    output_pdf = tmp_path / "merged.pdf"
    result = merge_pdfs(json.dumps([str(pdf1), str(pdf2)]), str(output_pdf))
    assert result["success"]
    assert output_pdf.exists()
    with fitz.open(output_pdf) as doc:
        assert len(doc) == 2
