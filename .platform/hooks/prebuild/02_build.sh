#!/bin/bash
set -e

cd /var/app/staging
echo "Building Next.js application..."
npm run build
