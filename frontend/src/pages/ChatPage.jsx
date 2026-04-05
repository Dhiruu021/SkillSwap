import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api.js";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../state/AuthContext";

const ChatPage = () => {
  const { user, login } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [chatSearch, setChatSearch] = useState("");
  const [premiumNotice, setPremiumNotice] = useState("");
  const [showPremiumPlans, setShowPremiumPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");

  const PREMIUM_PLANS = [
    { id: 'monthly', label: '1 Month', price: '₹99', duration: '1 month', description: 'Unlimited chat for 1 month' },
    { id: 'quarterly', label: '3 Months', price: '₹199', duration: '3 months', description: 'Great value for active chat users' },
    { id: 'yearly', label: '1 Year', price: '₹499', duration: '1 year', description: 'Best savings for year-long access' }
  ];

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const getOtherUser = (chat) =>
    (chat.participants || []).find((p) => (p._id || p.id) !== (user?._id || user?.id));

  const formatTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatChatTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return formatTime(value);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderMessageContent = (text = '') => {
    const parts = String(text).split(/(\[hidden [^\]]+\])/g);
    return parts.map((part, index) => {
      if (!part) return null;
      if (part.startsWith('[hidden')) {
        return (
          <span key={index} className="inline-block rounded px-1 bg-slate-800/80 text-slate-300 blur-sm">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const sanitizeChatText = (text = '') => {
    const original = String(text || '');
    if (!original.trim()) return original;

    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const socialUrlRegex = /https?:\/\/(?:www\.)?(?:instagram|facebook|twitter|tiktok|linkedin|snapchat|youtube|telegram|discord|m\.me|wa\.me|chat\.whatsapp|whatsapp|fb)\.[^\s]+/gi;
    const plainSocialRegex = /(?:www\.)?(?:instagram|facebook|twitter|tiktok|linkedin|snapchat|youtube|telegram|discord|m\.me|wa\.me|chat\.whatsapp|whatsapp|fb)\.[^\s]+/gi;
    const handleRegex = /(^|\s)@([A-Za-z0-9._]{2,30})/g;
    const phoneRegex = /(?:\+?\d[\d\s().-]{6,}\d)/g;

    let sanitized = original;
    sanitized = sanitized.replace(emailRegex, '[hidden email]');
    sanitized = sanitized.replace(socialUrlRegex, '[hidden social link]');
    sanitized = sanitized.replace(plainSocialRegex, '[hidden social link]');
    sanitized = sanitized.replace(phoneRegex, (match) => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 8 ? '[hidden phone]' : match;
    });
    sanitized = sanitized.replace(handleRegex, '$1[hidden handle]');
    return sanitized;
  };

  const Avatar = ({ user: chatUser, size = "md" }) => {
    const sizeClass = size === "lg" ? "h-11 w-11" : "h-10 w-10";
    if (chatUser?.profilePhoto) {
      return (
        <img
          src={chatUser.profilePhoto}
          alt={chatUser.name || "User"}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-slate-800`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold ring-2 ring-slate-800`}
      >
        {chatUser?.name?.[0]?.toUpperCase() || "U"}
      </div>
    );
  };

  const loadChats = async () => {
    try {
      const res = await api.get("/chats");
      const validChats = (res.data || []).filter((chat) => {
        if (!chat.participants || chat.participants.length < 2) return false;
        const other = chat.participants.find((p) => (p._id || p.id) !== (user?._id || user?.id));
        return other && other.name;
      });

      const uniqueChats = [];
      const seenUsers = new Set();
      validChats.forEach((chat) => {
        const other = getOtherUser(chat);
        const id = other?._id || other?.id;
        if (id && !seenUsers.has(id)) {
          seenUsers.add(id);
          uniqueChats.push(chat);
        }
      });

      const sorted = uniqueChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChats(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadMessages = async (chatId) => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      setMessages(res.data || []);
      if (socket) {
        socket.emit("seenMessage", { chatId, userId: user?._id || user?.id });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeChat?._id) {
      if (socket) {
        socket.emit("joinChat", { chatId: activeChat._id });
      }
      loadMessages(activeChat._id);
    }
  }, [activeChat, socket]);

  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      const incomingChatId = msg.chatId || msg.chat;
      if (incomingChatId === activeChat?._id) {
        setMessages((prev) => [...prev, msg]);
      }
      loadChats();
    };

    const onTyping = (data) => {
      if (data.chatId === activeChat?._id) {
        setTypingUser(data.userName || "Someone");
      }
    };

    const onStopTyping = () => setTypingUser(null);

    const onMessageSeen = (data) => {
      setMessages((prev) => prev.map((m) => (m._id === data.messageId ? { ...m, isRead: true } : m)));
    };

    socket.on("newMessage", onNewMessage);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("messageSeen", onMessageSeen);
    socket.on("messageError", (error) => {
      if (error?.chatId === activeChat?._id) {
        setPremiumNotice(error.message || 'Upgrade to premium to continue.');
      }
    });

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("messageSeen", onMessageSeen);
      socket.off("messageError");
    };
  }, [socket, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    return () => clearTimeout(typingTimeout.current);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || !socket) return;

    const hasPremium = user?.isPremium;
    const freeWindowMs = 60 * 1000;
    const firstMessageAt = activeChat?.firstMessageAt;
    const freeAllowed = !firstMessageAt || Date.now() - new Date(firstMessageAt).getTime() <= freeWindowMs;

    if (!hasPremium && !freeAllowed) {
      setPremiumNotice('Your 1 minute free chat has ended. Upgrade to Premium to continue messaging.');
      return;
    }

    socket.emit("sendMessage", {
      chatId: activeChat._id,
      senderId: user?._id || user?.id,
      content: input.trim(),
    });
    setInput("");
    socket.emit("stopTyping", { chatId: activeChat._id });
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setInput(value);
    if (!activeChat || !socket) return;

    socket.emit("typing", {
      chatId: activeChat._id,
      userName: user?.name || "Someone",
    });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { chatId: activeChat._id });
    }, 1000);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat || !socket) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("sendMessage", {
        chatId: activeChat._id,
        senderId: user?._id || user?.id,
        fileBase64: reader.result,
        fileType: file.type || "image",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUnlockPremium = () => {
    setShowPremiumPlans(true);
    setPremiumNotice('Select a Premium plan and enter your payment reference to verify your purchase.');
  };

  const buildPaymentQrUrl = (plan) => {
    const price = plan.price.replace(/[^0-9.]/g, '');
    const upiData = `upi://pay?pa=skillswap@upi&pn=SkillSwap Premium&am=${price}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiData)}`;
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowQr(false);
    setPaymentReference("");
    setPremiumNotice(`Scan the QR and pay ${plan.price} for ${plan.label}. Then enter the payment reference ID to verify.`);
  };

  const handleActivatePremium = async () => {
    if (!selectedPlan) {
      setPremiumNotice('Please select a plan first.');
      return;
    }

    if (!paymentReference.trim()) {
      setPremiumNotice('Enter a valid payment reference to verify your purchase.');
      return;
    }

    try {
      const res = await api.post('/users/me/premium', {
        planId: selectedPlan.id,
        paymentReference: paymentReference.trim(),
      });

      login(localStorage.getItem('token'), { ...user, isPremium: true });
      setPremiumNotice(res.data?.message || 'Premium activated! You can now continue messaging.');
      setShowPremiumPlans(false);
      setSelectedPlan(null);
      setPaymentReference("");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Unable to activate Premium right now. Try again in a moment.';
      setPremiumNotice(errorMsg);
    }
  };

  const filteredChats = useMemo(() => {
    const keyword = chatSearch.trim().toLowerCase();
    if (!keyword) return chats;

    return chats.filter((chat) => {
      const other = getOtherUser(chat);
      const name = other?.name?.toLowerCase() || "";
      const preview = (chat.lastMessage?.content || "").toLowerCase();
      return name.includes(keyword) || preview.includes(keyword);
    });
  }, [chatSearch, chats]);

  const activeOther = activeChat ? getOtherUser(activeChat) : null;
  const activeOnline = onlineUsers.includes(activeOther?._id || activeOther?.id);
  const freeWindowMs = 60 * 1000;
  const firstMessageAt = activeChat?.firstMessageAt;
  const freeChatElapsed = activeChat && firstMessageAt
    ? Date.now() - new Date(firstMessageAt).getTime()
    : 0;
  const hasFreeChat = activeChat && !user?.isPremium && (!firstMessageAt || freeChatElapsed <= freeWindowMs);
  const isChatLocked = activeChat && !user?.isPremium && firstMessageAt && freeChatElapsed > freeWindowMs;
  const freeChatSeconds = !activeChat || !hasFreeChat
    ? 0
    : firstMessageAt
      ? Math.max(0, Math.ceil((freeWindowMs - freeChatElapsed) / 1000))
      : Math.ceil(freeWindowMs / 1000);

  return (
    <div className="h-[calc(100vh-4rem)] text-white">
      <div className="h-full rounded-2xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-sm overflow-hidden shadow-2xl">
        <div className="flex h-full">
          <aside
            className={`w-full md:w-[360px] border-r border-slate-800/80 bg-slate-900/60 flex flex-col ${
              activeChat ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-wide">Conversations</h2>
                <span className="text-xs text-slate-400">{filteredChats.length} active</span>
              </div>
              <div className="mt-3">
                <input
                  className="input bg-slate-900/70"
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">No conversation found</div>
              ) : (
                filteredChats.map((chat) => {
                  const other = getOtherUser(chat);
                  const chatId = chat._id || chat.id;
                  const isActive = (activeChat?._id || activeChat?.id) === chatId;
                  const isOnline = onlineUsers.includes(other?._id || other?.id);
                  const unreadCount = Number(chat.unreadCount || 0);
                  const lastMsg = chat.lastMessage?.content
                    ? sanitizeChatText(chat.lastMessage.content)
                    : chat.lastMessage?.fileUrl
                    ? 'Photo'
                    : 'Start conversation';
                  return (
                    <button
                      key={chatId}
                      onClick={() => setActiveChat(chat)}
                      className={`w-full px-4 py-3.5 flex items-center gap-3 text-left transition border-l-2 ${
                        isActive
                          ? "bg-indigo-500/10 border-indigo-400"
                          : "border-transparent hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="relative">
                        <Avatar user={other} />
                        {isOnline && (
                          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-100">{other?.name || "Unknown"}</p>
                          <span className="text-[11px] text-slate-400">{formatChatTimestamp(chat.updatedAt)}</span>
                        </div>
                        <p className="truncate text-xs text-slate-400 mt-1">{lastMsg}</p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className={`flex-1 flex flex-col ${!activeChat && "hidden md:flex"}`}>
            {activeChat ? (
              <>
                <header className="px-4 md:px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center gap-3">
                  <button
                    className="md:hidden text-lg text-slate-300 hover:text-white"
                    onClick={() => setActiveChat(null)}
                    aria-label="Back to chats"
                  >
                    ←
                  </button>

                  <Avatar user={activeOther} size="lg" />

                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-semibold truncate">{activeOther?.name || "Unknown user"}</p>
                    <p className={`text-xs ${activeOnline ? "text-emerald-400" : "text-slate-400"}`}>
                      {activeOnline ? "Online now" : "Offline"}
                    </p>
                  </div>
                </header>

                {!user?.isPremium && activeChat && (
                  <div className="px-4 md:px-5 py-3 border-b border-slate-800/80 bg-slate-900/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">Premium chat unlocked</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {isChatLocked
                            ? 'Your 1 minute free chat has ended. Upgrade to premium to continue messaging.'
                            : `You have ${freeChatSeconds} seconds of free chat remaining before upgrading becomes required.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleUnlockPremium}
                        className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition w-full sm:w-auto"
                      >
                        Unlock Premium
                      </button>
                    </div>
                    {premiumNotice && <p className="mt-2 text-xs text-amber-300">{premiumNotice}</p>}

                    {showPremiumPlans && (
                      <div className="mt-4 mx-auto w-full max-w-[420px] lg:max-w-full rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-3 sm:p-4 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-3">
                          <p className="text-sm text-slate-300">Choose a Premium plan and verify your payment reference to unlock premium chat.</p>
                          {!selectedPlan && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {PREMIUM_PLANS.map((plan) => (
                                <button
                                  key={plan.id}
                                  type="button"
                                  onClick={() => handleSelectPlan(plan)}
                                  className={`w-full rounded-3xl border p-3 text-left transition ${selectedPlan?.id === plan.id ? 'border-indigo-400 bg-slate-800' : 'border-slate-700/80 bg-slate-900 hover:border-indigo-400 hover:bg-slate-800'}`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-100">{plan.label}</p>
                                      <p className="text-xs text-slate-400">{plan.duration}</p>
                                    </div>
                                    <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">{plan.price}</span>
                                  </div>
                                  <p className="mt-3 text-xs text-slate-400">{plan.description}</p>
                                </button>
                              ))}
                            </div>
                          )}

                          {selectedPlan && (
                            <div className="flex flex-col gap-3 rounded-3xl border border-slate-700/80 bg-slate-900 p-3 w-full max-w-full max-h-[60vh] overflow-y-auto">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-100">{selectedPlan.label} plan selected</p>
                                  <p className="text-xs text-slate-400 mt-1">Pay {selectedPlan.price} and then enter the payment reference to verify purchase.</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                  <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">{selectedPlan.duration}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPlan(null);
                                      setShowQr(false);
                                      setPaymentReference('');
                                      setPremiumNotice('Select a different plan to continue.');
                                    }}
                                    className="rounded-2xl border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition"
                                  >
                                    Change plan
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-3 lg:grid-cols-[minmax(220px,auto)_1fr]">
                                <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-950 p-3 overflow-hidden">
                                  {!showQr ? (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-800/90 bg-slate-900 p-4 text-center w-full">
                                      <p className="text-sm font-semibold text-slate-100">Preview your payment QR</p>
                                      <p className="text-xs text-slate-400">Load the QR code only when you are ready to pay so the page stays responsive.</p>
                                      <button
                                        type="button"
                                        onClick={() => setShowQr(true)}
                                        className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition w-full sm:w-auto"
                                      >
                                        Show QR code
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <img
                                        src={buildPaymentQrUrl(selectedPlan)}
                                        alt="Payment QR code"
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full max-w-[180px] md:max-w-[200px] rounded-3xl bg-slate-900 p-3 mx-auto"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <p className="text-xs text-slate-400 text-center max-w-[240px] w-full mx-auto">
                                        Scan this QR to pay {selectedPlan.price} to SkillSwap Premium. Use any UPI-enabled app or payment method that supports the QR.
                                      </p>
                                    </>
                                  )}
                                </div>

                                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-800/80 bg-slate-950 p-3 md:p-4">
                                  <div className="space-y-4">
                                    <input
                                      value={paymentReference}
                                      onChange={(e) => setPaymentReference(e.target.value)}
                                      placeholder="Payment reference or transaction ID"
                                      className="input w-full"
                                    />

                                    <button
                                      type="button"
                                      onClick={handleActivatePremium}
                                      className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition w-full"
                                    >
                                      Verify payment & unlock
                                    </button>
                                  </div>

                                  <div className="rounded-3xl border border-slate-700/80 bg-slate-900 p-3 md:p-4 text-sm text-slate-300">
                                    <p className="font-semibold text-slate-100">Verification</p>
                                    <p className="mt-2 text-xs text-slate-400">After paying, enter the transaction or reference ID here and tap Verify to unlock premium chat.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-3 bg-gradient-to-b from-slate-950 to-slate-900/70">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500">
                      No messages yet. Say hello and start learning together.
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isMe = (msg.senderId?._id || msg.senderId) === (user?._id || user?.id);
                    const displayContent = sanitizeChatText(msg.content);
                    return (
                      <div key={msg._id || `${msg.createdAt}-${msg.content}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] md:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow ${
                            isMe
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-md"
                              : "bg-slate-800/90 text-slate-100 rounded-bl-md border border-slate-700/70"
                          }`}
                        >
                          {displayContent && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {renderMessageContent(displayContent)}
                            </p>
                          )}

                          {msg.fileUrl && (
                            <img
                              src={msg.fileUrl}
                              alt="Shared"
                              className="rounded-lg mt-2 max-h-72 w-auto object-cover border border-slate-700/60"
                            />
                          )}

                          <div className="text-[10px] mt-1.5 flex items-center gap-1.5 opacity-80">
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && <span>{msg.isRead ? "Seen" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {typingUser && (
                    <div className="text-xs text-slate-400 px-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        {typingUser} is typing...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 md:p-4 border-t border-slate-800/80 bg-slate-950/90">
                  <div className="flex items-center gap-2 md:gap-3 bg-slate-900/80 border border-slate-700 rounded-2xl p-2">
                    <input
                      className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-500"
                      placeholder={isChatLocked ? "Free chat ended. Unlock Premium to continue." : "Type a message..."}
                      value={input}
                      onChange={handleTyping}
                      disabled={isChatLocked}
                    />

                    <input type="file" ref={fileInputRef} hidden onChange={handleImage} />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-200"
                      aria-label="Attach image"
                      disabled={isChatLocked}
                    >
                      📎
                    </button>

                    <button
                      type="submit"
                      disabled={!input.trim() || isChatLocked}
                      className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
                    >
                      Send
                    </button>
                  </div>
                  {isChatLocked && (
                    <p className="mt-2 text-xs text-amber-300">Your chat is locked. Unlock Premium to keep messaging.</p>
                  )}
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 px-6 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-base text-slate-300">Select a conversation</p>
                <p className="text-sm text-slate-500 mt-1">
                  Start chatting with your matches to schedule sessions quickly.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;