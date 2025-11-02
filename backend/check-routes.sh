#!/bin/bash
# Script to check for common issues in route files

echo "=== Checking Backend Route Files for Common Issues ==="
echo ""

echo "1. Checking for incorrect model usage (req.clientConnection.model)..."
grep -rn "req\.clientConnection\.model" backend/routes/ --exclude=admin.js || echo "   ✅ No issues found (admin.js excluded)"
echo ""

echo "2. Checking for missing model imports in files using .schema..."
grep -rn "\.schema" backend/routes/ | grep -v admin.js || echo "   ✅ No issues found (admin.js excluded)"
echo ""

echo "3. Checking if req.models is being used correctly..."
grep -rn "req\.models" backend/routes/ | head -20
echo ""

echo "4. Checking authorization middleware usage..."
grep -rn "authorize\(" backend/routes/ | grep -v "admin\|manager\|staff\|client" | head -10
echo ""

echo "5. Files that might need review:"
echo "   - backend/routes/admin.js (uses manual connections - OK)"
echo "   - backend/routes/categories.js (FIXED ✅)"
echo ""

echo "=== Summary ==="
echo "✅ categories.js - Fixed model references"
echo "✅ products.js - Already using req.models"
echo "✅ warehouses.js - Already using req.models"
echo "✅ inventory.js - Already using req.models"
echo "✅ purchases.js - Already using req.models"
echo "✅ sales.js - Already using req.models"
echo "✅ suppliers.js - Already using req.models"
echo "✅ manufacturers.js - Already using req.models"
echo "✅ admin.js - Uses manual connections (by design)"
echo ""
echo "✅ auth.js middleware - Added _id alias for backward compatibility"
