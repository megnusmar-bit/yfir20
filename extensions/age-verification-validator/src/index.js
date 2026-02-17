// @ts-check

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 * @typedef {import("../generated/api").ValidationError} ValidationError
 */

/**
 * Age verification validation function
 * Checks if customer has valid Auðkenni age verification
 * 
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
export default async function validate(input) {
  const errors = [];

  // Check if cart contains age-restricted products (beer)
  const hasAgeRestrictedProducts = input.cart.lines.some(line => {
    // Check if product has age restriction tag or is in beer collection
    const product = line.merchandise?.product;
    if (!product) return false;
    
    const tags = product.tags || [];
    const productType = product.productType || '';
    
    return tags.includes('age-restricted') || 
           tags.includes('alcohol') || 
           tags.includes('beer') ||
           productType.toLowerCase().includes('beer') ||
           productType.toLowerCase().includes('alcohol');
  });

  // If no age-restricted products, allow checkout
  if (!hasAgeRestrictedProducts) {
    return {
      errors: []
    };
  }

  // Check for age verification
  // This is a simplified check - in production you'd validate against your backend
  const buyerIdentity = input.cart.buyerIdentity;
  const customerId = buyerIdentity?.customer?.id;
  
  // Check if customer has age_verified metafield
  const isVerified = buyerIdentity?.customer?.metafields?.some(
    metafield => 
      metafield.namespace === 'audkenni' && 
      metafield.key === 'age_verified' && 
      metafield.value === 'true'
  );

  if (!isVerified) {
    errors.push({
      localizedMessage: 'Aldursstaðfesting vantar. Þú verður að staðfesta aldur þinn með Auðkenni til að kaupa áfengi.',
      target: 'cart'
    });
  }

  return {
    errors
  };
}
