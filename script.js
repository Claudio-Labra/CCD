
// CONTADORES


const total = new countUp.CountUp("total", 807)

const armada = new countUp.CountUp("armada", 17)
const ejercito = new countUp.CountUp("ejercito", 105)
const faa = new countUp.CountUp("faa", 15)
const federal = new countUp.CountUp("federal", 125)
const provincial = new countUp.CountUp("provincial", 437)
const otros = new countUp.CountUp("otros", 108)

const desaparecidos = new countUp.CountUp("desaparecidos", 30000)



// INICIAR CONTADORES CUANDO APARECEN


const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){

if(entry.target.querySelector("#total"))
total.start()

if(entry.target.querySelector("#armada")){
armada.start()
ejercito.start()
faa.start()
federal.start()
provincial.start()
otros.start()
}

if(entry.target.querySelector("#desaparecidos"))
desaparecidos.start()

}

})

})


document.querySelectorAll(".panel").forEach(panel => {

observer.observe(panel)

})



// JURISDICCIONES


const jurisdicciones = {

"BUENOS AIRES":259,
"CATAMARCA":3,
"CHACO":12,
"CHUBUT":8,
"CABA":61,
"CÓRDOBA":49,
"CORRIENTES":31,
"ENTRE RIOS":29,
"FORMOSA":16,
"JUJUY":20,
"LA PAMPA":14,
"LA RIOJA":19,
"MENDOZA":40,
"MISIONES":37,
"NEUQUEN":19,
"RIO NEGRO":13,
"SAN JUAN":13,
"SAN LUIS":12,
"SANTA CRUZ":4,
"SANTA FE":57,
"SANTIAGO DEL ESTERO":14,
"TIERRA DEL FUEGO":1,
"TUCUMAN":62,
"SALTA":14

}


const contenedor = document.getElementById("jurisdicciones")

for(let j in jurisdicciones){

const div = document.createElement("div")

div.innerHTML = j + " — " + jurisdicciones[j]

contenedor.appendChild(div)

}



// MAPA


const mapa = L.map("mapa").setView([-38.4, -63.6], 5)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")

.addTo(mapa)



// CARGAR CSV


fetch("data.csv")

.then(res=>res.text())

.then(text=>{

const filas = text.split("\n").slice(1)

filas.forEach(f=>{

const col = f.split(",")

const nombre = col[0]

const lat = parseFloat(col[1])

const lon = parseFloat(col[2])

if(!isNaN(lat)){

L.marker([lat,lon])

.addTo(mapa)

.bindPopup(nombre)

}

})

})
