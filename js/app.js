const IMG = "https://image.tmdb.org/t/p/";

/* Veilige opslag: werkt ook als de browser localStorage blokkeert (bv. in een preview/sandbox). */
const _mem = {};
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return (k in _mem)?_mem[k]:null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ _mem[k]=v; } }
};

// Ingebouwde standaard TMDB-sleutel: zo werkt de site meteen voor iedereen.
const DEFAULT_TMDB_KEY = "ee95529c2736ea03cde3fab5924d98ee";

/* ---------- meertaligheid (NL/EN) ---------- */
const I18N = {
  nl: {
    search_ph:"Zoek films & series… (bv. Dune, Breaking Bad)", search_btn:"Zoek",
    settings:"⚙️ Instellingen", export:"⬇️ Exporteer",
    tab_discover:"🔥 Ontdek", tab_search:"🔎 Zoekresultaten", tab_watchlist:"📌 Wil ik kijken", tab_watched:"✅ Gezien",
    f_all:"Alles", f_movie:"🎞️ Films", f_tv:"📺 Series", all_genres:"🎭 Alle genres",
    footer:"Gegevens via The Movie Database (TMDB). Deze app is niet door TMDB onderschreven.<br>Streaming-beschikbaarheid via JustWatch (in TMDB). Kijk altijd via legale diensten. 💛",
    trending_title:"🔥 Trending deze week", genre_title:"🎭 Genre", search_results:"🔎 Zoekresultaten",
    watchlist_title:"📌 Wil ik kijken", watched_title:"✅ Gezien",
    titles_word:"titels", loading:"Laden…", searching:"Zoeken…",
    empty_list_h:"Nog leeg", empty_list_p:"Open een titel en voeg 'm toe aan deze lijst.",
    empty_none_h:"Niets gevonden", empty_none_p:"Probeer een andere zoekterm of een ander genre.",
    movie_word:"Film", serie_word:"Serie",
    btn_wl_add:"Wil ik kijken", btn_wl_in:"In watchlist", btn_wd_mark:"Markeer gezien", btn_wd_in:"Gezien",
    trailer:"▶ Trailer", cast:"🎭 Cast", your_rating:"⭐ Jouw waardering", rate_hint:"(klik om te beoordelen)",
    where_in:"📺 Waar te kijken in", where:"📺 Waar te kijken",
    no_offer:"Geen aanbod gevonden voor regio", streaming:"Streaming", rent:"Huren", buy:"Kopen",
    open_jw:"↗ Open op JustWatch", no_desc:"Geen beschrijving beschikbaar.", detail_err:"Kon details niet laden.",
    seasons:"seizoen(en)", min:"min",
    t_add_wl:"Toegevoegd aan watchlist 📌", t_add_wd:"Gemarkeerd als gezien ✅", t_removed:"Verwijderd uit lijst",
    t_rated:"Waardering opgeslagen ⭐", t_unrated:"Waardering verwijderd",
    set_intro:"De site werkt al meteen — er is een sleutel ingebouwd. ✅<br>Wil je je <b>eigen</b> gratis TMDB-sleutel gebruiken? Vul 'm hieronder in (optioneel).",
    set_key:"TMDB API-sleutel (v3 auth)", set_region:"Regio voor streaming-aanbod",
    set_save:"Opslaan & testen", set_close:"Sluiten"
  },
  en: {
    search_ph:"Search movies & series… (e.g. Dune, Breaking Bad)", search_btn:"Search",
    settings:"⚙️ Settings", export:"⬇️ Export",
    tab_discover:"🔥 Discover", tab_search:"🔎 Search results", tab_watchlist:"📌 Watchlist", tab_watched:"✅ Watched",
    f_all:"All", f_movie:"🎞️ Movies", f_tv:"📺 Series", all_genres:"🎭 All genres",
    footer:"Data via The Movie Database (TMDB). This product is not endorsed by TMDB.<br>Streaming availability via JustWatch (in TMDB). Always watch through legal services. 💛",
    trending_title:"🔥 Trending this week", genre_title:"🎭 Genre", search_results:"🔎 Search results",
    watchlist_title:"📌 Watchlist", watched_title:"✅ Watched",
    titles_word:"titles", loading:"Loading…", searching:"Searching…",
    empty_list_h:"Empty", empty_list_p:"Open a title and add it to this list.",
    empty_none_h:"Nothing found", empty_none_p:"Try another search term or genre.",
    movie_word:"Movie", serie_word:"Series",
    btn_wl_add:"Add to watchlist", btn_wl_in:"In watchlist", btn_wd_mark:"Mark watched", btn_wd_in:"Watched",
    trailer:"▶ Trailer", cast:"🎭 Cast", your_rating:"⭐ Your rating", rate_hint:"(click to rate)",
    where_in:"📺 Where to watch in", where:"📺 Where to watch",
    no_offer:"No offers found for region", streaming:"Streaming", rent:"Rent", buy:"Buy",
    open_jw:"↗ Open on JustWatch", no_desc:"No description available.", detail_err:"Could not load details.",
    seasons:"season(s)", min:"min",
    t_add_wl:"Added to watchlist 📌", t_add_wd:"Marked as watched ✅", t_removed:"Removed from list",
    t_rated:"Rating saved ⭐", t_unrated:"Rating removed",
    set_intro:"The site works right away — a key is built in. ✅<br>Want to use your <b>own</b> free TMDB key? Enter it below (optional).",
    set_key:"TMDB API key (v3 auth)", set_region:"Region for streaming availability",
    set_save:"Save & test", set_close:"Close"
  }
};
function t(k){ return (I18N[state.lang] && I18N[state.lang][k]) || I18N.nl[k] || k; }

let state = {
  key: store.get("tmdb_key") || DEFAULT_TMDB_KEY,
  region: store.get("tmdb_region") || "NL",
  lang: store.get("lang") || "nl",
  view: "discover",
  filter: "all",
  genre: "all",
  lastSearch: [],
  lib: JSON.parse(store.get("myCinemaLib") || "{}"),      // id -> {item, status}
  ratings: JSON.parse(store.get("myRatings") || "{}")     // mt_id -> 1..5
};
let GENRES = {};       // id -> name
let currentDetail = null;

/* ---------- helpers ---------- */
function toast(msg){
  const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function saveLib(){ store.set("myCinemaLib", JSON.stringify(state.lib)); }
function libKey(item){ return (item.media_type||item._mt)+"_"+item.id; }
function getStatus(item){ const e=state.lib[libKey(item)]; return e?e.status:null; }

function ratingKey(mt,id){ return mt+"_"+id; }
function getRating(mt,id){ return state.ratings[ratingKey(mt,id)]||0; }
function setRating(mt,id,val){
  const k=ratingKey(mt,id);
  if(state.ratings[k]===val){ delete state.ratings[k]; toast(t("t_unrated")); }
  else { state.ratings[k]=val; toast(t("t_rated")); }
  store.set("myRatings", JSON.stringify(state.ratings));
  reRenderDetail();
}

async function tmdb(path, params={}){
  if(!state.key){ throw new Error("NO_KEY"); }
  const u=new URL("https://api.themoviedb.org/3"+path);
  u.searchParams.set("api_key", state.key);
  u.searchParams.set("language", state.lang==="nl"?"nl-NL":"en-US");
  for(const k in params) u.searchParams.set(k, params[k]);
  const r=await fetch(u);
  if(!r.ok){ const e=new Error("HTTP "+r.status); e.code=r.status; throw e; }
  return r.json();
}

/* ---------- taal ---------- */
function applyLang(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.innerHTML=t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.placeholder=t(el.dataset.i18nPh); });
  const lb=document.getElementById("langBtn"); if(lb) lb.textContent = state.lang==="nl"?"🌍 EN":"🌍 NL";
}
function toggleLang(){
  state.lang = state.lang==="nl"?"en":"nl";
  store.set("lang", state.lang);
  applyLang();
  loadGenres();
  if(currentDetail && document.getElementById("detailOverlay").classList.contains("open")){
    openDetail(currentDetail.id, currentDetail.media_type);
  }
  render();
}

/* ---------- genres ---------- */
async function loadGenres(){
  try{
    const [m,tv]=await Promise.all([tmdb("/genre/movie/list"), tmdb("/genre/tv/list")]);
    GENRES={};
    [...(m.genres||[]),...(tv.genres||[])].forEach(g=>GENRES[g.id]=g.name);
    const sel=document.getElementById("genreSelect");
    if(sel){
      const cur=state.genre;
      sel.innerHTML=`<option value="all">${t("all_genres")}</option>`+
        Object.entries(GENRES).sort((a,b)=>a[1].localeCompare(b[1]))
          .map(([id,name])=>`<option value="${id}">${name}</option>`).join("");
      sel.value=cur;
    }
  }catch(e){ /* stil */ }
}
function setGenre(v){ state.genre=v; render(); }

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

function matchGenre(it){
  if(state.genre==="all") return true;
  const id=parseInt(state.genre,10);
  return (it.genre_ids||[]).includes(id);
}
function matchMedia(it){
  return state.filter==="all" || (it.media_type||it._mt)===state.filter;
}

async function loadDiscover(){
  const grid=document.getElementById("grid");
  grid.innerHTML=`<div style="padding:40px"><span class="spinner"></span> ${t("loading")}</div>`;
  try{
    let res=[], title=t("trending_title");
    if(state.genre==="all"){
      const calls=[];
      if(state.filter!=="tv") calls.push(tmdb("/trending/movie/week").then(d=>d.results.map(x=>({...x,media_type:"movie"}))));
      if(state.filter!=="movie") calls.push(tmdb("/trending/tv/week").then(d=>d.results.map(x=>({...x,media_type:"tv"}))));
      res=(await Promise.all(calls)).flat();
    } else {
      const g=state.genre;
      const calls=[];
      if(state.filter!=="tv") calls.push(tmdb("/discover/movie",{with_genres:g, sort_by:"popularity.desc"}).then(d=>d.results.map(x=>({...x,media_type:"movie"}))));
      if(state.filter!=="movie") calls.push(tmdb("/discover/tv",{with_genres:g, sort_by:"popularity.desc"}).then(d=>d.results.map(x=>({...x,media_type:"tv"}))));
      res=(await Promise.all(calls)).flat();
      title=`${t("genre_title")}: ${GENRES[g]||""}`;
    }
    res.sort((a,b)=>b.popularity-a.popularity);
    drawCards(res, title);
  }catch(e){ handleErr(e); }
}

async function doSearch(){
  const q=document.getElementById("searchInput").value.trim();
  if(!q) return;
  setView("search");
  const grid=document.getElementById("grid");
  grid.innerHTML=`<div style="padding:40px"><span class="spinner"></span> ${t("searching")}</div>`;
  try{
    const d=await tmdb("/search/multi",{query:q, include_adult:"false"});
    state.lastSearch=d.results.filter(x=>x.media_type==="movie"||x.media_type==="tv");
    render();
  }catch(e){ handleErr(e); }
}

function render(){
  if(state.view==="discover"){ loadDiscover(); return; }
  let items=[], title="";
  if(state.view==="search"){ items=state.lastSearch; title=t("search_results"); }
  else if(state.view==="watchlist"){ items=libItems("watchlist"); title=t("watchlist_title"); }
  else if(state.view==="watched"){ items=libItems("watched"); title=t("watched_title"); }
  items=items.filter(i=>matchMedia(i)&&matchGenre(i));
  drawCards(items, title);
}

function libItems(status){
  return Object.values(state.lib).filter(e=>e.status===status).map(e=>e.item);
}

function drawCards(items, title){
  const grid=document.getElementById("grid");
  const empty=document.getElementById("empty");
  document.getElementById("hint").textContent = title + (items.length? "  ·  "+items.length+" "+t("titles_word"):"");
  if(!items.length){
    grid.innerHTML=""; empty.style.display="block";
    empty.innerHTML = (state.view==="watchlist"||state.view==="watched")
      ? `<h2>${t("empty_list_h")}</h2><p>${t("empty_list_p")}</p>`
      : `<h2>${t("empty_none_h")}</h2><p>${t("empty_none_p")}</p>`;
    return;
  }
  empty.style.display="none";
  grid.innerHTML = items.map(it=>{
    const mt=it.media_type||it._mt;
    const ttl=it.title||it.name||"—";
    const date=it.release_date||it.first_air_date||"";
    const yr=date?date.slice(0,4):"—";
    const rating=it.vote_average?it.vote_average.toFixed(1):null;
    const st=getStatus({...it,media_type:mt});
    const ur=getRating(mt,it.id);
    const poster=it.poster_path
      ? `<img class="poster" loading="lazy" src="${IMG}w342${it.poster_path}" alt="">`
      : `<div class="noposter">${ttl}</div>`;
    return `<div class="card" onclick='openDetail(${it.id},"${mt}")'>
      ${poster}
      ${rating?`<div class="badge">⭐ ${rating}</div>`:""}
      <div class="typebadge">${mt==="tv"?t("serie_word"):t("movie_word")}</div>
      ${st?`<div class="statusdot ${st==="watched"?"dot-seen":"dot-watch"}"></div>`:""}
      <div class="meta"><p class="title">${ttl}</p>
        <div class="year">${yr}</div>
        ${ur?`<div class="urating">${"★".repeat(ur)}<span class="off">${"★".repeat(5-ur)}</span></div>`:""}
      </div>
    </div>`;
  }).join("");
}

/* ---------- detail ---------- */
async function openDetail(id, mt){
  const ov=document.getElementById("detailOverlay");
  const body=document.getElementById("detailBody");
  ov.classList.add("open");
  body.innerHTML=`<div style="padding:40px"><span class="spinner"></span> ${t("loading")}</div>`;
  document.getElementById("hero").style.backgroundImage="none";
  try{
    const d=await tmdb(`/${mt}/${id}`,{append_to_response:"credits,watch/providers,videos"});
    d.media_type=mt;
    currentDetail=d;
    renderDetail(d);
  }catch(e){ body.innerHTML=`<div class="pad err">${t("detail_err")}</div>`; }
}
function reRenderDetail(){ if(currentDetail) renderDetail(currentDetail); }

function renderDetail(d){
  const mt=d.media_type;
  const ttl=d.title||d.name;
  const date=d.release_date||d.first_air_date||"";
  const yr=date?date.slice(0,4):"";
  const genres=(d.genres||[]).map(g=>g.name).join(" · ");
  const runtime=d.runtime?`${d.runtime} ${t("min")}`:(d.number_of_seasons?`${d.number_of_seasons} ${t("seasons")}`:"");
  const rating=d.vote_average?d.vote_average.toFixed(1):"—";
  document.getElementById("hero").style.backgroundImage =
    d.backdrop_path?`url(${IMG}w780${d.backdrop_path})`:"linear-gradient(135deg,#23232f,#14141c)";

  const cast=(d.credits?.cast||[]).slice(0,10).map(c=>`
    <div class="castcard">
      ${c.profile_path?`<img class="castimg" src="${IMG}w185${c.profile_path}">`:`<div class="castimg"></div>`}
      <div class="castname">${c.name}</div>
      <div class="castrole">${c.character||""}</div>
    </div>`).join("");

  const prov=d["watch/providers"]?.results?.[state.region];
  let provHtml="";
  if(prov){
    const groups=[["flatrate",t("streaming")],["rent",t("rent")],["buy",t("buy")]];
    let inner="";
    groups.forEach(([k,lbl])=>{
      if(prov[k]){
        inner+=`<div style="width:100%; color:var(--muted); font-size:12px; margin:6px 0 2px">${lbl}</div><div class="providers">`;
        inner+=prov[k].map(p=>`<div class="prov"><img src="${IMG}w92${p.logo_path}" title="${p.provider_name}"><span>${p.provider_name}</span></div>`).join("");
        inner+=`</div>`;
      }
    });
    if(inner) provHtml=`<div class="sec-title">${t("where_in")} ${state.region}</div>${inner}`;
    if(prov.link) provHtml+=`<div style="margin-top:10px"><a class="btn watchlink" href="${prov.link}" target="_blank">${t("open_jw")}</a></div>`;
  } else {
    provHtml=`<div class="sec-title">${t("where")}</div><p style="color:var(--muted);font-size:13px">${t("no_offer")} ${state.region}.</p>`;
  }

  const trailer=(d.videos?.results||[]).find(v=>v.site==="YouTube"&&v.type==="Trailer");
  const st=getStatus(d);
  const ur=getRating(mt,d.id);
  const slim={id:d.id, media_type:mt, title:d.title, name:d.name, poster_path:d.poster_path,
    release_date:d.release_date, first_air_date:d.first_air_date, vote_average:d.vote_average, _mt:mt,
    genre_ids:(d.genres||[]).map(g=>g.id), genre_names:(d.genres||[]).map(g=>g.name)};

  let stars="";
  for(let i=1;i<=5;i++) stars+=`<span class="star ${i<=ur?"on":""}" onclick="setRating('${mt}',${d.id},${i})">★</span>`;

  document.getElementById("detailBody").innerHTML=`
    <h1 class="mtitle">${ttl} ${yr?`<span style="color:var(--muted);font-weight:500">(${yr})</span>`:""}</h1>
    <div class="msub">
      <span class="pill">${mt==="tv"?"📺 "+t("serie_word"):"🎞️ "+t("movie_word")}</span>
      <span>⭐ ${rating}</span>
      ${runtime?`<span>${runtime}</span>`:""}
      ${genres?`<span>${genres}</span>`:""}
    </div>
    <div class="actions">
      <button class="btn ${st==="watchlist"?"primary":""}" onclick='toggleStatus(${JSON.stringify(slim).replace(/'/g,"&#39;")},"watchlist")'>📌 ${st==="watchlist"?t("btn_wl_in"):t("btn_wl_add")}</button>
      <button class="btn ${st==="watched"?"primary":""}" onclick='toggleStatus(${JSON.stringify(slim).replace(/'/g,"&#39;")},"watched")'>✅ ${st==="watched"?t("btn_wd_in"):t("btn_wd_mark")}</button>
      ${trailer?`<a class="btn watchlink" href="https://youtube.com/watch?v=${trailer.key}" target="_blank">${t("trailer")}</a>`:""}
    </div>
    <div class="ratebox">
      <span class="sec-title" style="margin:0">${t("your_rating")}</span>
      <span class="stars">${stars}</span>
      ${ur?`<span class="ratenum">${ur}/5</span>`:`<span class="ratehint">${t("rate_hint")}</span>`}
    </div>
    <p class="overview">${d.overview||t("no_desc")}</p>
    ${provHtml}
    ${cast?`<div class="sec-title">${t("cast")}</div><div class="cast">${cast}</div>`:""}
  `;
}

function toggleStatus(item, status){
  const k=libKey(item);
  if(state.lib[k] && state.lib[k].status===status){ delete state.lib[k]; toast(t("t_removed")); }
  else { state.lib[k]={item, status, added:Date.now()}; toast(status==="watched"?t("t_add_wd"):t("t_add_wl")); }
  saveLib();
  reRenderDetail();
}

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
  const key=document.getElementById("apiKeyInput").value.trim()||DEFAULT_TMDB_KEY;
  const region=(document.getElementById("regionInput").value.trim()||"NL").toUpperCase();
  const msg=document.getElementById("settingsMsg");
  msg.innerHTML='<span class="spinner"></span> …';
  state.key=key; state.region=region;
  try{
    await tmdb("/configuration");
    store.set("tmdb_key",key);
    store.set("tmdb_region",region);
    msg.innerHTML='<div class="ok">✅ OK!</div>';
    setTimeout(()=>{ closeSettings(); loadGenres(); setView("discover"); },800);
  }catch(e){
    msg.innerHTML='<div class="err">❌ '+ (state.lang==="nl"?"Sleutel lijkt ongeldig.":"Key seems invalid.") +'</div>';
  }
}

/* ---------- error handling ---------- */
function handleErr(e){
  if(e.message==="NO_KEY"){
    document.getElementById("grid").innerHTML="";
    const empty=document.getElementById("empty");
    empty.style.display="block";
    empty.innerHTML="<h2>👋</h2><p>TMDB</p><br><button class='btn primary' onclick='openSettings()'>⚙️</button>";
    return;
  }
  document.getElementById("grid").innerHTML='<div class="empty"><h2>⚠️</h2><p>'+e.message+'</p></div>';
}

/* ---------- export ---------- */
function exportMenu(){
  const wl=libItems("watchlist"), wd=libItems("watched");
  if(!wl.length && !wd.length){ toast(state.lang==="nl"?"Je lijsten zijn nog leeg":"Your lists are empty"); return; }
  const choice=prompt("Export — 'json' / 'csv':","json");
  if(!choice) return;
  if(choice.toLowerCase().startsWith("c")) exportCSV(); else exportJSON();
}
function exportJSON(){
  const data={exported:new Date().toISOString(), watchlist:libItems("watchlist"), watched:libItems("watched"), ratings:state.ratings};
  download("mijn-cinema.json", JSON.stringify(data,null,2), "application/json");
  toast("JSON ⬇️");
}
function exportCSV(){
  const rows=[["status","type","titel","jaar","tmdb_rating","mijn_rating","tmdb_id"]];
  Object.values(state.lib).forEach(e=>{
    const i=e.item, mt=i.media_type||i._mt;
    const ttl=(i.title||i.name||"").replace(/"/g,'""');
    const yr=(i.release_date||i.first_air_date||"").slice(0,4);
    rows.push([e.status, mt, '"'+ttl+'"', yr, i.vote_average||"", getRating(mt,i.id)||"", i.id]);
  });
  download("mijn-cinema.csv", rows.map(r=>r.join(",")).join("\n"), "text/csv");
  toast("CSV ⬇️");
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
  tapTimer=setTimeout(()=>{ tapCount=0; }, 800);
  if(tapCount>=3){
    tapCount=0; clearTimeout(tapTimer);
    if(unlocked){ openSecret(); } else { openLock(); }
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
  if(v===SECRET_PW){ unlocked=true; closeLock(); openSecret(); toast("🔓"); }
  else { msg.innerHTML='<div class="err">❌</div>'; }
}
function openSecret(){ document.getElementById("secretOverlay").classList.add("open"); setSecretTab("stats"); }
function closeSecret(){ document.getElementById("secretOverlay").classList.remove("open"); }

function setSecretTab(tab){
  document.querySelectorAll("[data-stab]").forEach(t=>t.classList.toggle("active",t.dataset.stab===tab));
  ["stats","manage","personal"].forEach(s=>{ document.getElementById("stab-"+s).style.display=(s===tab)?"block":"none"; });
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
  const myr=Object.values(state.ratings);
  const myAvg=myr.length?(myr.reduce((a,b)=>a+b,0)/myr.length).toFixed(1):"—";
  const cards=[
    ["📚 Totaal", all.length],["📌 Wil ik kijken", wl.length],["✅ Gezien", wd.length],
    ["🎞️ Films", movies.length],["📺 Series", tv.length],["⭐ Mijn gem.", myAvg],
  ];
  document.getElementById("statCards").innerHTML=cards.map(c=>`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px">
      <div style="font-size:24px;font-weight:800">${c[1]}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:2px">${c[0]}</div>
    </div>`).join("");
  const tot=movies.length+tv.length||1;
  document.getElementById("statBars").innerHTML=`${bar("🎞️ Films",movies.length,tot,"#e50914")}${bar("📺 Series",tv.length,tot,"#46d369")}`;
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
  if(!all.length){ box.innerHTML='<p style="color:var(--muted);font-size:13px">Nog geen titels.</p>'; return; }
  box.innerHTML=all.map(([k,e])=>{
    const i=e.item, mt=i.media_type||i._mt;
    const ttl=i.title||i.name||"—";
    const yr=(i.release_date||i.first_air_date||"").slice(0,4);
    const ur=getRating(mt,i.id);
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border)">
      <span class="typebadge" style="position:static">${mt==="tv"?"Serie":"Film"}</span>
      <div style="flex:1"><div style="font-weight:600;font-size:14px">${ttl}</div>
        <div style="font-size:12px;color:var(--muted)">${yr||"—"} · ${e.status==="watched"?"✅ Gezien":"📌 Wil ik kijken"}${ur?" · ⭐"+ur+"/5":""}</div></div>
      <button class="btn" style="padding:6px 10px;font-size:12px" onclick="switchStatus('${k}')">↔</button>
      <button class="btn" style="padding:6px 10px;font-size:12px;border-color:#5a2730;color:#ff7884" onclick="removeFromLib('${k}')">🗑️</button>
    </div>`;
  }).join("");
}
function switchStatus(k){
  if(!state.lib[k]) return;
  state.lib[k].status = state.lib[k].status==="watched"?"watchlist":"watched";
  saveLib(); renderManage(); renderStats();
}
function removeFromLib(k){ delete state.lib[k]; saveLib(); renderManage(); renderStats(); toast("🗑️"); }
function clearLib(){
  if(confirm("Hele database wissen?")){ state.lib={}; saveLib(); renderManage(); renderStats(); toast("Gewist"); }
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
      if(d.ratings) Object.assign(state.ratings, d.ratings);
      saveLib(); store.set("myRatings",JSON.stringify(state.ratings));
      renderManage(); renderStats();
      toast(added+" ✅");
    }catch(e){ toast("❌ JSON"); }
  };
  reader.readAsText(f); ev.target.value="";
}

function renderServers(){
  const box=document.getElementById("serverList");
  if(!servers.length){ box.innerHTML='<p style="color:var(--muted);font-size:13px">Nog geen snelkoppelingen.</p>'; return; }
  box.innerHTML=servers.map((s,idx)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border)">
      <div style="flex:1"><div style="font-weight:600">${s.name}</div>
        <a href="${s.url}" target="_blank" style="font-size:12px;color:var(--accent2)">${s.url}</a></div>
      <a class="btn" style="padding:6px 12px;font-size:12px" href="${s.url}" target="_blank">↗</a>
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
function delServer(idx){ servers.splice(idx,1); store.set("myCinemaServers",JSON.stringify(servers)); renderServers(); }

/* ---------- init ---------- */
document.getElementById("searchInput").addEventListener("keydown",e=>{ if(e.key==="Enter") doSearch(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ closeDetail(); closeSettings(); }});
applyLang();
loadGenres();
setView("discover");
