"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ArticleCard from "../../components/ArticleCard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [articles, setArticles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch user role from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "user");

      // Fetch Articles
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
      `}</style>
    </div>
  );
}