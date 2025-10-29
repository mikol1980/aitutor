# Manual Testing Guide: GET /api/profile

## Prerequisites

1. Dev server running: `npm run dev`
2. Valid JWT token from Supabase Auth
3. User account with profile in database

## Getting a Test Token

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Create a test user or select existing user
3. Click "Generate access token" (if available)

### Option 2: Using Authentication Endpoint (if implemented)
```bash
# Login to get token
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

### Option 3: Using Supabase Client Library
```javascript
// In browser console or Node.js
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword123'
});
console.log(data.session.access_token);
```

---

## Test Cases

### ✅ Test 1: Success - Valid Token (200 OK)

**Description:** User provides valid JWT token and receives their profile.

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "login": "student123",
  "email": "student@example.com",
  "has_completed_tutorial": false,
  "created_at": "2025-10-13T10:30:00Z"
}
```

**Expected Status:** `200 OK`

---

### ❌ Test 2: Error - Missing Authorization Header (401)

**Description:** Request without Authorization header is rejected.

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing authentication token"
  }
}
```

**Expected Status:** `401 Unauthorized`

---

### ❌ Test 3: Error - Invalid Token Format (401)

**Description:** Malformed or invalid token is rejected.

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer invalid_token_123" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

**Expected Status:** `401 Unauthorized`

---

### ❌ Test 4: Error - Expired Token (401)

**Description:** Token that has expired (older than 1 hour by default) is rejected.

```bash
# Use an old token that has expired
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer EXPIRED_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

**Expected Status:** `401 Unauthorized`

---

### ❌ Test 5: Error - Empty Bearer Token (401)

**Description:** Authorization header with "Bearer" but no token.

```bash
curl -X GET http://localhost:4321/api/profile \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication token format"
  }
}
```

**Expected Status:** `401 Unauthorized`

---

### ❌ Test 6: Error - Wrong Method (405)

**Description:** Using wrong HTTP method (POST instead of GET).

```bash
curl -X POST http://localhost:4321/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
Astro will return a 404 or method not allowed error (handled by framework).

---

## Testing Checklist

Before marking endpoint as complete, verify:

- [ ] **200 Success**: Valid token returns correct profile data
- [ ] **401 No Token**: Missing Authorization header returns 401
- [ ] **401 Invalid Token**: Malformed token returns 401
- [ ] **401 Expired Token**: Expired token returns 401
- [ ] **Response Format**: All responses follow ApiErrorResponseDTO format
- [ ] **CORS**: Frontend can call endpoint (if testing from browser)
- [ ] **Logging**: Console shows appropriate log messages
- [ ] **RLS**: User can only see their own profile (not others')

---

## Debugging Tips

### Check Server Logs
Look for console output in terminal where dev server is running:
- Info logs: Successful requests
- Warn logs: Authentication failures
- Error logs: Server errors

### Verify Database
Check if profile exists in Supabase:
```sql
SELECT * FROM profiles WHERE email = 'test@example.com';
```

### Verify Token
Decode JWT to check expiration and user ID:
- Use https://jwt.io to decode token
- Check `exp` claim (expiration timestamp)
- Check `sub` claim (user ID)

### Common Issues

**Issue:** Profile not found despite valid token
- **Cause:** Profile wasn't created during user registration
- **Fix:** Verify `handle_new_user()` trigger executed correctly

**Issue:** 401 for valid token
- **Cause:** Token might be from different Supabase project
- **Fix:** Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`

**Issue:** CORS error in browser
- **Cause:** Astro CORS configuration
- **Fix:** Check Astro config for CORS settings

---

## Performance Testing (Optional)

Test endpoint performance under load:

```bash
# Using Apache Bench (ab)
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" \
   http://localhost:4321/api/profile

# Expected results:
# - Mean response time: < 100ms
# - No failed requests
# - Requests per second: > 100
```

---

## Next Steps After Testing

1. ✅ All test cases pass
2. ✅ Logging works correctly
3. ✅ Error messages are user-friendly
4. ✅ RLS policies verified
5. ✅ Performance acceptable

Then proceed to:
- Implement PUT /api/profile (if needed)
- Add endpoint to API documentation
- Deploy to staging environment
- Run tests on staging

