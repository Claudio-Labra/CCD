'use strict';

/* ─────────────────────────────────────────────────────────
   TILES
───────────────────────────────────────────────────────── */
const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri'
  }
};

/* ─────────────────────────────────────────────────────────
   CCDs POR PROVINCIA
───────────────────────────────────────────────────────── */
const PROV_DATA = {
  "Buenos Aires":259,
  "Ciudad Autónoma de Buenos Aires":62,
  "Santa Fe":61,
  "Córdoba":57,
  "Entre Ríos":29,
  "Corrientes":31,
  "Misiones":37,
  "Chaco":14,
  "Formosa":12,
  "Jujuy":20,
  "Salta":16,
  "Tucumán":49,
  "Santiago del Estero":12,
  "Catamarca":14,
  "La Rioja":3,
  "San Juan":19,
  "San Luis":13,
  "Mendoza":40,
  "La Pampa":14,
  "Neuquén":19,
  "Río Negro":13,
  "Chubut":8,
  "Santa Cruz":4,
  "Tierra del Fuego":1
};

const GEOJSON_URL = 'argentina.geojson';

/* ─────────────────────────────────────────────────────────
   TREEMAP DATA
───────────────────────────────────────────────────────── */
const TREEMAP_DATA = {
  name: 'root',
  children: [
    { name:'Fuerza de Seguridad Provincial',short:'F.S. Provincial',value:437,color:'#0a7a7a'},
    { name:'Fuerza de Seguridad Federal',short:'F.S. Federal',value:125,color:'#0db8b8'},
    { name:'Otros',short:'Otros',value:108,color:'#1e3a3a'},
    { name:'Ejército',short:'Ejército',value:105,color:'#1adada'},
    { name:'Armada',short:'Arm.',value:17,color:'#3a7fd5'},
    { name:'Fuerza Aérea',short:'F.A.',value:15,color:'#55aaee'}
  ]
};

/* ─────────────────────────────────────────────────────────
   COLORES MARCADORES
───────────────────────────────────────────────────────── */
const DEP_COLORS = {
  provincial:'#0a7a7a',
  federal:'#0db8b8',
  ejercito:'#1adada',
  armada:'#3a7fd5',
  aerea:'#55aaee',
  otros:'#1e4a4a',
  default:'#444455'
};

/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════════════════════ */

const panels = Array.from(document.querySelectorAll('.panel'));
const arrow = document.getElementById('nav-arrow');

let current=0;
let isAnimating=false;

function showPanel(index){

  if(isAnimating) return;
  isAnimating=true;

  panels.forEach((p,i)=>{
    p.classList.remove('active','above');
    if(i<index) p.classList.add('above');
    if(i===index) p.classList.add('active');
  });

  arrow.classList.toggle('hidden',index===panels.length-1);

  if(index===1) initPanel2();
  if(index===2) initPanel3();
  if(index===3) initPanel4();

  setTimeout(()=>{isAnimating=false},960);
}

function nextPanel(){ if(current<panels.length-1){current++;showPanel(current)}}
function prevPanel(){ if(current>0){current--;showPanel(current)}}
function goHome(){current=0;showPanel(0)}

arrow.addEventListener('click',nextPanel);
document.getElementById('btn-back-home').addEventListener('click',goHome);

document.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='PageDown') nextPanel();
  if(e.key==='ArrowUp'||e.key==='PageUp') prevPanel();
});

showPanel(0);

/* ═══════════════════════════════════════════════════════════
   PANEL 2
══════════════════════════════════════════════════════════ */

let panel2Init=false;

function initPanel2(){

  if(panel2Init) return;
  panel2Init=true;

  const opts={
    duration:2.5,
    useEasing:true,
    useGrouping:true,
    separator:'.',
    decimal:','
  };

  new countUp.CountUp('ruvte-n1',8753,opts).start();
  new countUp.CountUp('ruvte-n2',807,{...opts,separator:''}).start();
  new countUp.CountUp('ruvte-n3',30000,opts).start();
}

/* ═══════════════════════════════════════════════════════════
   PANEL 3
══════════════════════════════════════════════════════════ */

let panel3Init=false;

function initPanel3(){

  if(panel3Init) return;
  panel3Init=true;

  new countUp.CountUp('contador-807',807,{
    duration:2.8,
    useGrouping:false
  }).start();

  setTimeout(buildChoropleth,950);
  setTimeout(buildTreemap,350);
}

/* ─────────────────────────────────────────────────────────
   MAPA D3
───────────────────────────────────────────────────────── */

function buildChoropleth(){

  const svgContainer=document.getElementById('choropleth-svg');
  if(!svgContainer) return;

  const colMap=svgContainer.closest('.info-col-map');

  const W=colMap.clientWidth;
  const H=colMap.clientHeight;

  svgContainer.innerHTML='';

  const svg=d3.select(svgContainer)
  .attr('width',W)
  .attr('height',H)
  .attr('viewBox',`0 0 ${W} ${H}`)
  .attr('preserveAspectRatio','xMidYMid meet');

  const maxVal=d3.max(Object.values(PROV_DATA));

  const colorScale=d3.scaleSequential()
  .domain([0,maxVal])
  .interpolator(d3.interpolate('#0d2e2e','#0ee8e8'));

  fetch(GEOJSON_URL)
  .then(r=>r.json())
  .then(geojson=>{

    const projection=d3.geoNaturalEarth1()
    .fitExtent([[10,10],[W-10,H-10]],geojson);

    const path=d3.geoPath().projection(projection);

    svg.selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('class','provincia-path')
    .attr('d',path)
    .attr('fill',d=>{
      const name=d.properties.name||d.properties.nombre;
      const val=lookupProvince(name);
      return val?colorScale(val):'#1a1a1a'
    });

    svg.selectAll('text')
    .data(geojson.features)
    .enter()
    .append('text')
    .attr('class','provincia-num')
    .attr('transform',d=>{
      const [x,y]=path.centroid(d);
      return `translate(${x},${y})`
    })
    .text(d=>{
      const name=d.properties.name||d.properties.nombre;
      const val=lookupProvince(name);
      return val?val:''
    });

  });
}

/* lookup */

function normalizeStr(s){
  return s.normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
}

function lookupProvince(name){

  if(PROV_DATA[name]!==undefined) return PROV_DATA[name]

  const gn=normalizeStr(name)

  for(const [k,v] of Object.entries(PROV_DATA)){
    if(normalizeStr(k)===gn) return v
  }

  return null
}

/* resize fix */

window.addEventListener('resize',()=>{
  if(panel3Init){
    setTimeout(buildChoropleth,200)
  }
});

/* ─────────────────────────────────────────────────────────
   TREEMAP
───────────────────────────────────────────────────────── */

function buildTreemap(){

  const container=document.getElementById('treemap-container');

  const W=container.clientWidth||600
  const H=container.clientHeight||180

  const root=d3.hierarchy(TREEMAP_DATA)
  .sum(d=>d.value)
  .sort((a,b)=>b.value-a.value)

  d3.treemap()
  .size([W,H])
  .paddingOuter(2)
  .paddingInner(2)(root)

  const svg=d3.select('#treemap-container')
  .append('svg')
  .attr('viewBox',`0 0 ${W} ${H}`)

  const cell=svg.selectAll('g')
  .data(root.leaves())
  .enter()
  .append('g')
  .attr('transform',d=>`translate(${d.x0},${d.y0})`)

  cell.append('rect')
  .attr('width',d=>d.x1-d.x0)
  .attr('height',d=>d.y1-d.y0)
  .attr('fill',d=>d.data.color)
}

/* ═══════════════════════════════════════════════════════════
   PANEL 4 MAPA LEAFLET
══════════════════════════════════════════════════════════ */

let panel4Init=false
let leafletMap
let tileLayer
let cluster

function initPanel4(){

  if(panel4Init) return
  panel4Init=true

  leafletMap=L.map('mapa-interactivo',{
    center:[-38,-63],
    zoom:5
  })

  setTile('dark')

  cluster=L.markerClusterGroup()
  leafletMap.addLayer(cluster)

  Papa.parse('data.csv',{
    download:true,
    header:true,
    complete:res=>buildMapMarkers(res.data)
  })
}

function setTile(key){

  const cfg=TILES[key]

  if(tileLayer) leafletMap.removeLayer(tileLayer)

  tileLayer=L.tileLayer(cfg.url,{attribution:cfg.attr})
  tileLayer.addTo(leafletMap)
}

function buildMapMarkers(data){

  data.forEach(row=>{

    const lat=parseFloat(row.LATITUD)
    const lon=parseFloat(row.LONGITUD)

    if(!lat||!lon) return

    const marker=L.circleMarker([lat,lon],{
      radius:4,
      color:'#0db8b8'
    })

    cluster.addLayer(marker)

  })
}
