export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Student Portal Demo</h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">A simple integrated web app using Supabase and Vercel.</p>

        {/* Button */}
        <a href="/login">
          <button className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded transition duration-200">
            Get Started
          </button>
        </a>
      </div>
    </div>
  );
}
