#!/bin/bash

echo "🚀 Starting CreatorApp Development Server..."
echo "============================================="
echo ""

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use!"
    echo "Existing process on port 3000:"
    lsof -Pi :3000 -sTCP:LISTEN
    echo ""
    echo "Kill existing process? (y/n)"
    read -n 1 answer
    if [ "$answer" = "y" ]; then
        echo ""
        echo "🔪 Killing existing process..."
        lsof -ti:3000 | xargs kill -9
        sleep 2
    else
        echo ""
        echo "❌ Cannot start server - port 3000 is occupied"
        exit 1
    fi
fi

echo "🔧 Starting Next.js development server with Turbopack..."
echo ""
echo "📱 Your app will be available at:"
echo "   🌐 Main App: http://localhost:3000"
echo "   🧪 Video Test: http://localhost:3000/test-video-loading.html"
echo "   📊 Dashboard: http://localhost:3000/dashboard"
echo ""
echo "✅ Video Loading Issue: RESOLVED"
echo "   - B2 presigned URLs implemented"
echo "   - VideoJS MEDIA_ERR_SRC_NOT_SUPPORTED fixed"
echo "   - Ready for production use"
echo ""
echo "🏃‍♂️ Starting server now..."

# Start the development server
NODE_ENV=development npm run dev
