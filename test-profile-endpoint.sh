#!/bin/bash

# Test script for GET /api/profile endpoint
# Usage: ./test-profile-endpoint.sh [YOUR_JWT_TOKEN]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:4321/api/profile"
TOKEN="${1:-}"

echo "========================================"
echo "Testing GET /api/profile Endpoint"
echo "========================================"
echo ""

# Test 1: Missing Authorization Header (401)
echo -e "${YELLOW}Test 1: Missing Authorization Header${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
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

# Test 2: Invalid Token Format (401)
echo -e "${YELLOW}Test 2: Invalid Token Format${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
  -H "Authorization: Bearer invalid_token_123" \
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

# Test 3: Empty Bearer Token (401)
echo -e "${YELLOW}Test 3: Empty Bearer Token${NC}"
echo "Expected: 401 Unauthorized"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
  -H "Authorization: Bearer " \
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

# Test 4: Valid Token (200) - only if token provided
if [ -n "$TOKEN" ]; then
  echo -e "${YELLOW}Test 4: Valid Token${NC}"
  echo "Expected: 200 OK with profile data"
  echo ""
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    echo "Profile Data:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  else
    echo -e "${RED}✗ FAIL${NC} - Status: $STATUS_CODE (expected 200)"
    echo "Response: $BODY"
  fi
  echo ""
  echo "----------------------------------------"
  echo ""
else
  echo -e "${YELLOW}Test 4: Valid Token${NC}"
  echo -e "${YELLOW}SKIPPED${NC} - No token provided"
  echo "Run: ./test-profile-endpoint.sh YOUR_JWT_TOKEN"
  echo ""
  echo "----------------------------------------"
  echo ""
fi

echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""
echo "Tests 1-3: Authentication error handling"
if [ -n "$TOKEN" ]; then
  echo "Test 4: Valid token authentication"
else
  echo "Test 4: Skipped (provide token as argument)"
fi
echo ""
echo "To test with a valid token:"
echo "./test-profile-endpoint.sh YOUR_JWT_TOKEN"
echo ""

