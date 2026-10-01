// Email service using Resend
import { Resend } from 'resend';

// Initialize Resend with a dummy key if not configured (prevents constructor error)
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_development');
const FROM_EMAIL = process.env.FROM_EMAIL || 'Safar <noreply@safarcurated.com>';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@safarcurated.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Safar Master Email Template - Reusable Design System
const SafarEmailTemplate = ({ title, subtitle = '', content, hideFooter = false }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header with Logo & Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 36px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 32px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">SAFAR</h1>
              <p style="color: rgba(255, 255, 255, 0.95); margin: 0; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Curated Kashmir Experiences</p>
            </td>
          </tr>

          <!-- Hero Title Section -->
          <tr>
            <td style="background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%); padding: 28px 32px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 600; text-align: center;">${title}</h2>
              ${subtitle ? `<p style="color: #6b7280; margin: 12px 0 0 0; font-size: 14px; text-align: center; line-height: 1.5;">${subtitle}</p>` : ''}
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          ${!hideFooter ? `
          <tr>
            <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 12px 0;">
                Questions or need assistance?<br/>
                Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981; text-decoration: none; font-weight: 600;">${SUPPORT_EMAIL}</a>
              </p>
              <div style="margin: 20px 0; height: 1px; background-color: #e5e7eb;"></div>
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                © ${new Date().getFullYear()} Safar. All rights reserved.<br/>
                Premium curated experiences in Kashmir
              </p>
            </td>
          </tr>
          ` : ''}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Reusable Email Components
const EmailButton = ({ href, text, style = 'primary' }) => {
  const styles = {
    primary: 'background-color: #10b981; color: #ffffff;',
    secondary: 'background-color: #059669; color: #ffffff;',
    outline: 'background-color: transparent; color: #10b981; border: 2px solid #10b981;'
  };
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${href}" style="${styles[style]} padding: 14px 36px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
};

const InfoCard = ({ title, items, highlight = false }) => `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${highlight ? '#f0fdf4' : '#f9fafb'}; border-radius: 12px; padding: 24px; margin: 20px 0; ${highlight ? 'border: 2px solid #10b981;' : ''}">
    ${title ? `<tr><td><h3 style="color: #111827; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">${title}</h3></td></tr>` : ''}
    ${items.map(item => `
      <tr>
        <td style="padding: 6px 0;">
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
            <strong style="color: #111827;">${item.label}:</strong> ${item.value}
          </p>
        </td>
      </tr>
    `).join('')}
  </table>
`;

const AlertBox = ({ type = 'info', content }) => {
  const styles = {
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    success: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' }
  };
  const style = styles[type];
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: ${style.bg}; border-left: 4px solid ${style.border}; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <tr>
        <td>
          <p style="margin: 0; color: ${style.text}; font-size: 14px; line-height: 1.6;">
            ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
};

// Email templates
export const EmailTemplates = {
  welcome: (name) => ({
    subject: '🎉 Welcome to Safar – Your Kashmir Journey Begins',
    html: SafarEmailTemplate({
      title: 'Welcome to Safar!',
      subtitle: 'Your email is verified and your account is ready',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Thank you for joining <strong>Safar</strong> — we're thrilled to have you with us! Your account is now active and ready to explore.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Discover curated <strong>stays</strong>, unforgettable <strong>experiences</strong>, and connect with trusted <strong>local hosts</strong> across the beautiful valleys of Kashmir.
        </p>
        ${EmailButton({ href: `${BASE_URL}/explore`, text: '🏔️ Start Exploring Kashmir' })}
        ${AlertBox({ type: 'success', content: '<strong>Pro tip:</strong> Complete your profile to get personalized recommendations and unlock exclusive deals!' })}
      `
    })
  }),

  // Host Application Received — reuses SafarEmailTemplate + EmailButton + AlertBox
  // so it is visually identical to `welcome` (same header, gradient, logo, colors,
  // typography, spacing, footer). Only the CONTENT differs.
  hostApplicationReceived: (name) => ({
    subject: '📋 Host Application Received – Awaiting Review',
    html: SafarEmailTemplate({
      title: 'Host Application Received',
      subtitle: 'Your host application is awaiting review.',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Thanks for applying to become a <strong>Safar host</strong>. We&rsquo;ve received your application and it is now in the queue for our team to review.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Reviews usually take <strong>up to 24 hours</strong>. As soon as your application is approved you&rsquo;ll receive another email and your host tools will unlock automatically — no need to sign up again.
        </p>
        ${AlertBox({ type: 'warning', content: '<strong>🟡 Pending Admin Approval</strong><br/><span style="font-size:13px;">Your host application is under review. We&rsquo;ll notify you as soon as it&rsquo;s approved.</span>' })}
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">
          In the meantime you can keep exploring Safar as a traveler.
        </p>
        ${EmailButton({ href: `${BASE_URL}/explore`, text: '🏔️ Explore Kashmir' })}
      `
    })
  }),

  // Host Application Approved — sent when admin promotes a pending host to 'host'.
  hostApplicationApproved: (name) => ({
    subject: '✅ You are now a Safar Host',
    html: SafarEmailTemplate({
      title: 'You are now a Safar Host',
      subtitle: 'Your host application has been approved.',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Great news — your <strong>Safar host</strong> application has been <strong>approved</strong>. You can now list your stay, transport or experience and start welcoming travelers to Kashmir.
        </p>
        ${AlertBox({ type: 'success', content: '<strong>🟢 Host Access Unlocked</strong><br/><span style="font-size:13px;">All host tools are now available in your dashboard.</span>' })}
        ${EmailButton({ href: `${BASE_URL}/add-listing`, text: '✨ Create your first listing' })}
      `
    })
  }),

  emailVerification: (name, verificationLink) => ({
    subject: '✉️ Verify Your Email – Welcome to Safar',
    html: SafarEmailTemplate({
      title: 'Verify Your Email Address',
      subtitle: 'One quick step to unlock your account',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Thanks for signing up! Please verify your email address to secure your account and unlock the full Safar experience.
        </p>
        ${EmailButton({ href: verificationLink, text: '✓ Verify Email Address' })}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
          <tr>
            <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Or copy this link:</p>
              <p style="margin: 0; color: #059669; font-size: 12px; word-break: break-all; font-family: monospace;">
                <a href="${verificationLink}" style="color: #059669; text-decoration: none;">${verificationLink}</a>
              </p>
            </td>
          </tr>
        </table>
        ${AlertBox({ type: 'warning', content: '<strong>Important:</strong> This link expires in 24 hours and can only be used once. If you did not create a Safar account, please ignore this email.' })}
      `
    })
  }),

  passwordReset: (name, resetLink) => ({
    subject: '🔐 Reset Your Safar Password',
    html: SafarEmailTemplate({
      title: 'Reset Your Password',
      subtitle: 'We received a request to reset your password',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          We received a request to reset the password for your Safar account. Click the button below to choose a new password.
        </p>
        ${EmailButton({ href: resetLink, text: '🔑 Reset Password' })}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
          <tr>
            <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">Or copy this link:</p>
              <p style="margin: 0; color: #059669; font-size: 12px; word-break: break-all; font-family: monospace;">
                <a href="${resetLink}" style="color: #059669; text-decoration: none;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
        ${AlertBox({ type: 'info', content: '<strong>Security note:</strong> This link expires in 1 hour and can only be used once. If you did not request this reset, your password remains unchanged.' })}
      `
    })
  }),

  bookingConfirmation: (travelerName, booking) => ({
    subject: `✅ Booking Confirmed – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'Booking Confirmed!',
      subtitle: `Your reservation at ${booking.listingTitle} is confirmed`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${travelerName}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Great news! Your booking has been confirmed. Here are your reservation details:
        </p>
        ${InfoCard({
          title: booking.listingTitle + (booking.inventoryTypeName ? ` – ${booking.inventoryTypeName}` : ''),
          highlight: true,
          items: [
            { label: 'Booking ID', value: booking.bookingId },
            { label: 'Check-in', value: new Date(booking.checkInDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Check-out', value: new Date(booking.checkOutDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Guests', value: booking.guests },
            { label: 'Nights', value: booking.nights },
            { label: 'Total Amount', value: `₹${booking.totalPrice.toLocaleString('en-IN')}` }
          ]
        })}
        ${AlertBox({ type: 'info', content: `<strong>Your Host:</strong> ${booking.hostName}<br/>Your host will contact you soon with check-in details and property information.` })}
        ${EmailButton({ href: `${BASE_URL}/dashboard/traveler`, text: '📋 View Booking Details' })}
      `
    })
  }),

  bookingNotificationHost: (hostName, booking) => ({
    subject: `📬 New Booking Request – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'New Booking Request!',
      subtitle: `You have a new reservation request for ${booking.listingTitle}`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${hostName}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Congratulations! You have a new booking request for your listing:
        </p>
        ${InfoCard({
          title: booking.listingTitle + (booking.inventoryTypeName ? ` – ${booking.inventoryTypeName}` : ''),
          highlight: true,
          items: [
            { label: 'Guest Name', value: booking.travelerName },
            { label: 'Guest Email', value: booking.travelerEmail },
            { label: 'Check-in', value: new Date(booking.checkInDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Check-out', value: new Date(booking.checkOutDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Guests', value: booking.guests },
            { label: 'Total Earnings', value: `₹${booking.totalPrice.toLocaleString('en-IN')}` }
          ]
        })}
        ${AlertBox({ type: 'warning', content: '<strong>Action Required:</strong> Please respond to this booking request within 24 hours to maintain your response rate.' })}
        ${EmailButton({ href: `${BASE_URL}/dashboard/host`, text: '✓ Manage Booking' })}
      `
    })
  }),

  bookingCancellation: (name, booking, isHost) => ({
    subject: `❌ Booking Cancelled – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'Booking Cancelled',
      subtitle: `Reservation for ${booking.listingTitle} has been cancelled`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          This booking has been cancelled:
        </p>
        ${InfoCard({
          title: booking.listingTitle + (booking.inventoryTypeName ? ` – ${booking.inventoryTypeName}` : ''),
          items: [
            { label: 'Booking ID', value: booking.bookingId },
            { label: 'Dates', value: `${new Date(booking.checkInDate).toLocaleDateString('en-IN')} – ${new Date(booking.checkOutDate).toLocaleDateString('en-IN')}` },
            { label: 'Amount', value: `₹${booking.totalPrice.toLocaleString('en-IN')}` }
          ]
        })}
        ${AlertBox({ 
          type: 'info', 
          content: isHost 
            ? 'The guest has cancelled this booking. The dates are now available for new reservations.' 
            : 'Your cancellation has been processed. Any applicable refund will be processed within 5-7 business days according to our cancellation policy.' 
        })}
      `
    })
  }),

  bookingApproved: (travelerName, booking) => ({
    subject: `🎉 Booking Approved – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'Booking Approved!',
      subtitle: `Your host has approved your reservation`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${travelerName}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Excellent news! Your booking has been approved by the host. Your Kashmir adventure is confirmed!
        </p>
        ${InfoCard({
          title: booking.listingTitle + (booking.inventoryTypeName ? ` – ${booking.inventoryTypeName}` : ''),
          highlight: true,
          items: [
            { label: 'Booking ID', value: booking.bookingId },
            { label: 'Check-in', value: new Date(booking.checkInDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Check-out', value: new Date(booking.checkOutDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Total Amount', value: `₹${booking.totalPrice.toLocaleString('en-IN')}` }
          ]
        })}
        ${AlertBox({ type: 'success', content: '<strong>Next Steps:</strong> Your host will reach out soon with detailed check-in instructions and property guidelines. Start packing!' })}
        ${EmailButton({ href: `${BASE_URL}/dashboard/traveler`, text: '📋 View Trip Details' })}
      `
    })
  }),

  bookingRejected: (travelerName, booking, reason) => ({
    subject: `Booking Update – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'Booking Update',
      subtitle: 'Your booking request status',
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${travelerName}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Unfortunately, your booking request for ${booking.listingTitle} couldn't be confirmed at this time.
        </p>
        ${InfoCard({
          title: booking.listingTitle,
          items: [
            { label: 'Requested Dates', value: `${new Date(booking.checkInDate).toLocaleDateString('en-IN')} – ${new Date(booking.checkOutDate).toLocaleDateString('en-IN')}` },
            ...(reason ? [{ label: 'Host Note', value: reason }] : [])
          ]
        })}
        ${AlertBox({ type: 'info', content: 'Do not worry! We have many other amazing properties available for your dates. Browse our collection to find your perfect stay.' })}
        ${EmailButton({ href: `${BASE_URL}/explore`, text: '🔍 Explore Other Properties' })}
      `
    })
  }),

  invoice: (travelerName, booking, invoiceId) => ({
    subject: `📄 Invoice #${invoiceId} – ${booking.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'Booking Invoice',
      subtitle: `Invoice for your reservation at ${booking.listingTitle}`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${travelerName}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          Please find your booking invoice below:
        </p>
        ${InfoCard({
          title: `Invoice #${invoiceId}`,
          items: [
            { label: 'Property', value: booking.listingTitle + (booking.inventoryTypeName ? ` – ${booking.inventoryTypeName}` : '') },
            { label: 'Booking ID', value: booking.bookingId },
            { label: 'Check-in', value: new Date(booking.checkInDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Check-out', value: new Date(booking.checkOutDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
            { label: 'Guests', value: booking.guests },
            { label: 'Total Amount', value: `₹${booking.totalPrice.toLocaleString('en-IN')}` }
          ]
        })}
        ${EmailButton({ href: `${BASE_URL}/dashboard/traveler`, text: '📥 Download Full Invoice' })}
      `
    })
  }),

  contactForm: (formData) => ({
    subject: `📧 New Contact Form Submission from ${formData.name}`,
    html: SafarEmailTemplate({
      title: 'New Contact Message',
      subtitle: 'Someone has reached out via the contact form',
      content: `
        ${InfoCard({
          title: 'Contact Details',
          items: [
            { label: 'Name', value: formData.name },
            { label: 'Email', value: formData.email },
            ...(formData.phone ? [{ label: 'Phone', value: formData.phone }] : []),
            ...(formData.subject ? [{ label: 'Subject', value: formData.subject }] : [])
          ]
        })}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Message:</p>
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${formData.message}</p>
            </td>
          </tr>
        </table>
        ${EmailButton({ href: `mailto:${formData.email}`, text: '↩️ Reply to Message' })}
      `
    })
  }),

  bookingInquiry: (inquiry, host) => ({
    subject: `💬 New Inquiry About ${inquiry.listingTitle}`,
    html: SafarEmailTemplate({
      title: 'New Booking Inquiry',
      subtitle: `A guest is interested in ${inquiry.listingTitle}`,
      content: `
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
          Hi <strong>${host.name}</strong>,
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
          A potential guest has sent an inquiry about your property:
        </p>
        ${InfoCard({
          title: 'Guest Information',
          items: [
            { label: 'Name', value: inquiry.guestName },
            { label: 'Email', value: inquiry.guestEmail },
            { label: 'Interested Dates', value: inquiry.dates || 'Flexible' },
            { label: 'Guests', value: inquiry.guests || 'Not specified' }
          ]
        })}
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <tr>
            <td>
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Inquiry Message:</p>
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${inquiry.message}</p>
            </td>
          </tr>
        </table>
        ${AlertBox({ type: 'warning', content: '<strong>Quick Response Tip:</strong> Responding within 24 hours significantly increases your booking conversion rate!' })}
        ${EmailButton({ href: `mailto:${inquiry.guestEmail}`, text: '↩️ Respond to Inquiry' })}
      `
    })
  })
};

// Helper function to send email via Resend
export async function sendEmail({ to, subject, html }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email not sent:', { to, subject });
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', { to, subject, id: data?.id });
    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error: error.message };
  }
}

// Convenience functions
export async function sendWelcomeEmail(user) {
  const { subject, html } = EmailTemplates.welcome(user.name);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendHostApplicationReceivedEmail(user) {
  const { subject, html } = EmailTemplates.hostApplicationReceived(user.name);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendHostApplicationApprovedEmail(user) {
  const { subject, html } = EmailTemplates.hostApplicationApproved(user.name);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendBookingConfirmation(booking, traveler) {
  const { subject, html } = EmailTemplates.bookingConfirmation(traveler.name, booking);
  return sendEmail({ to: traveler.email, subject, html });
}

export async function sendBookingNotificationToHost(booking, host) {
  const { subject, html } = EmailTemplates.bookingNotificationHost(host.name, booking);
  return sendEmail({ to: host.email, subject, html });
}

export async function sendBookingCancellationEmail(booking, user, isHost) {
  const { subject, html } = EmailTemplates.bookingCancellation(user.name, booking, isHost);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendVerificationEmail(user, verificationLink) {
  const { subject, html } = EmailTemplates.emailVerification(user.name, verificationLink);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendPasswordResetEmail(user, resetLink) {
  const { subject, html } = EmailTemplates.passwordReset(user.name, resetLink);
  return sendEmail({ to: user.email, subject, html });
}

export async function sendBookingApprovedEmail(booking, traveler) {
  const { subject, html } = EmailTemplates.bookingApproved(traveler.name, booking);
  return sendEmail({ to: traveler.email, subject, html });
}

export async function sendBookingRejectedEmail(booking, traveler, reason) {
  const { subject, html } = EmailTemplates.bookingRejected(traveler.name, booking, reason);
  return sendEmail({ to: traveler.email, subject, html });
}

export async function sendInvoiceEmail(booking, traveler, invoiceId) {
  const { subject, html } = EmailTemplates.invoice(traveler.name, booking, invoiceId);
  return sendEmail({ to: traveler.email, subject, html });
}

export async function sendContactFormEmail(formData, recipientEmail = 'admin@safarkashmir.com') {
  const { subject, html } = EmailTemplates.contactFormNotification(formData);
  return sendEmail({ to: recipientEmail, subject, html });
}

export async function sendBookingInquiryEmail(inquiry, host) {
  const { subject, html } = EmailTemplates.bookingInquiry(host.name, inquiry);
  return sendEmail({ to: host.email, subject, html });
}

// ------------------------------------------------------------------
// Safar Circle — additional lightweight notifications (Module 4)
// Reuses the SafarEmailTemplate design system + sendEmail transport.
// ------------------------------------------------------------------
export async function sendJourneyPublishedEmail(user, journey) {
  if (!user?.email) return { success: false, error: 'no email' };
  const url = `${BASE_URL || ''}/explore/community?journey=${journey.slug || journey.id}`;
  const html = SafarEmailTemplate({
    title: '🌍 Your journey is live!',
    subtitle: `${journey.name} has been published to Safar Explore`,
    content: `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Hi <strong>${user.name || 'Curator'}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Your journey <strong>${journey.name}</strong> is now visible in Safar Explore. Travellers can discover, view and request to join.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px;">
          View your journey →
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        Share the link with friends to invite them along, or manage your journey in the Studio.
      </p>
    `,
  });
  return sendEmail({ to: user.email, subject: `Your journey "${journey.name}" is live on Safar`, html });
}

// ------------------------------------------------------------------
// Founding Partner Application (Premium Launch Mode)
// Reuses the SafarEmailTemplate design system for full brand consistency.
// ------------------------------------------------------------------
export async function sendFoundingPartnerReceivedEmail(application) {
  if (!application?.email) return { success: false, error: 'no email' };
  const name = application.fullName || 'there';
  const html = SafarEmailTemplate({
    title: 'Welcome to Safar Curated',
    subtitle: 'Your Founding Partner application has been received',
    content: `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">Hello <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Thank you for applying to become one of our <strong>Founding Partners</strong>. We're delighted to have received your application.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        Our Partnerships Team will carefully review your information and personally contact you to guide you through the onboarding and verification process.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        You don't need to do anything else at this stage — we'll be in touch soon.
      </p>
      ${AlertBox({ type: 'success', content: `<strong>Application ID:</strong> ${application.applicationId || '—'}<br/><strong>Category:</strong> ${application.category || '—'}` })}
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:16px 0 8px 0;">Thank you for believing in Safar Curated.</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 0 0;">Together, we're building something extraordinary.</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:24px 0 0 0;">Warm regards,<br/><strong>The Safar Curated Team</strong></p>
    `,
  });
  return sendEmail({ to: application.email, subject: 'Welcome to Safar Curated', html });
}

export async function sendPaymentSuccessEmail(user, payment) {
  if (!user?.email) return { success: false, error: 'no email' };
  const amount = Number(payment.amount || 0).toLocaleString('en-IN');
  const html = SafarEmailTemplate({
    title: '✅ Payment received',
    subtitle: 'Thank you — your payment is confirmed',
    content: `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">Hi <strong>${user.name || 'Traveller'}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px 0;">
        We've received your payment of <strong>₹${amount}</strong> for <strong>${payment.purposeLabel || payment.purpose || 'your booking'}</strong>. A confirmation has been recorded on your account.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Payment ID</td><td style="padding:12px 16px;text-align:right;font-family:monospace;font-size:13px;color:#111827;">${payment.paymentId || '—'}</td></tr>
        <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;">Order ID</td><td style="padding:12px 16px;text-align:right;font-family:monospace;font-size:13px;color:#111827;border-top:1px solid #e5e7eb;">${payment.orderId || '—'}</td></tr>
        <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;">Amount</td><td style="padding:12px 16px;text-align:right;font-weight:600;color:#059669;border-top:1px solid #e5e7eb;">₹${amount}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Keep this email for your records. If anything looks off, reach out to support.</p>
    `,
  });
  return sendEmail({ to: user.email, subject: `Payment of ₹${amount} received — Safar`, html });
}
