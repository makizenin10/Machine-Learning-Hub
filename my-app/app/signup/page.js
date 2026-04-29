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
    // 1. Validation
    if (!email.trim() || !password.trim() || !fullName.trim() || !age.trim() || !contactNumber.trim()) {
      setMessage("Please fill in all fields before signing up.");
      return;
    }

    setLoading(true);
    setMessage("Processing signup...");

    // 2. Auth Signup
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
      // 3. THE FIX: Wait 1.5 seconds for the Auth user to be recognized by the DB
      setMessage("Finalizing account... please wait.");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 4. Profile Insertion
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

  const inputStyle = { 
    width: '100%', 
    padding: '10px', 
    margin: '8px 0', 
    border: '1px solid #ddd', 
    borderRadius: '6px', 
    boxSizing: 'border-box' 
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f3f4f6 url("https://www.transparenttextures.com/patterns/circuit-board.png")'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#a855f7', marginBottom: '20px' }}>Sign Up</h1>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
        <input type="tel" placeholder="Contact Number (11 digits)" value={contactNumber} 
          onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))} maxLength={11} style={inputStyle} />

        <button 
          onClick={handleSignUp}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginTop: '15px', 
            border: 'none', 
            background: loading ? '#d8b4fe' : '#a855f7', 
            color: 'white', 
            borderRadius: '8px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: '0.2s'
          }}>
          {loading ? "Please wait..." : "Create Account"}
        </button>

        <p style={{ marginTop: '15px', fontSize: '14px', color: message.includes('failed') ? '#ef4444' : '#10b981', fontWeight: '500' }}>
          {message}
        </p>
        
        <p style={{ fontSize: '14px', marginTop: '12px', color: '#4b5563' }}>
          Already have an account? <Link href="/login" style={{ color: '#6366f1', fontWeight: 'bold' }}>Login here</Link>
        </p>
        
        <Link href="/" style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginTop: '15px', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}