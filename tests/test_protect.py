import pytest
import pikepdf
from protect import protect_pdf


def test_protect_pdf(make_pdf, tmp_path):
    input_pdf = make_pdf("in.pdf")
    output_pdf = tmp_path / "protected.pdf"
    password = "secret"
    result = protect_pdf(str(input_pdf), str(output_pdf), password)
    assert result["success"]
    assert output_pdf.exists()
    with pytest.raises(pikepdf.PasswordError):
        pikepdf.Pdf.open(output_pdf)
    with pikepdf.Pdf.open(output_pdf, password=password) as pdf:
        assert len(pdf.pages) == 1
