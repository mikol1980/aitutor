#!/bin/bash

# ============================================================================
# Test script for GET /api/user-progress endpoint
# ============================================================================
# This script tests various scenarios for the user progress endpoint.
#
# Prerequisites:
# - Local development server running (npm run dev)
# - Valid authentication token (login first to get token from cookies)
#
# Usage:
#   1. Start dev server: npm run dev
#   2. Login via browser to get authentication cookies
#   3. Extract access token from browser cookies (sb-access-token)
#   4. Set TOKEN variable below
#   5. Run: bash test-user-progress-endpoint.sh
# ============================================================================

# Configuration
BASE_URL="http://localhost:3000"
TOKEN="${SUPABASE_ACCESS_TOKEN:-YOUR_TOKEN_HERE}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test result
print_result() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"

  if [ "$expected_status" == "$actual_status" ]; then
    echo -e "${GREEN}✓ PASS${NC}: $test_name (Status: $actual_status)"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}: $test_name (Expected: $expected_status, Got: $actual_status)"
    ((TESTS_FAILED++))
  fi
}

# Helper function to print section header
print_section() {
  echo ""
  echo "========================================================================"
  echo "$1"
  echo "========================================================================"
}

# Check if TOKEN is set
if [ "$TOKEN" == "YOUR_TOKEN_HERE" ]; then
  echo -e "${RED}ERROR${NC}: Please set SUPABASE_ACCESS_TOKEN environment variable"
  echo "Example: export SUPABASE_ACCESS_TOKEN='your-token-here'"
  exit 1
fi

# ============================================================================
# TEST 1: Unauthorized request (no token)
# ============================================================================
print_section "TEST 1: Unauthorized request (no token)"
echo "Request: GET $BASE_URL/api/user-progress"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/user-progress")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY"
print_result "Unauthorized request" "401" "$STATUS"

# ============================================================================
# TEST 2: Authorized request without filters
# ============================================================================
print_section "TEST 2: Authorized request without filters"
echo "Request: GET $BASE_URL/api/user-progress"
echo "Headers: Cookie: sb-access-token=$TOKEN"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Authorized request without filters" "200" "$STATUS"

# ============================================================================
# TEST 3: Filter by invalid section_id (not UUID)
# ============================================================================
print_section "TEST 3: Filter by invalid section_id (not UUID)"
echo "Request: GET $BASE_URL/api/user-progress?section_id=invalid-uuid"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress?section_id=invalid-uuid")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Invalid section_id" "400" "$STATUS"

# ============================================================================
# TEST 4: Filter by invalid status
# ============================================================================
print_section "TEST 4: Filter by invalid status"
echo "Request: GET $BASE_URL/api/user-progress?status=invalid_status"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress?status=invalid_status")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Invalid status" "400" "$STATUS"

# ============================================================================
# TEST 5: Filter by valid status (completed)
# ============================================================================
print_section "TEST 5: Filter by valid status (completed)"
echo "Request: GET $BASE_URL/api/user-progress?status=completed"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress?status=completed")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Valid status filter" "200" "$STATUS"

# ============================================================================
# TEST 6: Filter by valid status (in_progress)
# ============================================================================
print_section "TEST 6: Filter by valid status (in_progress)"
echo "Request: GET $BASE_URL/api/user-progress?status=in_progress"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress?status=in_progress")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Valid status filter (in_progress)" "200" "$STATUS"

# ============================================================================
# TEST 7: Filter by valid status (not_started)
# ============================================================================
print_section "TEST 7: Filter by valid status (not_started)"
echo "Request: GET $BASE_URL/api/user-progress?status=not_started"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Cookie: sb-access-token=$TOKEN" \
  "$BASE_URL/api/user-progress?status=not_started")
STATUS=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Response Status: $STATUS"
echo "Response Body: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
print_result "Valid status filter (not_started)" "200" "$STATUS"

# ============================================================================
# TEST 8: Combined filters (section_id + status)
# ============================================================================
print_section "TEST 8: Combined filters (section_id + status)"
echo "Note: This test requires a valid section_id from your database"
echo "Skipping - please manually test with a valid UUID"

# ============================================================================
# Summary
# ============================================================================
print_section "TEST SUMMARY"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed!${NC}"
  exit 1
fi
