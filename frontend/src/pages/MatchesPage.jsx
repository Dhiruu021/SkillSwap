import React, { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const MatchesPage = () => {

const [suggested,setSuggested] = useState([]);
const [matches,setMatches] = useState([]);
const [creatingId,setCreatingId] = useState(null);
const [loading,setLoading] = useState(true);

const [currentIndex,setCurrentIndex] = useState(0);
const [activeTab,setActiveTab] = useState("suggested");

/* LOAD */

const load = async()=>{
setLoading(true);
const [sRes,mRes] = await Promise.all([
api.get("/matches/suggested"),
api.get("/matches")
]);
setSuggested(sRes.data || []);
setMatches(mRes.data || []);
setLoading(false);
};

useEffect(()=>{ load(); },[]);

/* MATCH SCORE */

const getMatchScore = (item)=>
(item?.teachToLearn?.length || 0)+(item?.learnToTeach?.length || 0);

/* COMPATIBILITY */

const getCompatibility = (item)=>{
const score = getMatchScore(item);
return Math.min(100, score * 25);
};

/* AI EXPLANATION */

const getExplanation = (item)=>{
if(getMatchScore(item) >= 3)
return "Strong match based on multiple shared skills";

if(getMatchScore(item) === 2)
return "Good match with mutual skill exchange";

return "Partial match, may need more alignment";
};

/* CREATE MATCH */

const handleCreateMatch = async(item)=>{
setCreatingId(item.user.id);

await api.post("/matches",{
otherUserId:item.user.id,
teachSkill:item.teachToLearn[0],
learnSkill:item.learnToTeach[0]
});

alert(`🎉 Match created with ${item.user.name}`);

await load();
setCreatingId(null);
};

/* SWIPE */

const handleNext = ()=>{
setCurrentIndex(prev => prev + 1);
};

/* CURRENT ITEM */

const currentItem = suggested[currentIndex];

if(loading){
return <div className="text-center text-slate-400 py-10">Loading...</div>;
}

return(

<div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

<h1 className="text-3xl font-bold text-center text-indigo-400">
🔥 Smart Match Discovery
</h1>

{/* SWIPE CARD */}

{activeTab==="suggested" && currentItem && (

<div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700 space-y-5 text-center">

{/* USER */}

<div>
<div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl text-indigo-300">
{currentItem.user.name?.[0]}
</div>

<p className="text-xl font-semibold text-white mt-2">
{currentItem.user.name}
</p>

<p className="text-sm text-slate-400">
{currentItem.user.country}
</p>
</div>

{/* SKILLS */}

<div className="flex flex-wrap justify-center gap-2">

{currentItem.teachToLearn.map(skill=>(
<span key={skill} className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs">
Teach: {skill}
</span>
))}

{currentItem.learnToTeach.map(skill=>(
<span key={skill} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
Learn: {skill}
</span>
))}

</div>

{/* COMPATIBILITY */}

<div>
<div className="h-2 bg-slate-700 rounded">
<div
className="h-2 bg-indigo-400 rounded"
style={{width:`${getCompatibility(currentItem)}%`}}
/>
</div>

<p className="text-sm text-indigo-300 mt-1">
Compatibility: {getCompatibility(currentItem)}%
</p>
</div>

{/* AI EXPLANATION */}

<p className="text-xs text-slate-400 italic">
🧠 {getExplanation(currentItem)}
</p>

{/* ACTIONS */}

<div className="flex justify-center gap-4">

<button
onClick={handleNext}
className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600"
>
Skip
</button>

<button
onClick={()=>handleCreateMatch(currentItem)}
className="px-4 py-2 bg-indigo-500 rounded text-white"
>
{creatingId===currentItem.user.id ? "Matching..." : "Match"}
</button>

</div>

</div>

)}

{/* EMPTY */}

{activeTab==="suggested" && !currentItem && (
<div className="text-center text-slate-400">
No more suggestions 😅
</div>
)}

{/* MATCHES LIST */}

{activeTab==="matches" && (

<div className="space-y-4">

{matches.map(match=>(

<div
key={match._id}
className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 flex justify-between"
>

<div>
<p className="text-white">
{match.users.map(u=>u.name).join(" ↔ ")}
</p>
<p className="text-sm text-slate-400">
{match.teachSkill} → {match.learnSkill}
</p>
</div>

<span className="text-xs text-indigo-300">
{match.status}
</span>

</div>

))}

</div>

)}

{/* TAB SWITCH */}

<div className="flex justify-center gap-3">

<button
onClick={()=>setActiveTab("suggested")}
className="px-3 py-1 bg-slate-800 rounded"
>
Discover
</button>

<button
onClick={()=>setActiveTab("matches")}
className="px-3 py-1 bg-slate-800 rounded"
>
Matches
</button>

</div>

</div>

);

};

export default MatchesPage;