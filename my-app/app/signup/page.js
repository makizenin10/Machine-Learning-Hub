"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim() || !age.trim() || !contactNumber.trim()) {
      setMessage("Please fill in all fields before signing up.");
      return;
    }

    setLoading(true);
    setMessage("Processing signup...");

    const { data, error: authError } = await supabase.auth.signUp({ 
      email, 
      password 
    });

    if (authError) {
      setMessage(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setMessage("Finalizing account... please wait.");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email,
          full_name: fullName,
          age: parseInt(age),
          contact_number: contactNumber,
          role: 'user'
        }]);

      if (profileError) {
        console.error("Profile Error Detail:", profileError);
        setMessage("Signup successful but profile save failed: " + profileError.message);
      } else {
        setMessage("Sign up successful! You can now log in.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-card">
        <h1 className="signup-title">Sign Up</h1>

        <div className="input-group">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="signup-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="signup-input" />
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="signup-input" />
          <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} className="signup-input" />
          <input type="tel" placeholder="Contact Number (11 digits)" value={contactNumber} 
            onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))} maxLength={11} className="signup-input" />
        </div>

        <button onClick={handleSignUp} disabled={loading} className="signup-btn">
          {loading ? "Please wait..." : "Create Account"}
        </button>

        <p className={`status-text ${message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </p>
        
        <p className="footer-text">
          Already have an account? <Link href="/login" className="login-link">Login here</Link>
        </p>
        
        <Link href="/" className="home-link">
          ← Back to Home
        </Link>
      </div>

      <style jsx>{`
        .signup-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6 url("https://www.transparenttextures.com/patterns/circuit-board.png");
          padding: 20px;
        }
        .signup-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          maxWidth: 400px;
          boxShadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .signup-title {
          font-size: 32px;
          font-weight: 900;
          color: #a855f7;
          margin-bottom: 25px;
          letter-spacing: -1px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .signup-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .signup-input:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
        }
        .signup-btn {
          width: 100%;
          padding: 14px;
          border: none;
          background: #a855f7;
          color: white;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          font-size: 16px;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
        }
        .signup-btn:hover:not(:disabled) {
          background: #9333ea;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(168, 85, 247, 0.4);
        }
        .signup-btn:disabled {
          background: #d8b4fe;
          cursor: not-allowed;
        }
        .status-text {
          margin-top: 15px;
          font-size: 14px;
          font-weight: 600;
        }
        .status-text.error { color: #ef4444; }
        .status-text.success { color: #10b981; }
        .footer-text {
          font-size: 14px;
          margin-top: 20px;
          color: #4b5563;
        }
        .login-link {
          color: #6366f1;
          font-weight: 700;
          text-decoration: none;
        }
        .home-link {
          display: block;
          margin-top: 20px;
          font-size: 13px;
          color: #9ca3af;
          text-decoration: none;
          transition: color 0.2s;
        }
        .home-link:hover { color: #6b7280; }
      `}</style>
    </div>
  );
}