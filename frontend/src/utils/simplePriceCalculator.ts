/**
 * Simple price calculator for the new pricing model:
 * - Price for 12 Hours (fixed)
 * - Price Per Hour (for >12 hrs) - multiplied by hours
 * - Price Per Week (fixed)
 */

import { Bike } from '@/types';

export interface SimplePriceBreakdown {
  durationHours: number;
  basePrice: number;
  total: number;
  pricingType: '12hours' | 'hourly' | 'weekly';
  breakdown: string;
}

/**
 * Calculate price based on the new simple pricing model
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
  const hasPrice12Hours = bike.price12Hours && bike.price12Hours > 0;
  const hasIndividualHourlyRates = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].some(
    hour => bike[`pricePerHour${hour}` as keyof Bike] && Number(bike[`pricePerHour${hour}` as keyof Bike]) > 0
  );
  const hasPricePerWeek = bike.pricePerWeek && bike.pricePerWeek > 0;

  let basePrice = 0;
  let pricingType: '12hours' | 'hourly' | 'weekly' = 'hourly';
  let breakdown = '';

  // If duration is exactly or less than 12 hours and we have 12-hour pricing
  if (durationHours <= 12 && hasPrice12Hours) {
    basePrice = bike.price12Hours!;
    pricingType = '12hours';
    const hours = Math.round(durationHours);
    breakdown = `Total for ${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  // If duration is more than 12 hours (shouldn't happen, but handle it)
  else if (durationHours > 12 && durationHours <= 24) {
    if (hasIndividualHourlyRates) {
      // Use individual hourly rates for hours 13-24
      const priceFor12Hours = hasPrice12Hours ? bike.price12Hours! : 0;
      let priceForExtraHours = 0;
      const hoursOver12 = Math.floor(durationHours - 12);
      const partialHour = durationHours - 12 - hoursOver12;
      
      // Calculate price for full hours 13-24
      for (let hour = 13; hour <= Math.min(12 + hoursOver12, 24); hour++) {
        const hourPrice = bike[`pricePerHour${hour}` as keyof Bike] as number | undefined;
        if (hourPrice && hourPrice > 0) {
          priceForExtraHours += hourPrice;
        }
      }
      
      // Add partial hour if exists (use rate for next hour)
      if (partialHour > 0) {
        const nextHour = Math.min(12 + hoursOver12 + 1, 24);
        const nextHourPrice = bike[`pricePerHour${nextHour}` as keyof Bike] as number | undefined;
        if (nextHourPrice && nextHourPrice > 0) {
          priceForExtraHours += nextHourPrice * partialHour;
        }
      }
      
      basePrice = priceFor12Hours + priceForExtraHours;
      pricingType = 'hourly';
      breakdown = hasPrice12Hours
        ? `12 Hours: ₹${priceFor12Hours} + Extra hours: ₹${priceForExtraHours.toFixed(2)}`
        : `Hourly rates: ₹${basePrice.toFixed(2)}`;
    } else if (hasPrice12Hours) {
      // Fallback to 12-hour pricing if no individual rates
      basePrice = bike.price12Hours!;
      pricingType = '12hours';
      breakdown = `12 Hours Package: ₹${basePrice}`;
    }
  }
  // Fallback to legacy pricePerHour if new pricing not available
  else if (bike.pricePerHour) {
    basePrice = bike.pricePerHour * durationHours;
    pricingType = 'hourly';
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

