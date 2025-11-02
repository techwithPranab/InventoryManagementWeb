#!/bin/bash

# This script fixes the purchases.js route file to use client-specific databases
# It performs the following operations:
# 1. Updates imports at the top of the file
# 2. Adds requireClientCode middleware and req.models destructuring to each route

FILE="./routes/purchases.js"

echo "Fixing purchases.js routes..."

# Backup the file
cp "$FILE" "$FILE.backup"

# Read entire file
CONTENT=$(cat "$FILE")

# Fix 1: Update imports at top of file (already done in our previous change)

# Fix 2: Add req.models destructuring to GET /:id route
sed -i '' '/^router.get('\''\/\:id'\'', auth, async (req, res)/,/try {/s/try {/try {\n    const { PurchaseOrder } = req.models;/' "$FILE"
sed -i '' 's/router.get('\''\/\:id'\'', auth, async/router.get('\''\/\:id'\'', [auth, requireClientCode], async/' "$FILE"

# Fix 3: Add to POST / route  
sed -i '' '/^router.post('\''\/'\'' *\[$/,/try {/{
  s/authorize('\''admin'\'', '\''manager'\'')/requireClientCode, authorize('\''admin'\'', '\''manager'\'')/
}' "$FILE"

echo "Done! Backup saved as $FILE.backup"
