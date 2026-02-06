# File Upload Feature

## Overview

The chat platform now supports file uploads, enabling users to attach and analyze various file types in their conversations. This includes vision capabilities for images and text extraction for documents.

## Supported File Types

### Images (Vision-Enabled)
- **Formats**: PNG, JPEG, JPG, GIF, WebP
- **Max Size**: 10MB per file
- **Features**:
  - Direct image analysis using Claude and GPT-4 vision capabilities
  - Automatic dimension detection
  - Image preview in upload area

### Documents
- **PDF Files**
  - Max Size: 20MB
  - Text extraction from all pages
  - Page count metadata

- **Word Documents (.docx)**
  - Max Size: 10MB
  - Full text extraction
  - Formatting preserved in extracted content

- **Text Files (.txt)**
  - Max Size: 10MB
  - Direct content reading

### Spreadsheets
- **Excel Files (.xls, .xlsx)**
  - Max Size: 15MB
  - Multi-sheet support
  - Converts to CSV-like format for AI analysis
  - Row and column data preserved

## Usage

### Attaching Files

1. Click the **"Attach Files"** button in the chat input area
2. Either:
   - Click the upload area to select files
   - Drag and drop files directly into the upload area
3. Files will be validated and processed automatically
4. Preview your attachments before sending

### File Limits

- Maximum **5 files** per message
- File size limits vary by type (see above)
- Unsupported file types will be rejected with an error message

### Drag-and-Drop

The upload area supports drag-and-drop functionality:
1. Drag files from your file explorer
2. Drop them into the highlighted upload area
3. Files are instantly validated and processed

## How It Works

### For Images (Vision)

1. **Client-side Processing**:
   - Image converted to base64 format
   - Dimensions extracted
   - Preview generated

2. **AI Analysis**:
   - Base64 image sent to Claude or GPT-4
   - AI can "see" and analyze the image
   - Responds to questions about image content

### For Documents (Text Extraction)

1. **Client-side Processing**:
   - PDF: Text extracted using pdf-parse
   - Word: Text extracted using mammoth
   - Excel: Converted to structured text format
   - Text files: Read directly

2. **AI Analysis**:
   - Extracted text added to conversation context
   - AI can search, analyze, and answer questions about the content
   - Spreadsheet data can be analyzed for insights

## Technical Details

### Database Schema

New `file_attachments` table stores:
- File metadata (name, type, size)
- Storage path in Supabase Storage
- Extracted text content
- Image dimensions
- Processing status

### API Endpoints

- **POST /api/files/upload**: Upload files to storage
- **POST /api/chat/send**: Enhanced to handle file attachments

### File Processing Libraries

- `xlsx`: Excel file parsing
- `pdf-parse`: PDF text extraction
- `mammoth`: Word document parsing

## Security

- Row-Level Security (RLS) enforced on file attachments
- Users can only access their own uploaded files
- File type validation prevents malicious uploads
- Size limits prevent abuse

## Storage

Files are stored in Supabase Storage:
- Bucket: `chat-attachments`
- Path structure: `{user_id}/{message_id}/{timestamp}.{ext}`
- Private access with RLS policies

## Migration

To add file upload support to an existing database:

```bash
# Run the migration SQL file
psql -U your_user -d your_db -f migrations/001_add_file_attachments.sql
```

Or execute via Supabase SQL Editor:
- Copy contents of `migrations/001_add_file_attachments.sql`
- Paste into SQL Editor
- Execute

Then create the storage bucket:
1. Go to Supabase Dashboard > Storage
2. Create new bucket: `chat-attachments`
3. Set to **Private**
4. RLS policies are auto-configured

## Example Use Cases

### Image Analysis
- "What's in this screenshot?"
- "Analyze this chart and explain the trends"
- "Describe this diagram"

### Document Analysis
- "Summarize this PDF report"
- "Find key points in this Word document"
- "What are the main topics in this research paper?"

### Spreadsheet Analysis
- "What's the total revenue in this Excel file?"
- "Find the highest values in column B"
- "Analyze this sales data and provide insights"

## Limitations

- Files must meet size requirements
- Vision only works with Claude and GPT-4 models
- Very large PDFs may exceed token limits (split into smaller files)
- Excel formulas are not evaluated (only raw data is extracted)

## Future Enhancements

Potential improvements:
- More file formats (CSV, JSON, XML)
- File previews in message history
- Shared file library
- Batch file upload
- File compression
- OCR for scanned documents
