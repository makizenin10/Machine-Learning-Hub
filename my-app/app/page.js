export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-purple-300 p-8 rounded-lg shadow-md max-w-md">
        {/* Title */}
        <h1 className="text-3xl font-bold text-black mb-4">Student Portal Demo</h1>

        {/* Description */}
        <p className="text-black mb-6">A simple integrated web app using Supabase and Vercel.</p>

        {/* Button */}
        <a href="/login">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200">
            Get Started
          </button>
        </a>
      </div>
    </div>
  );
}
