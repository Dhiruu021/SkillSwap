import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";
import { useAuth } from "../state/AuthContext.jsx";

const SessionsPage = () => {

const { user } = useAuth();
const userTimeZone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const locale = user?.languagePreference === "hindi" ? "hi-IN" : "en-US";

const [sessions,setSessions] = useState([]);
const [creating,setCreating] = useState(false);
const [teacherPreview,setTeacherPreview] = useState(null);
const [loading,setLoading] = useState(true);
const [error,setError] = useState("");

const [newSession,setNewSession] = useState({
teacherId:"",
skill:"",
scheduledAt:"",
meetingLink:""
});

const [reviewingId,setReviewingId] = useState(null);

const [review,setReview] = useState({
rating:5,
comment:""
});

/* LOAD */

const load = async()=>{
try{
setLoading(true);
setError("");
const res = await api.get("/sessions");
setSessions(res.data || []);
}catch{
setError("Failed to load sessions");
}finally{
setLoading(false);
}
};

useEffect(()=>{
load().catch(()=>{});
},[]);

/* TEACHER PREVIEW */

const loadTeacher = async(id)=>{

if(!id){
setTeacherPreview(null);
return;
}

try{

const res = await api.get(`/users/${id}`);
setTeacherPreview(res.data?.user || null);

}catch{

setTeacherPreview(null);

}

};

/* STATUS */

const updateStatus = async(id,status)=>{

try{
await api.patch(`/sessions/${id}/status`,{status});
await load();
}catch{
setError("Could not update session status");
}

};

/* CREATE */

const handleCreate = async(e)=>{

e.preventDefault();
setCreating(true);

try{

await api.post("/sessions",{
teacherId:newSession.teacherId.trim(),
skill:newSession.skill.trim(),
scheduledAt:newSession.scheduledAt,
meetingLink:newSession.meetingLink.trim()
});

setNewSession({
teacherId:"",
skill:"",
scheduledAt:"",
meetingLink:""
});

setTeacherPreview(null);

await load();

}catch{
setError("Failed to create session");
}finally{

setCreating(false);

}

};

/* REVIEW */

const handleReviewSubmit = async(session)=>{

if(!user) return;

const isTeacher =
session.teacher?._id === (user._id || user.id);

const revieweeId = isTeacher
? session.learner?._id
: session.teacher?._id;

await api.post("/reviews",{
sessionId:session._id,
revieweeId,
rating:Number(review.rating),
comment:review.comment
});

setReviewingId(null);

setReview({
rating:5,
comment:""
});

};

const canReview = (session) => {
  const me = user?._id || user?.id;
  const isParticipant =
    session.teacher?._id === me || session.learner?._id === me;
  return session.status === "completed" && isParticipant;
};

/* COUNTDOWN */

const getCountdown=(date)=>{

const diff = new Date(date) - new Date();

if(diff<=0) return "Started";

const hours = Math.floor(diff/1000/60/60);
const minutes = Math.floor((diff/1000/60)%60);

return `${hours}h ${minutes}m`;

};

const formatSessionDate = (value) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: userTimeZone
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
};

if(loading){
return(
<div className="flex items-center justify-center h-40 text-slate-400">
Loading sessions...
</div>
);
}

return(

<div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

<h1 className="text-2xl md:text-3xl font-bold text-slate-100">
Sessions
</h1>

{error && (
<div className="card p-3 text-sm text-red-300 border-red-500/30">
{error}
</div>
)}

{/* CREATE SESSION */}

<div className="card p-4 space-y-4">

<p className="text-lg font-semibold text-slate-200">
Book new session
</p>

<form
onSubmit={handleCreate}
className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
>

<input
className="input"
placeholder="Teacher ID"
value={newSession.teacherId}
onChange={(e)=>{
setNewSession(prev=>({...prev,teacherId:e.target.value}));
loadTeacher(e.target.value);
}}
required
/>

<input
className="input"
placeholder="Skill"
value={newSession.skill}
onChange={(e)=>
setNewSession(prev=>({...prev,skill:e.target.value}))
}
required
/>

<input
className="input"
type="datetime-local"
value={newSession.scheduledAt}
onChange={(e)=>
setNewSession(prev=>({...prev,scheduledAt:e.target.value}))
}
required
/>

<input
className="input"
placeholder="Meeting link"
value={newSession.meetingLink}
onChange={(e)=>
setNewSession(prev=>({...prev,meetingLink:e.target.value}))
}
/>

<button
type="submit"
className="btn-primary sm:col-span-2 md:col-span-4"
disabled={creating}
>
{creating ? "Booking..." : "Book Session"}
</button>

</form>

{/* TEACHER PREVIEW */}

{teacherPreview && (

<div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 p-3 rounded">

{teacherPreview.profilePhoto ? (
<img
src={teacherPreview.profilePhoto}
className="w-12 h-12 rounded-full object-cover"
/>
) : (
<div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-semibold">
{teacherPreview.name?.[0] || "T"}
</div>
)}

<div className="text-center sm:text-left">

<p className="text-sm font-semibold text-white">
{teacherPreview.name}
</p>

<p className="text-xs text-slate-400">
Teaches: {(teacherPreview.teachSkills || []).join(", ") || "N/A"}
</p>

</div>

</div>

)}

</div>

{/* SESSION LIST */}

<div className="space-y-4">

{sessions.length===0 &&(

<div className="card p-4 text-slate-400">
No sessions yet
</div>

)}

{sessions.map(session=>(

<div
key={session._id}
className="card p-4 flex flex-col md:flex-row md:justify-between gap-4"
>

{/* LEFT */}

<div className="space-y-1">

<p className="font-semibold text-slate-100">
{session.skill}
</p>

<p className="text-sm text-slate-400">
{session.teacher?.name} / {session.learner?.name}
</p>

<p className="text-xs text-slate-500">
{formatSessionDate(session.scheduledAt)}
</p>

<p className="text-xs text-indigo-400">
Starts in {getCountdown(session.scheduledAt)}
</p>

<p className="text-[11px] text-cyan-300">
Timezone: {userTimeZone}
</p>

{session.meetingLink &&(

<a
href={session.meetingLink}
target="_blank"
rel="noreferrer"
className="text-xs text-green-400 underline"
>
Join Meeting
</a>

)}

</div>

{/* RIGHT */}

<div className="flex flex-col gap-2 md:items-end">

<span className="text-xs px-2 py-1 bg-slate-800 rounded w-fit">
{session.status}
</span>

{session.status==="pending" &&
session.teacher?._id === (user?._id || user?.id) &&(

<div className="flex flex-wrap gap-2">

<button
className="btn-primary text-xs"
onClick={()=>updateStatus(session._id,"accepted")}
>
Accept
</button>

<button
className="border border-slate-700 px-2 py-1 rounded text-xs"
onClick={()=>updateStatus(session._id,"rejected")}
>
Reject
</button>

</div>

)}

{/* REVIEW */}

{canReview(session) &&(

<div className="space-y-2 w-full md:w-56">

{reviewingId===session._id?(

<>

<div className="flex gap-1">

{[1,2,3,4,5].map(star=>(

<button
key={star}
onClick={()=>setReview(prev=>({...prev,rating:star}))}
className={`text-lg ${
review.rating>=star
?"text-yellow-400"
:"text-gray-500"
}`}
>
★
</button>

))}

</div>

<input
className="input text-xs w-full"
placeholder="Write review"
value={review.comment}
onChange={(e)=>
setReview(prev=>({...prev,comment:e.target.value}))
}
/>

<button
className="btn-primary text-xs w-full"
onClick={()=>handleReviewSubmit(session)}
>
Submit Review
</button>

</>

):( 

<button
className="border border-slate-700 px-2 py-1 text-xs rounded w-fit"
onClick={()=>setReviewingId(session._id)}
>
Rate Session
</button>

)}

</div>

)}

</div>

</div>

))}

</div>

</div>

);

};

export default SessionsPage;