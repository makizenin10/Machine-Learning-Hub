import { supabase } from '@/lib/supabaseClient';

// ── Option A: Notify ALL users (no follow system needed) ─────────────
// Call this right after inserting a new article.
//
// Usage example in your publish page:
//
//   import { notifyAllUsersNewArticle } from '@/lib/notifyNewArticle';
//
//   const { data: newArticle } = await supabase
//     .from('articles')
//     .insert([{ title, content, author_id: currentUserId }])
//     .select()
//     .single();
//
//   await notifyAllUsersNewArticle({
//     authorId: currentUserId,
//     authorName: currentUserName,
//     articleId: newArticle.id,
//     articleTitle: newArticle.title,
//   });

export async function notifyAllUsersNewArticle({ authorId, authorName, articleId, articleTitle }) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', authorId);

  if (!profiles || profiles.length === 0) return;

  const notifications = profiles.map(p => ({
    recipient_id: p.id,
    sender_id: authorId,
    article_id: articleId,
    type: 'new_article',
    message: `${authorName} published a new article: "${articleTitle}"`,
  }));

  // Batch insert in groups of 100 to avoid request size limits
  for (let i = 0; i < notifications.length; i += 100) {
    await supabase.from('notifications').insert(notifications.slice(i, i + 100));
  }
}

// ── Option B: Notify only followers (requires a follows table) ───────
// Requires this table: follows { id, follower_id, following_id }
//
// Usage example:
//
//   import { notifyFollowersNewArticle } from '@/lib/notifyNewArticle';
//
//   await notifyFollowersNewArticle({
//     authorId: currentUserId,
//     authorName: currentUserName,
//     articleId: newArticle.id,
//     articleTitle: newArticle.title,
//   });

export async function notifyFollowersNewArticle({ authorId, authorName, articleId, articleTitle }) {
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', authorId);

  if (!followers || followers.length === 0) return;

  const notifications = followers
    .filter(f => f.follower_id !== authorId)
    .map(f => ({
      recipient_id: f.follower_id,
      sender_id: authorId,
      article_id: articleId,
      type: 'new_article',
      message: `${authorName} published a new article: "${articleTitle}"`,
    }));

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications);
  }
}