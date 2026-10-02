#!/bin/bash

# Create and test
curl -s -X POST http://localhost:3000/api/auth/register-agency \
  -H "Content-Type: application/json" \
  -d '{"agencyName":"Quick Test Travel","name":"Test Admin","email":"test@quick.com","password":"pass123"}' > /tmp/reg.json

SLUG=$(cat /tmp/reg.json | grep -oP '(?<="slug":")[^"]+')
echo "Created agency with slug: $SLUG"

# Login and create website
curl -s -c /tmp/c.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@quick.com","password":"pass123"}' > /dev/null

curl -s -b /tmp/c.txt -X PUT http://localhost:3000/api/website/settings \
  -H "Content-Type: application/json" \
  -d '{"status":"published","title":"Quick Test"}' > /dev/null

curl -s -b /tmp/c.txt -X POST http://localhost:3000/api/website/pages \
  -H "Content-Type: application/json" \
  -d '{"title":"Home","slug":"home","pageType":"home","content":"<p>Hello World</p>","status":"published"}' > /dev/null

# Test public route
echo "Testing: http://localhost:3000/site/$SLUG"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/site/$SLUG")
echo "Status: $STATUS"

if [ "$STATUS" = "200" ]; then
  echo "✅ SUCCESS!"
  curl -s "http://localhost:3000/site/$SLUG" | grep -o '<title>[^<]*</title>'
else
  echo "❌ FAILED"
fi

# Cleanup
mongosh "$MONGO_URL" --quiet --eval "db.agencies.deleteOne({slug:'$SLUG'}); db.users.deleteMany({email:'test@quick.com'}); db.websiteSettings.deleteMany({}); db.websitePages.deleteMany({});" > /dev/null
rm -f /tmp/c.txt /tmp/reg.json
