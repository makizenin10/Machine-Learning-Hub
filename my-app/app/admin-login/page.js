"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setMessage('Access denied. Admins only.');
      return;
    }

    router.push("/dashboard");
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Admin Login</h1>

        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

        <button onClick={handleLogin}
          style={{ width: '100%', padding: '8px', marginTop: '8px', border: 'none', background: '#a855f7', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
          Login
        </button>

        <p style={{ marginTop: '10px', fontSize: '14px', color: '#ef4444' }}>{message}</p>
        <Link href="/" style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginTop: '8px', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}