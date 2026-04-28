"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  website: string;
  updated_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    bio: "",
    website: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchProfile(user.id);
    };
    getUser();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
    }

    if (data) {
      setProfile(data);
      setForm({
        username: data.username || "",
        full_name: data.full_name || "",
        bio: data.bio || "",
        website: data.website || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...form,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditing(false);
      fetchProfile(user.id);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setMessage(null);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage({ type: "error", text: uploadError.message });
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      setMessage({ type: "error", text: updateError.message });
    } else {
      setMessage({ type: "success", text: "Avatar updated!" });
      fetchProfile(user.id);
    }
    setUploadingAvatar(false);
  };

  const getInitials = () => {
    const name = profile?.full_name || profile?.username || user?.email || "?";
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8ff47] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#888] text-sm font-mono">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <p className="text-[#888] font-mono">Not logged in.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white font-mono">
      {/* Top bar */}
      <div className="border-b border-[#1e1e1e] px-6 py-4 flex items-center justify-between">
        <span className="text-[#e8ff47] font-bold tracking-widest text-sm uppercase">
          ◈ Profile
        </span>
        <span className="text-[#444] text-xs">{user.email}</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Avatar section */}
        <div className="flex items-start gap-8 mb-12">
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#1e1e1e] cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-2xl font-bold text-[#e8ff47]">
                  {getInitials()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">
                {uploadingAvatar ? "Uploading..." : "Change"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex-1 pt-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {profile?.full_name || profile?.username || "Anonymous"}
            </h1>
            {profile?.username && (
              <p className="text-[#555] text-sm mt-1">@{profile.username}</p>
            )}
            {profile?.bio && (
              <p className="text-[#888] text-sm mt-3 leading-relaxed">{profile.bio}</p>
            )}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e8ff47] text-xs mt-2 inline-block hover:underline"
              >
                ↗ {profile.website.replace(/https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm border ${
              message.type === "success"
                ? "bg-[#e8ff4710] border-[#e8ff4730] text-[#e8ff47]"
                : "bg-[#ff4f4710] border-[#ff4f4730] text-[#ff6b6b]"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
            <span className="text-xs text-[#555] uppercase tracking-widest">Edit Info</span>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-[#e8ff47] hover:text-white transition-colors"
              >
                Edit →
              </button>
            ) : (
              <button
                onClick={() => { setEditing(false); setMessage(null); }}
                className="text-xs text-[#555] hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="p-6 space-y-5">
            {[
              { label: "Username", key: "username", placeholder: "your_username" },
              { label: "Full Name", key: "full_name", placeholder: "Your Name" },
              { label: "Website", key: "website", placeholder: "https://yoursite.com" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-[#444] uppercase tracking-widest mb-2">
                  {label}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#e8ff47] transition-colors"
                  />
                ) : (
                  <p className="text-sm text-[#888] px-1">
                    {form[key as keyof typeof form] || <span className="text-[#333]">Not set</span>}
                  </p>
                )}
              </div>
            ))}

            {/* Bio */}
            <div>
              <label className="block text-xs text-[#444] uppercase tracking-widest mb-2">
                Bio
              </label>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell something about yourself..."
                  rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#e8ff47] transition-colors resize-none"
                />
              ) : (
                <p className="text-sm text-[#888] px-1">
                  {form.bio || <span className="text-[#333]">Not set</span>}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs text-[#444] uppercase tracking-widest mb-2">
                Email
              </label>
              <p className="text-sm text-[#555] px-1">{user.email}</p>
            </div>
          </div>

          {editing && (
            <div className="px-6 pb-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#e8ff47] text-black font-bold text-sm py-3 rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* Meta info */}
        {profile?.updated_at && (
          <p className="text-center text-[#2a2a2a] text-xs mt-8">
            Last updated: {new Date(profile.updated_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
