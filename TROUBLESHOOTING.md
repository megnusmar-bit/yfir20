# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Kennitala not found in userinfo"

**Symptoms:**
- Error in server logs: "Could not extract kennitala from user info"
- Verification fails after Auðkenni redirect

**Cause:**
Auðkenni uses a different claim name for the national ID than expected.

**Solution:**
1. Add debug logging in `server/index.js` around line 122:
```javascript
const userinfo = await audkenniClient.userinfo(tokenSet);
console.log('Full userinfo:', JSON.stringify(userinfo, null, 2));
```

2. Restart server and complete a verification
3. Check logs to see which field contains the kennitala
4. Update line 124 to use the correct field:
```javascript
const kennitala = userinfo.CORRECT_FIELD_NAME;
```

Common field names:
- `nationalId`
- `ssn`
- `sub`
- `nin` (National Identity Number)

---

### 2. Extension Not Showing at Checkout

**Symptoms:**
- No age verification banner appears
- Checkout looks normal

**Solutions:**

**A. Deploy the extension:**
```bash
shopify app deploy
```

**B. Enable in Shopify Admin:**
1. Go to Settings → Checkout
2. Scroll to "Checkout extensions"
3. Find "age-verification-banner"
4. Click "Enable"

**C. Verify product tags:**
Products must have one of these tags:
- `age-restricted`
- `alcohol`
- `beer`

Or product type contains "beer" or "alcohol"

**D. Check browser console:**
Open DevTools (F12) and look for JavaScript errors

---

### 3. Verification Not Persisting

**Symptoms:**
- Successfully verify age
- Redirect back to checkout
- Banner still shows "not verified"

**Solutions:**

**A. Check cookies:**
1. Open browser DevTools → Application → Cookies
2. Look for `age_verified` cookie
3. Verify domain matches your store

**B. Check session secret:**
Ensure `SESSION_SECRET` in `.env` is:
- At least 32 characters
- Random string
- Same on all server instances

**C. Test cookie setting:**
Add this temporary endpoint to `server/index.js`:
```javascript
app.get('/test-cookie', (req, res) => {
  res.cookie('test', 'value', { maxAge: 3600000 });
  res.send('Cookie set');
});
```

**D. Check CORS/SameSite:**
If using different domains:
```javascript
res.cookie('age_verified', verificationId, {
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: true,
  sameSite: 'none' // For cross-domain
});
```

---

### 4. Age Calculation Incorrect

**Symptoms:**
- Wrong age calculated
- Users over 20 rejected
- Users under 20 accepted

**Solution:**

**A. Verify kennitala format:**
Add logging:
```javascript
console.log('Kennitala:', kennitala);
console.log('Day:', kennitala.substring(0, 2));
console.log('Month:', kennitala.substring(2, 4));
console.log('Year:', kennitala.substring(4, 6));
console.log('Century:', kennitala.substring(9, 10));
```

**B. Check century calculation:**
The 10th digit indicates century:
- `9` = 1900s
- `0` = 2000s
- `8` = 1800s (rare)

**C. Test with known values:**
```javascript
// Test cases
console.log(calculateAgeFromKennitala('010194-2389')); // Born Jan 1, 1994
console.log(calculateAgeFromKennitala('010105-4560')); // Born Jan 1, 2005
```

---

### 5. "Failed to start verification"

**Symptoms:**
- Error when clicking "Verify with Auðkenni"
- No redirect happens

**Solutions:**

**A. Check Auðkenni configuration:**
1. Verify redirect URI in Auðkenni dashboard matches exactly:
   `https://your-app-url.com/auth/callback`
2. Check scopes include: `openid profile`
3. Verify client credentials are correct

**B. Check server logs:**
```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Local
# Check terminal where server is running
```

**C. Verify HTTPS:**
Auðkenni requires HTTPS. Local development may need:
```bash
# Use ngrok for local HTTPS
ngrok http 3000
```

---

### 6. CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail from checkout

**Solution:**

Add CORS middleware to `server/index.js`:
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-store.myshopify.com',
    'https://checkout.shopify.com'
  ],
  credentials: true
}));
```

Install cors:
```bash
npm install cors
```

---

### 7. Validation Function Not Blocking Checkout

**Symptoms:**
- Can checkout without verification
- No error message shown

**Solutions:**

**A. Verify function is deployed:**
```bash
shopify app deploy
```

**B. Check function target:**
In `extensions/age-verification-validator/shopify.extension.toml`:
```toml
[[extensions.targeting]]
target = "purchase.validation.run"
```

**C. Test validation logic:**
Add logging to `extensions/age-verification-validator/src/index.js`:
```javascript
export default async function validate(input) {
  console.log('Validation running');
  console.log('Cart lines:', input.cart.lines);
  // ... rest of function
}
```

**D. Verify metafield:**
Check if customer metafield is being set:
```javascript
// In server/index.js after successful verification
// Add Shopify API call to set metafield
```

---

### 8. Server Keeps Restarting

**Symptoms:**
- App works briefly then stops
- Deployment keeps failing

**Solutions:**

**A. Check memory usage:**
```javascript
// Add to server/index.js
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
}, 60000);
```

**B. Add persistent storage:**
Replace Map with Redis (see Production section)

**C. Add health endpoint monitoring:**
Set up uptime monitoring for `/health` endpoint

---

### 9. "Cannot read property 'customer' of undefined"

**Symptoms:**
- Error in validation function
- Checkout crashes

**Solution:**

Add null checks in validation function:
```javascript
const buyerIdentity = input.cart?.buyerIdentity;
const customerId = buyerIdentity?.customer?.id;

if (!buyerIdentity || !buyerIdentity.customer) {
  // Guest checkout - require verification differently
  // Or allow guest checkout without verification
  return { errors: [] };
}
```

---

### 10. Session Expired After Redirect

**Symptoms:**
- Successfully authenticate with Auðkenni
- Get "session expired" error on callback

**Solutions:**

**A. Increase session duration:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}));
```

**B. Use Redis for sessions:**
```javascript
const RedisStore = require('connect-redis').default;
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

---

## Debug Mode

Enable detailed logging by adding to `.env`:
```env
DEBUG=true
LOG_LEVEL=debug
```

Then in `server/index.js`:
```javascript
const DEBUG = process.env.DEBUG === 'true';

function log(...args) {
  if (DEBUG) {
    console.log(new Date().toISOString(), ...args);
  }
}

// Use throughout code:
log('Starting verification for:', customerId);
```

---

## Testing Checklist

Before contacting support, test:

- [ ] Server is running: `curl https://your-app-url.com/health`
- [ ] Environment variables are set
- [ ] Auðkenni redirect URI matches exactly
- [ ] Extension is deployed and enabled
- [ ] Products have correct tags
- [ ] Cookies are enabled in browser
- [ ] Browser console has no errors
- [ ] Server logs show no errors
- [ ] HTTPS is working
- [ ] Validation function is deployed

---

## Getting Help

**Server/Backend Issues:**
- Check server logs first
- Verify environment variables
- Test endpoints with curl/Postman

**Extension/Frontend Issues:**
- Check browser console
- Verify extension is deployed
- Test in incognito mode

**Auðkenni Issues:**
- Contact Auðkenni support
- Verify credentials in their dashboard
- Check redirect URI configuration

**Shopify Issues:**
- Check Shopify Partner dashboard
- Verify app scopes
- Test in development store first

---

## Useful Commands

```bash
# Check if server is running
curl https://your-app-url.com/health

# Test verification check endpoint
curl -X POST https://your-app-url.com/api/verify/check \
  -H "Content-Type: application/json" \
  -d '{"verificationId":"test"}'

# Deploy extensions
shopify app deploy

# View server logs (Railway)
railway logs

# View server logs (Heroku)
heroku logs --tail

# Restart server (Railway)
railway restart

# Check running Node processes
ps aux | grep node

# Check environment variables (Railway)
railway variables

# Check environment variables (Heroku)
heroku config
```
