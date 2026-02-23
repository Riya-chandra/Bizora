export type AIParsedItem = { name: string; quantity: number };

/**
 * Free AI-like parser - No API calls needed!
 * Extracts products from Hinglish messages using pattern matching
 */
export async function parseOrderMessageWithAI(
  message: string,
  businessAccount: string,
  priceHistory: Array<{ product: string; price: number }>
): Promise<{ items: AIParsedItem[]; confidence: number; interpretation: string }> {
  const knownProducts = new Set(priceHistory.map(p => p.product.toLowerCase()));
  console.log(`[AI Parser] FREE MODE: Known products = [${Array.from(knownProducts).join(', ')}]`);

  const items: AIParsedItem[] = [];
  const processedProducts = new Set<string>();
  
  // Split by "and" or "aur" to handle multi-item orders
  // "mujhe 2 kurti chahiye aur 1 duppatta" → ["mujhe 2 kurti chahiye", "1 duppatta"]
  const segments = message.split(/\s+(?:and|aur)\s+/i);
  console.log(`[AI Parser] Split into ${segments.length} segments`);

  for (const segment of segments) {
    console.log(`[AI Parser] Processing segment: "${segment.trim()}"`);
    
    // Look for: [ optional Hindi filler ] QUANTITY [ filler ] PRODUCT_NAME
    // Match groups: group 1 = qty, group 2 = product_word
    const match = segment.match(/(?:mujhe|chahiye|humko)?\s*(\d+)\s+([a-z]+)/i);
    if (!match) {
      console.log(`[AI Parser]   → No qty+product pattern found`);
      continue;
    }

    const qty = parseInt(match[1], 10);
    let productWord = match[2].toLowerCase();

    // Remove trailing filler words from product name
    productWord = productWord.replace(/\b(please|plz|for|and|the|aur|chahiye|mujhe|humko)$/i, '').trim();
    
    if (!productWord) {
      console.log(`[AI Parser]   → Product word empty after removing fillers`);
      continue;
    }

    // Try to find exact or fuzzy match in known products
    let bestMatch = '';
    let bestScore = 0;

    for (const known of Array.from(knownProducts)) {
      // Exact match
      if (known === productWord) {
        bestMatch = known;
        bestScore = 0.95;
        break;
      }
      // Contains match: "kurtis" contains "kurti"
      if (known.includes(productWord) || productWord.includes(known)) {
        bestMatch = known;
        bestScore = 0.85;
        break;
      }
      // Prefix match: "kur" matches "kurti"
      if (known.startsWith(productWord.substring(0, 3)) && productWord.length >= 3) {
        bestMatch = known;
        bestScore = 0.75;
        break;
      }
    }

    if (bestMatch && !processedProducts.has(bestMatch)) {
      items.push({ name: bestMatch, quantity: qty });
      processedProducts.add(bestMatch);
      console.log(`[AI Parser]   ✓ Matched "${productWord}" → "${bestMatch}" × ${qty}`);
    } else {
      console.log(`[AI Parser]   ✗ No product match for "${productWord}"`);
    }
  }

  const confidence = items.length > 0 ? 0.85 : 0.1;
  console.log(`[AI Parser] Final result: ${items.length} items, confidence=${confidence}`);
  return { items, confidence, interpretation: message };
}
