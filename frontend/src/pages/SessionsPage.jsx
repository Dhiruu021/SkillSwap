import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

const SessionsPage = () => {

const { user } = useAuth();
const userTimeZone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const [sessions,setSessions] = useState([]);
const [loading,setLoading] = useState(true);
const [creating,setCreating] = useState(false);
const [error,setError] = useState("");

const [newSession,setNewSession] = useState({
teacherId:"",
skill:"",
scheduledAt:"",
meetingLink:""
});

const [timeNow,setTimeNow] = useState(Date.now());

/* 🔔 NOTIFICATIONS PERMISSION */

useEffect(()=>{
if("Notification" in window){
Notification.requestPermission();
}
},[]);

/* ⏳ LIVE TIMER */

useEffect(()=>{
const interval = setInterval(()=>{
setTimeNow(Date.now());
},60000);

return ()=>clearInterval(interval);
},[]);

/* 🔄 AUTO REFRESH */

useEffect(()=>{
const interval = setInterval(()=>{
load();
},30000); // every 30s

return ()=>clearInterval(interval);
},[]);

/* LOAD */

const load = async()=>{
try{
setLoading(true);
const res = await api.get("/sessions");
setSessions(res.data || []);
}catch{
setError("Failed to load sessions");
}finally{
setLoading(false);
}
};

useEffect(()=>{
load();
},[]);

/* 🔔 SESSION ALERT */

const notifySession = (session)=>{
if(Notification.permission==="granted"){
new Notification(`Upcoming Session: ${session.skill}`,{
body:`Starts soon with ${session.teacher?.name}`,
});
}
};

/* CREATE */

const handleCreate = async(e)=>{
e.preventDefault();

if(newSession.meetingLink && !isValidMeetingLink(newSession.meetingLink)){
setError("Invalid meeting link (Use Zoom or Google Meet)");
return;
}

if(new Date(newSession.scheduledAt) < new Date()){
setError("Please select future time");
return;
}

setCreating(true);

try{

await api.post("/sessions",newSession);

setNewSession({
teacherId:"",
skill:"",
scheduledAt:"",
meetingLink:""
});

load();

}catch{
setError("Failed to create session");
}finally{
setCreating(false);
}
};

/* VALIDATION */

const isValidMeetingLink = (url)=>{
return url.includes("zoom.us") || url.includes("meet.google.com");
};

/* STATUS */

const getStatusColor = (status)=>{
switch(status){
case "accepted": return "bg-green-500/20 text-green-300";
case "pending": return "bg-yellow-500/20 text-yellow-300";
case "completed": return "bg-blue-500/20 text-blue-300";
default: return "bg-slate-700 text-slate-300";
}
};

/* COUNTDOWN */

const getCountdown=(session)=>{
const diff = new Date(session.scheduledAt) - timeNow;

if(diff<=0) return "Started";

const minutes = Math.floor(diff/1000/60);

if(minutes === 5){
notifySession(session);
}

const h = Math.floor(minutes/60);
const m = minutes%60;

return `${h}h ${m}m`;
};

/* 📊 STATS */

const total = sessions.length;
const completed = sessions.filter(s=>s.status==="completed").length;
const pending = sessions.filter(s=>s.status==="pending").length;

if(loading){
return(
<div className="flex justify-center items-center h-40 text-slate-400">
Loading sessions...
</div>
);
}

return(

<div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

{/* HEADER */}

<div className="text-center">
<h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
Sessions Dashboard 🚀
</h1>
<p className="text-slate-400 text-sm mt-2">
Manage your learning sessions and track your progress
</p>
</div>

{/* 📊 STATS */}

<div className="grid grid-cols-3 gap-4">

<div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-center">
<p className="text-slate-400 text-xs">Total</p>
<p className="text-xl font-bold text-white">{total}</p>
</div>

<div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-center">
<p className="text-slate-400 text-xs">Pending</p>
<p className="text-xl font-bold text-yellow-300">{pending}</p>
</div>

<div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl text-center">
<p className="text-slate-400 text-xs">Completed</p>
<p className="text-xl font-bold text-green-300">{completed}</p>
</div>

</div>

{error &&(
<div className="text-red-300 bg-red-500/10 p-3 rounded">
{error}
</div>
)}

{/* CREATE */}

<div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-4">

<h2 className="text-lg font-semibold text-white">
📅 Book Session
</h2>

<form
onSubmit={handleCreate}
className="grid md:grid-cols-4 gap-3"
>

<input
className="input"
placeholder="Teacher ID"
value={newSession.teacherId}
onChange={(e)=>setNewSession({...newSession,teacherId:e.target.value})}
/>

<input
className="input"
placeholder="Skill"
value={newSession.skill}
onChange={(e)=>setNewSession({...newSession,skill:e.target.value})}
/>

<input
type="datetime-local"
min={new Date().toISOString().slice(0,16)}
className="input"
value={newSession.scheduledAt}
onChange={(e)=>setNewSession({...newSession,scheduledAt:e.target.value})}
/>

<input
className="input"
placeholder="Meeting link (Zoom/Meet)"
value={newSession.meetingLink}
onChange={(e)=>setNewSession({...newSession,meetingLink:e.target.value})}
/>

<button
className="col-span-full btn-primary"
disabled={creating}
>
{creating ? "Booking..." : "🚀 Book Session"}
</button>

</form>

</div>

{/* SESSIONS */}

<div className="space-y-4">

{sessions.map(s=>(
<div
key={s._id}
className="p-5 rounded-xl bg-slate-900/60 border border-slate-700 flex justify-between items-center hover:bg-slate-900/80 transition"
>

<div>

<p className="text-lg font-semibold text-white">
{s.skill}
</p>

<p className="text-sm text-slate-400">
{s.teacher?.name} ↔ {s.learner?.name}
</p>

<p className="text-xs text-indigo-400">
⏳ {getCountdown(s)}
</p>

</div>

<div className="flex flex-col items-end gap-2">

<span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(s.status)}`}>
{s.status}
</span>

{s.meetingLink &&(
<a
href={s.meetingLink}
target="_blank"
rel="noreferrer"
className="text-green-400 text-xs underline"
>
Join
</a>
)}

</div>

</div>
))}

</div>

</div>

);

};

export default SessionsPage;