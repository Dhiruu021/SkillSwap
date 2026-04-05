import React, { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const MatchesPage = () => {

const [suggested,setSuggested] = useState([]);
const [matches,setMatches] = useState([]);
const [creatingId,setCreatingId] = useState(null);
const [loading,setLoading] = useState(true);
const [search,setSearch] = useState("");
const [sortBy,setSortBy] = useState("best");
const [availability,setAvailability] = useState("all");
const [activeTab,setActiveTab] = useState("suggested");

/* LOAD DATA */

const load = async()=>{

try{

setLoading(true);

const [suggestedRes,matchesRes] = await Promise.all([
api.get("/matches/suggested"),
api.get("/matches")
]);

setSuggested(suggestedRes.data || []);
setMatches(matchesRes.data || []);

}catch(err){

console.error(err);

}finally{

setLoading(false);

}

};

useEffect(()=>{
load();
},[]);

/* CREATE MATCH */

const handleCreateMatch = async(item)=>{

if(!item.teachToLearn.length || !item.learnToTeach.length)
return;

try{

setCreatingId(item.user.id);

await api.post("/matches",{
otherUserId:item.user.id,
teachSkill:item.teachToLearn[0],
learnSkill:item.learnToTeach[0]
});

await load();

}catch(err){

console.error(err);

}finally{

setCreatingId(null);

}

};

const normalizedSearch = search.trim().toLowerCase();

const getMatchScore = (item) =>
  (item?.teachToLearn?.length || 0) + (item?.learnToTeach?.length || 0);

const getUserSkillText = (item) =>
  [...(item.teachToLearn || []), ...(item.learnToTeach || [])]
    .join(" ")
    .toLowerCase();

const filteredSuggested = useMemo(() => {
  const base = [...suggested].filter((item) => {
    const name = item?.user?.name?.toLowerCase() || "";
    const bio = item?.user?.bio?.toLowerCase() || "";
    const skills = getUserSkillText(item);

    const searchMatch =
      !normalizedSearch ||
      name.includes(normalizedSearch) ||
      bio.includes(normalizedSearch) ||
      skills.includes(normalizedSearch);

    const availabilityMatch =
      availability === "all" ||
      (availability === "ready" && getMatchScore(item) >= 2) ||
      (availability === "needs_more" && getMatchScore(item) < 2);

    return searchMatch && availabilityMatch;
  });

  if (sortBy === "name") {
    return base.sort((a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""));
  }

  if (sortBy === "new") {
    return base.sort((a, b) => (b.user?.createdAt || "").localeCompare(a.user?.createdAt || ""));
  }

  return base.sort((a, b) => getMatchScore(b) - getMatchScore(a));
}, [availability, normalizedSearch, sortBy, suggested]);

const filteredMatches = useMemo(() => {
  const base = [...matches].filter((match) => {
    const names = (match.users || []).map((u) => (u?.name || "").toLowerCase()).join(" ");
    const skills = `${match.teachSkill || ""} ${match.learnSkill || ""}`.toLowerCase();
    const status = (match.status || "").toLowerCase();
    return !normalizedSearch || names.includes(normalizedSearch) || skills.includes(normalizedSearch) || status.includes(normalizedSearch);
  });

  return base.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
}, [matches, normalizedSearch]);

const acceptedMatches = matches.filter((m) => m.status === "accepted").length;
const pendingMatches = matches.filter((m) => m.status === "pending").length;
const suggestionStrength = filteredSuggested.filter((item) => getMatchScore(item) >= 2).length;

/* LOADING */

if(loading){

return(

<div className="flex items-center justify-center h-40 text-slate-400">
Loading matches...
</div>

);

}

/* UI */

return(

<div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

{/* TITLE */}

<div>

<h1 className="text-2xl md:text-3xl font-bold text-slate-100">
Skill Matches
</h1>

<p className="text-slate-400 text-sm mt-1">
Discover people whose skills complement yours and start better swaps faster
</p>

</div>

{/* QUICK STATS */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
<div className="card p-4">
<p className="text-xs uppercase tracking-wide text-slate-400">Suggestions</p>
<p className="text-2xl font-bold text-indigo-400 mt-1">{suggested.length}</p>
</div>
<div className="card p-4">
<p className="text-xs uppercase tracking-wide text-slate-400">Strong Fit</p>
<p className="text-2xl font-bold text-emerald-400 mt-1">{suggestionStrength}</p>
</div>
<div className="card p-4">
<p className="text-xs uppercase tracking-wide text-slate-400">Accepted</p>
<p className="text-2xl font-bold text-cyan-400 mt-1">{acceptedMatches}</p>
</div>
<div className="card p-4">
<p className="text-xs uppercase tracking-wide text-slate-400">Pending</p>
<p className="text-2xl font-bold text-amber-400 mt-1">{pendingMatches}</p>
</div>
</div>

{/* CONTROLS */}

<div className="card p-4 md:p-5 space-y-4">
<div className="flex flex-col md:flex-row gap-3 md:items-center">
<input
className="input"
placeholder="Search by name, skill, status..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<div className="grid grid-cols-2 gap-3 md:w-[22rem]">
<select
className="input"
value={sortBy}
onChange={(e)=>setSortBy(e.target.value)}
>
<option value="best">Sort: Best fit</option>
<option value="name">Sort: Name</option>
<option value="new">Sort: New users</option>
</select>

<select
className="input"
value={availability}
onChange={(e)=>setAvailability(e.target.value)}
>
<option value="all">All fit levels</option>
<option value="ready">Ready to swap</option>
<option value="needs_more">Needs more overlap</option>
</select>
</div>
</div>

<div className="flex flex-wrap gap-2">
<button
className={`px-3 py-1.5 rounded-full text-xs border transition ${
activeTab==="suggested"
? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
: "border-slate-700 text-slate-300 hover:bg-slate-800"
}`}
onClick={()=>setActiveTab("suggested")}
>
Suggested ({filteredSuggested.length})
</button>
<button
className={`px-3 py-1.5 rounded-full text-xs border transition ${
activeTab==="matches"
? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
: "border-slate-700 text-slate-300 hover:bg-slate-800"
}`}
onClick={()=>setActiveTab("matches")}
>
Your Matches ({filteredMatches.length})
</button>
</div>
</div>

{/* GRID */}

<div className="grid gap-6 md:grid-cols-2">

{/* SUGGESTED MATCHES */}

<div className={`space-y-4 ${activeTab==="matches" ? "hidden md:block" : ""}`}>

<h2 className="text-lg md:text-xl font-semibold text-slate-200">
Suggested Matches
</h2>

{filteredSuggested.length===0 &&(

<div className="card p-4 text-slate-400">
No suggested matches yet
</div>

)}

{filteredSuggested.map(item=>(

<div
key={item.user.id}
className="card p-4 flex flex-col gap-4"
>

{/* USER */}

<div className="space-y-2">

<p className="text-base md:text-lg font-semibold text-slate-100">
{item.user.name}
</p>

{item.user.country && (
<p className="text-xs text-cyan-300">
🌍 {item.user.country}
</p>
)}

<p className="text-xs md:text-sm text-slate-400 line-clamp-2">
{item.user.bio}
</p>

{/* TAGS */}

<div className="flex flex-wrap gap-2 mt-2">

{item.teachToLearn.map(skill=>(

<span
key={skill}
className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs"
>
Teach: {skill}
</span>

))}

{item.learnToTeach.map(skill=>(

<span
key={skill}
className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs"
>
Learn: {skill}
</span>

))}

</div>

<div className="flex items-center justify-between text-xs mt-1">
<span className="text-indigo-400">
✨ Smart match suggestion
</span>
<span className="text-slate-400">
Fit score: <span className="text-indigo-300 font-medium">{getMatchScore(item)}</span>
</span>
</div>

</div>

{/* BUTTON */}

<button
className="btn-primary w-full sm:w-fit text-sm"
onClick={()=>handleCreateMatch(item)}
disabled={creatingId===item.user.id}
>

{creatingId===item.user.id
? "Creating..."
: "Start Match"}

</button>

</div>

))}

</div>

{/* ACTIVE MATCHES */}

<div className={`space-y-4 ${activeTab==="suggested" ? "hidden md:block" : ""}`}>

<h2 className="text-lg md:text-xl font-semibold text-slate-200">
Your Matches
</h2>

{filteredMatches.length===0 &&(

<div className="card p-4 text-slate-400">
You have no active matches yet
</div>

)}

{filteredMatches.map(match=>(

<div
key={match._id}
className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
>

<div>

<p className="text-base md:text-lg font-semibold text-slate-100">

{match.users
.map(u=>u.name)
.filter(Boolean)
.join(" ↔ ")}

</p>

<p className="text-xs md:text-sm text-slate-400 mt-1">

Teach:{" "}
<span className="text-indigo-400 font-medium">
{match.teachSkill}
</span>

{" · "}

Learn:{" "}
<span className="text-emerald-400 font-medium">
{match.learnSkill}
</span>

</p>

</div>

<span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 uppercase tracking-wide w-fit">
{match.status}
</span>

</div>

))}

</div>

</div>

</div>

);

};

export default MatchesPage;