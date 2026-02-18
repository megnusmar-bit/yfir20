require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { Issuer, generators } = require('openid-client');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware - allow requests from Shopify store
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://bud.malbygg.is');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Store for verification status (in production, use Redis or database)
const verificationStore = new Map();

let audkenniClient;

// Initialize Kenni OpenID client
async function initializeAudkenni() {
  try {
    const issuer = await Issuer.discover(process.env.KENNI_ISSUER);
    
    audkenniClient = new issuer.Client({
      client_id: process.env.KENNI_CLIENT_ID,
      client_secret: process.env.KENNI_CLIENT_SECRET,
      redirect_uris: [process.env.KENNI_REDIRECT_URI],
      response_types: ['code']
    });
    
    console.log('✓ Kenni OpenID client initialized');
  } catch (error) {
    console.error('Failed to initialize Kenni client:', error);
    throw error;
  }
}

// Calculate age from Icelandic kennitala
// Format: DDMMYY-XXXX
// Century is determined by the 10th digit (9 = 1900s, 0 = 2000s)
// Examples:
//   290786-XXXX9 = 29 July 1986
//   290701-XXXX0 = 29 July 2001
function calculateAgeFromKennitala(kennitala) {
  // Strip any hyphens e.g. "290786-1234" -> "2907861234"
  const clean = kennitala.replace('-', '');

  const day   = parseInt(clean.substring(0, 2), 10);
  const month = parseInt(clean.substring(2, 4), 10);
  const yy    = parseInt(clean.substring(4, 6), 10);

  // 10th digit determines century: 9 = 1900s, 0 = 2000s
  const centuryDigit = parseInt(clean.substring(9, 10), 10);
  const century = centuryDigit === 0 ? 2000 : 1900;
  const year = century + yy;

  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Auðkenni Age Verification' });
});

// Start age verification process
app.post('/api/verify/start', async (req, res) => {
  try {
    const { customerId, checkoutToken, returnUrl } = req.body;
    
    if (!customerId && !checkoutToken) {
      return res.status(400).json({ error: 'Customer ID or checkout token required' });
    }
    
    const state = generators.state();
    const nonce = generators.nonce();
    
    // Store state and session info
    req.session.state = state;
    req.session.nonce = nonce;
    req.session.customerId = customerId;
    req.session.checkoutToken = checkoutToken;
    req.session.returnUrl = returnUrl || `${process.env.SHOPIFY_STORE_URL}/cart`;
    
    const authUrl = audkenniClient.authorizationUrl({
      scope: 'openid national_id',
      state: state,
      nonce: nonce
    });
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error starting verification:', error);
    res.status(500).json({ error: 'Failed to start verification' });
  }
});

// Auðkenni callback
app.get('/auth/callback', async (req, res) => {
  try {
    const params = audkenniClient.callbackParams(req);
    const tokenSet = await audkenniClient.callback(
      process.env.KENNI_REDIRECT_URI,
      params,
      { state: req.session.state, nonce: req.session.nonce }
    );
    
    const userinfo = await audkenniClient.userinfo(tokenSet);
    
    // Extract kennitala using Kenni's national_id claim
    const kennitala = userinfo.national_id;
    
    if (!kennitala) {
      throw new Error('Could not extract national_id from Kenni user info');
    }
    
    // Calculate age
    const age = calculateAgeFromKennitala(kennitala);
    const isVerified = age >= parseInt(process.env.MINIMUM_AGE);
    
    // Store verification result
    const verificationId = crypto.randomBytes(16).toString('hex');
    verificationStore.set(verificationId, {
      verified: isVerified,
      age: age,
      timestamp: Date.now(),
      customerId: req.session.customerId,
      checkoutToken: req.session.checkoutToken
    });
    
    // Set verification cookie (accessible to JavaScript)
    res.cookie('age_verified', 'true', {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Allow cross-site
      domain: '.malbygg.is' // Works across subdomains
    });
    
    // Also store in session for server-side checks
    req.session.age_verified = true;
    req.session.verification_age = age;
    
    // Redirect back to cart
    const redirectUrl = req.session.returnUrl || `${process.env.SHOPIFY_STORE_URL}/cart`;
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.SHOPIFY_STORE_URL}?error=verification_failed`);
  }
});

// Check verification status
app.post('/api/verify/check', (req, res) => {
  try {
    const { verificationId } = req.body;
    
    if (!verificationId) {
      return res.json({ verified: false });
    }
    
    const verification = verificationStore.get(verificationId);
    
    if (!verification) {
      return res.json({ verified: false });
    }
    
    // Check if verification is still valid (24 hours)
    const isValid = (Date.now() - verification.timestamp) < (24 * 60 * 60 * 1000);
    
    if (!isValid) {
      verificationStore.delete(verificationId);
      return res.json({ verified: false });
    }
    
    res.json({
      verified: verification.verified,
      age: verification.age
    });
    
  } catch (error) {
    console.error('Error checking verification:', error);
    res.status(500).json({ error: 'Failed to check verification' });
  }
});

// Webhook endpoint for Shopify validation function
app.post('/api/validate-checkout', async (req, res) => {
  try {
    const { checkoutToken, customerSessionId } = req.body;
    
    // Check if customer has valid age verification
    // This would integrate with your verification store
    
    const isVerified = false; // Check your verification logic here
    
    if (!isVerified) {
      return res.json({
        valid: false,
        errors: [{
          message: 'Age verification required. You must verify your age using Auðkenni to purchase alcohol.'
        }]
      });
    }
    
    res.json({ valid: true });
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await initializeAudkenni();
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Redirect URI: ${process.env.KENNI_REDIRECT_URI}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
