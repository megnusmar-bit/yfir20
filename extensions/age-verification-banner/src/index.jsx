import React, { useState, useEffect } from 'react';
import {
  reactExtension,
  Banner,
  Button,
  BlockStack,
  InlineStack,
  Text,
  useStorage,
  useApi
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <AgeVerificationBanner />
);

function AgeVerificationBanner() {
  const { storage } = useStorage();
  const { extension } = useApi();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check verification status on mount
  useEffect(() => {
    checkVerificationStatus();
  }, []);

  async function checkVerificationStatus() {
    try {
      setIsLoading(true);
      
      // Check local storage first
      const storedVerification = await storage.read('age_verified');
      
      if (storedVerification) {
        // Verify with backend that verification is still valid
        const response = await fetch('https://your-app-url.com/api/verify/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            verificationId: storedVerification
          })
        });
        
        const data = await response.json();
        
        if (data.verified) {
          setIsVerified(true);
        } else {
          // Verification expired or invalid
          await storage.delete('age_verified');
          setIsVerified(false);
        }
      } else {
        setIsVerified(false);
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setError('Failed to verify age status');
    } finally {
      setIsLoading(false);
    }
  }

  async function startVerification() {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get checkout token
      const checkoutToken = extension.target.id;
      
      // Request verification URL from backend
      const response = await fetch('https://your-app-url.com/api/verify/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutToken
        })
      });
      
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Auðkenni
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (err) {
      console.error('Error starting verification:', err);
      setError('Failed to start verification. Please try again.');
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Banner title="Checking age verification..." status="info">
        Please wait...
      </Banner>
    );
  }

  if (isVerified) {
    return (
      <Banner title="Age verified ✓" status="success">
        <BlockStack spacing="tight">
          <Text>You have been verified as 20 years or older.</Text>
          <Text size="small" appearance="subdued">
            This verification is valid for 24 hours.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  return (
    <Banner title="Age verification required" status="critical">
      <BlockStack spacing="base">
        <Text>
          To purchase alcoholic beverages, you must verify your age using Kenni 
          (Icelandic electronic ID). You must be 20 years or older.
        </Text>
        
        {error && (
          <Text appearance="critical">{error}</Text>
        )}
        
        <InlineStack spacing="tight">
          <Button
            kind="primary"
            onPress={startVerification}
            disabled={isLoading}
          >
            Verify with Kenni
          </Button>
        </InlineStack>
        
        <Text size="small" appearance="subdued">
          Clicking this button will redirect you to kenni.is
        </Text>
      </BlockStack>
    </Banner>
  );
}
