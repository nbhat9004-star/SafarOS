# Google Places API Debugging Guide

## 🔍 Enhanced Logging Added

Detailed logging has been added to help diagnose why searches return 0 results.

---

## 📊 What to Check

### **1. View Server Logs**

**Check Next.js logs**:
```bash
tail -f /var/log/supervisor/nextjs.out.log
```

Or in Docker/Container:
```bash
docker logs -f <container-name>
```

### **2. Test Connection**

Navigate to: **AI Marketplace Builder → Settings**
1. Enter your Google Places API key
2. Click "Test Connection"
3. Check the logs for detailed output

**Expected Log Output**:
```
=== GOOGLE PLACES API TEST CONNECTION ===
API Key (first 10 chars): AIzaSyBm0T...
Test URL: https://places.googleapis.com/v1/places:searchText
Request Body: { "textQuery": "restaurants in Kashmir" }
Response Status: 200 OK
Response Data: { "places": [...] }
✅ Test connection successful! Found 20 places
```

**If you see errors**, the logs will show:
- Exact error message from Google
- Error status code
- Whether billing is required
- Whether API is enabled

### **3. Run a Search**

Navigate to: **AI Marketplace Builder → Discover & Import**
1. Search for: "hotels"
2. City: "Srinagar"
3. Check the logs

**Expected Log Output**:
```
=== GOOGLE PLACES API REQUEST ===
Full Query: hotels in Srinagar
API Key (first 10 chars): AIzaSyBm0T...
Request URL: https://places.googleapis.com/v1/places:searchText
Request Body: {
  "textQuery": "hotels in Srinagar",
  "pageSize": 20
}
Response Status: 200 OK
=== GOOGLE PLACES API RESPONSE ===
Full Response: {
  "places": [
    {
      "id": "places/ChIJ...",
      "displayName": {...},
      ...
    }
  ]
}
Number of places found: 20
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: Billing Not Enabled**

**Error in logs**:
```
Error Status: BILLING_NOT_ENABLED
Error Message: This API call requires billing to be enabled
```

**Solution**:
1. Go to: https://console.cloud.google.com/billing
2. Link a billing account to your project
3. Note: Google provides $200 free credit per month for Maps Platform APIs

---

### **Issue 2: API Not Enabled**

**Error in logs**:
```
Error Status: PERMISSION_DENIED
Error Message: Places API (New) is not enabled
```

**Solution**:
1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Click "Enable"
3. Wait 1-2 minutes for propagation

---

### **Issue 3: Invalid API Key**

**Error in logs**:
```
Error Status: INVALID_ARGUMENT
Error Message: API key not valid
```

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Check your API key restrictions
3. Ensure API key is valid and not expired
4. Remove any unnecessary restrictions (IP, referrer, etc.) for testing

---

### **Issue 4: API Key Restrictions**

**Error in logs**:
```
Error Status: PERMISSION_DENIED
Error Message: API key restrictions
```

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under "API restrictions", select "Don't restrict key" (for testing)
4. Or add "Places API (New)" to allowed APIs

---

### **Issue 5: Zero Results (No Error)**

**Log shows**:
```
Response Status: 200 OK
Number of places found: 0
```

**Possible reasons**:
1. Search query too specific
2. No businesses found in that location
3. Try broader searches like "restaurants" or "hotels"
4. Try common cities like "Mumbai", "Delhi", "New York"

**Solution**:
- Try: "restaurants" (no city)
- Try: "hotels in Mumbai"
- Try: "tourist attractions in New Delhi"

---

## 🧪 Testing Steps

### **Step 1: Verify API is Enabled**

```bash
# Check if Places API (New) is enabled
# Go to: https://console.cloud.google.com/apis/dashboard
# Look for "Places API (New)" in enabled APIs list
```

### **Step 2: Verify Billing**

```bash
# Check if billing is enabled
# Go to: https://console.cloud.google.com/billing
# Ensure a billing account is linked
# Note: $200/month free credit is available
```

### **Step 3: Test with curl**

You can test the API directly:

```bash
curl -X POST \
  'https://places.googleapis.com/v1/places:searchText' \
  -H 'Content-Type: application/json' \
  -H 'X-Goog-Api-Key: YOUR_API_KEY' \
  -H 'X-Goog-FieldMask: places.displayName,places.id' \
  -d '{
    "textQuery": "restaurants in Kashmir"
  }'
```

**Expected response**:
```json
{
  "places": [
    {
      "id": "places/ChIJ...",
      "displayName": {
        "text": "Restaurant Name",
        "languageCode": "en"
      }
    }
  ]
}
```

**If billing not enabled**:
```json
{
  "error": {
    "code": 403,
    "message": "This API call requires billing to be enabled. Enable billing at https://console.cloud.google.com/billing",
    "status": "PERMISSION_DENIED"
  }
}
```

**If API not enabled**:
```json
{
  "error": {
    "code": 403,
    "message": "Places API (New) has not been used in project before or it is disabled.",
    "status": "PERMISSION_DENIED"
  }
}
```

---

## 📝 What the Logs Show

### **Request Details**:
- ✅ Full search query
- ✅ API key (first 10 characters only)
- ✅ Request URL
- ✅ Request headers
- ✅ Request body

### **Response Details**:
- ✅ HTTP status code
- ✅ Full response JSON
- ✅ Number of places found
- ✅ Error messages (if any)
- ✅ Error status codes
- ✅ Specific billing/API messages

### **Helpful Error Messages**:
The code now automatically detects:
- ❌ Invalid API key → Clear message
- ❌ API not enabled → Link to enable page
- ❌ Billing not enabled → Link to billing page
- ❌ Other errors → Full error details

---

## 🎯 Next Steps

1. **Enable Detailed Logging**:
   - Logs are already enabled in the code
   - Just run a test or search
   - Check `/var/log/supervisor/nextjs.out.log`

2. **Run Test Connection**:
   - Go to Settings
   - Click "Test Connection"
   - Read the error message carefully

3. **Check Google Cloud Console**:
   - Verify "Places API (New)" is enabled
   - Verify billing is enabled
   - Check API key restrictions

4. **Share Logs**:
   - Copy the full log output from the console
   - Look for lines starting with `===`
   - Share the error details for further diagnosis

---

## 📚 Google Cloud Console Links

- **Enable Places API (New)**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- **Enable Billing**: https://console.cloud.google.com/billing
- **API Credentials**: https://console.cloud.google.com/apis/credentials
- **API Dashboard**: https://console.cloud.google.com/apis/dashboard
- **Free Credit Info**: https://cloud.google.com/free/docs/free-cloud-features#free-tier

---

## 💡 Important Notes

1. **Billing is Required**: Google requires billing to be enabled for Places API (New), even for free tier usage
2. **Free Credits**: Google provides $200/month in free credits for Maps Platform APIs
3. **API Key**: Same API key works for both legacy and new Places API
4. **Enable Process**: Can take 1-2 minutes for API enablement to propagate
5. **Restrictions**: For testing, remove all API key restrictions temporarily

---

## ✅ Verification Checklist

Before reporting the issue, verify:

- [ ] Places API (New) is enabled in Google Cloud Console
- [ ] Billing account is linked to the project
- [ ] API key is valid and not expired
- [ ] No restrictive API key limitations
- [ ] Logs show detailed request/response information
- [ ] Error messages are clear and specific

---

**With these enhanced logs, you'll see exactly what Google's API is returning and why searches might be returning 0 results!**
