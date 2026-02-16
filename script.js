
let datos = []

let mapa = L.map("mapa").setView([-38,-63],5)

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
).addTo(mapa)


let cluster = L.markerClusterGroup()

mapa.addLayer(cluster)



Papa.parse("data.csv", {

download:true,

header:true,

complete:function(results){

datos = results.data

procesarDatos()

crearMapa(datos)

}

})



function procesarDatos(){

const total = datos.length


new countUp.CountUp(
"contador-total",
total
).start()



// DEPENDENCIAS


const deps = {}

datos.forEach(d=>{

const dep = d.dependencia

if(!deps[dep]) deps[dep]=0

deps[dep]++

})



mostrarContadores(deps,"dependencias")

crearFiltro(deps,"filtro-dependencia")



// JURISDICCIONES


const juris = {}

datos.forEach(d=>{

const j = d.jurisdiccion

if(!juris[j]) juris[j]=0

juris[j]++

})



mostrarContadores(juris,"jurisdicciones")

crearFiltro(juris,"filtro-jurisdiccion")

}



function mostrarContadores(obj,elemento){

const cont = document.getElementById(elemento)

cont.innerHTML=""


for(let key in obj){

const div = document.createElement("div")

const span = document.createElement("span")

span.id = elemento + key

span.innerHTML = "0"


div.innerHTML = key + " "

div.appendChild(span)

cont.appendChild(div)


new countUp.CountUp(

span.id,

obj[key]

).start()

}

}



function crearMapa(datos){

cluster.clearLayers()

datos.forEach(d=>{

const lat = parseFloat(d.lat)

const lon = parseFloat(d.lon)

if(!lat) return


const marker = L.marker([lat,lon])

.bindPopup(

"<b>"+d.nombre+"</b><br>"+

d.jurisdiccion+"<br>"+

d.dependencia

)

cluster.addLayer(marker)

})

}



function crearFiltro(obj,id){

const select = document.getElementById(id)

for(let key in obj){

const option = document.createElement("option")

option.value = key

option.innerHTML = key

select.appendChild(option)

}

}



document.getElementById("filtro-dependencia")

.addEventListener("change",filtrar)


document.getElementById("filtro-jurisdiccion")

.addEventListener("change",filtrar)



function filtrar(){

const dep = document.getElementById(
"filtro-dependencia"
).value

const jur = document.getElementById(
"filtro-jurisdiccion"
).value


const filtrados = datos.filter(d=>{

return (dep=="todos"||d.dependencia==dep)
&&
(jur=="todos"||d.jurisdiccion==jur)

})

crearMapa(filtrados)

}
