import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import OpenAI from 'openai';

import './config/db.js';
import { initSocket } from './socket/socket.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import walletRoutes from './routes/walletRoutes.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();
const server = http.createServer(app);

/* SOCKET */
const io = new SocketIOServer(server, {
  cors: { origin: true, methods: ['GET', 'POST'] }
});

initSocket(io);

/* MIDDLEWARE */
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ROOT */
app.get('/', (req, res) => {
  res.json({ message: 'Skill Swap API running ✅' });
});



const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const USE_FREE_CHAT_ONLY = process.env.FREE_AI_ONLY === "true";
const CHAT_HISTORY_LIMIT = Number(process.env.CHAT_HISTORY_LIMIT || 14);

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];
const normalizeText = (value = "") => value.toString().replace(/\s+/g, " ").trim();
const wrapFreeReply = (reply, language) => {
  const closing = language === "hindi"
    ? " Shukriya SkillSwap ka istemal karne ke liye! Agar kuch aur puchna ho to zaroor poochiye."
    : " Thank you for using SkillSwap! If you have more questions, please ask. ";
  return `${reply}${closing}`;
};

const freeResponses = {
  hindi: [
    {
      patterns: ["skill", "teach", "learn", "match", "matches", "interest", "search", "find"],
      replies: [
        "SkillSwap mein aap do tarah se kaam kar sakte hain: kisi ko skill sikha kar aur khud koi new skill seekh kar. Match tab hota hai jab dono ki skills aur interests milti hain.",
        "Aap skills add karke match request bhej sakte hain. Jab koi aapke skill interest se match karta hai, to aap baat cheet start kar sakte hain.",
      ],
    },
    {
      patterns: ["login", "signup", "register", "account", "password", "sign in", "sign up"],
      replies: [
        "Login ya register karne ke liye user page pe jaayein. Agar password bhool gaye hain, to password reset option use karein.",
        "Agar aap naye hain to Register button dabayein, agar pehle se account hai to Login karein.",
      ],
    },
    {
      patterns: ["free", "payment", "pay", "charge", "cost", "money", "price"],
      replies: [
        "SkillSwap free platform hai. Aap bina payment ke skills share aur learn kar sakte hain.",
        "Koi payment nahi lagti. Bas account banayein aur apni skills list karein.",
      ],
    },
    {
      patterns: ["profile", "edit", "update", "picture", "bio", "information"],
      replies: [
        "Apni profile page par jaake aap apna bio, skills, aur photo update kar sakte hain.",
        "Profile ko update karke apni skills aur availability clear dikhayein, taaki log aapko asani se connect kar saken.",
      ],
    },
    {
      patterns: ["chat", "message", "contact", "talk", "conversation"],
      replies: [
        "Chat section mein aap apne matches se message bhej sakte hain aur meeting time decide kar sakte hain.",
        "Message bhejne ke liye apne match profile pe jaakar Chat start karein.",
      ],
    },
    {
      patterns: ["help", "support", "problem", "issue", "question"],
      replies: [
        "Main aapki madad ke liye hoon. SkillSwap ke features, onboarding, ya profile questions puch sakte hain.",
        "Agar aapko kisi button, match, ya chat mein problem ho rahi hai, to aap mujhse seedha pooch sakte hain.",
      ],
    },
    {
      patterns: ["notification", "alert", "message"],
      replies: [
        "Notifications page par naye matches aur messages dikhte hain.",
        "Notifications on rakhiye taaki turant reply kar saken.",
        "Top navigation mein bell icon check karein unread notifications ke liye.",
      ],
    },
    {
      patterns: ["premium", "paid", "subscription", "upgrade"],
      replies: [
        "Premium mein unlimited chat, priority matching, aur advanced features milte hain.",
        "Plans ₹99/month se shuru. Profile settings mein upgrade karein.",
        "Premium users ko fast responses aur exclusive skill categories milte hain.",
      ],
    },
    {
      patterns: ["session", "meeting", "schedule", "book"],
      replies: [
        "Match hone ke baad chat mein session time schedule karein.",
        "Sessions matched users ke beech directly arrange hote hain.",
        "Upcoming meetings track karne ke liye sessions page check karein.",
      ],
    },
    {
      patterns: ["review", "rating", "feedback"],
      replies: [
        "Sessions ke baad reviews dekar doosron ki help karein.",
        "Aapki rating aapke profile ki visibility ko affect karti hai.",
        "Connect karne se pehle user profiles par reviews check karein.",
      ],
    },
    {
      patterns: ["bug", "error", "problem", "issue", "not working"],
      replies: [
        "Page refresh karein ya browser cache clear karein.",
        "Internet connection check karein aur phir try karein.",
        "Agar problem persist kare, to support ko problem ke details ke saath contact karein.",
      ],
    },
    {
      patterns: ["safety", "security", "trust", "scam"],
      replies: [
        "SkillSwap users ko verify karta hai aur interactions monitor karta hai.",
        "Naye connections ke liye video calls se start karein.",
        "Suspicious behavior ko immediately support ke through report karein.",
      ],
    },
  ],
  english: [
    {
      patterns: ["skill", "teach", "learn", "match", "matches", "interest", "search", "find"],
      replies: [
        "On SkillSwap, you can teach a skill or learn a new one by connecting with people who match your interests.",
        "Add your skills and send match requests. When someone matches your interests, you can start chatting.",
      ],
    },
    {
      patterns: ["login", "signup", "register", "account", "password", "sign in", "sign up"],
      replies: [
        "Go to the user page to login or register. If you forgot your password, use the reset option.",
        "If you are new, click Register; if you already have an account, click Login.",
      ],
    },
    {
      patterns: ["free", "payment", "pay", "charge", "cost", "money", "price"],
      replies: [
        "SkillSwap is free. You can share and learn skills without any payment.",
        "There are no hidden charges. Just create an account and list your skills.",
      ],
    },
    {
      patterns: ["profile", "edit", "update", "picture", "bio", "information"],
      replies: [
        "On your profile page, you can update your bio, skills, and photo.",
        "Keep your profile updated so others can connect with you easily.",
      ],
    },
    {
      patterns: ["chat", "message", "contact", "talk", "conversation"],
      replies: [
        "In chat, you can message your matches and decide a meeting time.",
        "Start a chat from a match profile to send messages.",
      ],
    },
    {
      patterns: ["help", "support", "problem", "issue", "question"],
      replies: [
        "I am here to help. Ask about SkillSwap features, onboarding, or profile questions.",
        "If you have an issue with a button, match, or chat, just ask me directly.",
      ],
    },
    {
      patterns: ["notification", "alert", "message"],
      replies: [
        "The notifications page shows new matches and messages.",
        "Keep notifications on so you can reply quickly to new messages.",
        "Check the bell icon in the top navigation for unread notifications.",
      ],
    },
    {
      patterns: ["premium", "paid", "subscription", "upgrade"],
      replies: [
        "Premium unlocks unlimited chat, priority matching, and advanced features.",
        "Plans start at ₹99/month. Upgrade in your profile settings.",
        "Premium users get faster responses and exclusive skill categories.",
      ],
    },
    {
      patterns: ["session", "meeting", "schedule", "book"],
      replies: [
        "After matching, use the chat to schedule a session time.",
        "Sessions are arranged directly between matched users.",
        "Check your sessions page to track upcoming meetings.",
      ],
    },
    {
      patterns: ["review", "rating", "feedback"],
      replies: [
        "Leave reviews after sessions to help others choose reliable partners.",
        "Your rating affects your profile visibility in matches.",
        "Check reviews on user profiles before connecting.",
      ],
    },
    {
      patterns: ["bug", "error", "problem", "issue", "not working"],
      replies: [
        "Try refreshing the page or clearing browser cache.",
        "Check your internet connection and try again.",
        "If issues persist, contact support with details of the problem.",
      ],
    },
    {
      patterns: ["safety", "security", "trust", "scam"],
      replies: [
        "SkillSwap verifies users and monitors interactions.",
        "Start with video calls for new connections.",
        "Report suspicious behavior immediately through support.",
      ],
    },
  ],
};

const getFreeChatReply = (message, language = "english") => {
  const text = normalizeText(message).toLowerCase();
  const normalizedLanguage = language === "hindi" ? "hindi" : "english";
  const lookup = freeResponses[normalizedLanguage] || freeResponses.english;
  const match = lookup.find((item) =>
    item.patterns.some((pattern) => text.includes(pattern))
  );

  if (match) {
    return wrapFreeReply(pickRandom(match.replies), normalizedLanguage);
  }

  const genericReplies = normalizedLanguage === "hindi"
    ? [
        "Yeh bahut achha sawaal hai. SkillSwap mein aap kisi bhi skill ko seekh ya sikhane ke liye logon se connect kar sakte hain.",
        "Agar aap specific feature ke baare mein poochna chahte hain, to jaise 'profile update', 'find match' ya 'chat start' puchiye.",
        "Main aapki help karne ke liye yahan hoon. Aap SkillSwap ke login, profile, skills, matches aur chat ke baare mein sawal kar sakte hain.",
        "Main bilkul free support mode mein hoon. Aap apne sawal ko thoda aur details ke saath pooch sakte hain, jaise 'How do I add a skill?' ya 'How do I find a match?'.",
      ]
    : [
        "That is a great question. On SkillSwap, you can connect with people to learn or teach new skills.",
        "If you want to ask about a specific feature, try 'How do I add a skill?' or 'How do I find a match?'.",
        "I'm here to help. You can ask about login, profile, skills, matches, or chat.",
        "This is a free support mode. Please give me more details like 'How do I add a skill?' or 'How do I find a match?'.",
      ];

  return wrapFreeReply(pickRandom(genericReplies), normalizedLanguage);
};

const buildSystemPrompt = (language) => `You are SkillSwap AI Assistant, a professional and friendly support expert for the SkillSwap platform.

Your role:
- Provide accurate, helpful guidance about SkillSwap features: user registration, profile management, skill matching, chat system, session scheduling, notifications, reviews, and premium features
- Give step-by-step instructions when users ask "how to" questions
- Be proactive in suggesting next steps or related features
- Maintain a professional yet approachable tone
- Use clear, concise language with appropriate emojis for friendliness
- If something is unclear, ask one clarifying question
- For technical issues, suggest checking browser console or contacting support
- Highlight premium benefits when relevant but don't pressure users
- Always prioritize user safety and platform guidelines

Key platform features to know:
- Users can teach skills and learn new ones through peer-to-peer connections
- Matching is based on complementary skills (what you teach vs. what you want to learn)
- Free 1-minute chat trial, then premium required for continued messaging
- Sessions can be scheduled after matching
- Reviews and ratings help build trust
- Real-time notifications for matches, messages, and session updates

Response guidelines:
1) Start with empathy for problems or congratulations for successes
2) Provide direct, actionable answers
3) Use bullet points or numbered lists for multi-step processes
4) End with offer for more help or related suggestions
5) Keep responses under 300 words unless detailed instructions needed
6) Never invent features or promise unavailable capabilities
7) If user seems frustrated, acknowledge feelings and offer alternatives

Respond only in ${language}.`;

const sanitizeChatMessages = (messages = []) =>
  messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role,
      content: normalizeText(msg.content),
    }))
    .filter((msg) => msg.content.length > 0);

const getLatestUserMessage = (messages = [], fallback = "") =>
  [...messages].reverse().find((msg) => msg.role === "user")?.content || fallback;
if (USE_FREE_CHAT_ONLY) {
  console.warn("FREE_AI_ONLY=true: using free built-in support responses only.");
} else if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY missing: using free built-in support responses.");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  const { message, messages, language } = req.body;
  const directMessage = normalizeText(message);

  console.log("📩 Incoming chat request", {
    message: directMessage,
    messageCount: Array.isArray(messages) ? messages.length : 0,
    language,
  });

  if (!directMessage && (!Array.isArray(messages) || messages.length === 0)) {
    return res.status(400).json({ error: "Message or conversation history is required" });
  }

  const normalizedLanguage = language === "hindi" ? "Hindi" : "English";
  const systemPrompt = buildSystemPrompt(normalizedLanguage);

  const buildMessages = () => {
    if (Array.isArray(messages) && messages.length > 0) {
      return sanitizeChatMessages(messages).slice(-CHAT_HISTORY_LIMIT);
    }

    return [{ role: "user", content: directMessage }];
  };

  const chatMessages = buildMessages();
  const latestUserMessage = getLatestUserMessage(chatMessages, directMessage);

  // Add conversation context for better responses
  const conversationContext = chatMessages.length > 1 ? 
    `Previous conversation: ${chatMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('; ')}` : '';

  if (USE_FREE_CHAT_ONLY || !OPENAI_API_KEY) {
    return res.json({ reply: getFreeChatReply(latestUserMessage, normalizedLanguage.toLowerCase()), source: "free" });
  }

  try {
    const systemPromptWithContext = conversationContext ? 
      `${buildSystemPrompt(normalizedLanguage)}\n\nConversation context: ${conversationContext}` : 
      buildSystemPrompt(normalizedLanguage);

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPromptWithContext },
        ...chatMessages,
      ],
      temperature: 0.35,
      presence_penalty: 0.1,
      frequency_penalty: 0.15,
      max_tokens: 500,
    });

    console.log("🧠 OpenAI raw response:", response);

    const reply =
      response?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ AI did not return a proper response";

    res.json({ reply, source: "openai" });

  } catch (error) {
    console.error("🔥 FULL AI ERROR:", error);

    const fallbackReply = getFreeChatReply(latestUserMessage, normalizedLanguage.toLowerCase());
    const isQuotaOrAuthError =
      error?.status === 429 ||
      error?.error?.type === "insufficient_quota" ||
      error?.code === "insufficient_quota" ||
      error?.message?.includes("quota") ||
      error?.message?.includes("401") ||
      error?.message?.includes("invalid_api_key");

    if (isQuotaOrAuthError) {
      return res.json({ reply: fallbackReply, source: "free" });
    }

    res.status(500).json({
      error: "AI failed",
      message: error.message,
      type: error?.error?.type || "unknown",
      code: error?.error?.code || "unknown"
    });
  }
});



app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});