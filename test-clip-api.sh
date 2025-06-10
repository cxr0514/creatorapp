#!/bin/bash

# Simple test for clip creation endpoint
echo "Testing clip creation endpoint..."

# First, check what videos exist
echo "=== Checking existing videos ==="
curl -s "http://localhost:3000/api/videos" | jq '.' || echo "No JSON or jq not available"

echo -e "\n=== Checking existing clips ==="
curl -s "http://localhost:3000/api/clips" | jq '.' || echo "No JSON or jq not available"

echo -e "\n=== Testing clip creation (this will fail without auth, but we can see the debug logs) ==="
curl -X POST "http://localhost:3000/api/clips" \
  -F "videoId=1" \
  -F "title=Test Clip" \
  -F "description=Test clip for debugging" \
  -F "hashtags=test,debug" \
  -F "tags=testing" \
  -F "startTime=5" \
  -F "endTime=15" \
  -F "aspectRatio=16:9" \
  -F "clipCount=1" \
  -v

echo -e "\nCheck the Next.js development server logs for debug output."
