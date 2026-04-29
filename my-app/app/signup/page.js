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

  const handleSignUp = async () => {
    // Check if all required fields are filled
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      // Save additional info to profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email,
              full_name: fullName,
              age: parseInt(age),
              contact_number: contactNumber,
              role: 'user'
            }
          ]);

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

  return (
    <div className="container">
      <h1>Sign Up</h1>
      <Link href="/" className="back-link">← Back to Home</Link>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <input
        type="number"
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        required
      />

      <input
        type="tel"
        placeholder="Contact Number"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ""))}
        maxLength={11}
        required
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
          margin: 50px auto;
          text-align: center;
          font-family: Arial, sans-serif;
        }
        .back-link { display: block; font-size: 13px; color: #6b7280; margin-bottom: 10px; text-decoration: none; }
        .back-link:hover { color: #374151; }

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