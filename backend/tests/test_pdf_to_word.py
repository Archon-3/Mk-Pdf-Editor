import tempfile
import unittest
from pathlib import Path

from docx import Document

from backend.app.services.conversion.pdf_to_word import pdf_to_word
from backend.app.services.processing_engine import ProcessingEngine


class PdfToWordConversionTest(unittest.TestCase):
    def test_pdf_to_word_creates_editable_docx(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'sample.pdf'
            output = Path(tmp_dir) / 'sample.docx'

            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 52 >>\nstream\nBT\n/F1 12 Tf\n50 100 Td\n(Hello PDF) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000919 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n983\n%%EOF'
            )

            result = pdf_to_word(source, output)

            self.assertTrue(Path(result).exists())
            document = Document(result)
            text = '\n'.join(paragraph.text for paragraph in document.paragraphs if paragraph.text)
            self.assertIn('Hello PDF', text)

    def test_processing_engine_converts_uploaded_pdf_to_docx(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'sample.pdf'
            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 52 >>\nstream\nBT\n/F1 12 Tf\n50 100 Td\n(Hello PDF) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000919 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n983\n%%EOF'
            )

            job = ProcessingEngine().process('pdf-to-word', str(source), job_id='job-123')

            self.assertTrue(job.success)
            self.assertTrue(Path(job.output_path).exists())
            self.assertTrue(Path(job.output_path).suffix == '.docx')

    def test_pdf_to_word_preserves_table_layout(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'table.pdf'
            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 117 >>\nstream\nBT\n/F1 10 Tf\n20 150 Td\n(Name) Tj\n80 150 Td\n(Score) Tj\n20 120 Td\n(Alice) Tj\n80 120 Td\n(90) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000329 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n383\n%%EOF'
            )
            output = Path(tmp_dir) / 'table.docx'

            result = pdf_to_word(source, output)
            document = Document(result)

            self.assertTrue(document.tables)
            table_text = '\n'.join(cell.text for table in document.tables for row in table.rows for cell in row.cells)
            self.assertIn('Name', table_text)
            self.assertIn('Score', table_text)


if __name__ == '__main__':
    unittest.main()
