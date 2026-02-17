#!/bin/bash

# Auðkenni Age Verification - Deployment Helper
# This script helps verify your setup before deployment

echo "🔍 Auðkenni Age Verification - Pre-Deployment Check"
echo "=================================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "✓ Node.js: $NODE_VERSION"
echo ""

# Check if .env exists
echo "Checking environment configuration..."
if [ -f .env ]; then
    echo "✓ .env file found"
    
    # Check required variables
    REQUIRED_VARS=("AUDKENNI_CLIENT_ID" "AUDKENNI_CLIENT_SECRET" "AUDKENNI_REDIRECT_URI" "SESSION_SECRET" "SHOPIFY_STORE_URL")
    
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" .env && ! grep -q "^${VAR}=your_" .env && ! grep -q "^${VAR}=$" .env; then
            echo "  ✓ $VAR is set"
        else
            echo "  ✗ $VAR is NOT set or still has placeholder value"
        fi
    done
else
    echo "✗ .env file not found"
    echo "  Run: cp .env.example .env"
fi
echo ""

# Check if node_modules exists
echo "Checking dependencies..."
if [ -d node_modules ]; then
    echo "✓ Dependencies installed"
else
    echo "✗ Dependencies not installed"
    echo "  Run: npm install"
fi
echo ""

# Check if Shopify CLI is available
echo "Checking Shopify CLI..."
if command -v shopify &> /dev/null; then
    SHOPIFY_VERSION=$(shopify version)
    echo "✓ Shopify CLI: $SHOPIFY_VERSION"
else
    echo "✗ Shopify CLI not found"
    echo "  Install: npm install -g @shopify/cli"
fi
echo ""

# Check shopify.app.toml
echo "Checking Shopify app configuration..."
if [ -f shopify.app.toml ]; then
    if grep -q "YOUR_CLIENT_ID" shopify.app.toml; then
        echo "✗ shopify.app.toml still has placeholder values"
        echo "  Update client_id in shopify.app.toml"
    else
        echo "✓ shopify.app.toml configured"
    fi
else
    echo "✗ shopify.app.toml not found"
fi
echo ""

# Check extension URLs
echo "Checking extension configuration..."
EXTENSION_FILE="extensions/age-verification-banner/src/index.jsx"
if [ -f "$EXTENSION_FILE" ]; then
    if grep -q "your-app-url.com" "$EXTENSION_FILE"; then
        echo "✗ Extension still has placeholder URLs"
        echo "  Update API URLs in $EXTENSION_FILE"
    else
        echo "✓ Extension URLs configured"
    fi
else
    echo "✗ Extension file not found"
fi
echo ""

echo "=================================================="
echo "Summary:"
echo ""
echo "If all checks passed (✓), you're ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Deploy server: railway up  (or heroku push)"
echo "2. Install app:   npm run dev"
echo "3. Tag products:  Add 'age-restricted' or 'beer' tags"
echo "4. Test:          Add beer to cart and checkout"
echo ""
echo "See QUICKSTART.md for detailed instructions."
