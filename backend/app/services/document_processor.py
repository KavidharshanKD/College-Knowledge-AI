import re
from pathlib import Path
from typing import List, Dict, Any

import pymupdf as fitz
import docx

from app.config import settings


class ProcessedChunk:
    def __init__(
        self,
        chunk_id: str,
        text: str,
        document_filename: str,
        category: str,
        filepath: str,
        page_number: int,
        chunk_index: int
    ):
        self.chunk_id = chunk_id
        self.text = text
        self.document_filename = document_filename
        self.category = category
        self.filepath = filepath
        self.page_number = page_number
        self.chunk_index = chunk_index

    def to_metadata(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_filename": self.document_filename,
            "category": self.category,
            "filepath": self.filepath,
            "page_number": int(self.page_number),
            "chunk_index": int(self.chunk_index),
        }


class DocumentProcessor:

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

        self._rapid_ocr = None

    # ============================================================
    # TEXT CLEANING
    # ============================================================

    def clean_text(self, text: str) -> str:
        if not text:
            return ""

        text = text.replace("\xa0", " ")
        text = text.replace("\u200b", "")

        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)

        return text.strip()

    # ============================================================
    # RAPIDOCR
    # ============================================================

    def _get_ocr(self):
        if self._rapid_ocr is None:
            from rapidocr_onnxruntime import RapidOCR
            self._rapid_ocr = RapidOCR()

        return self._rapid_ocr

    def _perform_ocr_on_page(self, page) -> str:
        """
        Fast OCR for scanned PDF pages.

        Important:
        - Low rendering DPI keeps OCR fast.
        - Image is limited in size.
        - OCR failure on one page does not stop ingestion.
        """

        try:
            ocr = self._get_ocr()

            # Lower DPI = much faster OCR
            pix = page.get_pixmap(
                dpi=72,
                colorspace=fitz.csRGB,
                alpha=False
            )

            img = pix.tobytes("png")

            result, _ = ocr(img)

            if not result:
                return ""

            lines = []

            for item in result:
                if len(item) >= 2:
                    text = str(item[1]).strip()

                    if text:
                        lines.append(text)

            return "\n".join(lines).strip()

        except Exception as e:
            print(
                f"      OCR failed on page {page.number + 1}: {e}"
            )
            return ""

    # ============================================================
    # PDF EXTRACTION
    # ============================================================

    def extract_text_from_pdf(
        self,
        pdf_path: str
    ) -> List[Dict[str, Any]]:

        pages_content = []

        doc = None

        try:
            doc = fitz.open(pdf_path)

            total_pages = len(doc)

            print(
                f"      PDF pages: {total_pages}"
            )

            for page_num in range(total_pages):

                page = doc[page_num]

                # ------------------------------------------------
                # FIRST: Normal text extraction
                # ------------------------------------------------

                raw_text = page.get_text("text")
                text = self.clean_text(raw_text)

                # ------------------------------------------------
                # SECOND: OCR only when page has no useful text
                # ------------------------------------------------

                if len(text) < 20:

                    print(
                        f"      OCR page {page_num + 1}/{total_pages}...",
                        end=" ",
                        flush=True
                    )

                    text = self.clean_text(
                        self._perform_ocr_on_page(page)
                    )

                    if text:
                        print("OK")
                    else:
                        print("NO TEXT")

                if text:

                    pages_content.append(
                        {
                            "page_number": page_num + 1,
                            "text": text,
                        }
                    )

            return pages_content

        except Exception as e:

            raise RuntimeError(
                f"Failed to process PDF '{pdf_path}': {e}"
            )

        finally:

            if doc is not None:
                doc.close()

    # ============================================================
    # DOCX
    # ============================================================

    def extract_text_from_docx(
        self,
        docx_path: str
    ) -> List[Dict[str, Any]]:

        try:

            doc = docx.Document(docx_path)

            parts = []

            for para in doc.paragraphs:

                text = para.text.strip()

                if text:
                    parts.append(text)

            for table in doc.tables:

                for row in table.rows:

                    row_text = " | ".join(
                        cell.text.strip()
                        for cell in row.cells
                        if cell.text.strip()
                    )

                    if row_text:
                        parts.append(row_text)

            combined = self.clean_text(
                "\n".join(parts)
            )

            if not combined:
                return []

            return [
                {
                    "page_number": 1,
                    "text": combined
                }
            ]

        except Exception as e:

            raise RuntimeError(
                f"Failed to process DOCX '{docx_path}': {e}"
            )

    # ============================================================
    # CHUNKING
    # ============================================================

    def split_text_into_chunks(
        self,
        text: str
    ) -> List[str]:

        if not text:
            return []

        if len(text) <= self.chunk_size:
            return [text]

        chunks = []

        start = 0
        text_length = len(text)

        while start < text_length:

            end = min(
                start + self.chunk_size,
                text_length
            )

            if end >= text_length:

                chunk = text[start:].strip()

                if chunk:
                    chunks.append(chunk)

                break

            split_position = -1

            delimiters = [
                "\n\n",
                "\n",
                ". ",
                "? ",
                "! ",
                "; ",
                ", ",
                " "
            ]

            search_start = (
                start +
                int(self.chunk_size * 0.60)
            )

            for delimiter in delimiters:

                position = text.rfind(
                    delimiter,
                    search_start,
                    end
                )

                if position != -1:

                    split_position = (
                        position +
                        len(delimiter)
                    )

                    break

            if split_position == -1:
                split_position = end

            chunk = text[
                start:split_position
            ].strip()

            if chunk:
                chunks.append(chunk)

            start = max(
                split_position -
                self.chunk_overlap,
                start + 1
            )

        return chunks

    # ============================================================
    # PROCESS FILE
    # ============================================================

    def process_file(
        self,
        file_path: str,
        category: str
    ) -> List[ProcessedChunk]:

        path = Path(file_path)

        filename = path.name
        extension = path.suffix.lower()

        # --------------------------------------------------------
        # Extract
        # --------------------------------------------------------

        if extension == ".pdf":

            pages = self.extract_text_from_pdf(
                file_path
            )

        elif extension in [".docx", ".doc"]:

            pages = self.extract_text_from_docx(
                file_path
            )

        else:

            return []

        # --------------------------------------------------------
        # Create chunks
        # --------------------------------------------------------

        chunks = []

        safe_filename = re.sub(
            r"[^a-zA-Z0-9_-]",
            "_",
            filename
        )

        safe_category = re.sub(
            r"[^a-zA-Z0-9_-]",
            "_",
            category
        )

        global_index = 0

        for page in pages:

            page_number = page["page_number"]
            page_text = page["text"]

            page_chunks = (
                self.split_text_into_chunks(
                    page_text
                )
            )

            for local_index, chunk_text in enumerate(
                page_chunks
            ):

                chunk_text = chunk_text.strip()

                if len(chunk_text) < 20:
                    continue

                chunk_id = (
                    f"{safe_category}_"
                    f"{safe_filename}_"
                    f"p{page_number}_"
                    f"c{local_index}"
                )

                chunks.append(
                    ProcessedChunk(
                        chunk_id=chunk_id,
                        text=chunk_text,
                        document_filename=filename,
                        category=category,
                        filepath=str(
                            path.resolve()
                        ),
                        page_number=page_number,
                        chunk_index=global_index,
                    )
                )

                global_index += 1

        return chunks


document_processor = DocumentProcessor()