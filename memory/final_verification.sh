#!/bin/bash
echo "=== Website Builder Public Route - Final Verification ==="
echo ""

# Test 1: Create agency
echo "1. Creating agency 'Bhat Travels'..."
AGENCY=$(curl -s -X POST http://localhost:3000/api/auth/register-agency \
  -H "Content-Type: application/json" \
  -d '{"agencyName":"Bhat Travels","name":"Admin","email":"admin@bhattravels.com","password":"pass123"}')
SLUG=$(echo "$AGENCY" | grep -oP '(?<="slug":")[^"]+')
echo "   Agency slug: $SLUG"

# Test 2: Login
echo "2. Logging in..."
curl -s -c /app/memory/test_cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bhattravels.com","password":"pass123"}' > /dev/null

# Test 3: Publish website
echo "3. Publishing website..."
curl -s -b /app/memory/test_cookies.txt -X PUT http://localhost:3000/api/website/settings \
  -H "Content-Type: application/json" \
  -d '{"status":"published","title":"Bhat Travels - Your Journey Partner"}' > /dev/null

# Test 4: Create pages
echo "4. Creating website pages..."
curl -s -b /app/memory/test_cookies.txt -X POST http://localhost:3000/api/website/pages \
  -H "Content-Type: application/json" \
  -d '{"title":"Welcome to Bhat Travels","slug":"home","pageType":"home","content":"<p>Explore the world with us!</p>","status":"published"}' > /dev/null

curl -s -b /app/memory/test_cookies.txt -X POST http://localhost:3000/api/website/pages \
  -H "Content-Type: application/json" \
  -d '{"title":"About Us","slug":"about","pageType":"custom","content":"<p>We are a leading travel agency.</p>","status":"published"}' > /dev/null

# Test 5: Test public URL
echo "5. Testing public website URL..."
PUBLIC_URL="http://localhost:3000/site/$SLUG"
echo "   URL: $PUBLIC_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL")
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ SUCCESS: Public website is accessible"
  
  # Verify content
  CONTENT=$(curl -s "$PUBLIC_URL")
  if echo "$CONTENT" | grep -q "Bhat Travels"; then
    echo "   ✅ Content renders correctly"
  else
    echo "   ❌ Content not found"
  fi
  
  if echo "$CONTENT" | grep -q "Welcome to Bhat Travels"; then
    echo "   ✅ Home page content present"
  fi
  
  if echo "$CONTENT" | grep -q "About Us"; then
    echo "   ✅ Navigation shows published pages"
  fi
else
  echo "   ❌ FAILED: Expected 200, got $HTTP_CODE"
fi

# Test 6: Test unpublished website (should 404)
echo ""
echo "6. Testing unpublished website protection..."
curl -s -b /app/memory/test_cookies.txt -X PUT http://localhost:3000/api/website/settings \
  -H "Content-Type: application/json" \
  -d '{"status":"draft"}' > /dev/null

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_URL")
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "404" ]; then
  echo "   ✅ Unpublished websites correctly return 404"
else
  echo "   ❌ Expected 404 for unpublished site, got $HTTP_CODE"
fi

# Test 7: Test invalid slug (should 404)
echo ""
echo "7. Testing invalid slug protection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/site/nonexistent-agency")
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "404" ]; then
  echo "   ✅ Invalid slugs correctly return 404"
else
  echo "   ❌ Expected 404 for invalid slug, got $HTTP_CODE"
fi

# Cleanup
echo ""
echo "8. Cleaning up..."
mongosh "$MONGO_URL" --quiet --eval "
  db.agencies.deleteMany({});
  db.users.deleteMany({});
  db.websiteSettings.deleteMany({});
  db.websitePages.deleteMany({});
" > /dev/null
rm -f /app/memory/test_cookies.txt

echo ""
echo "=== Verification Complete ==="
