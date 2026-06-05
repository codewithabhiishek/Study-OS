// Daily Luffy-inspired motivation companion.
// - Gemini API key is read from VITE_GEMINI_API_KEY (build-time env var).
// - One message per user per day, persisted in Supabase.
// - Falls back to local messages on any error; never surfaces API errors.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const FALLBACK_MESSAGES = [
  "THIS IS THE FALLBACK MESSAGE123"
];

function getLocalFallback() {
  const idx = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
  return FALLBACK_MESSAGES[idx];
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const GEMINI_PROMPT = `Act like Luffy from One Piece.

Generate one short motivational message for studying and personal growth.

Rules:
- Maximum 2 sentences.
- Sound energetic, optimistic and determined.
- Focus on dreams, consistency, discipline, courage and persistence.
- Mention Germany goals, study goals or personal growth when relevant.
- Do NOT use copyrighted anime dialogue.
- Do NOT quote the anime.
- Create original messages inspired by Luffy's personality.

Return only the message, no preamble, no quotes.`;

async function generateFromGemini(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: GEMINI_PROMPT }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 120 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini empty');
  return text.trim().replace(/^["']|["']$/g, '');
}

async function generateMessage() {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log("Gemini Key:", geminiKey);

  try {
    if (geminiKey) {
      const msg = await generateFromGemini(geminiKey);
      console.log("Gemini Success:", msg);
      return msg;
    }
  } catch (err) {
    console.error("Gemini Error:", err);
  }

  return getLocalFallback();
}

export default function LuffyCompanion() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const date = todayKey();

    async function load() {
      if (user?.id) {
        try {
          const { data } = await supabase
            .from('luffy_motivations')
            .select('message')
            .eq('user_id', user.id)
            .eq('date', date)
            .maybeSingle();
          if (!cancelled && data?.message) {
            setMessage(data.message);
            return;
          }
        } catch {}
      }

      const fresh = await generateMessage();
      if (cancelled) return;
      setMessage(fresh);

      if (user?.id) {
        try {
          await supabase
            .from('luffy_motivations')
            .insert({ user_id: user.id, date, message: fresh });
        } catch {}
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="mb-6 flex items-center gap-3">
      <div
  className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
  style={{
    border: '2px solid #00FF87',
    boxShadow: '0 0 10px rgba(0,255,135,0.35)',
    background: '#000',
  }}
  aria-label="Luffy companion"
>
  <img
    src="/luffy.png"
    alt="Luffy"
    className="w-full h-full object-cover"
  />
</div>

      {message && (
        <div
          className="w-full max-w-xl p-4"
          style={{
            border: '1px solid #00FF87',
            boxShadow: '4px 4px 0 #FF006E',
            background: 'rgba(0,255,135,0.04)',
          }}
        >
          <div
            className="text-[10px] font-mono font-bold tracking-widest mb-2"
            style={{ color: '#FF006E', textShadow: '0 0 8px rgba(255,0,110,0.4)' }}
          >
            🏴‍☠️ LUFFY SAYS:
          </div>
          <div
            className="text-sm sm:text-base leading-snug"
            style={{ color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
