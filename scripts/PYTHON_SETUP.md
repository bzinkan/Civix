# Python Scripts Setup Guide

Some data collection scripts use Python for web scraping and processing.

## Prerequisites

1. **Python 3.8+** - Check version:
   ```bash
   python --version
   # or
   python3 --version
   ```

2. **pip** - Python package installer (usually included with Python)

## Installation

### One-time setup:

```bash
# Navigate to project root
cd C:\Users\zinka\Documents\Civix

# Install Python dependencies
pip install -r scripts/requirements.txt
```

**What gets installed:**
- `requests` - HTTP library for downloading files
- `beautifulsoup4` - HTML parsing for web scraping
- `boto3` - AWS SDK for S3 uploads
- `python-dotenv` - Environment variable loading
- `lxml` - XML/HTML parser (faster than default)

## Running Python Scripts

### Cincinnati Permit Forms Scraper

Scrapes all permit forms from Cincinnati's building department website.

```bash
python scripts/scrape-cincinnati-permits.py
```

**What it does:**
1. Scrapes https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/
2. Finds all PDF links
3. Downloads to `data/cincinnati/permits/`
4. Uploads to S3: `s3://civix-documents/cincinnati-oh/permits/`
5. Creates `manifest.json` with metadata

**Output:**
```
data/cincinnati/permits/
├── manifest.json
├── building-permit-application.pdf
├── zoning-certificate-application.pdf
├── demolition-permit-application.pdf
└── ...
```

**manifest.json format:**
```json
[
  {
    "filename": "building-permit-application.pdf",
    "title": "Building Permit Application",
    "original_url": "https://www.cincinnati-oh.gov/...",
    "s3_url": "s3://civix-documents/cincinnati-oh/permits/...",
    "https_url": "https://civix-documents.s3.us-east-2.amazonaws.com/...",
    "file_size_mb": 0.45,
    "downloaded_at": "2025-12-31T12:00:00"
  }
]
```

## Environment Variables

Python scripts automatically load `.env.local` just like TypeScript scripts.

Required variables:
```env
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
AWS_S3_BUCKET=civix-documents
```

## Troubleshooting

### ModuleNotFoundError: No module named 'X'

**Solution:** Install dependencies
```bash
pip install -r scripts/requirements.txt
```

### boto3 can't find credentials

**Solution:** Check `.env.local` has AWS credentials
```bash
# Make sure these are set:
AWS_S3_ACCESS_KEY_ID=...
AWS_S3_SECRET_ACCESS_KEY=...
```

### SSL Certificate errors

**Solution:** Update certificates or use `--trusted-host`
```bash
pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -r scripts/requirements.txt
```

### Permission denied on Windows

**Solution:** Run as administrator or use:
```bash
python -m pip install -r scripts/requirements.txt
```

## Virtual Environment (Optional but Recommended)

To avoid conflicts with other Python projects:

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r scripts/requirements.txt

# Run scripts
python scripts/scrape-cincinnati-permits.py

# Deactivate when done
deactivate
```

## Adding New Python Scripts

1. Create script in `scripts/` folder
2. Add dependencies to `scripts/requirements.txt`
3. Load environment variables:
   ```python
   from dotenv import load_dotenv
   load_dotenv('.env.local')
   ```
4. Document in this file

## Python vs TypeScript

**Use Python for:**
- Web scraping (BeautifulSoup)
- PDF processing (PyPDF2, pdfplumber)
- Data science (pandas, numpy)
- ML/NLP tasks (sklearn, transformers)

**Use TypeScript for:**
- Database operations (Prisma)
- API endpoints (Next.js)
- S3 operations that integrate with app
- Anything that needs Prisma types

Both can access `.env.local` and S3!
