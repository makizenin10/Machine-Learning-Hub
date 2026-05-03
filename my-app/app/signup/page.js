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
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !fullName.trim() || !age.trim() || !contactNumber.trim()) {
      setMessage("Please fill in all fields before signing up.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    const ageValue = parseInt(age, 10);
    if (Number.isNaN(ageValue) || ageValue <= 0) {
      setMessage("Please enter a valid age.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setMessage("Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.");
      return;
    }

    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(contactNumber)) {
      setMessage("Contact number must be exactly 11 digits.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      if (data.user) {
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
          setMessage("Signup successful but profile save failed: " + profileError.message);
        } else {
          setMessage("Sign up successful! Check your email for confirmation.");
        }
      } else {
        setMessage("Sign up successful! Check your email for confirmation.");
      }
    }
  };

  const inputStyle = { width: '100%', padding: '8px', margin: '8px 0', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(6px)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Sign Up</h1>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />

        {/* Password with show/hide */}
        <div style={{ position: 'relative', margin: '8px 0' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', paddingRight: '40px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            required
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} required />
        <input type="tel" placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))} maxLength={11} style={inputStyle} required />

        <button onClick={handleSignUp}
          style={{ width: '100%', padding: '8px', marginTop: '8px', border: 'none', background: '#a855f7', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          Sign Up
        </button>

        <p style={{ marginTop: '10px', fontSize: '14px', color: '#ef4444' }}>{message}</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>Already have an account? <Link href="/login" style={{ color: '#3039bc' }}>Login here</Link></p>
        <Link href="/" style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginTop: '8px', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}