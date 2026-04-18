import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const SkillsPage = () => {

const [teach,setTeach] = useState("");
const [learn,setLearn] = useState("");

const [loading,setLoading] = useState(false);
const [message,setMessage] = useState("");

useEffect(()=>{

const load = async()=>{

try{

const res = await api.get("/skills/me");

setTeach(res.data.teachSkills.map(s=>s.name).join(", "));
setLearn(res.data.learnSkills.map(s=>s.name).join(", "));

}catch{}

};

load();

},[]);

const handleSubmit = async(e)=>{

e.preventDefault();

setLoading(true);
setMessage("");

try{

await api.put("/skills/me",{

teachSkills:teach.split(",").map(s=>s.trim()).filter(Boolean),
learnSkills:learn.split(",").map(s=>s.trim()).filter(Boolean)

});

setMessage("✅ Skills updated successfully");

}catch{

setMessage("❌ Failed to update skills");

}finally{

setLoading(false);

}

};

return(

<div className="max-w-6xl mx-auto px-4 py-10">

{/* HEADER */}

<div className="mb-8 text-center">
<h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
Manage Your Skills
</h1>
<p className="text-slate-400 text-sm mt-2">
Showcase what you know & learn what you love 🚀
</p>
</div>

{/* GRID LAYOUT */}

<div className="grid md:grid-cols-2 gap-8">

{/* LEFT: FORM */}

<form
onSubmit={handleSubmit}
className="p-6 md:p-8 space-y-6 rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur shadow-xl"
>

{/* TEACH */}

<div className="space-y-2">

<label className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
🎓 Skills you can teach
</label>

<textarea
className="w-full min-h-[100px] rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
placeholder="Example: React, Node.js, Python"
value={teach}
onChange={(e)=>setTeach(e.target.value)}
/>

<p className="text-xs text-slate-500">
Separate skills with commas
</p>

</div>

{/* LEARN */}

<div className="space-y-2">

<label className="text-sm font-semibold text-green-300 flex items-center gap-2">
📚 Skills you want to learn
</label>

<textarea
className="w-full min-h-[100px] rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
placeholder="Example: Docker, AI, UI Design"
value={learn}
onChange={(e)=>setLearn(e.target.value)}
/>

<p className="text-xs text-slate-500">
Separate skills with commas
</p>

</div>

{/* BUTTON */}

<button
type="submit"
className="w-full px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
disabled={loading}
>

{loading ? "Saving..." : "💾 Save Skills"}

</button>

{message &&(
<p className="text-sm text-slate-300">
{message}
</p>
)}

</form>

{/* RIGHT: EXTRA CONTENT */}

<div className="space-y-6">

{/* PREVIEW */}

<div className="p-6 rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur">

<h2 className="text-lg font-semibold text-slate-100 mb-3">
✨ Your Skills Preview
</h2>

<div className="space-y-2 text-sm">

<p className="text-indigo-300">
🎓 Teaching:
</p>
<p className="text-slate-400">
{teach || "No skills added yet"}
</p>

<p className="text-green-300 mt-3">
📚 Learning:
</p>
<p className="text-slate-400">
{learn || "No skills added yet"}
</p>

</div>

</div>

{/* TIPS */}

<div className="p-6 rounded-2xl border border-slate-700/40 bg-slate-900/60">

<h2 className="text-lg font-semibold text-slate-100 mb-3">
💡 Tips to Stand Out
</h2>

<ul className="text-sm text-slate-400 space-y-2">

<li>✔ Add specific skills (React instead of Web Dev)</li>
<li>✔ Keep updating your learning goals</li>
<li>✔ Mix beginner + advanced skills</li>
<li>✔ Be honest about your expertise</li>

</ul>

</div>

{/* STATS */}

<div className="p-6 rounded-2xl border border-slate-700/40 bg-slate-900/60">

<h2 className="text-lg font-semibold text-slate-100 mb-3">
📊 Quick Stats
</h2>

<p className="text-sm text-slate-400">
You have {teach.split(",").filter(Boolean).length} teaching skills
</p>

<p className="text-sm text-slate-400">
You want to learn {learn.split(",").filter(Boolean).length} skills
</p>

</div>

</div>

</div>

</div>

);

};

export default SkillsPage;