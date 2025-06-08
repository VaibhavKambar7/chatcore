import json
import os
import pdfplumber

def extract_tables_as_markdown(pdf_path):
    result = []
    abs_path = os.path.abspath(pdf_path)

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()
            for table in tables:
                if not table or not table[0]:
                    continue

                markdown = []
                headers = [str(header or "").strip() for header in table[0]]
                markdown.append("| " + " | ".join(headers) + " |")
                markdown.append("| " + " | ".join(["---"] * len(headers)) + " |")

                for row in table[1:]:
                    cleaned_row = [str(cell or "").strip() for cell in row]
                    markdown.append("| " + " | ".join(cleaned_row) + " |")

                result.append({
                    "page": page_num,
                    "pdf_path": abs_path,
                    "markdown": "\n".join(markdown),
                })

    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    extract_tables_as_markdown("./offer.pdf")
