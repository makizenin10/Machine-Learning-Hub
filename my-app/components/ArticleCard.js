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
    if (hasLiked) {
      // Unlike
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('article_id', article.id);

      if (unlikeError) {
        alert('Unlike failed: ' + unlikeError.message);
        return;
      }

      const { error: countError } = await supabase
        .rpc('decrement_counter', { row_id: article.id });

      if (!countError) {
        setCount(count - 1);
        setHasLiked(false);
      } else {
        alert('Counter failed: ' + countError.message);
      }
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('likes')
        .insert([{ user_id: currentUserId, article_id: article.id }]);

      if (likeError) {
        alert('Like failed: ' + likeError.message);
        return;
      }

      const { error: countError } = await supabase
        .rpc('increment_counter', { row_id: article.id });

      if (!countError) {
        setCount(count + 1);
        setHasLiked(true);
      } else {
        alert('Counter failed: ' + countError.message);
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
    const { error, count: deleteCount } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .eq('id', article.id);

    if (error) {
      alert('Delete failed: ' + error.message);
      return;
    }
    if (deleteCount === 0) {
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
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            By: {article.profiles?.username || 'Unknown Author'}
          </p>
          <p>{article.content}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleLike}
              style={{
                padding: '4px 10px',
                background: hasLiked ? '#f97316' : '#e5e7eb',
                color: hasLiked ? 'white' : '#374151',
                border: 'none', borderRadius: '4px',
                cursor: 'pointer'
              }}>
              🔥 {count}
            </button>
            <button onClick={handleShare}
              style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>
              🔗 Share
            </button>
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