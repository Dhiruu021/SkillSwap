import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

const DashboardPage = () => {
const { user } = useAuth();

const [matches,setMatches] = useState([]);
const [sessions,setSessions] = useState([]);

const [loading,setLoading] = useState(true);

/* LOAD */

useEffect(()=>{

const load = async()=>{

try{

const [matchesRes,sessionsRes] = await Promise.all([
api.get("/matches"),
api.get("/sessions")
]);

setMatches(matchesRes.data || []);
setSessions(sessionsRes.data || []);

}catch{}

finally{

setLoading(false);

}

};

load();

},[]);

/* STATS */

const activeMatches = matches.length;
const totalSessions = sessions.length;

const upcomingSessions =
sessions.filter(s=>s.status==="accepted");

const pendingSessions =
sessions.filter(s=>s.status==="pending");

const completedSessions =
sessions.filter(s=>s.status==="completed");

const completionRate = totalSessions
? Math.round((completedSessions.length/totalSessions)*100)
: 0;

/* NEXT SESSION */

const nextSession =
[...upcomingSessions].sort(
(a,b)=> new Date(a.scheduledAt)-new Date(b.scheduledAt)
)[0];

/* LOADING */

if(loading){

return(

<div className="flex items-center justify-center h-40 text-slate-400">
Loading dashboard...
</div>

);

}

/* UI */

return(

<div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

{/* TITLE */}

<div className="card p-5 md:p-6 bg-gradient-to-r from-indigo-600/20 via-slate-800 to-slate-900 border-indigo-500/30">
<p className="text-xs uppercase tracking-wider text-indigo-300">
Overview
</p>
<h1 className="text-2xl md:text-3xl font-bold text-slate-100 mt-1">
Dashboard
</h1>
<p className="text-sm text-slate-300 mt-2">
Track your learning progress, upcoming sessions, and match activity in one place.
</p>
{user?.country && (
<p className="text-xs text-cyan-300 mt-2">
🌍 Based in {user.country}
</p>
)}
</div>

{/* STATS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

{/* MATCHES */}

<div className="card p-4">

<p className="text-xs uppercase text-slate-400">
Active Matches
</p>

<p className="text-2xl md:text-3xl font-bold text-indigo-400 mt-2">
{activeMatches}
</p>

</div>

{/* UPCOMING */}

<div className="card p-4">

<p className="text-xs uppercase text-slate-400">
Upcoming Sessions
</p>

<p className="text-2xl md:text-3xl font-bold text-green-400 mt-2">
{upcomingSessions.length}
</p>

</div>

{/* PENDING */}

<div className="card p-4">

<p className="text-xs uppercase text-slate-400">
Pending Requests
</p>

<p className="text-2xl md:text-3xl font-bold text-yellow-400 mt-2">
{pendingSessions.length}
</p>

</div>

{/* COMPLETED */}

<div className="card p-4">

<p className="text-xs uppercase text-slate-400">
Completed Sessions
</p>

<p className="text-2xl md:text-3xl font-bold text-purple-400 mt-2">
{completedSessions.length}
</p>

</div>

</div>

{/* SECONDARY INSIGHTS */}

<div className="grid md:grid-cols-2 gap-4">
<div className="card p-4">
<p className="text-xs uppercase text-slate-400">
Total Sessions
</p>
<p className="text-2xl md:text-3xl font-bold text-cyan-400 mt-2">
{totalSessions}
</p>
<p className="text-xs text-slate-500 mt-2">
Includes pending, accepted, completed and rejected sessions
</p>
</div>

<div className="card p-4">
<p className="text-xs uppercase text-slate-400">
Completion Rate
</p>
<p className="text-2xl md:text-3xl font-bold text-emerald-400 mt-2">
{completionRate}%
</p>
<div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
<div
className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
style={{width:`${completionRate}%`}}
/>
</div>
</div>
</div>

{/* NEXT SESSION + UPCOMING LIST */}

<div className="grid lg:grid-cols-2 gap-4">

<div className="card p-4">

<h2 className="text-lg font-semibold text-slate-100 mb-2">
Next Session
</h2>

{nextSession ? (
<>
<p className="text-sm text-slate-300">

Skill:{" "}
<span className="text-indigo-400 font-medium">
{nextSession.skill}
</span>

</p>

<p className="text-sm text-slate-400 mt-1">

{new Date(nextSession.scheduledAt).toLocaleString()}

</p>
</>
) : (
<p className="text-sm text-slate-400">
No accepted session scheduled yet
</p>
)}

</div>

<div className="card p-4">
<h2 className="text-lg font-semibold text-slate-100 mb-2">
Upcoming Sessions
</h2>

{upcomingSessions.length===0 &&(
<p className="text-sm text-slate-400">
No upcoming sessions right now
</p>
)}

<div className="space-y-2">
{[...upcomingSessions]
.sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt))
.slice(0,3)
.map(s=>(
<div
key={s._id}
className="rounded-lg border border-slate-700/80 bg-slate-900/60 p-3"
>
<p className="text-sm font-medium text-slate-100">
{s.skill}
</p>
<p className="text-xs text-slate-400 mt-1">
{new Date(s.scheduledAt).toLocaleString()}
</p>
</div>
))}
</div>
</div>

</div>

{/* RECENT MATCHES */}

<div className="space-y-3">

<h2 className="text-lg font-semibold text-slate-100">
Recent Matches
</h2>

{matches.length===0 &&(

<div className="card p-4 text-slate-400">
No matches yet
</div>

)}

{matches.slice(0,3).map(match=>(

<div
key={match._id}
className="card p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
>

<div>

<p className="text-sm font-semibold text-slate-100">

{match.users
.map(u=>u.name)
.filter(Boolean)
.join(" ↔ ")}

</p>

<p className="text-xs text-slate-400 mt-1">

Teach:{" "}
<span className="text-indigo-400">
{match.teachSkill}
</span>

{" · "}

Learn:{" "}
<span className="text-green-400">
{match.learnSkill}
</span>

</p>

</div>

<span className="text-xs px-2 py-1 bg-slate-800 rounded w-fit">
{match.status}
</span>

</div>

))}

</div>

</div>

);

};

export default DashboardPage;