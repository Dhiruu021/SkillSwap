import React, { useState } from "react";
import { useAuth } from "../state/AuthContext.jsx";

const HelpPage = () => {
  const { user } = useAuth();

  const [showContact, setShowContact] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "assistant", text: "Hi 👋 Welcome to SkillSwap support. Ask me anything about matches, profiles, sessions, or using the app." }
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("english");
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [awaitingLanguageSelection, setAwaitingLanguageSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const chatUrl = apiBase.replace(/\/$/, "") + (apiBase.endsWith("/api") ? "/chat" : "/api/chat");

  React.useEffect(() => {
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
      { from: "assistant", text: "Hi 👋 Welcome to SkillSwap support. Ask me anything about matches, profiles, sessions, or using the app." }
    ]);
    setLanguage("english");
    setLanguageConfirmed(false);
    setAwaitingLanguageSelection(false);
    setInput("");
    setLoading(false);
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
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: `⚠️ AI server not responding (${err.message || "unknown"})`,
        },
      ]);
    }

    setLoading(false);
  };

  const prepareMessageForLanguage = (text = input) => {
    const messageText = text.trim();
    if (!messageText || awaitingLanguageSelection) return;

    const userMsg = { from: "user", text: messageText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    if (!languageConfirmed) {
      setMessages((prev) => [
        ...prev,
        {
          from: "system",
          text: "Please select the reply language: English or Hindi.",
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
        <div className="fixed bottom-5 right-5 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-lg flex flex-col">

          {/* HEADER */}
          <div className="flex justify-between items-center p-3 border-b border-slate-700">
            <div>
              <p className="font-semibold">AI Support</p>
              <p className="text-xs text-slate-400">Professional SkillSwap assistant</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[.18em] text-slate-300">
                {language === "english" ? "English" : "Hindi"}
              </span>
              <button
                onClick={resetChat}
                className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
              >
                Reset
              </button>
              <button onClick={() => setChatOpen(false)}>✖</button>
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
          <div className="flex-1 p-3 space-y-2 max-h-60 overflow-y-auto">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg w-fit max-w-[80%] ${
                  msg.from === "user"
                    ? "bg-indigo-600 ml-auto"
                    : "bg-slate-700"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <p className="text-xs text-slate-400">AI typing...</p>
            )}

          </div>

          {/* INPUT */}
          <div className="p-2 border-t border-slate-700 flex gap-2">

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-800 px-3 py-2 rounded-lg text-sm outline-none"
              onKeyDown={(e) => e.key === "Enter" && prepareMessageForLanguage()}
            />

            <button
              onClick={prepareMessageForLanguage}
              disabled={awaitingLanguageSelection}
              className={`px-3 rounded-lg ${awaitingLanguageSelection ? "bg-slate-600 cursor-not-allowed" : "bg-indigo-600"}`}
            >
              ➤
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default HelpPage;