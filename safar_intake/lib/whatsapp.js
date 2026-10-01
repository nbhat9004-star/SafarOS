// WhatsApp utility functions
// Generates WhatsApp URLs for direct messaging

export function formatWhatsAppUrl(phone, message) {
  if (!phone) return null;
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Encode message for URL
  const encoded = encodeURIComponent(message);
  
  // WhatsApp URL format
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

export function generateBookingInquiry(listingTitle, checkIn, checkOut, guests, location) {
  let message = `Hi! I'm interested in *${listingTitle}*`;
  
  if (location) {
    message += ` in ${location}`;
  }
  
  if (checkIn && checkOut) {
    message += `\n\nDates: ${checkIn} to ${checkOut}`;
  }
  
  if (guests) {
    message += `\nGuests: ${guests}`;
  }
  
  message += `\n\nCould you please share more details?`;
  
  return message;
}

export function generateQuickInquiry(listingTitle) {
  return `Hi! I'm interested in *${listingTitle}*. Is it available for booking?`;
}
