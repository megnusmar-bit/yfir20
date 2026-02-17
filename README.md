# Auðkenni Age Verification for Shopify

A Shopify Plus app that integrates Icelandic electronic ID (Auðkenni) for age verification at checkout when purchasing alcohol.

## Features

- ✅ OpenID Connect integration with Auðkenni
- ✅ Checkout UI extension for age verification banner
- ✅ Validation function to block checkout without verification
- ✅ 24-hour verification validity
- ✅ Automatic age calculation from kennitala (Icelandic SSN)
- ✅ Minimum age requirement (default: 20 years)

## Prerequisites

- Shopify Plus account (required for checkout extensibility)
- Node.js 18+ and npm/yarn
- Auðkenni API credentials (Client ID, Client Secret, certificates)
- Server hosting (Heroku, Railway, AWS, or similar)

## Project Structure

```
audkenni-age-verification/
├── server/
│   └── index.js              # Express server with Auðkenni integration
├── extensions/
│   ├── age-verification-banner/
│   │   ├── src/
│   │   │   └── index.jsx     # Checkout UI extension
│   │   ├── shopify.extension.toml
│   │   └── package.json
│   └── age-verification-validator/
│       ├── src/
│       │   └── index.js      # Validation function
│       └── shopify.extension.toml
├── package.json
├── shopify.app.toml
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
cd extensions/age-verification-banner
npm install
cd ../..
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app-url.com
SHOPIFY_STORE_URL=https://your-store.myshopify.com

# Auðkenni OpenID Configuration
AUDKENNI_CLIENT_ID=your_audkenni_client_id
AUDKENNI_CLIENT_SECRET=your_audkenni_client_secret
AUDKENNI_ISSUER=https://innskraning.island.is/
AUDKENNI_REDIRECT_URI=https://your-app-url.com/auth/callback

# Session Configuration
SESSION_SECRET=generate_random_32_char_string_here

# Age Verification Settings
MINIMUM_AGE=20
```

### 3. Configure Auðkenni

1. **Register your application** with Auðkenni
2. **Set redirect URI** to: `https://your-app-url.com/auth/callback`
3. **Request scopes**: `openid profile` (or whichever scopes provide access to kennitala/national ID)
4. **Note**: Auðkenni may use different claim names for the national ID. Common ones:
   - `nationalId`
   - `ssn`
   - `sub`
   - Check Auðkenni documentation for the exact claim name

### 4. Update Shopify App Configuration

Edit `shopify.app.toml`:

```toml
client_id = "YOUR_SHOPIFY_CLIENT_ID"
application_url = "https://your-app-url.com"
dev_store_url = "your-store.myshopify.com"
```

### 5. Update Extension URLs

In `extensions/age-verification-banner/src/index.jsx`, replace:
```javascript
'https://your-app-url.com/api/verify/check'
'https://your-app-url.com/api/verify/start'
```
with your actual app URL.

In `extensions/age-verification-banner/shopify.extension.toml`, update:
```toml
domains = [
  "innskraning.island.is",
  "your-app-url.com"
]
```

### 6. Deploy the Server

Deploy your Node.js server to your hosting platform:

**Heroku:**
```bash
heroku create your-app-name
git push heroku main
```

**Railway:**
```bash
railway init
railway up
```

Make sure to set all environment variables on your hosting platform.

### 7. Install the Shopify App

```bash
npm run dev
```

This will:
- Start the development server
- Open your browser to install the app
- Deploy the checkout extensions

### 8. Configure Product Tags

Tag your beer/alcohol products with:
- `age-restricted` OR
- `alcohol` OR
- `beer`

Or set the product type to include "beer" or "alcohol".

### 9. Test the Integration

1. Add a beer product to cart
2. Go to checkout
3. You should see the age verification banner
4. Click "Verify with Auðkenni"
5. Complete authentication on innskraning.island.is
6. You'll be redirected back and verified

## How It Works

### 1. Checkout Banner Extension
- Displays at checkout when cart contains age-restricted products
- Shows verification status
- Provides button to start Auðkenni verification

### 2. Age Verification Flow
```
User clicks "Verify" 
  → Server generates OpenID Connect auth URL
  → User redirects to innskraning.island.is
  → User authenticates with Auðkenni
  → Auðkenni redirects to /auth/callback
  → Server extracts kennitala
  → Server calculates age
  → Server stores verification (24hr validity)
  → User redirects back to checkout
```

### 3. Validation Function
- Runs before checkout completion
- Checks if cart has age-restricted products
- Validates age verification status
- Blocks checkout if not verified

### 4. Age Calculation
Kennitala format: `DDMMYY-XXXX-C`
- DD: Day
- MM: Month
- YY: Year (last 2 digits)
- XXXX: Random
- C: Century indicator (9=1900s, 0=2000s)

## Production Considerations

### 1. Use Persistent Storage
Replace the in-memory `Map` in `server/index.js` with:
- Redis
- PostgreSQL
- MongoDB

### 2. Add Customer Metafields
Store verification in Shopify customer metafields:
```javascript
// After successful verification
await shopify.api.rest.Metafield.create({
  session: session,
  metafield: {
    namespace: "audkenni",
    key: "age_verified",
    value: "true",
    type: "boolean"
  }
});
```

### 3. Implement Logging
Add logging for:
- Verification attempts
- Failed verifications
- Age calculation errors
- Compliance audit trail

### 4. Add Rate Limiting
Protect your endpoints with rate limiting to prevent abuse.

### 5. HTTPS Required
Always use HTTPS in production for OAuth security.

### 6. Session Management
Consider using Redis for session storage in production:
```javascript
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

## Customization

### Change Minimum Age
Edit `.env`:
```env
MINIMUM_AGE=18
```

### Customize UI Text
Edit `extensions/age-verification-banner/src/index.jsx`:
```jsx
<Text>
  To purchase alcoholic beverages, you must verify...
</Text>
```

### Add Multiple Languages
Add Icelandic translations:
```jsx
const translations = {
  en: {
    title: "Age verification required",
    message: "You must verify your age..."
  },
  is: {
    title: "Aldursstaðfesting vantar",
    message: "Þú verður að staðfesta aldur þinn..."
  }
};
```

## Troubleshooting

### Kennitala not found in userinfo
Check which claim Auðkenni uses:
```javascript
console.log('User info:', userinfo);
// Look for nationalId, ssn, sub, etc.
```

Update `server/index.js` line 124:
```javascript
const kennitala = userinfo.YOUR_CLAIM_NAME;
```

### Verification not persisting
Check:
1. Session secret is set
2. Cookies are working (check browser dev tools)
3. Server session storage is working

### Extension not showing
1. Verify the extension is deployed: `shopify app deploy`
2. Check the extension is enabled in Shopify admin
3. Ensure cart has age-restricted products
4. Check browser console for errors

### Age calculation incorrect
Verify the kennitala format and century indicator logic:
```javascript
console.log('Kennitala:', kennitala);
console.log('Calculated age:', age);
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/verify/start` | POST | Start verification flow |
| `/auth/callback` | GET | Auðkenni callback |
| `/api/verify/check` | POST | Check verification status |
| `/api/validate-checkout` | POST | Webhook for validation |

## Security Notes

- Never log kennitala or personal information
- Use HTTPS in production
- Rotate SESSION_SECRET regularly
- Implement rate limiting
- Add CSRF protection
- Validate all inputs
- Keep dependencies updated

## Support

For issues with:
- **Auðkenni integration**: Contact Auðkenni support
- **Shopify app**: Check Shopify Partner documentation
- **This code**: Create an issue in your repository

## License

MIT

## Credits

Built for Icelandic e-commerce stores selling age-restricted products.
