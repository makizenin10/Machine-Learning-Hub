'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function ArticleCard({ article, currentUserId, currentUserRole, onDeleted }) {
  const [count, setCount] = useState(article.counter);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUserId === article.user_id;
  const isAdmin = currentUserRole === 'admin';

  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  const handleIncrement = async () => {
    const { error } = await supabase.rpc('increment_counter', { row_id: article.id });
    if (!error) setCount(count + 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Check out this article by ${article.profiles?.username}`,
        url: window.location.href,
      });
    } else {
      alert("Sharing not supported on this browser, but you can copy the link!");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', article.id);
    if (!error && onDeleted) onDeleted(article.id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('articles')
      .update({ title: editTitle, content: editContent })
      .eq('id', article.id);
    setSaving(false);
    if (!error) {
      article.title = editTitle;
      article.content = editContent;
      setIsEditing(false);
    } else {
      alert('Failed to save: ' + error.message);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '15px', borderRadius: '8px' }}>
      {isEditing ? (
        <>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            style={{ width: '100%', marginBottom: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSaveEdit} disabled={saving}
              style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {saving ? 'Saving...' : '✅ Save'}
            </button>
            <button onClick={() => setIsEditing(false)}
              style={{ padding: '6px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>{article.title}</h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>By: {article.profiles?.username || 'Unknown'}</p>
          <p>{article.content}</p>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
            <button onClick={handleIncrement}>🔥 {count}</button>
            <button onClick={() => {}}>💬 Comments</button>
            <button onClick={handleShare}>🔗 Share</button>

            {canEdit && (
              <button onClick={() => setIsEditing(true)}
                style={{ padding: '4px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✏️ Edit
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete}
                style={{ padding: '4px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                🗑️ Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}