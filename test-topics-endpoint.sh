#!/bin/bash

# Test script for Topic API endpoints
# Usage: ./test-topics-endpoint.sh [YOUR_JWT_TOKEN] [TOPIC_ID]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:4321/api"
TOKEN="${1:-}"
TOPIC_ID="${2:-00000000-0000-0000-0000-000000000000}" # Default UUID for testing

echo "========================================"
echo "Testing Topic API Endpoints"
echo "========================================"
echo ""
echo "Base URL: $BASE_URL"
echo "Topic ID: $TOPIC_ID"
echo ""

# ==============================================
# PART 1: GET /api/topics/{topicId}
# ==============================================

echo ""
echo "========================================"
echo "PART 1: GET /api/topics/{topicId}"
echo "========================================"
echo ""

# Test 1.1: Missing Authorization (401)
echo -e "${YELLOW}Test 1.1: Missing Authorization Header${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID" \
  -H "Content-Type: application/json")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$STATUS_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 401)"
fi
echo "Response: $BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 1.2: Invalid UUID Format (400)
echo -e "${YELLOW}Test 1.2: Invalid UUID Format${NC}"
echo "Expected: 400 Bad Request"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/invalid-uuid" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 400)"
  fi
  echo "Response: $BODY"
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 1.3: Topic Not Found (404)
echo -e "${YELLOW}Test 1.3: Topic Not Found${NC}"
echo "Expected: 404 Not Found"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/00000000-0000-0000-0000-000000000099" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "404" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 404)"
  fi
  echo "Response: $BODY"
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 1.4: Valid Request (200)
echo -e "${YELLOW}Test 1.4: Valid Request - Get Topic Details${NC}"
echo "Expected: 200 OK with topic object"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    echo ""
    echo -e "${BLUE}Topic Data:${NC}"
    FORMATTED=$(echo "$BODY" | python3 -m json.tool 2>/dev/null)
    if [ $? -eq 0 ]; then
      echo "$FORMATTED"

      # Validate response structure
      TOPIC_TITLE=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('title', 'N/A'))" 2>/dev/null)
      echo ""
      echo -e "${GREEN}✓${NC} Topic Title: $TOPIC_TITLE"
    else
      echo "$BODY"
    fi
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# ==============================================
# PART 2: GET /api/topics/{topicId}/dependencies
# ==============================================

echo ""
echo "========================================"
echo "PART 2: GET /api/topics/{topicId}/dependencies"
echo "========================================"
echo ""

# Test 2.1: Missing Authorization (401)
echo -e "${YELLOW}Test 2.1: Missing Authorization Header${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/dependencies" \
  -H "Content-Type: application/json")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$STATUS_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 401)"
fi
echo "Response: $BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 2.2: Valid Request (200)
echo -e "${YELLOW}Test 2.2: Valid Request - Get Topic Dependencies${NC}"
echo "Expected: 200 OK with dependencies array"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/dependencies" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    echo ""
    echo -e "${BLUE}Dependencies Data:${NC}"
    FORMATTED=$(echo "$BODY" | python3 -m json.tool 2>/dev/null)
    if [ $? -eq 0 ]; then
      echo "$FORMATTED"

      # Validate response structure
      DEP_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('dependencies', [])))" 2>/dev/null)
      echo ""
      echo -e "${GREEN}✓${NC} Found $DEP_COUNT dependency/dependencies"
    else
      echo "$BODY"
    fi
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# ==============================================
# PART 3: GET /api/topics/{topicId}/content
# ==============================================

echo ""
echo "========================================"
echo "PART 3: GET /api/topics/{topicId}/content"
echo "========================================"
echo ""

# Test 3.1: Missing Authorization (401)
echo -e "${YELLOW}Test 3.1: Missing Authorization Header${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content" \
  -H "Content-Type: application/json")
STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$STATUS_CODE" = "401" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
else
  echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 401)"
fi
echo "Response: $BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 3.2: Invalid Query Parameter - usage_type (400)
echo -e "${YELLOW}Test 3.2: Invalid Query Parameter - usage_type${NC}"
echo "Expected: 400 Bad Request"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content?usage_type=invalid_type" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 400)"
  fi
  echo "Response: $BODY"
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 3.3: Invalid Query Parameter - is_verified (400)
echo -e "${YELLOW}Test 3.3: Invalid Query Parameter - is_verified${NC}"
echo "Expected: 400 Bad Request"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content?is_verified=maybe" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 400)"
  fi
  echo "Response: $BODY"
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 3.4: Valid Request - No Filters (200)
echo -e "${YELLOW}Test 3.4: Valid Request - Get All Content${NC}"
echo "Expected: 200 OK with content array"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    echo ""
    echo -e "${BLUE}Content Data:${NC}"
    FORMATTED=$(echo "$BODY" | python3 -m json.tool 2>/dev/null)
    if [ $? -eq 0 ]; then
      echo "$FORMATTED"

      # Validate response structure
      CONTENT_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('content', [])))" 2>/dev/null)
      echo ""
      echo -e "${GREEN}✓${NC} Found $CONTENT_COUNT content item(s)"
    else
      echo "$BODY"
    fi
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 3.5: Valid Request - Filter by usage_type=explanation (200)
echo -e "${YELLOW}Test 3.5: Valid Request - Filter by usage_type=explanation${NC}"
echo "Expected: 200 OK with filtered content"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content?usage_type=explanation" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    CONTENT_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('content', [])))" 2>/dev/null)
    echo -e "${GREEN}✓${NC} Found $CONTENT_COUNT explanation content item(s)"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 3.6: Valid Request - Filter by is_verified=true (200)
echo -e "${YELLOW}Test 3.6: Valid Request - Filter by is_verified=true${NC}"
echo "Expected: 200 OK with verified content only"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content?is_verified=true" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    CONTENT_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('content', [])))" 2>/dev/null)
    echo -e "${GREEN}✓${NC} Found $CONTENT_COUNT verified content item(s)"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# Test 3.7: Valid Request - Combined Filters (200)
echo -e "${YELLOW}Test 3.7: Valid Request - Combined Filters${NC}"
echo "Expected: 200 OK with filtered content"
echo ""
if [ -n "$TOKEN" ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/topics/$TOPIC_ID/content?usage_type=exercise&is_verified=true" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    CONTENT_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('content', [])))" 2>/dev/null)
    echo -e "${GREEN}✓${NC} Found $CONTENT_COUNT verified exercise(s)"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
else
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
fi
echo ""
echo "----------------------------------------"
echo ""

# ==============================================
# SUMMARY
# ==============================================

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo "PART 1: GET /api/topics/{topicId}"
echo "  - Test 1.1: Missing auth (401)"
echo "  - Test 1.2: Invalid UUID (400)"
echo "  - Test 1.3: Not found (404)"
echo "  - Test 1.4: Valid request (200)"
echo ""
echo "PART 2: GET /api/topics/{topicId}/dependencies"
echo "  - Test 2.1: Missing auth (401)"
echo "  - Test 2.2: Valid request (200)"
echo ""
echo "PART 3: GET /api/topics/{topicId}/content"
echo "  - Test 3.1: Missing auth (401)"
echo "  - Test 3.2: Invalid usage_type (400)"
echo "  - Test 3.3: Invalid is_verified (400)"
echo "  - Test 3.4: All content (200)"
echo "  - Test 3.5: Filter by usage_type (200)"
echo "  - Test 3.6: Filter by is_verified (200)"
echo "  - Test 3.7: Combined filters (200)"
echo ""

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}Note: Most tests were skipped. Provide token and topic ID:${NC}"
  echo "./test-topics-endpoint.sh YOUR_JWT_TOKEN YOUR_TOPIC_ID"
  echo ""
  echo "To get a JWT token:"
  echo "1. Start the dev server: npm run dev"
  echo "2. Login via /auth/login page or use /api/auth/login endpoint"
  echo "3. Extract access_token from response or browser cookies"
  echo ""
  echo "To get a valid topic ID:"
  echo "1. Call GET /api/sections to get section list"
  echo "2. Call GET /api/sections/{sectionId}/topics to get topics"
  echo "3. Use a topic ID from the response"
else
  echo -e "${GREEN}All tests completed!${NC}"
fi
echo ""
