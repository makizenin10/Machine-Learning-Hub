export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center bg-white-800 p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-3xl font-bold text-black mb-4">Student Portal Demo</h1>
        <p className="text-black mb-6">A simple integrated web app using Supabase and Vercel.</p>

        <div className="flex flex-col gap-4">
          <a href="/login">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200">
              User Login/Signup
            </button>
          </a>
          <a href="/admin-login">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition duration-200">
              Admin Login
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}