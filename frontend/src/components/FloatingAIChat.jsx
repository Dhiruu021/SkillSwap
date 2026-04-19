import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../state/AuthContext.jsx";

const safeLocalStorageGet = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read localStorage key '${key}':`, error);
    return null;
  }
};

const safeLocalStorageSet = (key, value) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write localStorage key '${key}':`, error);
  }
};

const safeLocalStorageRemove = (key) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove localStorage key '${key}':`, error);
  }
};

const FloatingAIChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = safeLocalStorageGet('skillswap_ai_chat_global');
    if (!saved) {
      return [
        { from: "assistant", text: "👋 Hi! I'm your SkillSwap AI assistant. How can I help you today?", timestamp: Date.now() }
      ];
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Invalid saved global chat data, resetting storage:', error);
      safeLocalStorageRemove('skillswap_ai_chat_global');
      return [
        { from: "assistant", text: "👋 Hi! I'm your SkillSwap AI assistant. How can I help you today?", timestamp: Date.now() }
      ];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const savedLanguage = safeLocalStorageGet('skillswap_ai_chat_language');
    if (savedLanguage === 'hindi' || savedLanguage === 'english') {
      return savedLanguage;
    }
    return user?.languagePreference === 'hindi' ? 'hindi' : 'english';
  });
  const messagesEndRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const chatUrl = apiBase.replace(/\/$/, "") + (apiBase.endsWith("/api") ? "/chat" : "/api/chat");

  const language = selectedLanguage;

  useEffect(() => {
    safeLocalStorageSet('skillswap_ai_chat_global', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    safeLocalStorageSet('skillswap_ai_chat_language', selectedLanguage);
  }, [selectedLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized]);

  const buildApiMessages = () =>
    messages
      .filter((msg) => msg.from !== "system")
      .map((msg) => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      }));

  const resetChat = () => {
    const initialMessage = {
      from: "assistant",
      text: "👋 Hi! I'm your SkillSwap AI assistant. How can I help you today?",
      timestamp: Date.now(),
    };

    setMessages([initialMessage]);
    setInput("");
    safeLocalStorageSet('skillswap_ai_chat_global', JSON.stringify([initialMessage]));
  };

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || loading) return;

    const userMsg = { from: "user", text: messageText, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: buildApiMessages().concat([{ role: "user", content: messageText }]),
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Server error");

      const botMsg = {
        from: "assistant",
        text: data.reply || "⚠️ AI did not return a proper response",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        from: "assistant",
        text: `⚠️ Sorry, I'm having trouble connecting. Please try again later.`,
        timestamp: Date.now(),
      }]);
    }

    setLoading(false);
  };

  const quickQuestions = [
    "How do I find matches?",
    "Update my profile",
    "Schedule a session",
    "Premium benefits"
  ];

  if (!user) return null; // Only show for logged-in users

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50"
          title="Chat with AI Assistant"
        >
          <span className="text-white text-xl group-hover:scale-110 transition-transform">🤖</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ${
          minimized ? 'h-14' : 'h-[500px]'
        }`}>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-sm">AI</span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">SkillSwap AI</p>
                <p className="text-xs text-indigo-100">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                className="text-white hover:text-indigo-200 transition"
                title="Refresh chat"
              >
                ⟳
              </button>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-xs bg-slate-800 text-white border border-slate-600 rounded-lg px-2 py-1 outline-none"
                title="Select chat language"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
              <button
                onClick={() => setMinimized(!minimized)}
                className="text-white hover:text-indigo-200 transition"
                title={minimized ? "Maximize" : "Minimize"}
              >
                {minimized ? "⬆️" : "⬇️"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-indigo-200 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          {!minimized && (
            <>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.from === "assistant" && (
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">AI</span>
                      </div>
                    )}
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      msg.from === "user"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                        : "bg-slate-700 text-slate-100"
                    }`}>
                      <p>{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">AI</span>
                    </div>
                    <div className="bg-slate-700 px-3 py-2 rounded-xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-slate-400 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full text-slate-300 transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-slate-700 px-3 py-2 rounded-lg text-sm outline-none text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition"
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className={`px-4 py-2 rounded-lg transition ${
                      !input.trim() || loading
                        ? "bg-slate-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    }`}
                  >
                    {loading ? "⏳" : "➤"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;