"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setAge(profileData.age || "");
        setContactNumber(profileData.contact_number || "");
        setUsername(profileData.username || "");
      }

      const { data: articleData } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (articleData) setArticles(articleData);
    };
    getData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        age: parseInt(age),
        contact_number: contactNumber,
        username: username,
      })
      .eq("id", user.id);
    setSaving(false);
    if (!error) {
      setProfile({ ...profile, full_name: fullName, age, contact_number: contactNumber, username });
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } else {
      setMessage("Failed to update: " + error.message);
    }
  };

  if (!user || !profile) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
        <h1>My Profile</h1>
      </div>

      <div className="card">
        {isEditing ? (
          <>
            <div className="field">
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label>Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                value={profile.email}
                readOnly
                onClick={() => alert('To change your email, please contact the admin.')}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6', cursor: 'pointer' }}
              />
            </div>
            <div className="field">
              <label>Age</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="field">
              <label>Contact Number</label>
              <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '✅ Save Changes'}
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="info-row"><span className="label">Username</span><span>{profile.username || '—'}</span></div>
            <div className="info-row"><span className="label">Full Name</span><span>{profile.full_name || '—'}</span></div>
            <div className="info-row"><span className="label">Email</span><span>{profile.email}</span></div>
            <div className="info-row"><span className="label">Age</span><span>{profile.age || '—'}</span></div>
            <div className="info-row"><span className="label">Contact</span><span>{profile.contact_number || '—'}</span></div>
            <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
          </>
        )}
        {message && <p style={{ color: '#10b981', marginTop: '10px', fontSize: '14px' }}>{message}</p>}
      </div>

      <div className="articles-section">
        <h2>My Articles ({articles.length})</h2>
        {articles.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>You haven't published any articles yet.</p>
        ) : (
          articles.map(article => (
            <div key={article.id} className="article-item">
              <h3>{article.title}</h3>
              <p>{article.content}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .container { max-width: 700px; margin: 40px auto; font-family: Arial, sans-serif; padding: 0 20px; }
        .header { margin-bottom: 20px; }
        .back-link { font-size: 13px; color: #6b7280; text-decoration: none; }
        .back-link:hover { color: #374151; }
        h1 { font-size: 24px; font-weight: bold; margin-top: 8px; }
        h2 { font-size: 18px; font-weight: bold; margin-bottom: 12px; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .label { color: #6b7280; font-weight: bold; }
        .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
        .field label { font-size: 13px; color: #6b7280; font-weight: bold; }
        .field input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
        .edit-btn { margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .save-btn { padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .cancel-btn { padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .articles-section { margin-top: 10px; }
        .article-item { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
        .article-item h3 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .article-item p { font-size: 14px; color: #374151; margin: 0; }
      `}</style>
    </div>
  );
}