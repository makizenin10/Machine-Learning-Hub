"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import ArticleCard from "../../components/ArticleCard";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [articles, setArticles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [fullName, setFullName] = useState(null); 

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
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "user");
      setFullName(profile?.full_name || user.email); // fallback to email if no name set

      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          profiles (
            username,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (!error) setArticles(data);
    };

    getData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // This takes them to the landing page (root)
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

    let file_url = null;
    let file_name = null;
    let file_type = null;

    if (selectedFile) {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('article-files')
        .upload(fileName, selectedFile);

      setUploading(false);

      if (uploadError) {
        alert('File upload failed: ' + uploadError.message);
        setPublishing(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('article-files')
        .getPublicUrl(fileName);

      file_url = urlData.publicUrl;
      file_name = selectedFile.name;
      file_type = selectedFile.type;
    }

    const { data, error } = await supabase
      .from("articles")
      .insert([{
        title: newTitle,
        content: newContent,
        author_id: user.id,
        counter: 0,
        file_url,
        file_name,
        file_type
      }])
      .select(`*, profiles(username, full_name)`)
      .single();

    setPublishing(false);

    if (!error) {
      setArticles((prev) => [data, ...prev]);
      setNewTitle("");
      setNewContent("");
      setSelectedFile(null);
      setShowForm(false);
    } else {
      alert("Failed to publish: " + error.message);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div className="container">
      {/* IMPROVED APP HEADER */}
      <div className="app-navbar">
        <div className="title-section">
          <h1 className="app-title">ARTICLE SPACE</h1>
          {userRole === "admin" && <span className="admin-badge">ADMIN</span>}
        </div>
        
        <div className="user-nav">
          <p className="welcome-text">Welcome, <strong>{fullName}</strong></p>
          <Link href="/profile" className="profile-link">
             <span className="profile-icon">👤</span> My Profile
          </Link>
          <div className="footer">
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

      </div>

      <div className="action-bar">
        <button className="publish-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '✏️ Publish Article'}
        </button>
      </div>

      {showForm && (
        <div className="publish-form">
          <input
            type="text"
            className="form-input"
            placeholder="Article Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="form-textarea"
            placeholder="Write your article here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={5}
          />

          {/* File Upload Section */}
          <div className="file-upload-zone">
            <input
              type="file"
              id="file-upload"
              accept="image/*,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="file-label">
              📎 {selectedFile ? selectedFile.name : 'Click to attach a file (image or document)'}
            </label>
            {selectedFile && (
              <button onClick={() => setSelectedFile(null)} className="remove-file-btn">
                ✕ Remove
              </button>
            )}
          </div>

          <button className="submit-btn" onClick={handlePublish} disabled={publishing || uploading}>
            {uploading ? '⏳ Uploading...' : publishing ? 'Publishing...' : '🚀 Publish'}
          </button>
        </div>
      )}

      <div className="feed">
        <h2 className="feed-header">Latest Articles</h2>
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
          <p className="empty-feed">No articles found.</p>
        )}
      </div>


      <style jsx>{`
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
          padding: 40px 20px; 
        }

        /* HEADER & APP TITLE */
        .app-navbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 20px;
        }

        .app-title { 
          font-size: 32px; 
          font-weight: 900; 
          letter-spacing: -1px;
          margin: 0;
          background: linear-gradient(to right, #a855f7, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        /* USER PROFILE LINK */
        .user-nav {
          text-align: right;
          color: #000000;
        }

        .welcome-text {
          font-size: 14px;
          color: #000000;
          margin: 0 0 8px 0;
        }

        .profile-link { 
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #4f46e5; 
          text-decoration: none;
          padding: 8px 16px;
          background: #f5f3ff;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .profile-link:hover {
          background: #ede9fe;
          transform: translateY(-1px);
        }

        /* PUBLISH FORM STYLING */
        .publish-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          margin-bottom: 25px;
        }

        .form-input {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 16px;
        }

        .form-textarea {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          font-size: 15px;
          font-family: inherit;
        }

        .file-upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          padding: 16px;
          text-align: center;
          background: white;
        }

        .file-label { cursor: pointer; color: #6366f1; font-size: 14px; }
        
        .remove-file-btn {
          margin-left: 10px;
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
        }

        .submit-btn {
          padding: 10px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }

        /* ARTICLE FEED TEXT */
        .feed-header { 
          font-size: 24px; 
          font-weight: 800; 
          color: #1f2937;
          margin: 20px 0;
          position: relative;
          padding-left: 15px;
        }

        .feed-header::before {
          content: "";
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 5px;
          background: #a855f7;
          border-radius: 10px;
        }

        .action-bar { text-align: right; margin-bottom: 20px; }

        .admin-badge { 
          align-self: flex-start;
          background: #10b981; 
          color: white; 
          padding: 3px 12px; 
          border-radius: 999px; 
          font-size: 11px; 
          font-weight: bold; 
        }

        .publish-btn { 
          padding: 10px 20px; 
          background: #3b82f6; 
          color: white; 
          border: none; 
          border-radius: 8px; 
          font-weight: 600;
          cursor: pointer; 
          transition: 0.2s;
        }

        .publish-btn:hover { background: #2563eb; }

        .feed { display: flex; flex-direction: column; gap: 20px; }

        .footer {margin-top: 10px; padding-bottom: 40px; margin-left: 50px; }
        
        .logout-btn { 
          padding: 10px 24px; 
          border: 1px solid #ef7f7f; 
          background: #c41b1b; 
          color: #000000; 
          font-weight: 500;
          border-radius: 8px; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        
        .logout-btn:hover { 
          background: #831010; 
          color: #f5f4f4; 
          border-color: #000000;
        }
      `}</style>
    </div>
  );
}