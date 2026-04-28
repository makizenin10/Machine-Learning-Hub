"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkResetLink = async () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      if (type === "recovery" && access_token && refresh_token && supabase.auth.setSession) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error || !data?.session) {
          setMessage("Invalid or expired reset link. Please request a new password reset.");
          return;
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage("Invalid or expired reset link. Please request a new password reset.");
      }
    };
    checkResetLink();
  }, []);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setMessage("No valid session found. Use the reset link sent to your email.");
      return;
    }

    if (!userData.user.email && !userData.user.phone) {
      setMessage("Password reset is not allowed for anonymous users. Please request a password reset using a registered email account.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully! You can now log in.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div className="container">
      <h1>Reset Password</h1>

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

      <button onClick={handleResetPassword}>Update Password</button>

      <p>{message}</p>

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
          background: #a855f7;
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