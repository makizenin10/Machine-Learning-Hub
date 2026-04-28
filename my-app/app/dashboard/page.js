"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <button onClick={handleLogout}>Logout</button>

      <style jsx>{`
        h1 {
          font-size: 24px;
          font-weight: bold;
        }
        .container {
          max-width: 600px;
          margin: 100px auto;
          text-align: center;
          font-family: Arial, sans-serif;
        }

        button {
          padding: 8px 16px;
          margin-top: 16px;
          border: none;
          background: #a855f7;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        p {
          margin-top: 10px;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}