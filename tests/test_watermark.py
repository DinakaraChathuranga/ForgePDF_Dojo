import os
import json
from watermark import add_watermark


def test_add_watermark(make_pdf, tmp_path):
    input_pdf = make_pdf("in.pdf")
    output_pdf = tmp_path / "watermarked.pdf"
    options = json.dumps({"text": "TEST"})
    result = add_watermark(str(input_pdf), str(output_pdf), options)
    assert result["success"]
    assert output_pdf.exists()
    assert os.path.getsize(output_pdf) > os.path.getsize(input_pdf)
