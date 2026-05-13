'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useRef } from 'react';

export default function NotificationBell({ currentUserId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    console.log('Fetching for userId:', currentUserId); // 👈 add this
    const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(full_name, username)')
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(30);
    console.log('Notifications data:', data, 'Error:', error); // 👈 add this
    if (data) setNotifications(data);
    setLoading(false);
    };

  useEffect(() => {
    if (!currentUserId) return;

    fetchNotifications();

    // Poll every 15 seconds (free plan friendly)
    const interval = setInterval(fetchNotifications, 15000);

    return () => clearInterval(interval);
  }, [currentUserId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return '🔥';
      case 'comment': return '💬';
      case 'reply': return '↩️';
      case 'new_article': return '📄';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (!currentUserId) return null;

  return (
    <div className="bell-wrapper" ref={dropdownRef}>
      <button
        className={`bell-btn ${open ? 'active' : ''}`}
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        aria-label="Notifications"
        >
        <svg width="50" height="25" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
            <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
        <span className="bell-label">Notifications</span>
        </button>

      {open && (
        <div className="dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => markOneRead(n.id)}
                >
                  <span className="notif-icon">{getIcon(n.type)}</span>
                  <div className="notif-body">
                    <p className="notif-message">{n.message}</p>
                    <span className="notif-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && <span className="unread-dot" />}
                  <button className="delete-btn" onClick={(e) => deleteNotification(n.id, e)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .bell-wrapper { position: relative; display: inline-block; margin-left: 35px; }

        .bell-btn { position: relative; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 10px; color: #f5d800; transition: background 0.2s, color 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .bell-btn:hover, .bell-btn.active { background: #fefce8; color: #ca8a04; }
        .bell-label { font-size: 11px; font-weight: 600; color: #000000; margin-top: 2px; }

        .badge { position: absolute; top: 2px; right: 2px; background: #ef4444; color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

        .dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 360px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); z-index: 1000; overflow: hidden; animation: dropIn 0.18s ease; }

        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .dropdown-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid #f3f4f6; }
        .dropdown-title { font-weight: 700; font-size: 15px; color: #111827; }
        .mark-read-btn { font-size: 12px; color: #6366f1; background: none; border: none; cursor: pointer; font-weight: 500; padding: 0; }
        .mark-read-btn:hover { text-decoration: underline; }

        .notif-list { max-height: 420px; overflow-y: auto; }
        .notif-list::-webkit-scrollbar { width: 4px; }
        .notif-list::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .empty-state { padding: 40px 20px; text-align: center; color: #9ca3af; font-size: 14px; }
        .empty-icon { font-size: 32px; display: block; margin-bottom: 8px; }

        .notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 20px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #f9fafb; }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: #f9fafb; }
        .notif-item.unread { background: #fafafe; }
        .notif-item.unread:hover { background: #f3f4ff; }

        .notif-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        .notif-body { flex: 1; min-width: 0; }
        .notif-message { font-size: 13.5px; color: #1f2937; line-height: 1.45; margin: 0 0 4px; }
        .notif-time { font-size: 11px; color: #9ca3af; }

        .unread-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

        .delete-btn { background: none; border: none; color: #d1d5db; cursor: pointer; font-size: 18px; padding: 0 0 0 4px; flex-shrink: 0; transition: color 0.15s; }
        .delete-btn:hover { color: #ef4444; }
      `}</style>
    </div>
  );
}