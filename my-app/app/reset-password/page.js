"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkResetLink = async () => {
      if (typeof window === "undefined") return;
      
      // Parse tokens from URL (Supabase sends these after clicking the email link)
      const params = new URLSearchParams(window.location.search);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error || !data?.session) {
          setMessage("Invalid or expired reset link. Please request a new one.");
          return;
        }
      }
    };
    checkResetLink();
  }, []);

  const handleResetPassword = async () => {
    setMessage(""); // Clear previous messages
    setIsSuccess(false);

    // 1. Check if passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    // 2. Strong Password Validation
    // Requirements: 8+ chars, Uppercase, Lowercase, Number, Special Char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage("Password must be 8+ characters with uppercase, lowercase, number, and symbol.");
      return;
    }

    // 3. Update Password in Supabase
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setIsSuccess(true);
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="container">
        <h1>Reset Password</h1>

        <div className="input-group">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button onClick={handleResetPassword}>Update Password</button>

        {message && (
          <p className={`message ${isSuccess ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <div className="footer-links">
          <a href="/login">← Back to Login</a>
        </div>
      </div>

      <style jsx>{`
        .main-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url('/circuit-bg.png'); 
          background-size: cover;
          background-position: center;
          padding: 20px;
        }

        .container {
          background: rgba(255, 255, 255, 0.98);
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 400px;
          text-align: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        h1 {
          font-size: 26px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #111;
        }

        .subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 24px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        input {
          width: 100%;
          padding: 12px 15px;
          margin: 8px 0;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fcfcfc;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }

        input:focus {
          border-color: #a855f7;
        }

        button {
          width: 100%;
          padding: 13px;
          background: #a855f7;
          color: white;
          font-weight: 600;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        button:hover {
          background: #9333ea;
        }

        .message {
          margin-top: 18px;
          font-size: 14px;
          padding: 10px;
          border-radius: 6px;
        }

        .message.error {
          color: #dc2626;
          background: #fee2e2;
        }

        .message.success {
          color: #16a34a;
          background: #dcfce7;
        }

        .footer-links {
          margin-top: 25px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }

        .footer-links a {
          font-size: 14px;
          color: #777;
          text-decoration: none;
        }

        .footer-links a:hover {
          color: #a855f7;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}