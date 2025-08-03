import sys
from pathlib import Path
import pytest
import fitz

# Ensure backend modules are importable
sys.path.append(str(Path(__file__).resolve().parents[1] / 'backend'))

@pytest.fixture
def make_pdf(tmp_path):
    def _make_pdf(name="sample.pdf", text="Hello"):
        path = tmp_path / name
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 72), text)
        doc.save(path)
        return path
    return _make_pdf
