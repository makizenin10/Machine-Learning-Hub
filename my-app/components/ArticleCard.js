'use client'; // Required for the counter button logic
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function ArticleCard({ article }) {
  const [count, setCount] = useState(article.counter);

  // Requirement: AJAX Counter
  const handleIncrement = async () => {
    const { error } = await supabase.rpc('increment_counter', { row_id: article.id });
    
    if (!error) {
      setCount(count + 1); // Updates UI instantly without refresh
    }
  };

  // Requirement: Share platform/message
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

  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '15px', borderRadius: '8px' }}>
      <h3>{article.title}</h3>
      <p>By: {article.profiles?.username || 'Unknown'}</p>
      <p>{article.content}</p>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button onClick={handleIncrement}>🔥 {count}</button>
        <button onClick={() => {/* Toggle comments logic */}}>💬 Comments</button>
        <button onClick={handleShare}>🔗 Share</button>
      </div>
    </div>
  );
}