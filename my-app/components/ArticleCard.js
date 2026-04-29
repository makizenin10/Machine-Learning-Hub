'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ArticleCard({ article, currentUserId, currentUserRole, onDeleted }) {
  const [count, setCount] = useState(article.counter || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);
  const [editContent, setEditContent] = useState(article.content);
  const [saving, setSaving] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

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

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, full_name)')
      .eq('article_id', article.id)
      .order('created_at', { ascending: true });
    if (!error) setComments(data);
  };

  const handleToggleComments = async () => {
    if (!showComments) await fetchComments();
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase
      .from('comments')
      .insert([{ article_id: article.id, user_id: currentUserId, content: newComment, parent_id: null }]);
    if (!error) { setNewComment(''); await fetchComments(); }
    else alert('Comment failed: ' + error.message);
  };

  const handleAddReply = async (parentId) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from('comments')
      .insert([{ article_id: article.id, user_id: currentUserId, content: replyText, parent_id: parentId }]);
    if (!error) { setReplyText(''); setReplyingTo(null); await fetchComments(); }
    else alert('Reply failed: ' + error.message);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) await fetchComments();
  };

  const handleLike = async () => {
    if (hasLiked) {
      const { error: unlikeError } = await supabase.from('likes').delete()
        .eq('user_id', currentUserId).eq('article_id', article.id);
      if (unlikeError) { alert('Unlike failed: ' + unlikeError.message); return; }
      const { error: countError } = await supabase.rpc('decrement_counter', { row_id: article.id });
      if (!countError) { setCount(count - 1); setHasLiked(false); }
    } else {
      const { error: likeError } = await supabase.from('likes')
        .insert([{ user_id: currentUserId, article_id: article.id }]);
      if (likeError) { alert('Like failed: ' + likeError.message); return; }
      const { error: countError } = await supabase.rpc('increment_counter', { row_id: article.id });
      if (!countError) { setCount(count + 1); setHasLiked(true); }
    }
  };

  const handleShare = async () => {
    const authorName = article.profiles?.full_name || article.profiles?.username || 'an author';
    if (navigator.share) {
      navigator.share({ title: article.title, text: `Check out this article by ${authorName}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    const { error, count: deleteCount } = await supabase
      .from('articles').delete({ count: 'exact' }).eq('id', article.id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    if (deleteCount === 0) { alert('Delete was blocked. Check your Supabase RLS policies.'); return; }
    if (onDeleted) onDeleted(article.id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.from('articles')
      .update({ title: editTitle, content: editContent }).eq('id', article.id);
    setSaving(false);
    if (!error) { article.title = editTitle; article.content = editContent; setIsEditing(false); }
    else alert('Edit failed: ' + error.message);
  };

  const topComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: 'white' }}>
      {isEditing ? (
        <>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
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

          {/* Clickable author name and username */}
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 8px' }}>
            By:{' '}
            <Link href={`/user/${article.author_id}`}
              style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
              {article.profiles?.full_name || 'Unknown Author'}
            </Link>
            {article.profiles?.username && (
              <Link href={`/user/${article.author_id}`}
                style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '12px', marginLeft: '4px' }}>
                (@{article.profiles?.username})
              </Link>
            )}
          </p>

          <p>{article.content}</p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleLike}
              style={{ padding: '4px 10px', background: hasLiked ? '#f97316' : '#e5e7eb', color: hasLiked ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              🔥 {count}
            </button>
            <button onClick={handleToggleComments}
              style={{ padding: '4px 10px', background: showComments ? '#6366f1' : '#e5e7eb', color: showComments ? 'white' : '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              💬 {comments.length > 0 ? comments.length : ''} {showComments ? 'Hide' : 'Comments'}
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

          {showComments && (
            <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
                <button onClick={handleAddComment}
                  style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                  Post
                </button>
              </div>

              {topComments.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px' }}>No comments yet. Be the first!</p>
              ) : (
                topComments.map(comment => (
                  <div key={comment.id} style={{ marginBottom: '12px' }}>
                    <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '6px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                        <strong>{comment.profiles?.full_name || comment.profiles?.username || 'Unknown'}</strong>
                        {comment.profiles?.username && (
                          <span style={{ color: '#9ca3af', fontWeight: 'normal', marginLeft: '4px' }}>
                            (@{comment.profiles?.username})
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '14px', margin: 0 }}>{comment.content}</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          💬 Reply
                        </button>
                        {(currentUserId === comment.user_id || isAdmin) && (
                          <button onClick={() => handleDeleteComment(comment.id)}
                            style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {replyingTo === comment.id && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', marginLeft: '20px' }}>
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
                        <button onClick={() => handleAddReply(comment.id)}
                          style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          Reply
                        </button>
                        <button onClick={() => setReplyingTo(null)}
                          style={{ padding: '6px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {getReplies(comment.id).map(reply => (
                      <div key={reply.id} style={{ marginLeft: '20px', marginTop: '6px', background: '#f3f4f6', padding: '8px 12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                          <strong>{reply.profiles?.full_name || reply.profiles?.username || 'Unknown'}</strong>
                          {reply.profiles?.username && (
                            <span style={{ color: '#9ca3af', fontWeight: 'normal', marginLeft: '4px' }}>
                              (@{reply.profiles?.username})
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: '14px', margin: 0 }}>{reply.content}</p>
                        {(currentUserId === reply.user_id || isAdmin) && (
                          <button onClick={() => handleDeleteComment(reply.id)}
                            style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px' }}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}