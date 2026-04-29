"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    // Block admins from using user login
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      await supabase.auth.signOut();
      setMessage('You are an admin. Please use the Admin Login page.');
      return;
    }

    router.push("/dashboard");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("Please enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset email sent! Check your email.");
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <button onClick={handleForgotPassword} style={{ background: '#6b7280' }}>
        Forgot Password?
      </button>

      <p>{message}</p>

      <p>Don't have an account? <Link href="/signup">Sign up here</Link></p>

      <style jsx>{`
        h1 { font-size: 24px; font-weight: bold; }
        .container {
          max-width: 300px;
          margin: 100px auto;
          text-align: center;
          font-family: Arial, sans-serif;
        }
        input {
          width: 100%;
          padding: 8px;
          margin: 8px 0;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          border: none;
          background: #a855f7;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        p { margin-top: 10px; font-size: 14px; }
      `}</style>
    </div>
  );
}