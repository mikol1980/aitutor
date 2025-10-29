#!/bin/bash

# Test script for GET /api/sections endpoint
# Usage: ./test-sections-endpoint.sh [YOUR_JWT_TOKEN]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:4321/api/sections"
TOKEN="${1:-}"

echo "========================================"
echo "Testing GET /api/sections Endpoint"
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
  echo "Expected: 200 OK with sections array"
  echo ""
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Status: $STATUS_CODE"
    echo ""
    echo -e "${BLUE}Sections Data:${NC}"

    # Pretty print JSON and extract section count
    FORMATTED=$(echo "$BODY" | python3 -m json.tool 2>/dev/null)
    if [ $? -eq 0 ]; then
      echo "$FORMATTED"

      # Validate response structure
      HAS_SECTIONS=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print('sections' in data)" 2>/dev/null)
      if [ "$HAS_SECTIONS" = "True" ]; then
        SECTION_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('sections', [])))" 2>/dev/null)
        echo ""
        echo -e "${GREEN}✓${NC} Response has 'sections' array"
        echo -e "${GREEN}✓${NC} Found $SECTION_COUNT section(s)"

        # Check if sections are ordered by display_order
        if [ "$SECTION_COUNT" -gt 0 ]; then
          FIRST_SECTION=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); s=data['sections'][0]; print(f\"Title: {s.get('title', 'N/A')}, Order: {s.get('display_order', 'N/A')}\")" 2>/dev/null)
          echo -e "${BLUE}First section:${NC} $FIRST_SECTION"
        fi
      else
        echo ""
        echo -e "${RED}✗${NC} Response missing 'sections' array"
      fi
    else
      echo "$BODY"
    fi
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
  echo "Run: ./test-sections-endpoint.sh YOUR_JWT_TOKEN"
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
  echo "Test 4: Valid token authentication + data validation"
else
  echo "Test 4: Skipped (provide token as argument)"
fi
echo ""
echo "To test with a valid token:"
echo "./test-sections-endpoint.sh YOUR_JWT_TOKEN"
echo ""
echo "Note: To get a JWT token:"
echo "1. Start the dev server: npm run dev"
echo "2. Login via /auth/login page or use /api/auth/login endpoint"
echo "3. Extract access_token from response or browser cookies"
echo ""
