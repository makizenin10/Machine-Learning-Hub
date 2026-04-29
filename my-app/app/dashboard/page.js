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

      // Fetch user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "user");

      // FETCH ARTICLES WITH JOIN (Linking author_id to profiles)
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles (
            username
          )
        `)
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

    // FIX: Using 'author_id' to match your database column and RLS policy
    const { data, error } = await supabase
      .from("articles")
      .insert([
        { 
          title: newTitle, 
          content: newContent, 
          author_id: user.id, 
          counter: 0 
        }
      ])
      .select(`
        *,
        profiles (
          username
        )
      `)
      .single();

    setPublishing(false);

    if (!error) {
      setArticles((prev) => [data, ...prev]);
      setNewTitle("");
      setNewContent("");
      setShowForm(false);
    } else {
      console.error("Supabase Error:", error);
      alert("Failed to publish: " + error.message);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Welcome, {user.email}!</p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <hr />

      <div style={{ textAlign: 'right', marginBottom: '10px' }}>
        <button className="publish-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '✏️ Publish Article'}
        </button>
      </div>

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
        .admin-badge { background: #10b981; color: white; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
        .logout-btn { padding: 8px 16px; margin-top: 10px; border: none; background: #a855f7; color: white; border-radius: 4px; cursor: pointer; }
        .publish-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .publish-form { display: flex; flex-direction: column; gap: 10px; background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .submit-btn { padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; align-self: flex-end; }
        .feed { display: flex; flex-direction: column; gap: 15px; }
      `}</style>
    </div>
  );
}