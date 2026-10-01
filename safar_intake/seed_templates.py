#!/usr/bin/env python3
"""
Seed default templates for Module 6
"""
import requests
import json

BASE_URL = "http://localhost:3000/api"

# Login as super admin
print("=== Logging in ===")
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "founder@safarcurated.com",
    "password": "SuperAdmin@2025"
})

if not login_res.ok:
    print(f"❌ Login failed: {login_res.status_code}")
    exit(1)

headers = {"Authorization": f"Bearer {login_res.json()['token']}"}
print("✅ Logged in successfully\n")

# Default templates to seed
templates = [
    # Email Templates
    {
        "name": "Welcome Email",
        "category": "welcome",
        "type": "email",
        "subject": "Welcome to {{website_name}}!",
        "body": """Dear {{customer_name}},

Welcome to {{website_name}}! We're thrilled to have you as part of our community.

{{website_name}} is Kashmir's premier curated travel platform, connecting you with authentic experiences, verified hosts, and unforgettable stays.

Explore our collection of houseboats, mountain retreats, and local experiences at your convenience.

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Listing Approved",
        "category": "listing",
        "type": "email",
        "subject": "Your listing {{listing_title}} is now live!",
        "body": """Dear {{host_name}},

Great news! Your listing "{{listing_title}}" has been approved and is now live on {{website_name}}.

Your property in {{city}} is now visible to thousands of travelers looking for authentic Kashmir experiences.

You can manage your listing, update availability, and respond to booking requests from your host dashboard.

Welcome to our community of verified hosts!

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Listing Rejected",
        "category": "listing",
        "type": "email",
        "subject": "Update Required for {{listing_title}}",
        "body": """Dear {{host_name}},

Thank you for submitting your listing "{{listing_title}}" to {{website_name}}.

We need a few updates before we can approve your listing:

• Please provide clearer photos
• Add more details about amenities
• Update pricing information

You can make these changes from your host dashboard. Once updated, we'll review your listing again promptly.

If you have any questions, please don't hesitate to reach out.

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Booking Confirmation",
        "category": "booking",
        "type": "email",
        "subject": "Booking Confirmed - {{listing_title}}",
        "body": """Dear {{customer_name}},

Your booking has been confirmed!

Booking ID: {{booking_id}}
Property: {{listing_title}}
Location: {{city}}
Date: {{date}}

Your host {{host_name}} will be in touch soon with check-in details.

We hope you have a wonderful stay in Kashmir!

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Booking Cancelled",
        "category": "booking",
        "type": "email",
        "subject": "Booking Cancellation - {{listing_title}}",
        "body": """Dear {{customer_name}},

Your booking ({{booking_id}}) for {{listing_title}} has been cancelled as per your request.

If this was a mistake or you'd like to rebook, please visit our website.

We hope to serve you again soon!

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Partnership Invitation",
        "category": "partnership",
        "type": "email",
        "subject": "Partnership Opportunity with {{website_name}}",
        "body": """Dear {{business_name}} Team,

We discovered your establishment in {{city}} and are impressed by what you offer!

{{website_name}} is Kashmir's leading curated travel platform, and we'd love to feature {{business_name}} to our audience of travelers seeking authentic experiences.

Partnership Benefits:
• Reach thousands of verified travelers
• Zero commission for the first 3 months
• Professional listing with photos and reviews
• Dedicated support from our team

Would you be interested in a quick call to discuss how we can work together?

Looking forward to hearing from you!

Best regards,
The {{website_name}} Team"""
    },
    {
        "name": "Password Reset",
        "category": "account",
        "type": "email",
        "subject": "Reset Your {{website_name}} Password",
        "body": """Dear {{customer_name}},

We received a request to reset your password for your {{website_name}} account.

If you made this request, please click the link below to reset your password:
[Reset Password Link]

This link will expire in 24 hours.

If you didn't request this, please ignore this email. Your password will remain unchanged.

Best regards,
The {{website_name}} Team"""
    },
    
    # WhatsApp Templates
    {
        "name": "Welcome WhatsApp",
        "category": "welcome",
        "type": "whatsapp",
        "body": """🙏 Salaam {{customer_name}}!

Welcome to *{{website_name}}* - Kashmir's curated travel platform! 

Discover authentic stays, local experiences, and verified hosts across Kashmir.

Start exploring: [Website Link]"""
    },
    {
        "name": "Listing Approved WhatsApp",
        "category": "listing",
        "type": "whatsapp",
        "body": """🎉 Congratulations {{host_name}}!

Your listing *{{listing_title}}* is now LIVE on {{website_name}}!

Travelers in {{city}} can now discover and book your property.

Manage your listing: [Dashboard Link]"""
    },
    {
        "name": "Booking Confirmation WhatsApp",
        "category": "booking",
        "type": "whatsapp",
        "body": """✅ Booking Confirmed!

Hi {{customer_name}},

Your booking at *{{listing_title}}* in {{city}} is confirmed!

📍 Property: {{listing_title}}
🆔 Booking: {{booking_id}}
📅 Date: {{date}}

Your host {{host_name}} will contact you soon with details.

View booking: [Booking Link]"""
    },
    {
        "name": "Booking Reminder WhatsApp",
        "category": "booking",
        "type": "whatsapp",
        "body": """⏰ Reminder: Check-in Tomorrow!

Hi {{customer_name}},

Your stay at *{{listing_title}}* in {{city}} is tomorrow!

📍 Location: {{city}}
👤 Host: {{host_name}}

Have all your details ready. Safe travels! 🧳"""
    },
    {
        "name": "Follow-up WhatsApp",
        "category": "follow_up",
        "type": "whatsapp",
        "body": """Hi {{business_name}} team! 👋

Following up on our partnership opportunity with {{website_name}}.

We'd love to feature your property in {{city}} on our platform and help you reach more travelers.

Are you available for a quick chat?

Thanks!
{{website_name}} Team"""
    }
]

# Create templates
print("=== Creating Default Templates ===\n")
created_count = 0
for template in templates:
    res = requests.post(f"{BASE_URL}/marketplace/templates", json=template, headers=headers)
    
    if res.ok:
        print(f"✅ Created: {template['name']} ({template['type']})")
        created_count += 1
    else:
        print(f"❌ Failed: {template['name']} - {res.json().get('error', 'Unknown error')}")

print("\n=== Summary ===")
print(f"✅ Created {created_count}/{len(templates)} templates")
print("\nTemplates are ready to use!")
