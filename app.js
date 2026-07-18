
const STORAGE_KEY = "proyectoRafaDataV1";

const defaults = {
  nextWorkout: "Tirada larga · 12 km Z2",
  runs: [{
    id: crypto.randomUUID(),
    date: "2026-07-17",
    type: "Rodaje Z2",
    distance: 7.02,
    time: "40:06",
    pace: "5:42",
    avgHr: 147,
    maxHr: 155,
    te: 3.4,
    temp: 33,
    shoes: "ASICS Gel-Nimbus 28",
    notes: "90 % del tiempo en Z2. Buen control de pulsaciones con calor."
  }],
  gym: [{
    id: crypto.randomUUID(),
    date: "2026-07-16",
    name: "Torso",
    notes: "Press banca 20 kg · Remo barra 40 kg · Press militar 20 kg · Laterales 15 kg · Fondos asistidos 40 kg · Curl EZ 10 kg · Tríceps polea 20 kg"
  }],
  gear: [
    {id: crypto.randomUUID(), name:"ASICS Gel-Nimbus 28", type:"Zapatillas", km:7.02, notes:"Rodajes suaves y tiradas largas"},
    {id: crypto.randomUUID(), name:"Adidas Adizero Evo SL", type:"Zapatillas", km:0, notes:"Series y sesiones rápidas"}
  ],
  races: [
    {id: crypto.randomUUID(), name:"Media Maratón de Murcia", date:"2027-02-01", goal:"Terminar fuerte", notes:"Objetivo principal"}
  ]
};

let data = loadData();
let currentFilter = "Todos";
let currentForm = null;

function loadData(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaults);
  }catch{
    return structuredClone(defaults);
  }
}
function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderAll();
}
function formatDate(date){
  return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(date+"T12:00:00"));
}
function paceFrom(distance,time){
  if(!distance || !time) return "—";
  const parts=time.split(":").map(Number);
  const seconds = parts.length===3 ? parts[0]*3600+parts[1]*60+parts[2] : parts[0]*60+parts[1];
  const paceSec = Math.round(seconds/distance);
  return `${Math.floor(paceSec/60)}:${String(paceSec%60).padStart(2,"0")}`;
}
function weekKm(){
  const now = new Date();
  const day = (now.getDay()+6)%7;
  const monday = new Date(now);
  monday.setHours(0,0,0,0);
  monday.setDate(now.getDate()-day);
  return data.runs.filter(r=>new Date(r.date+"T12:00:00")>=monday).reduce((a,r)=>a+Number(r.distance||0),0);
}
function runCard(r){
  return `<article class="activity-card">
    <div class="activity-head">
      <div><div class="activity-title">${r.type}</div><div class="activity-date">${formatDate(r.date)} · ${r.shoes||"Sin zapatillas"}</div></div>
      <div class="activity-title">${Number(r.distance).toFixed(2).replace(".",",")} km</div>
    </div>
    <div class="stats-row">
      <div class="stat"><small>Ritmo</small><b>${r.pace||paceFrom(r.distance,r.time)}/km</b></div>
      <div class="stat"><small>FC media</small><b>${r.avgHr||"—"} ppm</b></div>
      <div class="stat"><small>Tiempo</small><b>${r.time||"—"}</b></div>
    </div>
    ${r.notes?`<p class="note">${r.notes}</p>`:""}
  </article>`;
}
function renderHome(){
  const latest=[...data.runs].sort((a,b)=>b.date.localeCompare(a.date))[0];
  document.querySelector("#weekKm").textContent=weekKm().toFixed(1).replace(".",",");
  document.querySelector("#lastPace").textContent=latest?`${latest.pace||paceFrom(latest.distance,latest.time)}/km`:"—";
  document.querySelector("#lastHr").textContent=latest?`${latest.avgHr||"—"} ppm`:"—";
  document.querySelector("#totalRuns").textContent=data.runs.length;
  document.querySelector("#nextWorkout").textContent=data.nextWorkout;
  document.querySelector("#latestRun").innerHTML=latest?runCard(latest):`<div class="empty">Aún no hay entrenamientos.</div>`;
  const progress=Math.min(100,Math.round((weekKm()/25)*100));
  const ring=document.querySelector(".goal-ring");
  ring.style.background=`conic-gradient(var(--accent) ${progress*3.6}deg, var(--surface-2) 0deg)`;
  document.querySelector("#goalPercent").textContent=`${progress}%`;
}
function renderRuns(){
  const rows=[...data.runs].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>currentFilter==="Todos"||r.type===currentFilter);
  document.querySelector("#runList").innerHTML=rows.length?rows.map(runCard).join(""):`<div class="empty">No hay entrenamientos en este filtro.</div>`;
}
function renderGym(){
  const rows=[...data.gym].sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector("#gymList").innerHTML=rows.length?rows.map(g=>`<article class="activity-card"><div class="activity-head"><div><div class="activity-title">${g.name}</div><div class="activity-date">${formatDate(g.date)}</div></div></div><p class="note">${g.notes||""}</p></article>`).join(""):`<div class="empty">Sin sesiones registradas.</div>`;
}
function renderGear(){
  document.querySelector("#gearList").innerHTML=data.gear.length?data.gear.map(g=>`<article class="activity-card"><div class="activity-head"><div><div class="activity-title">${g.name}</div><div class="activity-date">${g.type}</div></div><div class="activity-title">${Number(g.km||0).toFixed(1).replace(".",",")} km</div></div><p class="note">${g.notes||""}</p></article>`).join(""):`<div class="empty">Sin material registrado.</div>`;
}
function renderRaces(){
  const rows=[...data.races].sort((a,b)=>a.date.localeCompare(b.date));
  document.querySelector("#raceList").innerHTML=rows.length?rows.map(r=>`<article class="activity-card"><div class="activity-head"><div><div class="activity-title">${r.name}</div><div class="activity-date">${formatDate(r.date)}</div></div><div class="activity-title">${r.goal||""}</div></div><p class="note">${r.notes||""}</p></article>`).join(""):`<div class="empty">Sin carreras registradas.</div>`;
}
function renderAll(){renderHome();renderRuns();renderGym();renderGear();renderRaces()}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  btn.classList.add("active");
  document.querySelector("#"+btn.dataset.view).classList.add("active");
  scrollTo({top:0,behavior:"smooth"});
}));
document.querySelectorAll(".chip").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".chip").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active"); currentFilter=btn.dataset.filter; renderRuns();
}));

const modal=document.querySelector("#modal");
const formFields=document.querySelector("#formFields");

const fields = {
  running: {
    title:"Añadir entrenamiento",
    html:`<div class="field"><label>Fecha</label><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="field"><label>Tipo</label><select name="type"><option>Rodaje Z2</option><option>Series</option><option>Tirada larga</option><option>Carrera</option><option>Recuperación</option></select></div>
    <div class="two-col"><div class="field"><label>Distancia (km)</label><input name="distance" type="number" step="0.01" required></div><div class="field"><label>Tiempo (mm:ss)</label><input name="time" placeholder="40:06" required></div></div>
    <div class="two-col"><div class="field"><label>FC media</label><input name="avgHr" type="number"></div><div class="field"><label>FC máxima</label><input name="maxHr" type="number"></div></div>
    <div class="two-col"><div class="field"><label>Training Effect</label><input name="te" type="number" step="0.1"></div><div class="field"><label>Temperatura</label><input name="temp" type="number"></div></div>
    <div class="field"><label>Zapatillas</label><input name="shoes" value="ASICS Gel-Nimbus 28"></div>
    <div class="field"><label>Notas</label><textarea name="notes"></textarea></div>`
  },
  gym: {
    title:"Registrar gimnasio",
    html:`<div class="field"><label>Fecha</label><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label>Sesión</label><input name="name" placeholder="Torso / Pierna / Full body" required></div><div class="field"><label>Ejercicios, pesos y repeticiones</label><textarea name="notes" required></textarea></div>`
  },
  material: {
    title:"Añadir material",
    html:`<div class="field"><label>Nombre</label><input name="name" required></div><div class="field"><label>Tipo</label><input name="type" value="Zapatillas"></div><div class="field"><label>Kilómetros actuales</label><input name="km" type="number" step="0.1" value="0"></div><div class="field"><label>Notas</label><textarea name="notes"></textarea></div>`
  },
  race: {
    title:"Añadir carrera",
    html:`<div class="field"><label>Nombre</label><input name="name" required></div><div class="field"><label>Fecha</label><input name="date" type="date" required></div><div class="field"><label>Objetivo</label><input name="goal"></div><div class="field"><label>Notas</label><textarea name="notes"></textarea></div>`
  }
};

document.querySelectorAll("[data-open-form]").forEach(btn=>btn.addEventListener("click",()=>{
  currentForm=btn.dataset.openForm;
  document.querySelector("#modalTitle").textContent=fields[currentForm].title;
  formFields.innerHTML=fields[currentForm].html;
  modal.showModal();
}));

document.querySelector("#dynamicForm").addEventListener("submit",e=>{
  if(e.submitter?.value==="cancel") return;
  e.preventDefault();
  const fd=Object.fromEntries(new FormData(e.currentTarget).entries());
  fd.id=crypto.randomUUID();
  if(currentForm==="running"){
    fd.distance=Number(fd.distance); fd.avgHr=Number(fd.avgHr)||null; fd.maxHr=Number(fd.maxHr)||null; fd.te=Number(fd.te)||null; fd.temp=Number(fd.temp)||null;
    fd.pace=paceFrom(fd.distance,fd.time);
    data.runs.push(fd);
    const gear=data.gear.find(g=>g.name===fd.shoes);
    if(gear) gear.km=Number(gear.km||0)+fd.distance;
  } else if(currentForm==="gym") data.gym.push(fd);
  else if(currentForm==="material"){fd.km=Number(fd.km)||0;data.gear.push(fd);}
  else if(currentForm==="race") data.races.push(fd);
  saveData(); modal.close(); e.currentTarget.reset();
});

document.querySelector("#editNextBtn").addEventListener("click",()=>{
  const value=prompt("Próximo entrenamiento:",data.nextWorkout);
  if(value){data.nextWorkout=value;saveData();}
});

document.querySelector("#themeBtn").addEventListener("click",()=>{
  document.documentElement.classList.toggle("light");
  localStorage.setItem("proyectoRafaTheme",document.documentElement.classList.contains("light")?"light":"dark");
});
if(localStorage.getItem("proyectoRafaTheme")==="light") document.documentElement.classList.add("light");

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
renderAll();
