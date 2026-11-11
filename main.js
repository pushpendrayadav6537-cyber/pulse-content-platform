import { createClient } from '@supabase/supabase-js'
import './style.css'
const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const sb=(url&&key)?createClient(url,key):null
const $=s=>document.querySelector(s)
$('#app').innerHTML=`
<header><b class="brand">PULSE<span>.</span></b><span class="tag">GUEST LIBRARY</span></header>
<main><section class="hero"><small>WATCH • CHAT • CONNECT</small><h1>Your content,<br>one place.</h1><p>Enter a display name to browse the shared library.</p></section>
<section id="gate" class="panel"><h2>Welcome, guest</h2><label>Display name</label><input id="name" maxlength="40" placeholder="Your name"><button id="join">Enter library</button><p id="notice" class="muted"></p></section>
<section id="inside" hidden><div class="welcome"><h2 id="wel"></h2><button class="secondary" id="leave">Exit</button></div>
<nav><button data-view="library" class="active">Library</button><button data-view="chat">Chat</button><button data-view="admin">Admin</button></nav>
<section class="panel view" id="library"><h2>Available videos</h2><div id="items" class="grid"></div></section>
<section class="panel view" id="chat" hidden><h2>Guest chat</h2><p class="muted">Messages are shared in the live chat room.</p><div id="msgs" class="messages"></div><form id="send"><input id="message" placeholder="Write a message…" maxlength="2000" required><button>Send</button></form></section>
<section class="panel view" id="admin" hidden><h2>Admin sign-in</h2><p class="muted">Admin tools are restricted to authenticated admin accounts.</p><label>Email</label><input id="email" type="email"><label>Password</label><input id="password" type="password"><button id="login">Sign in</button><p id="adminnote" class="muted"></p><div id="adminarea" hidden><h3>Upload content</h3><label>Title</label><input id="title"><label>Description</label><input id="desc"><label>Video file</label><input id="file" type="file" accept="video/*"><button id="upload">Upload video</button><p id="upnote"></p></div></section>
</section></main><footer>Pulse • Shared guest library</footer>`
let guestName='',guestId=null,chatChannel=null
const note=t=>$('#notice').textContent=t
$('#join').onclick=async()=>{
 guestName=$('#name').value.trim();if(!guestName)return note('Please enter a name.')
 $('#gate').hidden=true;$('#inside').hidden=false;$('#wel').textContent='Hi, '+guestName
 if(!sb){note('Supabase config missing. Add .env values then restart.');return}
 const {data,error}=await sb.from('content').select('id,title,description,category,storage_path,mime_type').eq('published',true).order('created_at',{ascending:false})
 if(error){$('#items').innerHTML='<p class="muted">Database setup is not complete yet. Run supabase/schema.sql first.</p>';return}
 $('#items').innerHTML=data.length?data.map(c=>`<article class="tile"><div class="thumb">▶</div><h3>${esc(c.title)}</h3><p>${esc(c.description||'')}</p><small>${esc(c.category||'General')}</small></article>`).join(''):'<p>No videos published yet.</p>'
}
$('#leave').onclick=()=>{if(chatChannel)sb?.removeChannel(chatChannel);$('#inside').hidden=true;$('#gate').hidden=false}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==b.dataset.view)})
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#login').onclick=async()=>{if(!sb)return $('#adminnote').textContent='Supabase config missing';const {error}=await sb.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});$('#adminnote').textContent=error?.message||'Signed in';if(!error)$('#adminarea').hidden=false}
$('#upload').onclick=async()=>{
 const f=$('#file').files[0],title=$('#title').value.trim();if(!f||!title)return $('#upnote').textContent='Title and video file required'
 const user=(await sb.auth.getUser()).data.user;if(!user)return $('#upnote').textContent='Admin sign-in required'
 const path=`${user.id}/${Date.now()}-${f.name.replace(/[^\w.-]/g,'_')}`
 const {error:e1}=await sb.storage.from('videos').upload(path,f,{upsert:false})
 if(e1)return $('#upnote').textContent=e1.message
 const {error:e2}=await sb.from('content').insert({title,description:$('#desc').value,storage_path:path,mime_type:f.type,created_by:user.id})
 $('#upnote').textContent=e2?.message||'Uploaded! Refresh Library to see it.'
}
$('#send').onsubmit=async e=>{e.preventDefault();if(!sb)return;const m=$('#message').value.trim();if(!m)return;const {error}=await sb.from('chat_messages').insert({sender_role:'guest',message:m});if(error)alert(error.message);$('#message').value=''}
if(sb){
 sb.channel('pulse-chat').on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},p=>{const m=p.new;$('#msgs').insertAdjacentHTML('beforeend',`<p><b>${esc(m.sender_role)}</b>: ${esc(m.message)}</p>`)}).subscribe()
}
