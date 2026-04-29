"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserProfile({ params }) {
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!profileData) { router.push("/dashboard"); return; }
      setProfile(profileData);

      const { data: articleData } = await supabase
        .from("articles")
        .select("*")
        .eq("author_id", params.id)
        .order("created_at", { ascending: false });

      if (articleData) setArticles(articleData);
    };
    getData();
  }, [params.id, router]);

  if (!profile) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;

  return (
    <div className="container">
      <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>

      <div className="card">
        <h1>{profile.full_name || profile.username || 'Unknown User'}</h1>
        <p className="username">@{profile.username || '—'}</p>
        <div className="info-row"><span className="label">Email</span><span>{profile.email}</span></div>
        <div className="info-row"><span className="label">Age</span><span>{profile.age || '—'}</span></div>
        <div className="info-row"><span className="label">Contact</span><span>{profile.contact_number || '—'}</span></div>
      </div>

      <div className="articles-section">
        <h2>Articles by {profile.full_name || profile.username} ({articles.length})</h2>
        {articles.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No articles published yet.</p>
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
        .back-link { font-size: 13px; color: #6b7280; text-decoration: none; }
        .back-link:hover { color: #374151; }
        .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
        .username { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .label { color: #6b7280; font-weight: bold; }
        h2 { font-size: 18px; font-weight: bold; margin-bottom: 12px; }
        .articles-section { margin-top: 10px; }
        .article-item { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
        .article-item h3 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .article-item p { font-size: 14px; color: #374151; margin: 0; }
      `}</style>
    </div>
  );
}