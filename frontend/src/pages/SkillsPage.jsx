import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const SkillsPage = () => {

const [teach,setTeach] = useState("");
const [learn,setLearn] = useState("");

const [loading,setLoading] = useState(false);
const [message,setMessage] = useState("");

/* LOAD SKILLS */

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

/* SAVE */

const handleSubmit = async(e)=>{

e.preventDefault();

setLoading(true);
setMessage("");

try{

await api.put("/skills/me",{

teachSkills:teach
.split(",")
.map(s=>s.trim())
.filter(Boolean),

learnSkills:learn
.split(",")
.map(s=>s.trim())
.filter(Boolean)

});

setMessage("Skills updated successfully");

}catch{

setMessage("Failed to update skills");

}finally{

setLoading(false);

}

};

/* UI */

return(

<div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

{/* TITLE */}

<h1 className="text-2xl md:text-3xl font-bold text-slate-100">
Skill Management
</h1>

{/* FORM */}

<form
onSubmit={handleSubmit}
className="card p-4 md:p-6 space-y-5"
>

{/* TEACH */}

<div className="space-y-1">

<label className="text-sm font-medium text-slate-300">
Skills you can teach
</label>

<textarea
className="input w-full min-h-[90px] md:min-h-[80px]"
placeholder="Example: React, Node.js, Python"
value={teach}
onChange={(e)=>setTeach(e.target.value)}
/>

<p className="text-xs text-slate-500">
Separate skills with commas
</p>

</div>

{/* LEARN */}

<div className="space-y-1">

<label className="text-sm font-medium text-slate-300">
Skills you want to learn
</label>

<textarea
className="input w-full min-h-[90px] md:min-h-[80px]"
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
className="btn-primary w-full md:w-auto"
disabled={loading}
>

{loading ? "Saving..." : "Save skills"}

</button>

{/* MESSAGE */}

{message &&(

<p className="text-sm text-slate-400">
{message}
</p>

)}

</form>

</div>

);

};

export default SkillsPage;