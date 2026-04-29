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

  if (!user || !profile) return <div className="loading-screen">Loading Profile...</div>;

  return (
    <div className="main-wrapper">
      <div className="container">
        <div className="header">
          <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
          <h1 className="page-title">My Profile</h1>
        </div>

        <div className="profile-card">
          {isEditing ? (
            <div className="edit-form">
              <div className="field">
                <label>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="styled-input" />
              </div>
              <div className="field">
                <label>Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="styled-input" />
              </div>
              <div className="field">
                <label>Email (Locked)</label>
                <input
                  value={profile.email}
                  readOnly
                  onClick={() => alert('To change your email, please contact the admin.\n\n📧 Email: manaayjerica@gmail.com\n📞 Contact: 09686336110')}
                  className="styled-input readonly"
                />
              </div>
              <div className="field">
                <label>Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="styled-input" />
              </div>
              <div className="field">
                <label>Contact Number</label>
                <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="styled-input" />
              </div>
              <div className="button-group">
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '✅ Save Changes'}
                </button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="view-details">
              <div className="info-row"><span className="label">Username</span><span className="value">{profile.username || '—'}</span></div>
              <div className="info-row"><span className="label">Full Name</span><span className="value">{profile.full_name || '—'}</span></div>
              <div className="info-row"><span className="label">Email</span><span className="value">{profile.email}</span></div>
              <div className="info-row"><span className="label">Age</span><span className="value">{profile.age || '—'}</span></div>
              <div className="info-row"><span className="label">Contact</span><span className="value">{profile.contact_number || '—'}</span></div>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
            </div>
          )}
          {message && <p className="status-message">{message}</p>}
        </div>

        <div className="articles-section">
          <h2 className="section-title">My Articles ({articles.length})</h2>
          {articles.length === 0 ? (
            <p className="empty-text">You haven't published any articles yet.</p>
          ) : (
            <div className="article-grid">
              {articles.map(article => (
                <div key={article.id} className="article-item">
                  <h3>{article.title}</h3>
                  <p className="article-preview">{article.content.substring(0, 100)}...</p>
                  <span className="article-date">
                    {new Date(article.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx>{`
          .main-wrapper {
            min-height: 100vh;
            background: #f3f4f6 url('https://www.transparenttextures.com/patterns/circuit-board.png');
            padding: 40px 20px;
          }
          .container { max-width: 800px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }
          
          .header { margin-bottom: 30px; }
          .back-link { 
            display: inline-block;
            font-size: 14px; 
            color: #ffffff; 
            text-decoration: none; 
            font-weight: 700; 
            background: #1f2937; 
            padding: 10px 20px;
            border-radius: 8px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 1px solid #374151;
          }

  .back-link:hover { 
    background: #000000; 
    transform: translateX(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
          
          .page-title { 
            font-size: 25px; 
            font-weight: 900; 
            margin-top: 10px; 
            background: linear-gradient(to right, #111827, #374151);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          /* GLASS CARD AESTHETIC */
          .profile-card { 
            background: rgba(255, 255, 255, 0.9); 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px; 
            padding: 30px; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            margin-bottom: 40px; 
          }

          .info-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
          .label { color: #64748b; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { color: #1e293b; font-weight: 500; }

          .edit-btn { 
            margin-top: 25px; 
            width: 100%;
            padding: 12px; 
            background: #4f46e5; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-weight: 700;
            cursor: pointer; 
            transition: 0.3s;
          }
          .edit-btn:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }

          /* FORM STYLING */
          .field { margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px; }
          .field label { font-size: 13px; font-weight: 700; color: #475569; }
          .styled-input { 
            padding: 10px 14px; 
            border: 1px solid #cbd5e1; 
            border-radius: 8px; 
            font-size: 15px; 
            transition: 0.2s;
          }
          .styled-input:focus { border-color: #6366f1; outline: none; ring: 2px solid #e0e7ff; }
          .readonly { background: #f8fafc; cursor: not-allowed; color: #64748b; }

          .button-group { display: flex; gap: 10px; margin-top: 20px; }
          .save-btn { flex: 2; padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
          .cancel-btn { flex: 1; padding: 12px; background: #94a3b8; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }

          /* ARTICLES SECTION */
          .section-title { font-size: 22px; font-weight: 800; color: #030303; margin-bottom: 20px; }
          .article-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
          .article-item { 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            transition: 0.2s;
          }
          .article-item:hover { transform: scale(1.01); border-color: #6366f1; }
          .article-item h3 { font-size: 18px; margin-bottom: 8px; color: #0f172a; }
          .article-preview { color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 12px; }
          .article-date { font-size: 12px; color: #94a3b8; font-weight: 600; }

          .status-message { color: #10b981; font-weight: 600; text-align: center; margin-top: 15px; }
          .loading-screen { text-align: center; margin-top: 100px; font-weight: 700; color: #6366f1; }
        `}</style>
      </div>
    </div>
  );
}