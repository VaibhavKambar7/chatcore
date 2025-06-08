import sys

import pytesseract
from pdf2image import convert_from_path


def ocr_pdf_to_text(pdf_path):
    pages = convert_from_path(pdf_path)
    result = []
    for i, page in enumerate(pages):
        text = pytesseract.image_to_string(page)
        result.append(f"=== PAGE {i + 1} ===\n{text.strip()}")
    return "\n\n".join(result)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ocr.py <path-to-pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output = ocr_pdf_to_text(pdf_path)
    print(output)
