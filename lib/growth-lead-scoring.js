/**
 * SafarOS Growth premium lead scoring.
 *
 * This is a deterministic qualification helper, not proof of identity,
 * phone ownership, ability to pay, or guaranteed booking conversion.
 * OTP is optional and is never a prerequisite for scoring.
 */

export const GROWTH_SCORE_WEIGHTS = Object.freeze({
  profileCompleteness: 10,
  tripSpecificity: 15,
  budgetAndGroup: 15,
  travelTiming: 15,
  engagement: 20,
  purchaseIntent: 15,
  integrity: 10,
});

export const GROWTH_QUALITY_BANDS = Object.freeze({
  premium: { min: 80, max: 100, label: 'Premium' },
  qualified: { min: 60, max: 79, label: 'Qualified' },
  review: { min: 0, max: 59, label: 'Review required' },
});

export const GROWTH_PREMIUM_PRICE_BANDS_INR = Object.freeze([
  { minScore: 95, maxScore: 100, amountInr: 499 },
  { minScore: 90, maxScore: 94, amountInr: 399 },
  { minScore: 85, maxScore: 89, amountInr: 299 },
  { minScore: 80, maxScore: 84, amountInr: 199 },
]);

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidPhoneFormat = (value) => {
  const digits = String(value || '').replace(/\\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};
const isValidEmailFormat = (value) =>
  hasText(value) && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim());

function travelTimingPoints(travelStart, referenceDate) {
  if (!travelStart) return 0;
  const start = new Date(travelStart);
  const reference = new Date(referenceDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(reference.getTime())) return 0;
  const days = Math.ceil((start.getTime() - reference.getTime()) / 86400000);
  if (days < 0) return 0;
  if (days <= 90) return 15;
  if (days <= 180) return 12;
  if (days <= 365) return 8;
  return 3;
}

export function scoreGrowthLead(lead = {}, options = {}) {
  const referenceDate = options.referenceDate || new Date().toISOString();
  const signals = lead.qualificationSignals || {};
  const breakdown = {
    profileCompleteness:
      (hasText(lead.name) ? 3 : 0) +
      (isValidPhoneFormat(lead.phone) ? 4 : 0) +
      (isValidEmailFormat(lead.email) ? 3 : 0),
    tripSpecificity:
      (hasText(lead.destination) ? 5 : 0) +
      (hasText(lead.travelStart) ? 5 : 0) +
      (hasText(lead.tripType) ? 5 : 0),
    budgetAndGroup:
      (Number.isFinite(Number(lead.budgetMax)) && Number(lead.budgetMax) > 0 ? 8 : 0) +
      (Number.isInteger(Number(lead.partySize)) && Number(lead.partySize) > 0 ? 7 : 0),
    travelTiming: travelTimingPoints(lead.travelStart, referenceDate),
    engagement:
      (signals.confirmedRequirements === true ? 10 : 0) +
      (signals.respondedToFollowUp === true ? 5 : 0) +
      (signals.requestedQuoteOrCallback === true ? 5 : 0),
    purchaseIntent:
      (signals.requestedQuotation === true ? 8 : 0) +
      (signals.statedBookingTimeline === true ? 4 : 0) +
      (signals.selectedItineraryOrPackage === true ? 3 : 0),
    integrity: 10 -
      (signals.possibleDuplicate === true ? 10 : 0) -
      (signals.suspiciousSubmission === true ? 10 : 0),
  };

  breakdown.integrity = Math.max(0, breakdown.integrity);
  const score = Math.min(100, Object.values(breakdown).reduce((sum, points) => sum + points, 0));
  const quality = score >= 80 ? 'premium' : score >= 60 ? 'qualified' : 'review';
  const consentValid = lead.consent?.granted === true && lead.consent?.withdrawn !== true;
  const duplicate = signals.possibleDuplicate === true;
  const suspicious = signals.suspiciousSubmission === true;
  const phoneFormatValid = isValidPhoneFormat(lead.phone);
  const blockers = [];
  if (!consentValid) blockers.push('valid_consent_required');
  if (!phoneFormatValid) blockers.push('valid_phone_format_required');
  if (duplicate) blockers.push('duplicate_review_required');
  if (suspicious) blockers.push('suspicious_submission_review_required');
  if (quality !== 'premium') blockers.push('premium_score_threshold_not_met');
  if (breakdown.engagement < 10) blockers.push('meaningful_engagement_required');

  const price = GROWTH_PREMIUM_PRICE_BANDS_INR.find(
    (band) => score >= band.minScore && score <= band.maxScore
  );

  return {
    score,
    quality,
    breakdown,
    premiumEligible: blockers.length === 0,
    suggestedPriceInr: blockers.length === 0 && price ? price.amountInr : null,
    phoneOwnershipVerified: lead.phoneOwnershipVerified === true,
    otpRequired: false,
    blockers,
  };
}
