"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ArticleCard from "../../components/ArticleCard"; // Make sure you created this file!

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]); // State to store articles
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      // 1. Check for User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 2. Fetch Articles with Profile info
      const { data, error } = await supabase
        .from("articles")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (!error) {
        setArticles(data);
      }
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Dashboard</h1>
        <p>Welcome, {user.email}!</p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <hr />

      <div className="feed">
        <h2>Article Feed</h2>
        {articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p>No articles found. Start by adding one to the database!</p>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
          padding: 0 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 { font-size: 24px; font-weight: bold; }
        h2 { margin-top: 20px; text-align: left; }
        
        .logout-btn {
          padding: 8px 16px;
          margin-top: 16px;
          border: none;
          background: #a855f7;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        
        hr { margin: 20px 0; border: 0; border-top: 1px solid #eee; }
        
        .feed {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}