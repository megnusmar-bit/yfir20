# Quick Start Guide - Auðkenni Age Verification

## Step-by-Step Setup (15 minutes)

### Step 1: Get Your Credentials Ready (5 min)

You'll need:
- ✅ Auðkenni Client ID
- ✅ Auðkenni Client Secret  
- ✅ Shopify Partner account
- ✅ Shopify Plus store

### Step 2: Install & Configure (5 min)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your credentials
nano .env  # or use your preferred editor
```

**Required values in .env:**
```env
AUDKENNI_CLIENT_ID=your_client_id_here
AUDKENNI_CLIENT_SECRET=your_secret_here
AUDKENNI_REDIRECT_URI=https://your-app-url.com/auth/callback
SESSION_SECRET=generate_a_random_32_character_string
SHOPIFY_STORE_URL=https://your-store.myshopify.com
```

### Step 3: Deploy Server (3 min)

**Option A - Railway (Easiest):**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

**Option B - Heroku:**
```bash
heroku create your-app-name
git push heroku main
heroku config:set AUDKENNI_CLIENT_ID=your_id
# ... set all env vars
```

### Step 4: Configure Auðkenni (2 min)

In your Auðkenni dashboard:
1. Add redirect URI: `https://your-app-url.com/auth/callback`
2. Confirm scopes include: `openid profile`
3. Note which claim contains the kennitala (usually `nationalId` or `ssn`)

### Step 5: Install Shopify App (2 min)

```bash
# Update shopify.app.toml with your Shopify client ID
nano shopify.app.toml

# Start development and install
npm run dev
```

This will:
- Open browser to install app
- Deploy checkout extensions
- Link everything together

### Step 6: Tag Your Products (1 min)

In Shopify admin, tag your beer/alcohol products with:
- `age-restricted` OR
- `alcohol` OR  
- `beer`

### Step 7: Test (2 min)

1. Add beer to cart
2. Go to checkout
3. See verification banner
4. Click "Verify with Auðkenni"
5. Authenticate
6. Complete checkout ✅

## Common Issues & Quick Fixes

### "Kennitala not found"
**Fix:** Update line 124 in `server/index.js`:
```javascript
const kennitala = userinfo.nationalId; // or userinfo.ssn or userinfo.sub
```
Check your Auðkenni docs for the correct claim name.

### Extension not showing
**Fix:** 
```bash
shopify app deploy
```
Then check it's enabled in Shopify admin → Settings → Checkout → Extensions

### Verification not persisting
**Fix:** Check cookies in browser dev tools. Ensure:
- `age_verified` cookie is set
- Domain matches
- Not in incognito/private browsing

### Age calculation wrong
**Fix:** Log the kennitala format:
```javascript
console.log('Kennitala:', kennitala);
```
Verify it matches: `DDMMYY-XXXX` format

## Next Steps

Once working:

1. **Add Icelandic translations** - Edit `extensions/age-verification-banner/src/index.jsx`
2. **Set up persistent storage** - Replace Map with Redis/PostgreSQL
3. **Add logging** - Track verifications for compliance
4. **Customize styling** - Match your store branding
5. **Test edge cases** - Expired sessions, network errors, etc.

## Support Checklist

Before asking for help, verify:
- [ ] All environment variables are set
- [ ] Server is running and accessible
- [ ] Auðkenni redirect URI matches exactly
- [ ] Products are tagged correctly
- [ ] Extension is deployed and enabled
- [ ] Browser console shows no errors
- [ ] Cookies are enabled

## Production Deployment Checklist

Before going live:
- [ ] Use HTTPS everywhere
- [ ] Add Redis for session storage
- [ ] Implement rate limiting
- [ ] Add comprehensive logging
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Test with real Auðkenni accounts
- [ ] Verify age calculation for all century codes
- [ ] Add customer metafield storage
- [ ] Set up backup verification method
- [ ] Review Icelandic data protection compliance

## Quick Reference

**Test verification:**
```bash
curl -X POST https://your-app-url.com/api/verify/check \
  -H "Content-Type: application/json" \
  -d '{"verificationId":"test-id"}'
```

**Check server health:**
```bash
curl https://your-app-url.com/health
```

**Deploy extensions:**
```bash
shopify app deploy
```

**View logs:**
```bash
railway logs  # or heroku logs --tail
```

Good luck! 🍺
