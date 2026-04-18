import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const NotificationsPage = () => {

const [notifications,setNotifications] = useState([]);
const [loading,setLoading] = useState(true);
const [filter,setFilter] = useState("all"); // all | unread

/* LOAD */

const load = async()=>{
try{
setLoading(true);
const res = await api.get("/notifications");
setNotifications(res.data || []);
}catch{}
finally{
setLoading(false);
}
};

useEffect(()=>{
load();
},[]);

/* MARK READ */

const markRead = async(id)=>{
await api.patch(`/notifications/${id}/read`);

setNotifications(prev =>
prev.map(n =>
n._id === id ? {...n,isRead:true} : n
)
);
};

/* MARK ALL */

const markAllRead = async()=>{
await Promise.all(
notifications
.filter(n=>!n.isRead)
.map(n=>api.patch(`/notifications/${n._id}/read`))
);

setNotifications(prev =>
prev.map(n=>({...n,isRead:true}))
);
};

/* FILTER */

const filteredNotifications = notifications.filter(n=>{
if(filter==="unread") return !n.isRead;
return true;
});

/* GROUPING */

const groupNotifications = () => {
const today = [];
const yesterday = [];
const older = [];

const now = new Date();

filteredNotifications.forEach(n=>{
const date = new Date(n.createdAt);

const diffDays = Math.floor((now - date)/(1000*60*60*24));

if(diffDays === 0){
today.push(n);
}else if(diffDays === 1){
yesterday.push(n);
}else{
older.push(n);
}
});

return { today, yesterday, older };
};

const { today, yesterday, older } = groupNotifications();

/* TIME FORMAT */

const formatTime = (date)=>{
return new Date(date).toLocaleString();
};

const unreadCount = notifications.filter(n=>!n.isRead).length;

if(loading){
return(
<div className="flex justify-center items-center h-40 text-slate-400">
Loading notifications...
</div>
);
}

return(

<div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

{/* HEADER */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

<div>
<h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
Notifications
</h1>
<p className="text-slate-400 text-sm">
Stay updated with your activity
</p>
</div>

{/* FILTER + ACTION */}

<div className="flex items-center gap-3 flex-wrap">

{/* FILTER */}

<div className="flex gap-2">

<button
onClick={()=>setFilter("all")}
className={`px-3 py-1 text-xs rounded ${
filter==="all"
? "bg-indigo-500/20 text-indigo-300"
: "bg-slate-800 text-slate-400"
}`}
>
All
</button>

<button
onClick={()=>setFilter("unread")}
className={`px-3 py-1 text-xs rounded ${
filter==="unread"
? "bg-indigo-500/20 text-indigo-300"
: "bg-slate-800 text-slate-400"
}`}
>
Unread
</button>

</div>

{/* BADGE */}

{unreadCount > 0 && (
<span className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
{unreadCount} unread
</span>
)}

{/* MARK ALL */}

{unreadCount > 0 && (
<button
onClick={markAllRead}
className="text-xs px-3 py-1 rounded border border-slate-600 hover:bg-slate-700 transition"
>
Mark all read
</button>
)}

</div>

</div>

{/* GROUP SECTION */}

<div className="space-y-6">

{/* SECTION COMPONENT */}

{[
{title:"Today", data:today},
{title:"Yesterday", data:yesterday},
{title:"Earlier", data:older}
].map(section => (

section.data.length > 0 && (

<div key={section.title} className="space-y-3">

<h2 className="text-xs uppercase text-slate-500 tracking-wider">
{section.title}
</h2>

{section.data.map(n=>(

<div
key={n._id}
className={`p-4 rounded-xl border transition-all hover:bg-slate-900/80
${!n.isRead 
? "border-indigo-500/40 bg-slate-900/60" 
: "border-slate-700 bg-slate-900/40"
}`}
>

<div className="flex flex-col sm:flex-row sm:justify-between gap-3">

{/* LEFT */}

<div className="flex gap-3">

{!n.isRead && (
<div className="mt-2 h-2 w-2 rounded-full bg-indigo-500 animate-pulse"/>
)}

<div>

<p className="text-sm font-semibold text-white">
{n.title}
</p>

<p className="text-xs text-slate-400">
{n.body}
</p>

<p className="text-[11px] text-slate-500 mt-1">
🕒 {formatTime(n.createdAt)}
</p>

</div>

</div>

{/* RIGHT */}

{!n.isRead && (
<button
onClick={()=>markRead(n._id)}
className="text-xs px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition"
>
Mark read
</button>
)}

</div>

</div>

))}

</div>

)

))}

{/* EMPTY */}

{filteredNotifications.length === 0 && (
<div className="p-6 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-700">
No notifications found 🔕
</div>
)}

</div>

</div>

);

};

export default NotificationsPage;