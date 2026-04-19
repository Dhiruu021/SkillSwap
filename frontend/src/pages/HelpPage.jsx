import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../state/AuthContext.jsx";

const HelpPage = () => {
  const { user } = useAuth();

  const [showContact, setShowContact] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('skillswap_ai_chat');
    if (!saved) {
      return [
        { from: "assistant", text: "Hi 👋 Welcome to SkillSwap support. Ask me anything about matches, profiles, sessions, or using the app.", timestamp: Date.now() }
      ];
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn('Invalid saved chat data, resetting storage:', error);
      localStorage.removeItem('skillswap_ai_chat');
      return [
        { from: "assistant", text: "Hi 👋 Welcome to SkillSwap support. Ask me anything about matches, profiles, sessions, or using the app.", timestamp: Date.now() }
      ];
    }
  });
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("english");
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [awaitingLanguageSelection, setAwaitingLanguageSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const chatUrl = apiBase.replace(/\/$/, "") + (apiBase.endsWith("/api") ? "/chat" : "/api/chat");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('skillswap_ai_chat', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (user?.languagePreference === "hindi" || user?.languagePreference === "english") {
      setLanguage(user.languagePreference);
      setLanguageConfirmed(true);
    }
  }, [user]);

  const suggestions = [
    "How do I find a match?",
    "How can I update my profile?",
    "What is SkillSwap?",
    "How do I schedule a session?",
    "Tell me about premium features",
    "How to add skills?",
  ];

  const buildApiMessages = (sourceMessages = messages) =>
    sourceMessages
      .filter((msg) => msg.from !== "system")
      .map((msg) => ({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      }));

  const resetChat = () => {
    setMessages([
      { from: "assistant", text: "Hi 👋 Welcome to SkillSwap support. Ask me anything about matches, profiles, sessions, or using the app.", timestamp: Date.now() }
    ]);
    setLanguage("english");
    setLanguageConfirmed(false);
    setAwaitingLanguageSelection(false);
    setInput("");
    setLoading(false);
    localStorage.removeItem('skillswap_ai_chat');
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = language === 'hindi' ? 'hi-IN' : 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const sendChatRequest = async (selectedLanguage, sourceMessages = messages) => {
    setLoading(true);

    try {
      const res = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: buildApiMessages(sourceMessages),
          language: selectedLanguage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.message || data.error || "AI server error";
        throw new Error(errorText);
      }

      const botMsg = {
        from: "assistant",
        text: data.reply || "⚠️ AI did not return a proper response",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: `⚠️ AI server not responding (${err.message || "unknown"})`,
          timestamp: Date.now(),
        },
      ]);
    }

    setLoading(false);
  };

  const prepareMessageForLanguage = (text = input) => {
    const messageText = text.trim();
    if (!messageText || awaitingLanguageSelection) return;

    const userMsg = { from: "user", text: messageText, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    if (!languageConfirmed) {
      setMessages((prev) => [
        ...prev,
        {
          from: "system",
          text: "Please select the reply language: English or Hindi.",
          timestamp: Date.now(),
        },
      ]);
      setAwaitingLanguageSelection(true);
      return;
    }

    sendChatRequest(language, nextMessages);
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    setLanguageConfirmed(true);

    if (awaitingLanguageSelection) {
      setAwaitingLanguageSelection(false);
      const cleanMessages = messages.filter((msg) => msg.from !== "system");
      setMessages(cleanMessages);
      sendChatRequest(lang, cleanMessages);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-6 py-12">

      <div className="max-w-4xl mx-auto">

        {/* HEADING */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
          Help & Support
        </h1>

        <p className="text-slate-400 text-center mb-10">
          Need help? Find answers or contact us below.
        </p>

        {/* FAQ */}
        <div className="space-y-6">

          <div className="card p-5">
            <h2 className="font-bold text-lg">How does SkillSwap work?</h2>
            <p className="text-slate-400 mt-2">
              You can teach a skill and learn another by connecting with people
              who match your interests.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-lg">Is SkillSwap free?</h2>
            <p className="text-slate-400 mt-2">
              Yes, completely free. No hidden charges.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-lg">How to contact support?</h2>
            <p className="text-slate-400 mt-2">
              Use options below or chat with AI assistant 🤖
            </p>
          </div>

        </div>

        {/* CONTACT SECTION */}
        <div className="mt-12 text-center space-y-4">

          <h2 className="text-xl font-bold">Still need help?</h2>

          {!showContact ? (
            <button
              onClick={() => setShowContact(true)}
              className="btn-primary px-6 py-3"
            >
              Contact Support
            </button>
          ) : (
            <div className="space-y-4">

              {/* PHONE */}
              <p className="text-lg font-semibold text-indigo-400">
                📞 +91 7800XXX409
              </p>

              {/* CALL */}
              <a
                href="tel:+917800330409"
                className="inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-700 transition"
              >
                Call Now
              </a>

              {/* AI CHAT BUTTON */}
              <button
                onClick={() => setChatOpen(true)}
                className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 transition"
              >
                Chat with AI 🤖
              </button>

            </div>
          )}

        </div>

      </div>

      {/*AI CHAT*/}
      {chatOpen && (
        <div className="fixed bottom-5 right-5 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[600px]">

          {/* HEADER */}
          <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-sm">Ss</span>
              </div>
              <div>
                <p className="font-semibold text-white">SkillSwap Assistant</p>
                <p className="text-xs text-indigo-100">Professional support </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs uppercase tracking-[.18em] text-white">
                {language === "english" ? "EN" : "HI"}
              </span>
              <button
                onClick={resetChat}
                className="rounded-lg bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30 transition"
                title="Reset conversation"
              >
                🔄
              </button>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-white hover:text-indigo-200 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {messages.length <= 1 && !awaitingLanguageSelection && (
            <div className="p-3 border-b border-slate-700 space-y-2">
              <p className="text-sm text-slate-300">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => prepareMessageForLanguage(item)}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:border-indigo-500 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {awaitingLanguageSelection && (
            <div className="p-3 border-b border-slate-700">
              <p className="text-xs uppercase tracking-[.18em] text-slate-400">
                Choose language
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Select English or Hindi to get the reply in that language.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => selectLanguage("english")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    language === "english"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => selectLanguage("hindi")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    language === "hindi"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Hindi
                </button>
              </div>
            </div>
          )}

          {/* MESSAGES */}
          <div className="flex-1 p-4 space-y-3 max-h-80 overflow-y-auto">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.from === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                    msg.from === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white ml-auto"
                      : msg.from === "system"
                      ? "bg-slate-700 text-slate-300 text-center"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.timestamp && (
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {msg.from === "user" && (
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">U</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">AI</span>
                </div>
                <div className="bg-slate-700 px-4 py-3 rounded-2xl">
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

          {/* INPUT */}
          <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about SkillSwap..."
                className="flex-1 bg-slate-700 px-4 py-3 rounded-xl text-sm outline-none text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 transition"
                onKeyDown={(e) => e.key === "Enter" && prepareMessageForLanguage()}
                disabled={awaitingLanguageSelection}
              />

              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`px-4 py-3 rounded-xl transition ${
                  isListening 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
                title={isListening ? "Stop voice input" : "Start voice input"}
                disabled={awaitingLanguageSelection}
              >
                {isListening ? "🎤" : "🎙️"}
              </button>

              <button
                onClick={prepareMessageForLanguage}
                disabled={awaitingLanguageSelection || !input.trim() || loading}
                className={`px-4 py-3 rounded-xl transition ${
                  awaitingLanguageSelection || !input.trim() || loading
                    ? "bg-slate-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                }`}
              >
                {loading ? "⏳" : "➤"}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default HelpPage;