const sessions = [
  {
    day:"LUN", date:"20", title:"Rodaje Z2", main:"7 km suaves",
    icon:"⌁", color:"#28e6b1", distance:"7,0 km", duration:"42 min", pace:"6:00/km", zone:"Z2",
    note:"Corre fácil, con control y buenas sensaciones.", done:true,
    point:{x:5,y:68}
  },
  {
    day:"MAR", date:"21", title:"Fuerza", main:"Tren inferior",
    icon:"⇆", color:"#7b65ff", distance:"—", duration:"55 min", pace:"—", zone:"Fuerza",
    note:"Calidad de movimiento, estabilidad y ejecución limpia.", done:true,
    point:{x:22,y:34}
  },
  {
    day:"MIÉ", date:"22", title:"Descanso", main:"Recuperación",
    icon:"☾", color:"#a159ff", distance:"—", duration:"—", pace:"—", zone:"Descanso",
    note:"Recuperar también forma parte del entrenamiento.", done:true,
    point:{x:37,y:67}
  },
  {
    day:"JUE", date:"23", title:"Series", main:"6 × 800 m",
    icon:"ϟ", color:"#25eaff", distance:"8,6 km", duration:"58 min", pace:"4:15/km", zone:"Z4–Z5",
    note:"Controla la primera repetición y termina igual de sólido.", done:false,
    point:{x:54,y:30}
  },
  {
    day:"VIE", date:"24", title:"Fuerza", main:"Tren superior",
    icon:"⇆", color:"#7b65ff", distance:"—", duration:"50 min", pace:"—", zone:"Fuerza",
    note:"Mantén margen y evita llegar al fallo en cada serie.", done:false,
    point:{x:68,y:43}
  },
  {
    day:"SÁB", date:"25", title:"Rodaje Z2", main:"8 km suaves",
    icon:"⌁", color:"#28e6b1", distance:"8,0 km", duration:"48 min", pace:"6:00/km", zone:"Z2",
    note:"Suma kilómetros fáciles sin perseguir el ritmo.", done:false,
    point:{x:81,y:68}
  },
  {
    day:"DOM", date:"26", title:"Tirada larga", main:"12 km",
    icon:"⌁", color:"#ffb52b", distance:"12,0 km", duration:"1h 10m", pace:"5:50/km", zone:"Z2",
    note:"Construye resistencia. Hoy manda la constancia.", done:false,
    point:{x:96,y:58}
  }
];

let selectedIndex = 3;
let completedCount = 3;

const nodesLayer = document.getElementById("nodesLayer");
const sessionPanel = document.getElementById("sessionPanel");
const routeProgress = document.getElementById("routeProgress");
const progressRing = document.getElementById("progressRing");
const progressValue = document.getElementById("progressValue");
const sessionCount = document.getElementById("sessionCount");

function buildNodes(){
  nodesLayer.innerHTML = sessions.map((session,index)=>`
    <button
      type="button"
      class="route-node ${index === selectedIndex ? "active" : ""} ${index < completedCount ? "done" : ""}"
      style="left:${session.point.x}%;top:${session.point.y}%;--node-color:${session.color}"
      data-index="${index}"
      aria-label="${session.day} ${session.date}: ${session.title}"
    >
      <span class="route-node__day">${session.day}</span>
      <strong class="route-node__date">${session.date}</strong>
      <span class="route-node__orb">${session.icon}</span>
    </button>
  `).join("");

  nodesLayer.querySelectorAll(".route-node").forEach(button=>{
    button.addEventListener("click",()=>{
      selectedIndex = Number(button.dataset.index);
      render();
      sessionPanel.classList.remove("switching");
      void sessionPanel.offsetWidth;
      sessionPanel.classList.add("switching");
    });
  });
}

function renderPanel(){
  const session = sessions[selectedIndex];
  sessionPanel.style.setProperty("--panel-accent",session.color);
  sessionPanel.innerHTML = `
    <div class="panel-grid">
      <div>
        <span class="panel-kicker">SESIÓN SELECCIONADA</span>
        <h2>${session.title}</h2>
        <p class="panel-main">${session.main}</p>
        <p class="panel-note">${session.note}</p>
      </div>
      <div class="panel-symbol">${session.icon}</div>
    </div>

    <div class="metrics">
      <div class="metric"><span>Distancia</span><strong>${session.distance}</strong></div>
      <div class="metric"><span>Duración</span><strong>${session.duration}</strong></div>
      <div class="metric"><span>Ritmo</span><strong>${session.pace}</strong></div>
      <div class="metric"><span>Zona</span><strong>${session.zone}</strong></div>
    </div>
  `;
}

function updateProgress(){
  const totalLength = routeProgress.getTotalLength();
  const fraction = completedCount === 0 ? 0 : (completedCount - 1) / (sessions.length - 1);
  routeProgress.style.strokeDasharray = `${totalLength}`;
  routeProgress.style.strokeDashoffset = `${totalLength * (1 - fraction)}`;
  routeProgress.classList.toggle("pulse",completedCount > 0);

  const percentage = Math.round((completedCount / sessions.length) * 100);
  progressRing.style.setProperty("--progress",percentage);
  progressValue.textContent = `${percentage}%`;
  sessionCount.textContent = `${completedCount}/${sessions.length}`;
}

function render(){
  buildNodes();
  renderPanel();
  updateProgress();
}

document.getElementById("previousProgress").addEventListener("click",()=>{
  completedCount = Math.max(0,completedCount - 1);
  selectedIndex = Math.min(selectedIndex,Math.max(0,completedCount));
  render();
});

document.getElementById("nextProgress").addEventListener("click",()=>{
  completedCount = Math.min(sessions.length,completedCount + 1);
  selectedIndex = Math.min(sessions.length - 1,Math.max(0,completedCount - 1));
  render();
});

const addButton = document.getElementById("addButton");
const actionSheet = document.getElementById("actionSheet");
const backdrop = document.getElementById("actionSheetBackdrop");

function openSheet(){
  backdrop.hidden = false;
  actionSheet.classList.add("open");
  actionSheet.setAttribute("aria-hidden","false");
}

function closeSheet(){
  actionSheet.classList.remove("open");
  actionSheet.setAttribute("aria-hidden","true");
  setTimeout(()=>backdrop.hidden = true,300);
}

addButton.addEventListener("click",openSheet);
backdrop.addEventListener("click",closeSheet);
document.addEventListener("keydown",event=>{
  if(event.key === "Escape") closeSheet();
});

window.addEventListener("load",render);
