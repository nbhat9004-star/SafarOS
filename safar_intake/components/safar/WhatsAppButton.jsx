'use client';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatWhatsAppUrl, generateBookingInquiry, generateQuickInquiry } from '@/lib/whatsapp';

export default function WhatsAppButton({ 
  phone, 
  listingTitle, 
  location,
  checkIn, 
  checkOut, 
  guests, 
  className = "",
  size = "default",
  variant = "default"
}) {
  if (!phone) return null;
  
  const message = (checkIn && checkOut) 
    ? generateBookingInquiry(listingTitle, checkIn, checkOut, guests, location)
    : generateQuickInquiry(listingTitle);
  
  const whatsappUrl = formatWhatsAppUrl(phone, message);
  
  if (!whatsappUrl) return null;
  
  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={`gap-2 ${className}`}
    >
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <MessageCircle className="size-4" />
        <span>Chat on WhatsApp</span>
      </a>
    </Button>
  );
}

// Compact version for cards
export function WhatsAppButtonCompact({ phone, listingTitle, className = "" }) {
  if (!phone) return null;
  
  const message = generateQuickInquiry(listingTitle);
  const whatsappUrl = formatWhatsAppUrl(phone, message);
  
  if (!whatsappUrl) return null;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition ${className}`}
    >
      <MessageCircle className="size-3.5" />
      <span>WhatsApp</span>
    </a>
  );
}
