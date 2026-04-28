"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Sign up successful! Check your email.");
    }
  };

  return (
    <div className="container">
      <h1>Sign Up</h1>

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

      <button onClick={handleSignUp}>Sign Up</button>

      <p>{message}</p>

      <p>Already have an account? <Link href="/login">Login here</Link></p>

      <style jsx>{`
        h1{
          font-size: 24px;
          font-weight: bold;
        }
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
          background: #3039bc;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }

        p {
          margin-top: 10px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}