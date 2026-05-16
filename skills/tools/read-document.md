# read_document Tool

Use when the user uploads bylaws, statements, or evidence files.

- **PDF**: Extracted via pdfjs-dist; if text is empty, note scanned PDF and use base64 fallback description.
- **Markdown/text**: Return full text.
- After reading, cross-reference with search_bylaws and query_transactions when relevant.
