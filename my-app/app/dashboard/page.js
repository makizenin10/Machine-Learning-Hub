"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ArticleCard from "../../components/ArticleCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [articles, setArticles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "user");

      const { data, error } = await supabase
        .from("articles")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (!error) setArticles(data);
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleArticleDeleted = (deletedId) => {
    setArticles((prev) => prev.filter((a) => a.id !== deletedId));
  };

  const handlePublish = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    setPublishing(true);
    const { data, error } = await supabase
      .from("articles")
      .insert([{ title: newTitle, content: newContent, user_id: user.id, counter: 0 }])
      .select("*, profiles(username)")
      .single();
    setPublishing(false);

    if (!error) {
      setArticles((prev) => [data, ...prev]);
      setNewTitle("");
      setNewContent("");
      setShowForm(false);
    } else {
      alert("Failed to publish: " + error.message);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Welcome, {user.email}!</p>
        {userRole === "admin" && (
          <span style={{
            background: '#10b981', color: 'white',
            padding: '2px 10px', borderRadius: '999px',
            fontSize: '12px', fontWeight: 'bold'
          }}>
            ADMIN
          </span>
        )}
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <hr />

      {/* Publish Button */}
      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button className="publish-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '✏️ Publish Article'}
        </button>
      </div>

      {/* Publish Form */}
      {showForm && (
        <div className="publish-form">
          <input
            type="text"
            placeholder="Article Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="Write your article here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={5}
          />
          <button className="submit-btn" onClick={handlePublish} disabled={publishing}>
            {publishing ? 'Publishing...' : '🚀 Publish'}
          </button>
        </div>
      )}

      <div className="feed">
        <h2>Article Feed</h2>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              currentUserId={user.id}
              currentUserRole={userRole}
              onDeleted={handleArticleDeleted}
            />
          ))
        ) : (
          <p>No articles found.</p>
        )}
      </div>

      <style jsx>{`
        .container { max-width: 800px; margin: 40px auto; font-family: Arial, sans-serif; padding: 0 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { font-size: 24px; font-weight: bold; }
        h2 { margin-top: 20px; text-align: left; }
        .logout-btn { display: block; padding: 8px 16px; margin: 16px auto 0; border: none; background: #a855f7; color: white; border-radius: 4px; cursor: pointer; }
        hr { margin: 20px 0; border: 0; border-top: 1px solid #eee; }
        .feed { display: flex; flex-direction: column; gap: 10px; }

        .publish-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .publish-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
        }

        .publish-form input, .publish-form textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }

        .submit-btn {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          align-self: flex-end;
        }
      `}</style>
    </div>
  );
}