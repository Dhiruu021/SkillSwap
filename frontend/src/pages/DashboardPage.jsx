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

<div className="w-full">

{/* HERO SECTION */}

<div className="bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 px-4 py-12 md:py-16">

<div className="max-w-6xl mx-auto">

<div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">

{/* TEXT SECTION */}

<div className="space-y-6 order-2 md:order-1">

<div className="space-y-2">

<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
Exchange Skills, Build Community
</h1>


<p className="text-sm text-slate-400 font-bold pt-4 border-t border-slate-800">
  Welcome back, <span className="text-indigo-400 font-semibold">
    {user?.gender === 'male' ? 'Mr.' : user?.gender === 'female' ? 'Ms.' : ''} {user?.name || "Learner"}
  </span>! Start your learning journey today.
</p>

</div>

<div className="space-y-4 text-slate-300">

<p className="text-base leading-relaxed">
SkillSwap is a revolutionary platform designed to connect people who want to <span className="text-indigo-400 font-semibold">learn and teach skills</span> with each other. Whether you're an expert in design, coding, languages, or any craft, you can share your knowledge while learning new skills from others.
</p>

<div className="space-y-3">

<div className="flex gap-3">

<div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 mt-1">

<span className="text-indigo-400 text-xs">✓</span>

</div>

<div>

<p className="font-semibold text-slate-100">Learn New Skills</p>

<p className="text-sm text-slate-400">Find mentors and experts willing to teach you what you want to learn</p>

</div>

</div>

<div className="flex gap-3">

<div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0 mt-1">

<span className="text-green-400 text-xs">✓</span>

</div>

<div>

<p className="font-semibold text-slate-100">Share Your Expertise</p>

<p className="text-sm text-slate-400">Teach others what you know and build credibility in your field</p>

</div>

</div>

<div className="flex gap-3">

<div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 mt-1">

<span className="text-cyan-400 text-xs">✓</span>

</div>

<div>

<p className="font-semibold text-slate-100">Flexible Sessions</p>

<p className="text-sm text-slate-400">Schedule sessions that work for your timezone and availability</p>

</div>

</div>

<div className="flex gap-3">

<div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0 mt-1">

<span className="text-purple-400 text-xs">✓</span>

</div>

<div>

<p className="font-semibold text-slate-100">Global Community</p>

<p className="text-sm text-slate-400">Connect with learners and teachers from around the world</p>

</div>

</div>

</div>

</div>



</div>

{/* IMAGE SECTION */}

<div className="order-1 md:order-2 flex justify-center">

<svg viewBox="0 0 400 400" className="w-full max-w-sm md:max-w-md" xmlns="http://www.w3.org/2000/svg">

{/* Background circle */}

<defs>

<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">

<stop offset="0%" style={{stopColor: '#4f46e5', stopOpacity: 0.1}} />

<stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 0.1}} />

</linearGradient>

<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">

<stop offset="0%" style={{stopColor: '#4f46e5'}} />

<stop offset="100%" style={{stopColor: '#0ea5e9'}} />

</linearGradient>

</defs>

<circle cx="200" cy="200" r="180" fill="url(#bgGrad)" />

{/* Left person */}

<circle cx="120" cy="140" r="35" fill="#4f46e5" opacity="0.3" />

<circle cx="120" cy="140" r="30" fill="#4f46e5" opacity="0.5" />

<rect x="100" y="170" width="40" height="50" rx="5" fill="#4f46e5" opacity="0.5" />

<rect x="90" y="220" width="25" height="60" rx="3" fill="#4f46e5" opacity="0.4" />

<rect x="115" y="220" width="25" height="60" rx="3" fill="#4f46e5" opacity="0.4" />

{/* Right person */}

<circle cx="280" cy="140" r="35" fill="#06b6d4" opacity="0.3" />

<circle cx="280" cy="140" r="30" fill="#06b6d4" opacity="0.5" />

<rect x="260" y="170" width="40" height="50" rx="5" fill="#06b6d4" opacity="0.5" />

<rect x="250" y="220" width="25" height="60" rx="3" fill="#06b6d4" opacity="0.4" />

<rect x="275" y="220" width="25" height="60" rx="3" fill="#06b6d4" opacity="0.4" />

{/* Connecting arrows */}

<path d="M 150 180 Q 200 190 250 180" stroke="url(#grad1)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />

<path d="M 250 220 Q 200 210 150 220" stroke="url(#grad1)" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" />

{/* Arrow marker */}

<defs>

<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">

<polygon points="0 0, 10 5, 0 10" fill="#4f46e5" />

</marker>

</defs>

{/* Skill icons */}

<circle cx="100" cy="100" r="18" fill="#ec4899" opacity="0.2" />

<text x="100" y="107" textAnchor="middle" fill="#ec4899" fontSize="20">💻</text>

<circle cx="300" cy="100" r="18" fill="#f59e0b" opacity="0.2" />

<text x="300" y="107" textAnchor="middle" fill="#f59e0b" fontSize="20">🎨</text>

<circle cx="80" cy="320" r="18" fill="#10b981" opacity="0.2" />

<text x="80" y="327" textAnchor="middle" fill="#10b981" fontSize="20">📚</text>

<circle cx="320" cy="320" r="18" fill="#3b82f6" opacity="0.2" />

<text x="320" y="327" textAnchor="middle" fill="#3b82f6" fontSize="20">🌍</text>

</svg>

</div>

</div>

</div>

</div>






{/* RECENT MATCHES */}

<div className="space-y-4">

<h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">

<span className="text-2xl"></span> Recent Matches

</h2>

{matches.length===0 ? (

<div className="card p-8 text-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30">

<p className="text-slate-400">No matches yet</p>

<p className="text-xs text-slate-500 mt-2">Start by exploring skills or creating a profile!</p>

</div>

) : (

<div className="grid gap-3">

{matches.slice(0,5).map((match, idx)=>(
<div
key={match._id}
className="card p-4 bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-slate-700/30 hover:border-slate-600/60 hover:bg-gradient-to-r hover:from-slate-800/60 hover:to-slate-900/60 transition-all group"
>

<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">

<div className="flex-1">

<div className="flex items-center gap-2 mb-2">

<span className="text-xs font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
#{idx + 1}
</span>

<p className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">

{match.users
.map(u=>u.name)
.filter(Boolean)
.join(" ↔ ")}

</p>

</div>

<div className="space-y-1">

<p className="text-xs text-slate-400">

🎓 Teach:{" "}
<span className="text-indigo-400 font-medium">
{match.teachSkill}
</span>

</p>

<p className="text-xs text-slate-400">

📚 Learn:{" "}
<span className="text-green-400 font-medium">
{match.learnSkill}
</span>

</p>

</div>

</div>

<div className="flex items-center gap-2">

<span className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all
${match.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/50' :
match.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
match.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' :
'bg-slate-700/50 text-slate-300 border-slate-600/50'}`}>
{match.status}
</span>

</div>

</div>

</div>

))}

</div>

)}

</div>

</div>

);

};

export default DashboardPage;