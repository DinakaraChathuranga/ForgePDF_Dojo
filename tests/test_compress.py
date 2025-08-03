import os
from compress import compress_pdf

def test_compress_pdf(make_pdf, tmp_path):
    input_pdf = make_pdf("in.pdf", "hello" * 100)
    output_pdf = tmp_path / "out.pdf"
    result = compress_pdf(str(input_pdf), str(output_pdf))
    assert result["success"]
    assert output_pdf.exists()
    assert os.path.getsize(output_pdf) <= os.path.getsize(input_pdf)
