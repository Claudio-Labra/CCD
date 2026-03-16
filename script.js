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

/* colores fijos provincias */

const PROV_COLORS={
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

const GEOJSON_URL='argentina.geojson';

/* ─────────────────────────────────────────────────────────
   TREEMAP DATA
───────────────────────────────────────────────────────── */

const TREEMAP_DATA={
name:'root',
children:[
{name:'Fuerza de Seguridad Provincial',short:'F.S. Provincial',value:437,color:'#0a7a7a'},
{name:'Fuerza de Seguridad Federal',short:'F.S. Federal',value:125,color:'#0db8b8'},
{name:'Otros',short:'Otros',value:108,color:'#1e3a3a'},
{name:'Ejército',short:'Ejército',value:105,color:'#1adada'},
{name:'Armada',short:'Arm.',value:17,color:'#3a7fd5'},
{name:'Fuerza Aérea',short:'F.A.',value:15,color:'#55aaee'}
]};

/* ─────────────────────────────────────────────────────────
   COLORES MARCADORES
───────────────────────────────────────────────────────── */

const DEP_COLORS={
provincial:'#e63946',
federal:'#457b9d',
ejercito:'#2a9d8f',
armada:'#f4a261',
aerea:'#9b5de5',
otros:'#6c757d',
default:'#999999'
};


/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN PANELES
══════════════════════════════════════════════════════════ */

const panels=Array.from(document.querySelectorAll('.panel'));
const arrow=document.getElementById('nav-arrow');

let current=0;
let isAnimating=false;

function showPanel(index){

if(isAnimating)return;
isAnimating=true;

panels.forEach((p,i)=>{
p.classList.remove('active','above');
if(i<index)p.classList.add('above');
if(i===index)p.classList.add('active');
});

arrow.classList.toggle('hidden',index===panels.length-1);

if(index===1)initPanel2();
if(index===2)initPanel3();
if(index===3)initPanel4();

setTimeout(()=>{isAnimating=false},960);

}

function nextPanel(){if(current<panels.length-1){current++;showPanel(current)}}
function prevPanel(){if(current>0){current--;showPanel(current)}}
function goHome(){current=0;showPanel(0)}

arrow.addEventListener('click',nextPanel);
document.getElementById('btn-back-home').addEventListener('click',goHome);

document.addEventListener('keydown',e=>{
if(e.key==='ArrowDown'||e.key==='PageDown')nextPanel();
if(e.key==='ArrowUp'||e.key==='PageUp')prevPanel();
});

showPanel(0);


/* ═══════════════════════════════════════════════════════════
   PANEL 2
══════════════════════════════════════════════════════════ */

let panel2Init=false;

function initPanel2(){

if(panel2Init)return;
panel2Init=true;

const opts={
duration:2.5,
useEasing:true,
useGrouping:true,
separator:'.',
decimal:','
};

const cu1=new countUp.CountUp('ruvte-n1',8753,opts);
const cu2=new countUp.CountUp('ruvte-n2',807,{...opts,separator:''});
const cu3=new countUp.CountUp('ruvte-n3',30000,opts);

setTimeout(()=>{
cu1.start();
cu2.start();
cu3.start();
},200);

}


/* ═══════════════════════════════════════════════════════════
   PANEL 3
══════════════════════════════════════════════════════════ */

let panel3Init=false;

function initPanel3(){

if(panel3Init)return;
panel3Init=true;

const cu=new countUp.CountUp('contador-807',807,{
duration:2.8,
useGrouping:false
});

setTimeout(()=>cu.start(),200);

setTimeout(buildTreemap,350);
setTimeout(buildChoropleth,950);

}


/* ─────────────────────────────────────────────────────────
   MAPA ARGENTINA D3
───────────────────────────────────────────────────────── */

function buildChoropleth(){

const container=document.getElementById('choropleth-svg');
if(!container)return;

const W=container.clientWidth;
const H=window.innerHeight;

const svg=d3.select('#choropleth-svg')
.attr('width',W)
.attr('height',H);

fetch(GEOJSON_URL)
.then(r=>r.json())
.then(geojson=>{

const projection=d3.geoMercator()
.fitSize([W,H],geojson);

const path=d3.geoPath().projection(projection);

const g=svg.append("g");

const provincias=g.selectAll("path")
.data(geojson.features)
.enter()
.append("path")
.attr("class","provincia-path")
.attr("d",path)
.attr("fill",d=>{
const name=d.properties.name||d.properties.nombre;
return PROV_COLORS[name]||"#1a1a1a";
})
.on("mouseover",function(event,d){

const name=d.properties.name||d.properties.nombre;
const val=PROV_DATA[name]||0;

const tooltip=d3.select("#map-tooltip");

tooltip
.html(`<div class="tooltip-name">${name}</div>
<div class="tooltip-count">${val} centros</div>`)
.classed("visible",true);

tooltip
.style("left",(event.pageX+12)+"px")
.style("top",(event.pageY-12)+"px");

d3.select(this)
.raise()
.transition()
.duration(200)
.attr("transform",()=>{
const c=path.centroid(d);
return `translate(${c[0]},${c[1]}) scale(1.08) translate(${-c[0]},${-c[1]})`;
})
.attr("stroke","#ffffff")
.attr("stroke-width",2);

})
.on("mousemove",function(event){

d3.select("#map-tooltip")
.style("left",(event.pageX+12)+"px")
.style("top",(event.pageY-12)+"px");

})
.on("mouseout",function(){

d3.select("#map-tooltip")
.classed("visible",false);

d3.select(this)
.transition()
.duration(200)
.attr("transform","scale(1)")
.attr("stroke","none");

});

provincias.append("title")
.text(d=>{
const name=d.properties.name||d.properties.nombre;
return `${name} — ${PROV_DATA[name]||0}`;
});

svg.selectAll("text")
.data(geojson.features)
.enter()
.append("text")
.attr("class","provincia-num")
.attr("fill","#ffffff")
.attr("transform",d=>{
let [x,y]=path.centroid(d);

if((d.properties.name||d.properties.nombre)==="Salta"){
x+=15;
y+=5;
}
return `translate(${x},${y})`;
})
.text(d=>{
const name=d.properties.name||d.properties.nombre;
return PROV_DATA[name]||"";
});

});

}


/* ─────────────────────────────────────────────────────────
   TREEMAP
───────────────────────────────────────────────────────── */

function buildTreemap(){

const container=document.getElementById('treemap-container');

const W=container.clientWidth||600;
const H=container.clientHeight||180;

const root=d3.hierarchy(TREEMAP_DATA)
.sum(d=>d.value)
.sort((a,b)=>b.value-a.value);

d3.treemap()
.size([W,H])
.paddingOuter(4)
.paddingInner(4)
.round(true)(root);

const svg=d3.select('#treemap-container')
.append('svg')
.attr('viewBox',`0 0 ${W} ${H}`);

const tooltip=d3.select("body")
.append("div")
.style("position","absolute")
.style("background","#0b1e1e")
.style("color","#ffffff")
.style("padding","10px 12px")
.style("border-radius","6px")
.style("font-size","13px")
.style("pointer-events","none")
.style("opacity",0)
.style("box-shadow","0 6px 18px rgba(0,0,0,0.35)");

const cell=svg.selectAll('g')
.data(root.leaves())
.enter()
.append('g')
.attr('transform',d=>`translate(${d.x0},${d.y0})`)
.style("cursor","pointer");

const rect=cell.append('rect')
.attr('width',0)
.attr('height',0)
.attr('fill',d=>d.data.color)
.attr('rx',4)
.attr('ry',4)
.transition()
.duration(800)
.attr('width',d=>d.x1-d.x0)
.attr('height',d=>d.y1-d.y0);

cell
.on("mouseover",function(event,d){

const percent=Math.round(d.data.value/807*100);

d3.select(this)
.raise()
.transition()
.duration(180)
.attr("transform",`translate(${d.x0-2},${d.y0-2}) scale(1.04)`);

tooltip
.transition()
.duration(120)
.style("opacity",1);

tooltip.html(
`<strong>${d.data.name}</strong><br>
${d.data.value} centros<br>
${percent} %`
);

})
.on("mousemove",function(event){

tooltip
.style("left",(event.pageX+14)+"px")
.style("top",(event.pageY-18)+"px");

})
.on("mouseout",function(event,d){

d3.select(this)
.transition()
.duration(180)
.attr("transform",`translate(${d.x0},${d.y0}) scale(1)`);

tooltip
.transition()
.duration(200)
.style("opacity",0);

});


/* % GRANDE */

cell.append('text')
.attr('x',d=>(d.x1-d.x0)/2)
.attr('y',d=>(d.y1-d.y0)/2-14)
.attr('text-anchor','middle')
.style('font-size','30px')
.style('font-weight','700')
.style('fill','#ffffff')
.text(d=>Math.round(d.data.value/807*100)+'%');


/* NOMBRE */

cell.append('text')
.attr('x',d=>(d.x1-d.x0)/2)
.attr('y',d=>(d.y1-d.y0)/2+8)
.attr('text-anchor','middle')
.style('font-size','13px')
.style('fill','#ffffff')
.text(d=>d.data.short);


/* CANTIDAD */

cell.append('text')
.attr('x',d=>(d.x1-d.x0)/2)
.attr('y',d=>(d.y1-d.y0)/2+26)
.attr('text-anchor','middle')
.style('font-size','14px')
.style('fill','#ffffff')
.text(d=>d.data.value);

}


/* ═══════════════════════════════════════════════════════════
   PANEL 4 MAPA FINAL
══════════════════════════════════════════════════════════ */

let panel4Init=false;
let leafletMap=null;
let tileLayer=null;
let cluster=null;

function initPanel4(){

if(panel4Init)return;
panel4Init=true;

leafletMap=L.map('mapa-interactivo',{
center:[-38,-63],
zoom:5
});

setTile('dark');

cluster=L.markerClusterGroup({
maxClusterRadius:50,
spiderfyOnMaxZoom:true,
showCoverageOnHover:false
});

leafletMap.addLayer(cluster);

Papa.parse('data.csv',{
download:true,
header:true,
skipEmptyLines:true,
complete:results=>{
buildMapMarkers(results.data);
buildLegend();
}
});

document.getElementById('tile-select')
.addEventListener('change',e=>setTile(e.target.value));

setTimeout(()=>leafletMap.invalidateSize(),1000);

}

function setTile(key){

const cfg=TILES[key]||TILES.dark;

if(tileLayer)leafletMap.removeLayer(tileLayer);

tileLayer=L.tileLayer(cfg.url,{
attribution:cfg.attr,
maxZoom:18
});

tileLayer.addTo(leafletMap);

}

function buildMapMarkers(data){

cluster.clearLayers();

data.forEach(row=>{

const lat=parseFloat(row['LATITUD']||row['latitud']);
const lon=parseFloat(row['LONGITUD']||row['longitud']);
const dep=(row['DEPENDENCIA']||'').trim();
const depS=(row['DEPENDENCIA SIMPLIF']||dep).trim();
const nom=(row['NOMBRE ESTABLECIMIENTO']||'').trim();

if(!lat||!lon)return;

const color=resolveColor(dep);

const icon=L.divIcon({
className:'',
html:`<div style="
width:10px;height:10px;border-radius:50%;
background:${color};
border:2px solid rgba(255,255,255,0.3);
box-shadow:0 0 6px ${color}99;
"></div>`,
iconSize:[10,10],
iconAnchor:[5,5]
});

const marker=L.marker([lat,lon],{icon});

marker.bindPopup(
`<div class="popup-nombre">${nom||'Sin nombre'}</div>
<div class="popup-dep">${depS||dep||'-'}</div>`
);

cluster.addLayer(marker);

});

}

function resolveColor(dep){

if(!dep)return DEP_COLORS.default;

const d=dep.toLowerCase();

if(d.includes('provincial')||d.includes('polici'))return DEP_COLORS.provincial;
if(d.includes('federal')||d.includes('gendarm')||d.includes('prefect'))return DEP_COLORS.federal;
if(d.includes('ejerc'))return DEP_COLORS.ejercito;
if(d.includes('armada')||d.includes('marina'))return DEP_COLORS.armada;
if(d.includes('aerea')||d.includes('aérea'))return DEP_COLORS.aerea;

return DEP_COLORS.otros;

}

function buildLegend(){

const legend=document.getElementById('map-legend');

legend.innerHTML='<div class="legend-title">Dependencia</div>';

const entries=[
['Fuerza de Seguridad Provincial',DEP_COLORS.provincial],
['Fuerza de Seguridad Federal',DEP_COLORS.federal],
['Ejército',DEP_COLORS.ejercito],
['Armada',DEP_COLORS.armada],
['Fuerza Aérea',DEP_COLORS.aerea],
['Otros',DEP_COLORS.otros]
];

entries.forEach(([label,color])=>{
const item=document.createElement('div');
item.className='legend-item';
item.innerHTML=
`<span class="legend-dot" style="background:${color}"></span>
<span class="legend-label">${label}</span>`;
legend.appendChild(item);
});

}
