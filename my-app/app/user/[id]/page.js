"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfile() {
  const params = useParams();
  const id = params?.id;
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const getData = async () => {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error("Profile error:", error.message);
      if (profileData) setProfile(profileData);

      const { data: articleData } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", id)
        .order("created_at", { ascending: false });

      if (articleData) setArticles(articleData);
      setLoading(false);
    };
    getData();
  }, [id]);

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (!profile) return <div className="loading-screen">User not found.</div>;

  return (
    <div className="main-wrapper">
      <div className="container">
        <div className="header">
          <Link href="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            <h1 className="display-name">{profile.full_name || profile.username || 'Unknown User'}</h1>
            <p className="username-tag">@{profile.username || 'user'}</p>
          </div>

          <div className="info-section">
            <div className="info-row">
              <span className="label">Email</span>
              <span className="value">{profile.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Age</span>
              <span className="value">{profile.age || '—'}</span>
            </div>
            <div className="info-row">
              <span className="label">Contact</span>
              <span className="value">{profile.contact_number || '—'}</span>
            </div>
          </div>
        </div>

        <div className="articles-section">
          <h2 className="section-title">Articles by {profile.full_name || profile.username} ({articles.length})</h2>
          {articles.length === 0 ? (
            <p className="empty-text">No articles published yet.</p>
          ) : (
            <div className="article-grid">
              {articles.map(article => (
                <div key={article.id} className="article-item">
                  <h3>{article.title}</h3>
                  <p className="article-preview">{article.content.substring(0, 150)}...</p>
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
          
          .header { margin-bottom: 25px; }

          /* BACK BUTTON BOX STYLE */
          :global(.back-link) { 
            display: inline-block !important;
            font-size: 14px !important; 
            color: #ffffff !important; 
            text-decoration: none !important; 
            font-weight: 700 !important; 
            background: #1f2937 !important; 
            padding: 10px 20px !important;
            border-radius: 8px !important;
            border: 1px solid #374151 !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
            transition: all 0.2s ease !important;
          }

          :global(.back-link:hover) { 
            background: #000000 !important; 
            transform: translateX(-3px) !important;
          }

          .profile-card { 
            background: rgba(255, 255, 255, 0.98); 
            backdrop-filter: blur(10px);
            border-radius: 16px; 
            padding: 35px; 
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            margin-bottom: 40px; 
            border: 1px solid #e2e8f0;
          }

          .profile-header { margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .display-name { font-size: 32px; font-weight: 900; color: #111827; margin: 0; }
          .username-tag { color: #6366f1; font-weight: 700; font-size: 18px; margin: 5px 0 0 0; }

          .info-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
          .label { color: #64748b; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          /* SHARP BLACK VALUES */
          .value { color: #000000; font-weight: 700; font-size: 15px; }

          .section-title { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 20px; }
          .article-grid { display: flex; flex-direction: column; gap: 15px; }
          
          .article-item { 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            padding: 20px; 
            transition: 0.2s;
          }
          .article-item:hover { transform: translateY(-2px); border-color: #6366f1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          
          .article-item h3 { font-size: 18px; margin: 0 0 10px 0; color: #111827; font-weight: 800; }
          .article-preview { color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
          .article-date { font-size: 12px; color: #94a3b8; font-weight: 600; }

          .empty-text { color: #94a3b8; font-style: italic; }
          .loading-screen { text-align: center; margin-top: 100px; font-weight: 700; color: #6366f1; font-family: sans-serif; }
        `}</style>
      </div>
    </div>
  );
}