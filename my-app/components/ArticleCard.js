'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

export default function ArticleCard({ article, currentUserId, currentUserRole, onDeleted }) {
  const [count, setCount] = useState(article.counter || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUserId === article.author_id; 
  const isAdmin = currentUserRole === 'admin';
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  useEffect(() => {
    const checkLike = async () => {
      if (!currentUserId) return;
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('article_id', article.id)
        .single();
      if (data) setHasLiked(true);
    };
    checkLike();
  }, [currentUserId, article.id]);

  const handleLike = async () => {
    if (hasLiked) return;
    const { error: likeError } = await supabase
      .from('likes')
      .insert([{ user_id: currentUserId, article_id: article.id }]);

    if (!likeError) {
      const { error: countError } = await supabase
        .rpc('increment_counter', { row_id: article.id });
      if (!countError) {
        setCount(count + 1);
        setHasLiked(true);
      }
    }
  };

  const handleShare = async () => {
    const authorName = article.profiles?.username || 'an author';
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: `Check out this article by ${authorName}`,
        url: window.location.href,
      });
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDelete = async () => {
  if (!confirm('Are you sure?')) return;
  const { error, count } = await supabase
    .from('articles')
    .delete({ count: 'exact' })
    .eq('id', article.id);

  if (error) {
    alert('Delete failed: ' + error.message);
    return;
  }
  if (count === 0) {
    alert('Delete was blocked. Check your Supabase RLS policies.');
    return;
  }
  if (onDeleted) onDeleted(article.id);
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
    alert('Edit failed: ' + error.message);
  }
};

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: 'white' }}>
      {isEditing ? (
        <>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} style={{ width: '100%' }} />
          <button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <h3>{article.title}</h3>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            By: {article.profiles?.username || 'Unknown Author'}
          </p>
          <p>{article.content}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={handleLike} disabled={hasLiked} style={{ background: hasLiked ? '#eee' : '#f97316', color: hasLiked ? '#999' : 'white' }}>
              🔥 {count}
            </button>
            <button onClick={handleShare}>🔗 Share</button>
            {canEdit && <button onClick={() => setIsEditing(true)}>✏️ Edit</button>}
            {canDelete && <button onClick={handleDelete} style={{ background: '#ef4444', color: 'white' }}>🗑️ Delete</button>}
          </div>
        </>
      )}
    </div>
  );
}