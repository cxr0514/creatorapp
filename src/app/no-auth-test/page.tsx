export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Test Page</h1>
        <div className="bg-green-100 p-4 rounded-lg">
          <p>✅ This page loads without any authentication logic.</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
        <div className="mt-6">
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
