#!/bin/bash

# Test script for GET /api/sessions/{sessionId} endpoint
# This script tests various scenarios including authentication, authorization, and error cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "======================================================================"
echo "Testing GET /api/sessions/{sessionId} Endpoint"
echo "======================================================================"
echo ""

# Function to print test result
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
  fi
  echo ""
}

# Function to extract access token from cookies
extract_token() {
  echo "$1" | grep -oP 'sb-access-token=\K[^;]+'
}

echo "----------------------------------------------------------------------"
echo "Setup: Logging in to get authentication token"
echo "----------------------------------------------------------------------"

# Login to get authentication token
LOGIN_RESPONSE=$(curl -s -c cookies.txt -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}Login successful${NC}"
  ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.session.access_token')
  USER_ID=$(echo "$RESPONSE_BODY" | jq -r '.user.id')
  echo "User ID: $USER_ID"
else
  echo -e "${RED}Login failed. Please ensure you have a test user created.${NC}"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 1: Valid sessionId with authentication and authorization
echo "----------------------------------------------------------------------"
echo "Test 1: GET /api/sessions/{validSessionId} with valid auth (should return 200 or 404)"
echo "----------------------------------------------------------------------"

# Note: Replace with actual session ID from your database
# For this test to return 200, the session must exist and belong to the authenticated user
TEST_SESSION_ID="550e8400-e29b-41d4-a716-446655440000"

RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies.txt "$API_URL/sessions/$TEST_SESSION_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
  print_result 0 "Valid session returned successfully"
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${YELLOW}Note: Session not found (expected if test data not present)${NC}"
  print_result 0 "404 returned for non-existent session"
else
  print_result 1 "Unexpected status code: $HTTP_CODE"
fi

# Test 2: Invalid UUID format
echo "----------------------------------------------------------------------"
echo "Test 2: GET /api/sessions/{invalidUuid} (should return 400)"
echo "----------------------------------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies.txt "$API_URL/sessions/not-a-valid-uuid")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "400" ]; then
  ERROR_CODE=$(echo "$RESPONSE_BODY" | jq -r '.error.code')
  if [ "$ERROR_CODE" = "INVALID_INPUT" ]; then
    print_result 0 "Invalid UUID format rejected with 400"
  else
    print_result 1 "Expected error code INVALID_INPUT, got: $ERROR_CODE"
  fi
else
  print_result 1 "Expected 400, got: $HTTP_CODE"
fi

# Test 3: Missing authentication
echo "----------------------------------------------------------------------"
echo "Test 3: GET /api/sessions/{sessionId} without authentication (should return 401)"
echo "----------------------------------------------------------------------"

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/sessions/$TEST_SESSION_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "401" ]; then
  ERROR_CODE=$(echo "$RESPONSE_BODY" | jq -r '.error.code')
  if [ "$ERROR_CODE" = "UNAUTHORIZED" ]; then
    print_result 0 "Unauthenticated request rejected with 401"
  else
    print_result 1 "Expected error code UNAUTHORIZED, got: $ERROR_CODE"
  fi
else
  print_result 1 "Expected 401, got: $HTTP_CODE"
fi

# Test 4: Session belonging to another user (403)
# Note: This requires having a session that belongs to a different user
echo "----------------------------------------------------------------------"
echo "Test 4: GET /api/sessions/{otherUserSessionId} (should return 403 or 404)"
echo "----------------------------------------------------------------------"

# Replace with a session ID that belongs to another user
OTHER_USER_SESSION_ID="650e8400-e29b-41d4-a716-446655440001"

RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies.txt "$API_URL/sessions/$OTHER_USER_SESSION_ID")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "403" ]; then
  ERROR_CODE=$(echo "$RESPONSE_BODY" | jq -r '.error.code')
  if [ "$ERROR_CODE" = "FORBIDDEN" ]; then
    print_result 0 "Forbidden access rejected with 403"
  else
    print_result 1 "Expected error code FORBIDDEN, got: $ERROR_CODE"
  fi
elif [ "$HTTP_CODE" = "404" ]; then
  echo -e "${YELLOW}Note: 404 returned (session doesn't exist or service role key not configured)${NC}"
  print_result 0 "404 returned (acceptable if no test data)"
else
  print_result 1 "Expected 403 or 404, got: $HTTP_CODE"
fi

# Cleanup
rm -f cookies.txt

echo "======================================================================"
echo "Test Suite Completed"
echo "======================================================================"
echo ""
echo -e "${YELLOW}Note:${NC} Some tests may show 404 if test data is not present in the database."
echo "To fully test the endpoint, ensure you have:"
echo "  1. A test user account"
echo "  2. Sessions in the database belonging to that user"
echo "  3. Sessions belonging to other users (for 403 test)"
echo "  4. SUPABASE_SERVICE_ROLE_KEY configured in .env"
