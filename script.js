'use strict';

/* =========================================================
   DATOS
========================================================= */

const GEOJSON_URL = "argentina.geojson";

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

const TREEMAP_DATA = {
name:"root",
children:[
{ name:'Fuerza de Seguridad Provincial',short:'F.S. Provincial',value:437,color:'#0a7a7a'},
{ name:'Fuerza de Seguridad Federal',short:'F.S. Federal',value:125,color:'#0db8b8'},
{ name:'Otros',short:'Otros',value:108,color:'#1e3a3a'},
{ name:'Ejército',short:'Ejército',value:105,color:'#1adada'},
{ name:'Armada',short:'Arm.',value:17,color:'#3a7fd5'},
{ name:'Fuerza Aérea',short:'F.A.',value:15,color:'#55aaee'}
]};

/* =========================================================
   PANEL SYSTEM
========================================================= */

const panels=[...document.querySelectorAll(".panel")];
const arrow=document.getElementById("nav-arrow");

let current=0;
let animating=false;

function showPanel(index){

if(animating)return;
animating=true;

panels.forEach((p,i)=>{
p.classList.remove("active","above");
if(i<index)p.classList.add("above");
if(i===index)p.classList.add("active");
});

arrow.classList.toggle("hidden",index===panels.length-1);

if(index===2)initPanel3();

setTimeout(()=>animating=false,900);

}

function nextPanel(){if(current<panels.length-1){current++;showPanel(current)}}
function prevPanel(){if(current>0){current--;showPanel(current)}}

arrow.addEventListener("click",nextPanel);

document.addEventListener("keydown",e=>{
if(e.key==="ArrowDown")nextPanel();
if(e.key==="ArrowUp")prevPanel();
});

showPanel(0);

/* =========================================================
   PANEL 3
========================================================= */

let panel3Init=false;

function initPanel3(){

if(panel3Init)return;
panel3Init=true;

new countUp.CountUp("contador-807",807,{duration:2.8,useGrouping:false}).start();

setTimeout(buildTreemap,400);
setTimeout(buildChoropleth,900);

}

/* =========================================================
   MAPA D3
========================================================= */

function buildChoropleth(){

const container=document.getElementById("choropleth-svg");
if(!container)return;

const col=container.closest(".info-col-map");

const W=col.clientWidth;
const H=col.clientHeight;

container.innerHTML="";

const svg=d3.select(container)
.attr("width",W)
.attr("height",H)
.attr("viewBox",`0 0 ${W} ${H}`);

fetch(GEOJSON_URL)
.then(r=>r.json())
.then(geojson=>{

const projection=d3.geoNaturalEarth1()
.fitExtent([[10,10],[W-10,H-10]],geojson);

const path=d3.geoPath().projection(projection);

svg.selectAll("path")
.data(geojson.features)
.enter()
.append("path")
.attr("class","provincia-path")
.attr("d",path)
.attr("fill",d=>{
const name=d.properties.name||d.properties.nombre;
return PROV_COLORS[name]||"#333";
});

svg.selectAll("text")
.data(geojson.features)
.enter()
.append("text")
.attr("class","provincia-num")
.attr("transform",d=>{
const [x,y]=path.centroid(d);
return `translate(${x},${y})`;
})
.attr("fill","#ffffff")
.text(d=>{
const name=d.properties.name||d.properties.nombre;
return PROV_DATA[name]||"";
});

});

}

window.addEventListener("resize",()=>{
if(panel3Init)setTimeout(buildChoropleth,200);
});

/* =========================================================
   TREEMAP
========================================================= */

function buildTreemap(){

const container=document.getElementById("treemap-container");

const W=container.clientWidth||600;
const H=container.clientHeight||200;

container.innerHTML="";

const root=d3.hierarchy(TREEMAP_DATA)
.sum(d=>d.value)
.sort((a,b)=>b.value-a.value);

d3.treemap()
.size([W,H])
.paddingInner(2)
.paddingOuter(2)
(root);

const svg=d3.select(container)
.append("svg")
.attr("viewBox",`0 0 ${W} ${H}`);

const cell=svg.selectAll("g")
.data(root.leaves())
.enter()
.append("g")
.attr("class","treemap-cell-group")
.attr("transform",d=>`translate(${d.x0},${d.y0})`);

cell.append("rect")
.attr("width",d=>d.x1-d.x0)
.attr("height",d=>d.y1-d.y0)
.attr("fill",d=>d.data.color);

cell.append("text")
.attr("class","treemap-label")
.attr("x",d=>(d.x1-d.x0)/2)
.attr("y",d=>(d.y1-d.y0)/2-6)
.attr("text-anchor","middle")
.text(d=>Math.round(d.data.value/807*100)+"%");

cell.append("text")
.attr("class","treemap-sub")
.attr("x",d=>(d.x1-d.x0)/2)
.attr("y",d=>(d.y1-d.y0)/2+12)
.attr("text-anchor","middle")
.text(d=>d.data.short);

}
