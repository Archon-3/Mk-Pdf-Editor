import tempfile
import unittest
from pathlib import Path

from backend.app.services.extraction.tables import extract_tables
from backend.app.services.ocr.service import ocr_pdf


class TableExtractionAndOcrTest(unittest.TestCase):
    def test_extract_tables_creates_csv(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'sample.pdf'
            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 131 >>\nstream\nBT\n/F1 10 Tf\n20 150 Td\n(Name) Tj\n80 150 Td\n(Score) Tj\n20 120 Td\n(Alice) Tj\n80 120 Td\n(90) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000329 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n383\n%%EOF'
            )
            output_dir = Path(tmp_dir) / 'tables'

            generated = extract_tables(source, output_dir)

            self.assertTrue(generated)
            self.assertTrue(Path(generated[0]).exists())
            csv_text = Path(generated[0]).read_text(encoding='utf-8')
            self.assertIn('Name', csv_text)
            self.assertIn('Score', csv_text)

    def test_ocr_pdf_returns_valid_payload(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'scan.pdf'
            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 42 >>\nstream\nBT\n/F1 12 Tf\n20 100 Td\n(Hello) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000919 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n983\n%%EOF'
            )

            result = ocr_pdf(str(source), str(Path(tmp_dir) / 'ocr.pdf'))

            self.assertIn('status', result)
            self.assertIn('pages', result)


if __name__ == '__main__':
    unittest.main()
