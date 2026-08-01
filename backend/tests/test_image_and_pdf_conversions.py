import tempfile
import unittest
from pathlib import Path

from PIL import Image

from backend.app.services.conversion.image_to_pdf import image_to_pdf
from backend.app.services.conversion.pdf_to_image import pdf_to_image


class PdfImageConversionsTest(unittest.TestCase):
    def test_pdf_to_image_generates_images(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source = Path(tmp_dir) / 'sample.pdf'
            output_dir = Path(tmp_dir) / 'images'
            source.write_bytes(
                b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 47 >>\nstream\nBT\n/F1 12 Tf\n20 100 Td\n(Hello) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000124 00000 n \n0000000257 00000 n \n0000000919 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n983\n%%EOF'
            )

            files = pdf_to_image(source, output_dir)
            self.assertTrue(files)
            self.assertTrue(all(Path(item).exists() for item in files))

    def test_image_to_pdf_generates_pdf(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            source_dir = Path(tmp_dir) / 'images'
            source_dir.mkdir()
            image_path = source_dir / 'sample.png'
            Image.new('RGB', (200, 100), color='white').save(image_path)
            output = Path(tmp_dir) / 'combined.pdf'

            result = image_to_pdf([image_path], output)
            self.assertTrue(Path(result).exists())


if __name__ == '__main__':
    unittest.main()
