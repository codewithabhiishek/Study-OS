// Daily Luffy-inspired motivation companion.
// - Gemini API key is read from VITE_GEMINI_API_KEY (build-time env var).
// - One message per user per day, persisted in Supabase.
// - Falls back to local messages on any error; never surfaces API errors.

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

const FALLBACK_MESSAGES = [
  "If you don't take risks, you can't create a future! Keep grinding!",
  "No matter how hard or impossible it is, never lose sight of your goal!",
  "Power isn't determined by your size, but the size of your heart and dreams! Let's study!",
  "If you don't try, you'll never win! Push forward!",
  "Don't start a fight you can't finish, but always finish your goals!",
  "If I die trying to achieve my dream, then at least I tried! Don't hold back!",
  "It's not about whether it's possible or not. I'm doing it because I want to!",
  "I have my own dream, and I will make it happen no matter what! Keep moving!",
  "When the world shoves you around, you just gotta stand up and shove back!",
  "If you can't even protect your dream, then your dream is nothing but talk!",
  "No matter how deep the night, it always turns to day eventually. Keep pushing!",
  "You can't see what you still have if you keep focusing on what you've lost!",
  "If you don't fight to the very end, you will never see the dawn!",
  "I'll make my own path, even if it leads straight through a wall!",
  "If you're too afraid to make mistakes, you'll never achieve anything great!",
  "It is a righteous path to pursue what you believe in, no matter what others say!",
  "Never underestimate the power of a determined mind! You can do this!",
  "We have to live a life of no regrets. Get up and make today count!",
  "There is something I must meet again. And until that day... not even Death itself can take my life away!",
  "When do you think people die? When they are forgotten! Keep your dream alive!",
  "Destiny... fate... dreams... these unstoppable ideas are held deep in the heart of man.",
  "Fools who don't respect the past are likely to repeat it. Focus on your growth!",
  "Being alone is more painful than getting hurt. I'm glad I have my nakama!",
  "One day, I will find the greatest treasure in the world! Start with today's grind!",
  "If you lose credibility by just admitting defeat, then you never had any in the first place. Stand tall!",
  "Compared to the 'righteous' greed of the rulers, the world's criminals seem far more honorable.",
  "I don't want to conquer anything. I just think the person with the most freedom on the ocean is the Pirate King!",
  "A wound that would make an ordinary man unconscious... I won't lose to it! Stand up!",
  "Inherited Will, The Destiny of Age, and The Dreams of People. As long as people pursue Freedom, these will never cease!",
  "Stand up and walk! Keep moving forward. You've got two strong legs, so use them!"
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
- Mention Europe goals, study goals or personal growth when relevant.
- Do NOT use copyrighted anime dialogue.
- Do NOT quote the anime.
- Create original messages inspired by Luffy's personality.

Return only the message, no preamble, no quotes.`;

async function generateFromGemini(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
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
      // 1. Check database first if authenticated
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('luffy_motivations')
            .select('message')
            .eq('user_id', user.id)
            .eq('date', date)
            .maybeSingle();
          if (error) console.error("Supabase load error:", error);
          if (!cancelled && data?.message && data.message !== "THIS IS THE FALLBACK MESSAGE123") {
            setMessage(data.message);
            return;
          }
        } catch (err) {
          console.error("Supabase load exception:", err);
        }
      }

      // 2. Check localStorage as a secondary quick cache to prevent API spam
      try {
        const localSaved = localStorage.getItem(`luffy_msg_${date}`);
        if (localSaved && localSaved !== "THIS IS THE FALLBACK MESSAGE123" && !cancelled) {
          setMessage(localSaved);
          return;
        }
      } catch (err) {
        console.error("Local storage read error:", err);
      }

      // 3. Call API / Fallback
      const fresh = await generateMessage();
      if (cancelled) return;
      setMessage(fresh);

      // 4. Save to localStorage
      try {
        localStorage.setItem(`luffy_msg_${date}`, fresh);
      } catch (err) {
        console.error("Local storage save error:", err);
      }

      // 5. Save to database if authenticated
      if (user?.id) {
        try {
          const { error } = await supabase
            .from('luffy_motivations')
            .insert({ user_id: user.id, date, message: fresh });
          if (error) console.error("Supabase insert error:", error);
        } catch (err) {
          console.error("Supabase insert exception:", err);
        }
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
