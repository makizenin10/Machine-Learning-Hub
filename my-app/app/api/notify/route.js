import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { title, content, authorName, articleId } = await request.json();

  // Get all user emails from profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'user');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const emails = profiles.map(p => p.email).filter(Boolean);

  if (emails.length === 0) {
    return Response.json({ message: 'No users to notify' });
  }

  // Send email to all users
  const { error: emailError } = await resend.emails.send({
    from: 'Machine Learning Hub <onboarding@resend.dev>',
    to: emails,
    subject: `📢 New Article: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Article Published!</h2>
        <h3>${title}</h3>
        <p>By: ${authorName}</p>
        <p>${content.substring(0, 200)}...</p>
        <a href="https://machine-learning-hub-topaz.vercel.app/dashboard" 
          style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Read Article
        </a>
        <hr style="margin-top: 30px;" />
        <p style="font-size: 12px; color: #9ca3af;">Machine Learning Hub — Student Portal</p>
      </div>
    `,
  });

  if (emailError) {
    return Response.json({ error: emailError.message }, { status: 500 });
  }

  return Response.json({ message: `Notified ${emails.length} users!` });
}