#!/usr/bin/env python3
"""
Cincinnati Building Department Permit Forms Scraper

This script:
1. Scrapes all permit forms and documents from Cincinnati's building department
2. Downloads PDFs to local folder
3. Uploads to S3 bucket
4. Creates manifest.json with metadata

Requirements:
    pip install requests beautifulsoup4 boto3 python-dotenv

Usage:
    python scripts/scrape-cincinnati-permits.py
"""

import os
import json
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from urllib.parse import urljoin, urlparse
import boto3
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env.local
load_dotenv('.env.local')

# Configuration
BASE_URL = 'https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/'
LOCAL_DOWNLOAD_DIR = Path('data/cincinnati/permits')
S3_BUCKET = os.getenv('AWS_S3_BUCKET', 'civix-documents')
S3_PREFIX = 'cincinnati-oh/permits/'

# Initialize S3 client
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION', 'us-east-2'),
    aws_access_key_id=os.getenv('AWS_S3_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_S3_SECRET_ACCESS_KEY')
)

def clean_filename(filename):
    """Clean filename for safe storage"""
    # Remove special characters, keep alphanumeric, dash, underscore
    filename = re.sub(r'[^\w\s-]', '', filename)
    filename = re.sub(r'[-\s]+', '-', filename)
    return filename.strip('-').lower()

def scrape_permit_forms(url):
    """Scrape all PDF links from the permit forms page"""
    print(f"Scraping permit forms from: {url}\n")

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Error fetching page: {e}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')

    # Find all links to PDFs
    pdf_links = []

    # Look for <a> tags with href ending in .pdf
    for link in soup.find_all('a', href=True):
        href = link['href']
        if href.lower().endswith('.pdf'):
            # Get absolute URL
            full_url = urljoin(url, href)

            # Get link text for title
            title = link.get_text(strip=True)
            if not title:
                # Try to get title from parent element
                parent = link.parent
                if parent:
                    title = parent.get_text(strip=True)

            # Extract filename from URL
            parsed_url = urlparse(full_url)
            filename = os.path.basename(parsed_url.path)

            pdf_links.append({
                'url': full_url,
                'title': title or filename,
                'original_filename': filename
            })

    print(f"[OK] Found {len(pdf_links)} PDF documents\n")

    # Remove duplicates based on URL
    seen_urls = set()
    unique_pdfs = []
    for pdf in pdf_links:
        if pdf['url'] not in seen_urls:
            seen_urls.add(pdf['url'])
            unique_pdfs.append(pdf)

    if len(unique_pdfs) < len(pdf_links):
        print(f"[OK] Removed {len(pdf_links) - len(unique_pdfs)} duplicates\n")

    return unique_pdfs

def download_pdf(url, local_path):
    """Download PDF from URL to local path"""
    try:
        response = requests.get(url, timeout=60, stream=True)
        response.raise_for_status()

        # Create parent directory if it doesn't exist
        local_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return True
    except requests.exceptions.RequestException as e:
        print(f"   WARNING: Download failed: {e}")
        return False

def upload_to_s3(local_path, s3_key):
    """Upload file to S3"""
    try:
        s3_client.upload_file(
            str(local_path),
            S3_BUCKET,
            s3_key,
            ExtraArgs={
                'ContentType': 'application/pdf',
                'Metadata': {
                    'uploaded-date': datetime.now().isoformat(),
                    'jurisdiction': 'cincinnati-oh',
                    'document-type': 'permit-form'
                }
            }
        )

        # Generate S3 URL
        s3_url = f"s3://{S3_BUCKET}/{s3_key}"
        https_url = f"https://{S3_BUCKET}.s3.{os.getenv('AWS_REGION', 'us-east-2')}.amazonaws.com/{s3_key}"

        return s3_url, https_url
    except Exception as e:
        print(f"   WARNING: S3 upload failed: {e}")
        return None, None

def main():
    print("""
================================================================
  Cincinnati Building Department Permit Forms Scraper

  This script will:
  1. Scrape all permit forms from Cincinnati's website
  2. Download PDFs to local folder
  3. Upload to S3 bucket
  4. Create manifest.json with metadata
================================================================
""")

    # Create local download directory
    LOCAL_DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Scrape permit forms
    pdf_documents = scrape_permit_forms(BASE_URL)

    if not pdf_documents:
        print("ERROR: No PDF documents found. Exiting.")
        return

    # Process each PDF
    manifest = []
    successful_downloads = 0
    successful_uploads = 0

    for i, doc in enumerate(pdf_documents, 1):
        print(f"[{i}/{len(pdf_documents)}] Processing: {doc['title']}")

        # Generate clean filename
        clean_name = clean_filename(doc['title'])
        if not clean_name:
            clean_name = clean_filename(doc['original_filename'])

        # Ensure .pdf extension
        if not clean_name.endswith('.pdf'):
            clean_name += '.pdf'

        local_path = LOCAL_DOWNLOAD_DIR / clean_name
        s3_key = f"{S3_PREFIX}{clean_name}"

        # Download PDF
        print(f"   Downloading...")
        if download_pdf(doc['url'], local_path):
            successful_downloads += 1
            file_size = local_path.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            print(f"   [OK] Downloaded ({file_size_mb:.2f} MB)")

            # Upload to S3
            print(f"   Uploading to S3...")
            s3_url, https_url = upload_to_s3(local_path, s3_key)

            if s3_url:
                successful_uploads += 1
                print(f"   [OK] Uploaded to S3\n")

                # Add to manifest
                manifest.append({
                    'filename': clean_name,
                    'title': doc['title'],
                    'original_url': doc['url'],
                    'original_filename': doc['original_filename'],
                    's3_url': s3_url,
                    'https_url': https_url,
                    'local_path': str(local_path),
                    'file_size_bytes': file_size,
                    'file_size_mb': round(file_size_mb, 2),
                    'downloaded_at': datetime.now().isoformat(),
                    'jurisdiction': 'cincinnati-oh',
                    'document_type': 'permit-form'
                })
            else:
                print(f"   ERROR: S3 upload failed\n")
        else:
            print(f"   ERROR: Download failed\n")

    # Save manifest
    manifest_path = LOCAL_DOWNLOAD_DIR / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"[OK] Saved manifest to: {manifest_path}\n")

    # Upload manifest to S3
    s3_manifest_key = f"{S3_PREFIX}manifest.json"
    try:
        s3_client.upload_file(
            str(manifest_path),
            S3_BUCKET,
            s3_manifest_key,
            ExtraArgs={'ContentType': 'application/json'}
        )
        print(f"[OK] Uploaded manifest to S3: s3://{S3_BUCKET}/{s3_manifest_key}\n")
    except Exception as e:
        print(f"WARNING: Failed to upload manifest to S3: {e}\n")

    # Summary
    print("================================================================")
    print("  Summary")
    print("================================================================")
    print(f"")
    print(f"Total documents found: {len(pdf_documents)}")
    print(f"Successfully downloaded: {successful_downloads}")
    print(f"Successfully uploaded to S3: {successful_uploads}")
    print(f"")
    print(f"Local files: {LOCAL_DOWNLOAD_DIR}")
    print(f"S3 location: s3://{S3_BUCKET}/{S3_PREFIX}")
    print(f"")

    # Calculate total size
    total_size_mb = sum(doc['file_size_mb'] for doc in manifest)
    print(f"Total size: {total_size_mb:.2f} MB")
    print(f"")

    # Show document types
    print(f"Document titles:")
    for doc in manifest[:10]:  # Show first 10
        print(f"   - {doc['title']}")

    if len(manifest) > 10:
        print(f"   ... and {len(manifest) - 10} more")

    print(f"\nComplete! All permit forms are now in S3 and ready to use.")
    print(f"\nManifest file: {manifest_path}")

if __name__ == '__main__':
    main()
