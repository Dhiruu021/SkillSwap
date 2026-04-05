import React, { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const NotificationsPage = () => {

const [notifications,setNotifications] = useState([]);

/* LOAD */

const load = async()=>{

const res = await api.get("/notifications");

setNotifications(res.data || []);

};

useEffect(()=>{
load().catch(()=>{});
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

return(

<div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

<h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
Notifications
</h1>

<div className="space-y-3">

{notifications.length === 0 && (

<div className="card p-4 text-center text-slate-500">
No notifications yet
</div>

)}

{notifications.map(n=>(

<div
key={n._id}
className={`card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition
${!n.isRead ? "border-l-4 border-indigo-500 bg-slate-900/40" : ""}
`}
>

{/* LEFT */}

<div className="flex gap-3">

{/* DOT */}

{!n.isRead && (
<div className="mt-2 h-2 w-2 rounded-full bg-indigo-500"/>
)}

<div>

<p className="text-sm md:text-base font-semibold text-slate-100">
{n.title}
</p>

<p className="text-xs md:text-sm text-slate-400">
{n.body}
</p>

<p className="text-[11px] md:text-xs text-slate-500 mt-1">
{new Date(n.createdAt).toLocaleString()}
</p>

</div>

</div>

{/* BUTTON */}

{!n.isRead && (

<button
onClick={()=>markRead(n._id)}
className="btn-primary text-xs md:text-sm px-3 py-1 w-fit self-start sm:self-auto"
>
Mark read
</button>

)}

</div>

))}

</div>

</div>

);

};

export default NotificationsPage;