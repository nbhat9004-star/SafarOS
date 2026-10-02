#!/bin/bash
echo "=== Website Builder Public Route Fix - Manual Test ==="
echo ""

# Create test agency
echo "1. Creating test agency..."
AGENCY_RESP=$(curl -s -X POST http://localhost:3000/api/auth/register-agency \
  -H "Content-Type: application/json" \
  -d '{"agencyName":"Test Travel Agency","name":"Admin User","email":"admin@testtravel.com","password":"testpass123"}')

echo "Agency created response: $AGENCY_RESP"
echo ""

# Login
echo "2. Logging in..."
LOGIN_RESP=$(curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testtravel.com","password":"testpass123"}')
echo "Login response: $LOGIN_RESP"
echo ""

# Get agency slug from database
echo "3. Fetching agency slug..."
SLUG=$(mongosh "$MONGO_URL" --quiet --eval "db.agencies.findOne({name:'Test Travel Agency'}, {_id:0, slug:1})" | grep -oP '(?<=slug: ")[^"]+')
echo "Agency slug: $SLUG"
echo ""

# Create website settings
echo "4. Creating website settings..."
SETTINGS_RESP=$(curl -s -b /tmp/cookies.txt -X PUT http://localhost:3000/api/website/settings \
  -H "Content-Type: application/json" \
  -d '{"status":"published","title":"Test Travel Agency","description":"Your journey begins here"}')
echo "Settings response: $SETTINGS_RESP"
echo ""

# Create a home page
echo "5. Creating home page..."
PAGE_RESP=$(curl -s -b /tmp/cookies.txt -X POST http://localhost:3000/api/website/pages \
  -H "Content-Type: application/json" \
  -d '{"title":"Welcome","slug":"home","pageType":"home","content":"<p>Welcome to our travel agency!</p>","status":"published"}')
echo "Page response: $PAGE_RESP"
echo ""

# Test public route
echo "6. Testing public website route..."
PUBLIC_URL="http://localhost:3000/site/$SLUG"
echo "URL: $PUBLIC_URL"
PUBLIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL")
echo "HTTP Status: $PUBLIC_STATUS"

if [ "$PUBLIC_STATUS" = "200" ]; then
  echo "✅ SUCCESS: Public website route is working!"
else
  echo "❌ FAILED: Expected 200, got $PUBLIC_STATUS"
fi
echo ""

# Cleanup
echo "7. Cleaning up test data..."
mongosh "$MONGO_URL" --quiet --eval "
  db.agencies.deleteOne({name:'Test Travel Agency'});
  db.users.deleteMany({email:'admin@testtravel.com'});
  db.websiteSettings.deleteMany({});
  db.websitePages.deleteMany({});
  print('Cleanup complete');
"

rm -f /tmp/cookies.txt
echo ""
echo "=== Test Complete ==="
