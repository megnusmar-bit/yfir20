# Deployment Checklist

Use this checklist to ensure everything is configured correctly before going live.

## Pre-Deployment

### 1. Auðkenni Configuration
- [ ] Registered application with Auðkenni
- [ ] Obtained Client ID
- [ ] Obtained Client Secret
- [ ] Configured redirect URI: `https://your-app-url.com/auth/callback`
- [ ] Confirmed which claim contains kennitala (nationalId, ssn, sub)
- [ ] Tested with Auðkenni test credentials
- [ ] Requested production access from Auðkenni

### 2. Environment Configuration
- [ ] Created `.env` file from `.env.example`
- [ ] Set `AUDKENNI_CLIENT_ID`
- [ ] Set `AUDKENNI_CLIENT_SECRET`
- [ ] Set `AUDKENNI_REDIRECT_URI`
- [ ] Generated random `SESSION_SECRET` (32+ chars)
- [ ] Set `SHOPIFY_STORE_URL`
- [ ] Set `SHOPIFY_API_KEY`
- [ ] Set `SHOPIFY_API_SECRET`
- [ ] Set `MINIMUM_AGE=20`
- [ ] Set `NODE_ENV=production`

### 3. Code Configuration
- [ ] Updated API URLs in `extensions/age-verification-banner/src/index.jsx`
- [ ] Updated domain whitelist in `extensions/age-verification-banner/shopify.extension.toml`
- [ ] Configured correct kennitala claim in `server/index.js` (line 124)
- [ ] Updated `shopify.app.toml` with correct client_id
- [ ] Updated `shopify.app.toml` with correct application_url

### 4. Dependencies
- [ ] Ran `npm install` in root directory
- [ ] Ran `npm install` in `extensions/age-verification-banner/`
- [ ] Verified Node.js version (18+)
- [ ] Installed Shopify CLI globally

### 5. Server Hosting
- [ ] Selected hosting provider (Railway, Heroku, AWS, etc.)
- [ ] Created application/project
- [ ] Configured environment variables on host
- [ ] Set up custom domain (optional)
- [ ] Verified HTTPS is working
- [ ] Tested `/health` endpoint

### 6. Shopify Configuration
- [ ] Have Shopify Plus account
- [ ] Created Shopify Partner account
- [ ] Created Shopify app in Partner dashboard
- [ ] Added app to development store
- [ ] Configured OAuth redirect URLs
- [ ] Set correct app scopes

## Deployment

### 7. Deploy Server
- [ ] Pushed code to hosting provider
- [ ] Verified server is running
- [ ] Checked logs for errors
- [ ] Tested health endpoint: `curl https://your-app-url.com/health`
- [ ] Verified Auðkenni OpenID client initializes

### 8. Deploy Shopify App
- [ ] Ran `shopify app deploy`
- [ ] Verified checkout extension deployed
- [ ] Verified validation function deployed
- [ ] Installed app in Shopify admin
- [ ] Granted necessary permissions

### 9. Enable Extensions
- [ ] In Shopify admin → Settings → Checkout
- [ ] Found "age-verification-banner" under extensions
- [ ] Clicked "Enable"
- [ ] Verified extension shows in checkout customization

### 10. Configure Products
- [ ] Tagged beer/alcohol products with `age-restricted` OR `alcohol` OR `beer`
- [ ] Or set product type to contain "beer" or "alcohol"
- [ ] Verified tags are applied correctly
- [ ] Tested with at least 3 different products

## Testing

### 11. Functionality Testing
- [ ] Added age-restricted product to cart
- [ ] Went to checkout
- [ ] Saw age verification banner
- [ ] Clicked "Verify with Auðkenni"
- [ ] Redirected to innskraning.island.is
- [ ] Authenticated successfully
- [ ] Redirected back to store
- [ ] Verification status shows "verified"
- [ ] Able to complete checkout
- [ ] Verification persists after page refresh

### 12. Negative Testing
- [ ] Tested without verification (should block checkout)
- [ ] Tested with expired verification (should require re-verification)
- [ ] Tested with non-age-restricted products (should not require verification)
- [ ] Tested validation error message is clear
- [ ] Tested in different browsers (Chrome, Safari, Firefox)
- [ ] Tested on mobile devices

### 13. Edge Cases
- [ ] Tested guest checkout
- [ ] Tested logged-in customer checkout
- [ ] Tested with multiple products (mixed restricted/non-restricted)
- [ ] Tested verification timeout scenario
- [ ] Tested network error handling
- [ ] Tested with VPN/different locations

## Production Readiness

### 14. Security
- [ ] All connections use HTTPS
- [ ] Session secret is strong and unique
- [ ] Cookies set with `secure` and `httpOnly` flags
- [ ] No credentials in code or logs
- [ ] Rate limiting implemented (recommended)
- [ ] CSRF protection enabled (recommended)
- [ ] Input validation on all endpoints

### 15. Performance
- [ ] Implemented persistent storage (Redis/database) instead of Map
- [ ] Added caching where appropriate
- [ ] Optimized database queries (if using database)
- [ ] Tested under load
- [ ] Set up health check monitoring
- [ ] Configured auto-scaling (if available)

### 16. Monitoring & Logging
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Configured log aggregation
- [ ] Set up uptime monitoring
- [ ] Created alerts for critical errors
- [ ] Added application performance monitoring (APM)
- [ ] Configured log retention policy

### 17. Compliance
- [ ] Reviewed Icelandic alcohol sale regulations
- [ ] Verified minimum age requirement (20 years)
- [ ] Confirmed data retention policies
- [ ] Added privacy policy updates (if needed)
- [ ] Documented verification process
- [ ] Created audit trail for verifications
- [ ] Reviewed GDPR compliance

### 18. Documentation
- [ ] Updated README with production URLs
- [ ] Documented environment variables
- [ ] Created runbook for common issues
- [ ] Documented backup/recovery procedures
- [ ] Created support contact info
- [ ] Documented escalation procedures

### 19. Backup & Recovery
- [ ] Backed up environment variables
- [ ] Documented server configuration
- [ ] Created database backup strategy (if applicable)
- [ ] Tested restore procedure
- [ ] Documented rollback plan

### 20. User Experience
- [ ] Tested complete user journey
- [ ] Verified error messages are clear
- [ ] Confirmed verification button is prominent
- [ ] Tested mobile responsiveness
- [ ] Added Icelandic translations
- [ ] Verified loading states are clear
- [ ] Added helpful tooltips/hints

## Post-Deployment

### 21. Monitoring
- [ ] Verified application is running
- [ ] Checked error rates
- [ ] Monitored verification success rate
- [ ] Tracked checkout completion rate
- [ ] Set up weekly/monthly reports

### 22. Support
- [ ] Created support email/contact
- [ ] Prepared FAQ for common issues
- [ ] Trained support team (if applicable)
- [ ] Set up feedback collection
- [ ] Created incident response plan

### 23. Optimization
- [ ] Reviewed user feedback
- [ ] Analyzed verification success rates
- [ ] Identified bottlenecks
- [ ] Planned improvements
- [ ] Scheduled regular reviews

## Emergency Contacts

**Auðkenni Support:**
- Email: _____________
- Phone: _____________
- Emergency: _____________

**Hosting Provider Support:**
- Portal: _____________
- Email: _____________
- Phone: _____________

**Shopify Support:**
- Partner Support: https://partners.shopify.com/support
- Plus Support: https://help.shopify.com/

## Rollback Plan

If critical issues arise:

1. Disable checkout extension in Shopify admin
2. Revert to previous deployment
3. Notify customers of temporary issue
4. Fix issue in development environment
5. Test thoroughly
6. Re-deploy

## Sign-off

- [ ] Technical lead approved
- [ ] Security review completed
- [ ] Legal compliance verified
- [ ] Business stakeholder approved
- [ ] Ready for production

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________

---

## Quick Health Check Commands

After deployment, run these to verify:

```bash
# Server health
curl https://your-app-url.com/health

# Extension deployed
shopify app list extensions

# Verification endpoint
curl -X POST https://your-app-url.com/api/verify/check \
  -H "Content-Type: application/json" \
  -d '{"verificationId":"test"}'
```

## Success Criteria

✅ Deployment is successful when:
- All checklist items marked complete
- Health endpoint returns 200
- Age verification works end-to-end
- Checkout blocks without verification
- No critical errors in logs
- Monitoring alerts configured
- Support team trained
