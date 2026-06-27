const IMG = "https://image.tmdb.org/t/p/";

/* Veilige opslag: werkt ook als de browser localStorage blokkeert (bv. in een preview/sandbox).
   Valt dan terug op tijdelijk geheugen, zodat de app niet crasht en de knoppen blijven werken. */
const _mem = {};
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return (k in _mem)?_mem[k]:null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ _mem[k]=v; } }
};

let state = {
  key: store.get("tmdb_key") || "",
  region: store.get("tmdb_region") || "NL",
  view: "discover",
  filter: "all",
  lastSearch: [],
  lib: JSON.parse(store.get("myCinemaLib") || "{}") // id -> {item, status}
};

/* ---------- helpers ---------- */
function toast(msg){
  const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function saveLib(){ store.set("myCinemaLib", JSON.stringify(state.lib)); }
function libKey(item){ return (item.media_type||item._mt)+"_"+item.id; }
function getStatus(item){ const e=state.lib[libKey(item)]; return e?e.status:null; }

async function tmdb(path, params={}){
  if(!state.key){ throw new Error("NO_KEY"); }
  const u=new URL("https://api.themoviedb.org/3"+path);
  u.searchParams.set("api_key", state.key);
  u.searchParams.set("language","nl-NL");
  for(const k in params) u.searchParams.set(k, params[k]);
  const r=await fetch(u);
  if(!r.ok){ const e=new Error("HTTP "+r.status); e.code=r.status; throw e; }
  return r.json();
}

/* ---------- views ---------- */
function setView(v){
  state.view=v;
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===v));
  render();
}
function setFilter(f){
  state.filter=f;
  document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c.dataset.f===f));
  render();
}

async function loadDiscover(){
  const grid=document.getElementById("grid");
  grid.innerHTML='<div style="padding:40px"><span class="spinner"></span> Laden…</div>';
  try{
    const calls=[];
    if(state.filter!=="tv") calls.push(tmdb("/trending/movie/week").then(d=>d.results.map(x=>({...x,media_type:"movie"}))));
    if(state.filter!=="movie") calls.push(tmdb("/trending/tv/week").then(d=>d.results.map(x=>({...x,media_type:"tv"}))));
    const res=(await Promise.all(calls)).flat();
    res.sort((a,b)=>b.popularity-a.popularity);
    drawCards(res, "🔥 Trending deze week");
  }catch(e){ handleErr(e); }
}

async function doSearch(){
  const q=document.getElementById("searchInput").value.trim();
  if(!q) return;
  setView("search");
  const grid=document.getElementById("grid");
  grid.innerHTML='<div style="padding:40px"><span class="spinner"></span> Zoeken…</div>';
  try{
    const d=await tmdb("/search/multi",{query:q, include_adult:"false"});
    state.lastSearch=d.results.filter(x=>x.media_type==="movie"||x.media_type==="tv");
    render();
  }catch(e){ handleErr(e); }
}

function render(){
  if(state.view==="discover"){ loadDiscover(); return; }
  let items=[];
  let title="";
  if(state.view==="search"){ items=state.lastSearch; title="🔎 Zoekresultaten"; }
  else if(state.view==="watchlist"){ items=libItems("watchlist"); title="📌 Wil ik kijken"; }
  else if(state.view==="watched"){ items=libItems("watched"); title="✅ Gezien"; }
  if(state.filter!=="all") items=items.filter(i=>(i.media_type||i._mt)===state.filter);
  drawCards(items, title);
}

function libItems(status){
  return Object.values(state.lib).filter(e=>e.status===status).map(e=>e.item);
}

function drawCards(items, title){
  const grid=document.getElementById("grid");
  const empty=document.getElementById("empty");
  document.getElementById("hint").textContent = title + (items.length? "  ·  "+items.length+" titels":"");
  if(!items.length){
    grid.innerHTML=""; empty.style.display="block";
    empty.innerHTML = state.view==="watchlist"||state.view==="watched"
      ? "<h2>Nog leeg</h2><p>Open een titel en voeg 'm toe aan deze lijst.</p>"
      : "<h2>Niets gevonden</h2><p>Probeer een andere zoekterm.</p>";
    return;
  }
  empty.style.display="none";
  grid.innerHTML = items.map(it=>{
    const mt=it.media_type||it._mt;
    const t=it.title||it.name||"Onbekend";
    const date=it.release_date||it.first_air_date||"";
    const yr=date?date.slice(0,4):"—";
    const rating=it.vote_average?it.vote_average.toFixed(1):null;
    const st=getStatus({...it,media_type:mt});
    const poster=it.poster_path
      ? `<img class="poster" loading="lazy" src="${IMG}w342${it.poster_path}" alt="">`
      : `<div class="noposter">${t}</div>`;
    return `<div class="card" onclick='openDetail(${it.id},"${mt}")'>
      ${poster}
      ${rating?`<div class="badge">⭐ ${rating}</div>`:""}
      <div class="typebadge">${mt==="tv"?"Serie":"Film"}</div>
      ${st?`<div class="statusdot ${st==="watched"?"dot-seen":"dot-watch"}"></div>`:""}
      <div class="meta"><p class="title">${t}</p><div class="year">${yr}</div></div>
    </div>`;
  }).join("");
}

/* ---------- detail ---------- */
async function openDetail(id, mt){
  const ov=document.getElementById("detailOverlay");
  const body=document.getElementById("detailBody");
  ov.classList.add("open");
  body.innerHTML='<div style="padding:40px"><span class="spinner"></span> Laden…</div>';
  document.getElementById("hero").style.backgroundImage="none";
  try{
    const d=await tmdb(`/${mt}/${id}`,{append_to_response:"credits,watch/providers,videos"});
    d.media_type=mt;
    renderDetail(d);
  }catch(e){ body.innerHTML='<div class="pad err">Kon details niet laden.</div>'; }
}

function renderDetail(d){
  const mt=d.media_type;
  const t=d.title||d.name;
  const date=d.release_date||d.first_air_date||"";
  const yr=date?date.slice(0,4):"";
  const genres=(d.genres||[]).map(g=>g.name).join(" · ");
  const runtime=d.runtime?`${d.runtime} min`:(d.number_of_seasons?`${d.number_of_seasons} seizoen(en)`:"");
  const rating=d.vote_average?d.vote_average.toFixed(1):"—";
  document.getElementById("hero").style.backgroundImage =
    d.backdrop_path?`url(${IMG}w780${d.backdrop_path})`:"linear-gradient(135deg,#23232f,#14141c)";

  const cast=(d.credits?.cast||[]).slice(0,10).map(c=>`
    <div class="castcard">
      ${c.profile_path?`<img class="castimg" src="${IMG}w185${c.profile_path}">`:`<div class="castimg"></div>`}
      <div class="castname">${c.name}</div>
      <div class="castrole">${c.character||""}</div>
    </div>`).join("");

  // watch providers
  const prov=d["watch/providers"]?.results?.[state.region];
  let provHtml="";
  if(prov){
    const groups=[["flatrate","Streaming"],["rent","Huren"],["buy","Kopen"]];
    let inner="";
    groups.forEach(([k,lbl])=>{
      if(prov[k]){
        inner+=`<div style="width:100%; color:var(--muted); font-size:12px; margin:6px 0 2px">${lbl}</div><div class="providers">`;
        inner+=prov[k].map(p=>`<div class="prov"><img src="${IMG}w92${p.logo_path}" title="${p.provider_name}"><span>${p.provider_name}</span></div>`).join("");
        inner+=`</div>`;
      }
    });
    if(inner) provHtml=`<div class="sec-title">📺 Waar te kijken in ${state.region}</div>${inner}`;
    if(prov.link) provHtml+=`<div style="margin-top:10px"><a class="btn watchlink" href="${prov.link}" target="_blank">↗ Open op JustWatch</a></div>`;
  } else {
    provHtml=`<div class="sec-title">📺 Waar te kijken</div><p style="color:var(--muted);font-size:13px">Geen aanbod gevonden voor regio ${state.region}. Wijzig je regio bij Instellingen.</p>`;
  }

  const trailer=(d.videos?.results||[]).find(v=>v.site==="YouTube"&&v.type==="Trailer");
  const st=getStatus(d);
  const slim={id:d.id, media_type:mt, title:d.title, name:d.name, poster_path:d.poster_path,
    release_date:d.release_date, first_air_date:d.first_air_date, vote_average:d.vote_average, _mt:mt,
    genre_names:(d.genres||[]).map(g=>g.name)};

  document.getElementById("detailBody").innerHTML=`
    <h1 class="mtitle">${t} ${yr?`<span style="color:var(--muted);font-weight:500">(${yr})</span>`:""}</h1>
    <div class="msub">
      <span class="pill">${mt==="tv"?"📺 Serie":"🎞️ Film"}</span>
      <span>⭐ ${rating}</span>
      ${runtime?`<span>${runtime}</span>`:""}
      ${genres?`<span>${genres}</span>`:""}
    </div>
    <div class="actions">
      <button class="btn ${st==="watchlist"?"primary":""}" onclick='toggleStatus(${JSON.stringify(slim).replace(/'/g,"&#39;")},"watchlist")'>📌 ${st==="watchlist"?"In watchlist":"Wil ik kijken"}</button>
      <button class="btn ${st==="watched"?"primary":""}" onclick='toggleStatus(${JSON.stringify(slim).replace(/'/g,"&#39;")},"watched")'>✅ ${st==="watched"?"Gezien":"Markeer gezien"}</button>
      ${trailer?`<a class="btn watchlink" href="https://youtube.com/watch?v=${trailer.key}" target="_blank">▶ Trailer</a>`:""}
    </div>
    <p class="overview">${d.overview||"Geen beschrijving beschikbaar."}</p>
    ${provHtml}
    ${cast?`<div class="sec-title">🎭 Cast</div><div class="cast">${cast}</div>`:""}
  `;
}

function toggleStatus(item, status){
  const k=libKey(item);
  if(state.lib[k] && state.lib[k].status===status){ delete state.lib[k]; toast("Verwijderd uit lijst"); }
  else { state.lib[k]={item, status, added:Date.now()}; toast(status==="watched"?"Gemarkeerd als gezien ✅":"Toegevoegd aan watchlist 📌"); }
  saveLib();
  renderDetail({...item, media_type:item._mt, credits:lastCredits, "watch/providers":lastProv, videos:lastVideos, genres:lastGenres, overview:lastOverview, backdrop_path:lastBackdrop, runtime:lastRuntime, number_of_seasons:lastSeasons});
}
// keep last detail context so buttons re-render correctly
let lastCredits,lastProv,lastVideos,lastGenres,lastOverview,lastBackdrop,lastRuntime,lastSeasons;
const _origRender=renderDetail;
renderDetail=function(d){
  lastCredits=d.credits; lastProv=d["watch/providers"]; lastVideos=d.videos; lastGenres=d.genres;
  lastOverview=d.overview; lastBackdrop=d.backdrop_path; lastRuntime=d.runtime; lastSeasons=d.number_of_seasons;
  _origRender(d);
};

function closeDetail(){ document.getElementById("detailOverlay").classList.remove("open"); render(); }

/* ---------- settings ---------- */
function openSettings(){
  document.getElementById("apiKeyInput").value=state.key;
  document.getElementById("regionInput").value=state.region;
  document.getElementById("settingsMsg").innerHTML="";
  document.getElementById("settingsOverlay").classList.add("open");
}
function closeSettings(){ document.getElementById("settingsOverlay").classList.remove("open"); }
async function saveSettings(){
  const key=document.getElementById("apiKeyInput").value.trim();
  const region=(document.getElementById("regionInput").value.trim()||"NL").toUpperCase();
  const msg=document.getElementById("settingsMsg");
  if(!key){ msg.innerHTML='<div class="err">Vul een API-sleutel in.</div>'; return; }
  msg.innerHTML='<span class="spinner"></span> Testen…';
  state.key=key; state.region=region;
  try{
    await tmdb("/configuration");
    store.set("tmdb_key",key);
    store.set("tmdb_region",region);
    msg.innerHTML='<div class="ok">✅ Sleutel werkt! Je kunt nu zoeken & ontdekken.</div>';
    setTimeout(()=>{ closeSettings(); setView("discover"); },900);
  }catch(e){
    msg.innerHTML='<div class="err">❌ Sleutel lijkt ongeldig (of geen internet). Controleer en probeer opnieuw.</div>';
  }
}

/* ---------- error handling ---------- */
function handleErr(e){
  if(e.message==="NO_KEY"){
    document.getElementById("grid").innerHTML="";
    const empty=document.getElementById("empty");
    empty.style.display="block";
    empty.innerHTML="<h2>👋 Welkom!</h2><p>Stel eerst je gratis TMDB API-sleutel in om te beginnen.</p><br><button class='btn primary' onclick='openSettings()'>⚙️ Sleutel instellen</button>";
    return;
  }
  document.getElementById("grid").innerHTML='<div class="empty"><h2>Er ging iets mis</h2><p>'+e.message+'</p></div>';
}

/* ---------- export ---------- */
function exportMenu(){
  const wl=libItems("watchlist"), wd=libItems("watched");
  if(!wl.length && !wd.length){ toast("Je lijsten zijn nog leeg"); return; }
  const choice=prompt("Exporteer als — typ 'json' of 'csv':","json");
  if(!choice) return;
  if(choice.toLowerCase().startsWith("c")) exportCSV(); else exportJSON();
}
function exportJSON(){
  const data={exported:new Date().toISOString(), watchlist:libItems("watchlist"), watched:libItems("watched")};
  download("mijn-cinema.json", JSON.stringify(data,null,2), "application/json");
  toast("JSON gedownload ⬇️");
}
function exportCSV(){
  const rows=[["status","type","titel","jaar","rating","tmdb_id"]];
  Object.values(state.lib).forEach(e=>{
    const i=e.item, mt=i.media_type||i._mt;
    const t=(i.title||i.name||"").replace(/"/g,'""');
    const yr=(i.release_date||i.first_air_date||"").slice(0,4);
    rows.push([e.status, mt, '"'+t+'"', yr, i.vote_average||"", i.id]);
  });
  download("mijn-cinema.csv", rows.map(r=>r.join(",")).join("\n"), "text/csv");
  toast("CSV gedownload ⬇️");
}
function download(name, content, type){
  const blob=new Blob([content],{type});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download=name; a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- verborgen dashboard ---------- */
const SECRET_PW = "Moviebox.esper.net";
let tapCount=0, tapTimer=null, unlocked=false;
let servers = JSON.parse(store.get("myCinemaServers")||"[]");

function logoTap(){
  tapCount++;
  clearTimeout(tapTimer);
  tapTimer=setTimeout(()=>{ tapCount=0; }, 800); // 3 klikken binnen het tijdsvenster
  if(tapCount>=3){
    tapCount=0; clearTimeout(tapTimer);
    if(unlocked){ openSecret(); }
    else { openLock(); }
  }
}
function openLock(){
  document.getElementById("lockInput").value="";
  document.getElementById("lockMsg").innerHTML="";
  document.getElementById("lockOverlay").classList.add("open");
  setTimeout(()=>document.getElementById("lockInput").focus(),100);
}
function closeLock(){ document.getElementById("lockOverlay").classList.remove("open"); }
function tryUnlock(){
  const v=document.getElementById("lockInput").value;
  const msg=document.getElementById("lockMsg");
  if(v===SECRET_PW){
    unlocked=true;
    closeLock();
    openSecret();
    toast("Toegang verleend 🔓");
  } else {
    msg.innerHTML='<div class="err">❌ Onjuist wachtwoord.</div>';
  }
}
function openSecret(){
  document.getElementById("secretOverlay").classList.add("open");
  setSecretTab("stats");
}
function closeSecret(){ document.getElementById("secretOverlay").classList.remove("open"); }

function setSecretTab(tab){
  document.querySelectorAll("[data-stab]").forEach(t=>t.classList.toggle("active",t.dataset.stab===tab));
  ["stats","manage","personal"].forEach(s=>{
    document.getElementById("stab-"+s).style.display = (s===tab)?"block":"none";
  });
  if(tab==="stats") renderStats();
  if(tab==="manage") renderManage();
  if(tab==="personal") renderServers();
}

function renderStats(){
  const all=Object.values(state.lib);
  const wl=all.filter(e=>e.status==="watchlist");
  const wd=all.filter(e=>e.status==="watched");
  const movies=all.filter(e=>(e.item.media_type||e.item._mt)==="movie");
  const tv=all.filter(e=>(e.item.media_type||e.item._mt)==="tv");
  const ratings=all.map(e=>e.item.vote_average).filter(Boolean);
  const avg=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):"—";
  const cards=[
    ["📚 Totaal", all.length],
    ["📌 Wil ik kijken", wl.length],
    ["✅ Gezien", wd.length],
    ["🎞️ Films", movies.length],
    ["📺 Series", tv.length],
    ["⭐ Gem. rating", avg],
  ];
  document.getElementById("statCards").innerHTML=cards.map(c=>`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">
      <div style="font-size:24px;font-weight:800">${c[1]}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${c[0]}</div>
    </div>`).join("");
  const tot=movies.length+tv.length||1;
  document.getElementById("statBars").innerHTML=`
    ${bar("🎞️ Films",movies.length,tot,"#e50914")}
    ${bar("📺 Series",tv.length,tot,"#46d369")}`;
  // genres (only available if titles were opened; fall back to count by media)
  const gmap={};
  all.forEach(e=>{(e.item.genre_names||[]).forEach(g=>gmap[g]=(gmap[g]||0)+1)});
  const gentries=Object.entries(gmap).sort((a,b)=>b[1]-a[1]).slice(0,12);
  document.getElementById("statGenres").innerHTML = gentries.length
    ? gentries.map(([g,n])=>`<span class="pill">${g} · ${n}</span>`).join("")
    : '<span style="color:var(--muted);font-size:13px">Open titels in detail om genres te verzamelen.</span>';
}
function bar(label,val,tot,color){
  const pct=Math.round(val/tot*100);
  return `<div style="margin:8px 0">
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${label}</span><span style="color:var(--muted)">${val} (${pct}%)</span></div>
    <div style="background:var(--card2);border-radius:8px;height:12px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${color}"></div></div>
  </div>`;
}

function renderManage(){
  const all=Object.entries(state.lib);
  document.getElementById("mgCount").textContent=all.length;
  const box=document.getElementById("manageList");
  if(!all.length){ box.innerHTML='<p style="color:var(--muted);font-size:13px">Nog geen titels in je database.</p>'; return; }
  box.innerHTML=all.map(([k,e])=>{
    const i=e.item, mt=i.media_type||i._mt;
    const t=i.title||i.name||"Onbekend";
    const yr=(i.release_date||i.first_air_date||"").slice(0,4);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border)">
      <span class="typebadge" style="position:static">${mt==="tv"?"Serie":"Film"}</span>
      <div style="flex:1"><div style="font-weight:600;font-size:14px">${t}</div>
        <div style="font-size:12px;color:var(--muted)">${yr||"—"} · ${e.status==="watched"?"✅ Gezien":"📌 Wil ik kijken"}</div></div>
      <button class="btn" style="padding:6px 10px;font-size:12px" onclick="switchStatus('${k}')">↔ Wissel</button>
      <button class="btn" style="padding:6px 10px;font-size:12px;border-color:#5a2730;color:#ff7884" onclick="removeFromLib('${k}')">🗑️</button>
    </div>`;
  }).join("");
}
function switchStatus(k){
  if(!state.lib[k]) return;
  state.lib[k].status = state.lib[k].status==="watched"?"watchlist":"watched";
  saveLib(); renderManage(); renderStats();
}
function removeFromLib(k){
  delete state.lib[k]; saveLib(); renderManage(); renderStats(); toast("Verwijderd");
}
function clearLib(){
  if(confirm("Weet je zeker dat je je HELE database wilt wissen? Dit kan niet ongedaan worden gemaakt.")){
    state.lib={}; saveLib(); renderManage(); renderStats(); toast("Database gewist");
  }
}
function importJSON(ev){
  const f=ev.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const d=JSON.parse(reader.result);
      let added=0;
      const add=(arr,status)=>(arr||[]).forEach(it=>{
        const mt=it.media_type||it._mt||"movie";
        const k=mt+"_"+it.id;
        state.lib[k]={item:{...it,_mt:mt,media_type:mt}, status, added:Date.now()}; added++;
      });
      add(d.watchlist,"watchlist"); add(d.watched,"watched");
      saveLib(); renderManage(); renderStats();
      toast(added+" titels geïmporteerd ✅");
    }catch(e){ toast("Ongeldig JSON-bestand ❌"); }
  };
  reader.readAsText(f);
  ev.target.value="";
}

function renderServers(){
  const box=document.getElementById("serverList");
  if(!servers.length){ box.innerHTML='<p style="color:var(--muted);font-size:13px">Nog geen snelkoppelingen.</p>'; return; }
  box.innerHTML=servers.map((s,idx)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border)">
      <div style="flex:1"><div style="font-weight:600">${s.name}</div>
        <a href="${s.url}" target="_blank" style="font-size:12px;color:var(--accent2)">${s.url}</a></div>
      <a class="btn" style="padding:6px 12px;font-size:12px" href="${s.url}" target="_blank">↗ Open</a>
      <button class="btn" style="padding:6px 10px;font-size:12px;border-color:#5a2730;color:#ff7884" onclick="delServer(${idx})">🗑️</button>
    </div>`).join("");
}
function addServer(){
  const name=document.getElementById("srvName").value.trim();
  let url=document.getElementById("srvUrl").value.trim();
  if(!name||!url){ toast("Vul naam en URL in"); return; }
  if(!/^https?:\/\//i.test(url) && !url.startsWith("/")) url="http://"+url;
  servers.push({name,url});
  store.set("myCinemaServers",JSON.stringify(servers));
  document.getElementById("srvName").value=""; document.getElementById("srvUrl").value="";
  renderServers(); toast("Toegevoegd");
}
function delServer(idx){
  servers.splice(idx,1);
  store.set("myCinemaServers",JSON.stringify(servers));
  renderServers();
}

/* ---------- init ---------- */
document.getElementById("searchInput").addEventListener("keydown",e=>{ if(e.key==="Enter") doSearch(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeDetail(); closeSettings(); }});
if(!state.key){ handleErr({message:"NO_KEY"}); } else { setView("discover"); }
