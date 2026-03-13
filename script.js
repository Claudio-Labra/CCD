'use strict';

/* ─────────────────────────────────────────────────────────
   TILES
───────────────────────────────────────────────────────── */
const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; CARTO'
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

/* ─────────────────────────────────────────────────────────
   COLORES PROVINCIALES
───────────────────────────────────────────────────────── */

const PROV_COLORS = {
"Buenos Aires":"#0d5560",
"Catamarca":"#bee7ed",
"Chaco":"#6abeca",
"Chubut":"#bee7ed",
"Córdoba":"#2c747f",
"Corrientes":"#3996a4",
"Entre Ríos":"#3996a4",
"Formosa":"#6abeca",
"Jujuy":"#3996a4",
"La Pampa":"#6abeca",
"La Rioja":"#6abeca",
"Mendoza":"#2c747f",
"Misiones":"#3996a4",
"Neuquén":"#6abeca",
"Río Negro":"#6abeca",
"Salta":"#6abeca",
"San Juan":"#6abeca",
"San Luis":"#6abeca",
"Santa Cruz":"#bee7ed",
"Santa Fe":"#2c747f",
"Santiago del Estero":"#6abeca",
"Tierra del Fuego":"#bee7ed",
"Tucumán":"#2c747f",
"Ciudad Autónoma de Buenos Aires":"#0d5d60"
};

const GEOJSON_URL = 'argentina.geojson';

/* ─────────────────────────────────────────────────────────
   TREEMAP DATA
───────────────────────────────────────────────────────── */

const TREEMAP_DATA = {
  name:'root',
  children:[
    {name:'Fuerza de Seguridad Provincial',short:'F.S. Provincial',value:437,color:'#0a7a7a'},
    {name:'Fuerza de Seguridad Federal',short:'F.S. Federal',value:125,color:'#0db8b8'},
    {name:'Otros',short:'Otros',value:108,color:'#1e3a3a'},
    {name:'Ejército',short:'Ejército',value:105,color:'#1adada'},
    {name:'Armada',short:'Arm.',value:17,color:'#3a7fd5'},
    {name:'Fuerza Aérea',short:'F.A.',value:15,color:'#55aaee'}
  ]
};

/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN
══════════════════════════════════════════════════════════ */

const panels = Array.from(document.querySelectorAll('.panel'));
const arrow = document.getElementById('nav-arrow');

let current = 0;
let isAnimating = false;

function showPanel(index){

  if(isAnimating) return;
  isAnimating = true;

  panels.forEach((p,i)=>{
    p.classList.remove('active','above');
    if(i < index) p.classList.add('above');
    if(i === index) p.classList.add('active');
  });

  arrow.classList.toggle('hidden',index === panels.length-1);

  if(index === 1) initPanel2();
  if(index === 2) initPanel3();
  if(index === 3) initPanel4();

  setTimeout(()=>{isAnimating=false},900);
}

function nextPanel(){ if(current < panels.length-1){current++;showPanel(current)} }
function prevPanel(){ if(current > 0){current--;showPanel(current)} }

arrow.addEventListener('click',nextPanel);

document.addEventListener('keydown',e=>{
  if(e.key === 'ArrowDown') nextPanel();
  if(e.key === 'ArrowUp') prevPanel();
});

showPanel(0);

/* ═══════════════════════════════════════════════════════════
   PANEL 2
══════════════════════════════════════════════════════════ */

let panel2Init = false;

function initPanel2(){

  if(panel2Init) return;
  panel2Init = true;

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

let panel3Init = false;

function initPanel3(){

  if(panel3Init) return;
  panel3Init = true;

  new countUp.CountUp('contador-807',807,{
    duration:2.8,
    useGrouping:false
  }).start();

  setTimeout(buildChoropleth,900);
  setTimeout(buildTreemap,350);
}

/* ─────────────────────────────────────────────────────────
   MAPA D3
───────────────────────────────────────────────────────── */

function buildChoropleth(){

  const svgContainer=document.getElementById('choropleth-svg');
  if(!svgContainer) return;

  const colMap=svgContainer.closest('.info-col-map');

  const W = colMap.clientWidth;
  const H = colMap.clientHeight;

  svgContainer.innerHTML='';

  const svg=d3.select(svgContainer)
  .attr('width',W)
  .attr('height',H)
  .attr('viewBox',`0 0 ${W} ${H}`);

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
      const name=d.properties.name || d.properties.nombre;
      return PROV_COLORS[name] || '#222';
    });

    svg.selectAll('text')
    .data(geojson.features)
    .enter()
    .append('text')
    .attr('class','provincia-num')
    .attr('transform',d=>{
      const [x,y]=path.centroid(d);
      return `translate(${x},${y})`;
    })
    .text(d=>{
      const name=d.properties.name || d.properties.nombre;
      return PROV_DATA[name] || '';
    });

  });

}

window.addEventListener('resize',()=>{
  if(panel3Init) setTimeout(buildChoropleth,200);
});

/* ─────────────────────────────────────────────────────────
   TREEMAP
───────────────────────────────────────────────────────── */

function buildTreemap(){

  const container=document.getElementById('treemap-container');

  const W=container.clientWidth || 600;
  const H=container.clientHeight || 180;

  container.innerHTML='';

  const root=d3.hierarchy(TREEMAP_DATA)
  .sum(d=>d.value)
  .sort((a,b)=>b.value-a.value);

  d3.treemap()
  .size([W,H])
  .paddingOuter(2)
  .paddingInner(2)
  .round(true)(root);

  const svg=d3.select('#treemap-container')
  .append('svg')
  .attr('viewBox',`0 0 ${W} ${H}`);

  const cell=svg.selectAll('g')
  .data(root.leaves())
  .enter()
  .append('g')
  .attr('transform',d=>`translate(${d.x0},${d.y0})`);

  cell.append('rect')
  .attr('width',d=>d.x1-d.x0)
  .attr('height',d=>d.y1-d.y0)
  .attr('fill',d=>d.data.color);

  cell.append('text')
  .attr('x',d=>(d.x1-d.x0)/2)
  .attr('y',d=>(d.y1-d.y0)/2 - 6)
  .attr('text-anchor','middle')
  .attr('fill','#ffffff')
  .attr('font-size','18px')
  .text(d=>Math.round(d.data.value/807*100)+'%');

  cell.append('text')
  .attr('x',d=>(d.x1-d.x0)/2)
  .attr('y',d=>(d.y1-d.y0)/2 + 12)
  .attr('text-anchor','middle')
  .attr('fill','#ffffff')
  .attr('font-size','11px')
  .text(d=>d.data.short);
}

/* ═══════════════════════════════════════════════════════════
   PANEL 4 (Leaflet)
══════════════════════════════════════════════════════════ */

let panel4Init=false;
let leafletMap;
let cluster;

function initPanel4(){

  if(panel4Init) return;
  panel4Init=true;

  leafletMap=L.map('mapa-interactivo',{
    center:[-38,-63],
    zoom:5
  });

  L.tileLayer(TILES.dark.url,{
    attribution:TILES.dark.attr
  }).addTo(leafletMap);

  cluster=L.markerClusterGroup();
  leafletMap.addLayer(cluster);

  Papa.parse('data.csv',{
    download:true,
    header:true,
    complete:res=>buildMapMarkers(res.data)
  });

}

function buildMapMarkers(data){

  data.forEach(row=>{

    const lat=parseFloat(row.LATITUD);
    const lon=parseFloat(row.LONGITUD);

    if(!lat || !lon) return;

    const marker=L.circleMarker([lat,lon],{
      radius:4,
      color:'#0db8b8'
    });

    cluster.addLayer(marker);

  });

}
