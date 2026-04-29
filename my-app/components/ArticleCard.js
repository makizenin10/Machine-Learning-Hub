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
    if (!currentUserId) {
      alert("Please login to like articles.");
      return;
    }
    if (hasLiked) {
      const { error: unlikeError } = await supabase.from('likes').delete()
        .eq('user_id', currentUserId).eq('article_id', article.id);
      if (unlikeError) return;
      await supabase.rpc('decrement_counter', { row_id: article.id });
      setCount(count - 1);
      setHasLiked(false);
    } else {
      const { error: likeError } = await supabase.from('likes')
        .insert([{ user_id: currentUserId, article_id: article.id }]);
      if (likeError) return;
      await supabase.rpc('increment_counter', { row_id: article.id });
      setCount(count + 1);
      setHasLiked(true);
    }
  };

  const handleShare = async () => {
    const authorName = article.profiles?.full_name || 'the author';
    if (navigator.share) {
      navigator.share({ title: article.title, text: `Check out this article by ${authorName}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', article.id);
    if (error) { alert('Delete failed: ' + error.message); }
    else if (onDeleted) onDeleted(article.id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.from('articles')
      .update({ title: editTitle, content: editContent }).eq('id', article.id);
    setSaving(false);
    if (!error) {
      setIsEditing(false);
      // Logic to update local display text
      article.title = editTitle;
      article.content = editContent;
    } else {
      alert('Edit failed: ' + error.message);
    }
  };

  const topComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="card">
      {isEditing ? (
        <div className="edit-container">
          <input className="edit-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
          <textarea className="edit-textarea" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} placeholder="Content..." />
          <div className="button-group">
            <button onClick={handleSaveEdit} disabled={saving} className="btn btn-save">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn btn-cancel">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="header">
            <h3 className="title">{article.title}</h3>
            <p className="author-info">
              By <Link href={`/user/${article.author_id}`} className="author-link">{article.profiles?.full_name || 'Unknown Author'}</Link>
              {article.profiles?.username && <span className="username"> @{article.profiles.username}</span>}
            </p>
          </div>

          <p className="content">{article.content}</p>

          {article.file_url && (
            <div className="attachment">
              {article.file_type?.startsWith('image/') ? (
                <img src={article.file_url} alt="attachment" className="image-attachment" />
              ) : (
                <a href={article.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                  📄 {article.file_name}
                </a>
              )}
            </div>
          )}

          <div className="actions">
            <button onClick={handleLike} className={`action-btn ${hasLiked ? 'liked' : ''}`}>
              {hasLiked ? '🔥' : '👍'} {count}
            </button>
            <button onClick={handleToggleComments} className={`action-btn ${showComments ? 'active' : ''}`}>
              💬 {comments.length > 0 ? comments.length : ''} {showComments ? 'Hide' : 'Comments'}
            </button>
            <button onClick={handleShare} className="action-btn">🔗 Share</button>
            {canEdit && <button onClick={() => setIsEditing(true)} className="btn-edit">✏️ Edit</button>}
            {canDelete && <button onClick={handleDelete} className="btn-delete">🗑️ Delete</button>}
          </div>

          {showComments && (
            <div className="comment-section">
              <div className="comment-form">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." />
                <button onClick={handleAddComment}>Post</button>
              </div>

              {topComments.length === 0 ? (
                <p className="empty-text">No comments yet. Start the conversation!</p>
              ) : (
                topComments.map(comment => (
                  <div key={comment.id} className="comment-wrapper">
                    <div className="comment-box">
                      <p className="comment-user">
                        <strong>{comment.profiles?.full_name || 'User'}</strong>
                        {comment.profiles?.username && <span> @{comment.profiles.username}</span>}
                      </p>
                      <p className="comment-text">{comment.content}</p>
                      <div className="comment-actions">
                        <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>Reply</button>
                        {(currentUserId === comment.user_id || isAdmin) && (
                          <button className="del-btn" onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                        )}
                      </div>
                    </div>

                    {replyingTo === comment.id && (
                      <div className="reply-form">
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply..." />
                        <button className="btn-post-reply" onClick={() => handleAddReply(comment.id)}>Send</button>
                      </div>
                    )}

                    {getReplies(comment.id).map(reply => (
                      <div key={reply.id} className="reply-box">
                        <p className="comment-user"><strong>{reply.profiles?.full_name || 'User'}</strong></p>
                        <p className="comment-text">{reply.content}</p>
                        {(currentUserId === reply.user_id || isAdmin) && (
                          <button className="del-btn" onClick={() => handleDeleteComment(reply.id)}>Delete</button>
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

      <style jsx>{`
        .card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 20px; font-family: inherit; }
        .title { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .author-info { font-size: 0.85rem; color: #6b7280; margin-bottom: 12px; }
        .author-link { color: #3b82f6; text-decoration: none; font-weight: 600; }
        .username { color: #9ca3af; font-size: 0.75rem; }
        .content { color: #374151; line-height: 1.6; margin-bottom: 15px; }
        .attachment { margin: 15px 0; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 8px; }
        .image-attachment { max-width: 100%; border-radius: 6px; display: block; }
        .file-link { display: inline-block; padding: 8px; color: #6366f1; font-weight: 500; text-decoration: none; }
        
        .actions { display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid #f3f4f6; padding-top: 15px; }
        .action-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .action-btn:hover { background: #f9fafb; }
        .action-btn.liked { background: #fff7ed; border-color: #fdba74; color: #ea580c; }
        .action-btn.active { background: #eef2ff; border-color: #c7d2fe; color: #4f46e5; }
        
        .btn-edit { margin-left: auto; background: #dbeafe; color: #1e40af; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
        .btn-delete { background: #fee2e2; color: #991b1b; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }

        .comment-section { margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e5e7eb; }
        .comment-form { display: flex; gap: 8px; margin-bottom: 20px; }
        .comment-form input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; }
        .comment-form button { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }

        .comment-box { background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 8px; }
        .comment-user { font-size: 13px; margin-bottom: 4px; }
        .comment-text { font-size: 14px; color: #1f2937; }
        .comment-actions { display: flex; gap: 12px; margin-top: 8px; }
        .comment-actions button, .del-btn { background: none; border: none; font-size: 12px; color: #6366f1; cursor: pointer; padding: 0; }
        .del-btn { color: #ef4444; }

        .reply-box { margin-left: 24px; margin-top: 6px; background: #f9fafb; border-left: 2px solid #e5e7eb; padding: 8px 12px; border-radius: 0 8px 8px 0; }
        .reply-form { margin-left: 24px; margin-bottom: 10px; display: flex; gap: 4px; }
        .reply-form input { flex: 1; font-size: 13px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn-post-reply { font-size: 12px; background: #6366f1; color: white; border: none; padding: 4px 8px; border-radius: 4px; }

        /* Edit Mode Styles */
        .edit-input { width: 100%; font-size: 1.25rem; font-weight: 700; padding: 8px; margin-bottom: 10px; border: 1px solid #a855f7; border-radius: 6px; }
        .edit-textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 12px; }
        .btn-save { background: #10b981; color: white; margin-right: 8px; padding: 5px 16px; }
        .btn-cancel { background: #6b7280; color: white; padding: 5px 16px; }
        .btn { padding: 5px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
      `}</style>
    </div>
  );
}