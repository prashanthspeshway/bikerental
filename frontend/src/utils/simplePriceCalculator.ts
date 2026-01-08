/**
 * Simple price calculator for the new pricing model:
 * - Price for 12 Hours (fixed)
 * - 14 blocks of 12-hour pricing (Block 1: hours 13-24, Block 2: hours 25-36, ..., Block 14: hours 157-168)
 * - Price Per Week (fixed)
 */

import { Bike } from '@/types';

export interface SimplePriceBreakdown {
  durationHours: number;
  basePrice: number;
  total: number;
  pricingType: '12hours' | 'blocks' | 'weekly';
  breakdown: string;
}

/**
 * Calculate price based on the new simple pricing model with 12-hour blocks
 */
export function calculateSimplePrice(
  bike: Bike,
  startDate: Date,
  endDate: Date
): SimplePriceBreakdown {
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  const durationDays = durationHours / 24;

  // Check if we have the new pricing fields
  const hasPrice12Hours = bike.price12Hours != null && bike.price12Hours > 0;
  const hasBlocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].some(
    block => {
      const blockPrice = bike[`priceBlock${block}` as keyof Bike];
      return blockPrice != null && Number(blockPrice) > 0;
    }
  );
  const hasPricePerWeek = bike.pricePerWeek != null && bike.pricePerWeek > 0;

  let basePrice = 0;
  let pricingType: '12hours' | 'blocks' | 'weekly' = 'blocks';
  let breakdown = '';

  // If duration is exactly or less than 12 hours and we have 12-hour pricing
  if (durationHours <= 12 && hasPrice12Hours) {
    basePrice = bike.price12Hours!;
    pricingType = '12hours';
    const hours = Math.round(durationHours);
    breakdown = `Total for ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  // If duration is more than 12 hours
  else if (durationHours > 12) {
    // Check if we should use weekly pricing (only if duration is 7 days or more)
    if (hasPricePerWeek && durationDays >= 7) {
      const weeks = Math.ceil(durationDays / 7);
      basePrice = bike.pricePerWeek! * weeks;
      pricingType = 'weekly';
      breakdown = `${weeks} Week${weeks > 1 ? 's' : ''} Package: ₹${basePrice}`;
    } else if (hasPrice12Hours && hasBlocks) {
      // Calculate using 12-hour blocks
      const priceFor12Hours = bike.price12Hours!;
      let priceForBlocks = 0;
      const hoursOver12 = durationHours - 12;
      
      // Calculate which blocks are needed
      // Block 1 covers hours 13-24 (hours 1-12 after the initial 12)
      // Block 2 covers hours 25-36 (hours 13-24 after the initial 12)
      // etc.
      const fullBlocksNeeded = Math.floor(hoursOver12 / 12);
      const partialBlockHours = hoursOver12 % 12;
      
      // Add price for full blocks
      for (let block = 1; block <= Math.min(fullBlocksNeeded, 14); block++) {
        const blockPrice = bike[`priceBlock${block}` as keyof Bike] as number | null | undefined;
        if (blockPrice != null && blockPrice > 0) {
          priceForBlocks += blockPrice;
        }
      }
      
      // For partial block, charge the full block price (round up)
      if (partialBlockHours > 0 && fullBlocksNeeded < 14) {
        const nextBlock = fullBlocksNeeded + 1;
        const nextBlockPrice = bike[`priceBlock${nextBlock}` as keyof Bike] as number | null | undefined;
        if (nextBlockPrice != null && nextBlockPrice > 0) {
          priceForBlocks += nextBlockPrice;
        }
      }
      
      basePrice = priceFor12Hours + priceForBlocks;
      pricingType = 'blocks';
      
      if (fullBlocksNeeded > 0) {
        const blockText = fullBlocksNeeded === 1 ? 'block' : 'blocks';
        const partialText = partialBlockHours > 0 ? ` + 1 partial block` : '';
        breakdown = `12 Hours: ₹${priceFor12Hours} + ${fullBlocksNeeded} ${blockText}${partialText}: ₹${priceForBlocks.toFixed(2)}`;
      } else {
        breakdown = `12 Hours: ₹${priceFor12Hours} + 1 block: ₹${priceForBlocks.toFixed(2)}`;
      }
    } else if (hasPrice12Hours) {
      // Fallback to 12-hour pricing if no blocks available
      basePrice = bike.price12Hours!;
      pricingType = '12hours';
      breakdown = `12 Hours Package: ₹${basePrice}`;
    }
  }
  
  // Fallback to legacy pricePerHour if new pricing not available
  if (basePrice === 0 && bike.pricePerHour && bike.pricePerHour > 0) {
    basePrice = bike.pricePerHour * durationHours;
    pricingType = 'blocks';
    breakdown = `${durationHours.toFixed(1)} hrs × ₹${bike.pricePerHour} = ₹${basePrice.toFixed(2)}`;
  }

  // Calculate GST (default 18%)
  const gstPercentage = bike.gstPercentage || 18.0;
  const gstAmount = (basePrice * gstPercentage) / 100;
  const total = basePrice + gstAmount;

  return {
    durationHours,
    basePrice,
    total,
    pricingType,
    breakdown,
    // Add fields for compatibility with legacy priceInfo
    priceAfterSurge: basePrice,
    surgeMultiplier: 1.0,
    hasWeekend: false,
    excessKm: 0,
    excessKmCharge: 0,
    subtotal: basePrice,
    gstPercentage,
    gstAmount,
    includedKm: bike.kmLimit || 0,
    extraKmPrice: 0,
  };
}
