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
   CCDs POR PROVINCIA  (fuente: RUVTE)
   Las claves deben coincidir exactamente con el GeoJSON
───────────────────────────────────────────────────────── */
const PROV_DATA = {
  "Buenos Aires":                         259,
  "Ciudad Autónoma de Buenos Aires":       62,
  "Santa Fe":                              61,
  "Córdoba":                               57,
  "Entre Ríos":                            29,
  "Corrientes":                            31,
  "Misiones":                              37,
  "Chaco":                                 14,
  "Formosa":                               12,
  "Jujuy":                                 20,
  "Salta":                                 16,
  "Tucumán":                               49,
  "Santiago del Estero":                   12,
  "Catamarca":                             14,
  "La Rioja":                               3,
  "San Juan":                              19,
  "San Luis":                              13,
  "Mendoza":                               40,
  "La Pampa":                              14,
  "Neuquén":                               19,
  "Río Negro":                             13,
  "Chubut":                                 8,
  "Santa Cruz":                             4,
  "Tierra del Fuego":                       1
};
 
/* GeoJSON con límites provinciales argentinos */
const GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina.geojson';
 
/* ─────────────────────────────────────────────────────────
   TREEMAP DATA
───────────────────────────────────────────────────────── */
const TREEMAP_DATA = {
  name: 'root',
  children: [
    { name: 'Fuerza de Seguridad Provincial', short: 'F.S. Provincial', value: 437, color: '#0a7a7a' },
    { name: 'Fuerza de Seguridad Federal',    short: 'F.S. Federal',    value: 125, color: '#0db8b8' },
    { name: 'Otros',                          short: 'Otros',           value: 108, color: '#1e3a3a' },
    { name: 'Ejército',                       short: 'Ejército',        value: 105, color: '#1adada' },
    { name: 'Armada',                         short: 'Arm.',            value: 17,  color: '#3a7fd5' },
    { name: 'Fuerza Aérea',                   short: 'F.A.',            value: 15,  color: '#55aaee' }
  ]
};
 
/* ─────────────────────────────────────────────────────────
   COLORES MARCADORES
───────────────────────────────────────────────────────── */
const DEP_COLORS = {
  provincial: '#0a7a7a',
  federal:    '#0db8b8',
  ejercito:   '#1adada',
  armada:     '#3a7fd5',
  aerea:      '#55aaee',
  otros:      '#1e4a4a',
  default:    '#444455'
};
 
 
/* ═══════════════════════════════════════════════════════════
   NAVEGACIÓN POR PANELES
══════════════════════════════════════════════════════════ */
const panels    = Array.from(document.querySelectorAll('.panel'));
const arrow     = document.getElementById('nav-arrow');
let current     = 0;
let isAnimating = false;
 
function showPanel(index) {
  if (isAnimating) return;
  isAnimating = true;
 
  panels.forEach((p, i) => {
    p.classList.remove('active', 'above');
    if (i < index)   p.classList.add('above');
    if (i === index) p.classList.add('active');
  });
 
  arrow.classList.toggle('hidden', index === panels.length - 1);
 
  if (index === 2) initPanel3();
  if (index === 3) initPanel4();
 
  setTimeout(() => { isAnimating = false; }, 960);
}
 
function nextPanel() {
  if (current < panels.length - 1) { current++; showPanel(current); }
}
function prevPanel() {
  if (current > 0) { current--; showPanel(current); }
}
function goHome() {
  current = 0;
  showPanel(0);
}
 
arrow.addEventListener('click', nextPanel);
document.getElementById('btn-back-home').addEventListener('click', goHome);
 
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') nextPanel();
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   prevPanel();
});
 
let wheelLock = false;
document.addEventListener('wheel', e => {
  if (wheelLock) return;
  wheelLock = true;
  if (e.deltaY > 30)  nextPanel();
  if (e.deltaY < -30) prevPanel();
  setTimeout(() => { wheelLock = false; }, 1100);
}, { passive: true });
 
let touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) { if (dy > 0) nextPanel(); else prevPanel(); }
}, { passive: true });
 
showPanel(0);
 
 
/* ═══════════════════════════════════════════════════════════
   PANEL 3 · CONTADOR + COROPLÉTICO D3 + TREEMAP
══════════════════════════════════════════════════════════ */
let panel3Init = false;
 
function initPanel3() {
  if (panel3Init) return;
  panel3Init = true;
 
  /* CountUp 807 */
  const cu = new countUp.CountUp('contador-807', 807, {
    duration: 2.8,
    useEasing: true,
    useGrouping: false
  });
  setTimeout(() => cu.start(), 200);
 
  /* D3 choropleth */
  buildChoropleth();
 
  /* Treemap */
  setTimeout(buildTreemap, 350);
}
 
 
/* ─────────────────────────────────────────────────────────
   D3 CHOROPLETH MAP
───────────────────────────────────────────────────────── */
function buildChoropleth() {
  const container = document.getElementById('choropleth-svg');
  if (!container) return;
 
  const W = container.clientWidth  || 500;
  const H = container.clientHeight || window.innerHeight;
 
  const svg = d3.select('#choropleth-svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
 
  /* Color scale: light teal (low) → dark teal (high) — igual que la imagen de referencia */
  const maxVal = d3.max(Object.values(PROV_DATA));
  /* Escala logarítmica para que las provincias pequeñas también tengan color visible */
  const colorScale = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(t => {
      /* t=0 → muy claro, t=1 → muy oscuro */
      const inv = 1 - t;
      /* light: #aaeae8  mid: #0db8b8  dark: #003a3a */
      if (inv > 0.6)  return d3.interpolate('#aaeae8', '#2ec8c8')(1 - (inv - 0.6) / 0.4);
      if (inv > 0.2)  return d3.interpolate('#2ec8c8', '#007a7a')(1 - (inv - 0.2) / 0.4);
      return d3.interpolate('#007a7a', '#002e2e')(1 - inv / 0.2);
    });
 
  const tooltip = document.getElementById('map-tooltip');
 
  fetch(GEOJSON_URL)
    .then(r => {
      if (!r.ok) throw new Error('GeoJSON fetch failed');
      return r.json();
    })
    .then(geojson => {
 
      /* Fit projection to container con padding generoso */
      const projection = d3.geoMercator()
        .fitExtent([[16, 16], [W - 16, H - 16]], geojson);
 
      const pathGen = d3.geoPath().projection(projection);
 
      /* Fondo negro para el área fuera de Argentina */
      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', W).attr('height', H)
        .attr('fill', '#0c0c0c');
 
      /* Draw provinces */
      svg.selectAll('path.provincia-path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('class', 'provincia-path')
        .attr('d', pathGen)
        .attr('fill', d => {
          const count = lookupProvince(d.properties.name || d.properties.nombre || '');
          return count !== null ? colorScale(count) : '#1e2e2e';
        })
        /* Tooltip */
        .on('mousemove', function(event, d) {
          const name  = d.properties.name || d.properties.nombre || 'Provincia';
          const count = lookupProvince(name);
          const rect  = container.closest('.info-col-map').getBoundingClientRect();
 
          tooltip.innerHTML =
            `<div class="tooltip-name">${name}</div>` +
            `<div class="tooltip-count">${count !== null
              ? `<strong>${count}</strong> centros clandestinos`
              : 'Sin datos'}</div>`;
 
          const mx = event.clientX - rect.left;
          const my = event.clientY - rect.top;
          const tw = 200;
          const tx = mx + 14 + tw > rect.width ? mx - tw - 10 : mx + 14;
          const ty = my - 10;
 
          tooltip.style.left = tx + 'px';
          tooltip.style.top  = ty + 'px';
          tooltip.classList.add('visible');
        })
        .on('mouseleave', () => tooltip.classList.remove('visible'));
 
      /* Number labels — centered, white, sized by projected bounding box */
      svg.selectAll('text.provincia-num')
        .data(geojson.features)
        .enter()
        .append('text')
        .attr('class', 'provincia-num')
        .attr('transform', d => {
          const [cx, cy] = pathGen.centroid(d);
          return `translate(${cx},${cy})`;
        })
        .attr('font-size', d => {
          /* Tamaño de fuente basado en el bounding box proyectado */
          const bounds = pathGen.bounds(d);
          const bw = bounds[1][0] - bounds[0][0];
          const bh = bounds[1][1] - bounds[0][1];
          const minDim = Math.min(bw, bh);
          return Math.min(Math.max(minDim * 0.38, 8), 22) + 'px';
        })
        .text(d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = lookupProvince(name);
          return count !== null ? count : '';
        });
 
    })
    .catch(err => {
      console.warn('Error cargando GeoJSON:', err);
      /* Fallback message */
      svg.append('text')
        .attr('x', W / 2).attr('y', H / 2 - 12)
        .attr('text-anchor', 'middle')
        .attr('fill', '#555')
        .attr('font-family', 'Outfit, sans-serif')
        .attr('font-size', '13px')
        .text('No se pudo cargar el mapa.');
 
      svg.append('text')
        .attr('x', W / 2).attr('y', H / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#444')
        .attr('font-family', 'Outfit, sans-serif')
        .attr('font-size', '11px')
        .text('Requiere conexión a internet.');
    });
}
 
/* Fuzzy lookup: normalize accents + lowercase and try partial match */
function normalizeStr(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
 
function lookupProvince(geoName) {
  if (!geoName) return null;
 
  /* Exact match first */
  if (PROV_DATA[geoName] !== undefined) return PROV_DATA[geoName];
 
  const gn = normalizeStr(geoName);
 
  for (const [key, val] of Object.entries(PROV_DATA)) {
    const kn = normalizeStr(key);
    if (kn === gn)                  return val;
    if (kn.includes(gn))            return val;
    if (gn.includes(kn))            return val;
  }
 
  /* Special aliases */
  const aliases = {
    'tierra del fuego, antartida e islas del atlantico sur': 'Tierra del Fuego',
    'ciudad de buenos aires': 'Ciudad Autónoma de Buenos Aires',
    'caba': 'Ciudad Autónoma de Buenos Aires',
    'gba': 'Buenos Aires'
  };
  const alias = aliases[gn];
  if (alias && PROV_DATA[alias] !== undefined) return PROV_DATA[alias];
 
  return null;
}
 
 
/* ─────────────────────────────────────────────────────────
   D3 TREEMAP
───────────────────────────────────────────────────────── */
function buildTreemap() {
  const container = document.getElementById('treemap-container');
  if (!container) return;
 
  const W = container.clientWidth  || 600;
  const H = container.clientHeight || 180;
 
  const root = d3.hierarchy(TREEMAP_DATA)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
 
  d3.treemap()
    .size([W, H])
    .paddingOuter(2)
    .paddingInner(2)
    .round(true)(root);
 
  const svg = d3.select('#treemap-container')
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
 
  const cell = svg.selectAll('g')
    .data(root.leaves())
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);
 
  cell.append('rect')
    .attr('class', 'treemap-cell')
    .attr('width',  d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0))
    .attr('fill',   d => d.data.color)
    .attr('rx', 1)
    .append('title')
    .text(d => `${d.data.name}: ${d.data.value} CCDs (${Math.round(d.data.value / 807 * 100)}%)`);
 
  cell.each(function(d) {
    const cw  = d.x1 - d.x0;
    const ch  = d.y1 - d.y0;
    const g   = d3.select(this);
    const pct = Math.round(d.data.value / 807 * 100) + '%';
 
    if (cw < 28 || ch < 20) return;
 
    const big = cw > 140 && ch > 55;
    const med = cw > 65  && ch > 38;
    const pxPct = Math.min(Math.max(cw * 0.15, 12), 22);
 
    g.append('text')
      .attr('class', 'treemap-label')
      .attr('x', 7)
      .attr('y', big ? ch * 0.38 : ch / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', pxPct + 'px')
      .text(pct);
 
    if (big) {
      g.append('text')
        .attr('class', 'treemap-sub')
        .attr('x', 7)
        .attr('y', ch * 0.63)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', Math.min(cw * 0.07, 11) + 'px')
        .text(d.data.name);
 
      g.append('text')
        .attr('class', 'treemap-sub')
        .attr('x', 7)
        .attr('y', ch - 7)
        .attr('dominant-baseline', 'auto')
        .attr('font-size', '10px')
        .text(d.data.value);
 
    } else if (med) {
      g.append('text')
        .attr('class', 'treemap-sub')
        .attr('x', 7)
        .attr('y', ch * 0.68)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .text(d.data.short);
    }
  });
}
 
 
/* ═══════════════════════════════════════════════════════════
   PANEL 4 · MAPA LEAFLET
══════════════════════════════════════════════════════════ */
let panel4Init = false;
let leafletMap = null;
let tileLayer  = null;
let cluster    = null;
 
function initPanel4() {
  if (panel4Init) return;
  panel4Init = true;
 
  leafletMap = L.map('mapa-interactivo', {
    center: [-38, -63],
    zoom: 5,
    zoomControl: true,
    preferCanvas: true
  });
 
  setTile('dark');
 
  cluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  leafletMap.addLayer(cluster);
 
  Papa.parse('data.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: results => {
      buildMapMarkers(results.data);
      buildLegend();
    },
    error: err => console.warn('CSV error:', err)
  });
 
  document.getElementById('tile-select')
    .addEventListener('change', e => setTile(e.target.value));
 
  setTimeout(() => leafletMap.invalidateSize(), 1000);
}
 
function setTile(key) {
  const cfg = TILES[key] || TILES.dark;
  if (tileLayer) leafletMap.removeLayer(tileLayer);
  tileLayer = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: 18 });
  tileLayer.addTo(leafletMap);
}
 
function buildMapMarkers(data) {
  cluster.clearLayers();
 
  data.forEach(row => {
    const lat  = parseFloat(row['LATITUD']  || row['latitud']  || '');
    const lon  = parseFloat(row['LONGITUD'] || row['longitud'] || '');
    const dep  = (row['DEPENDENCIA']        || '').trim();
    const depS = (row['DEPENDENCIA SIMPLIF'] || row['DEPENDENCIA_SIMPLIF'] || dep).trim();
    const nom  = (row['NOMBRE ESTABLECIMIENTO'] || row['NOMBRE_ESTABLECIMIENTO'] || '').trim();
 
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
 
    const color = resolveColor(dep);
 
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:10px;height:10px;border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.3);
        box-shadow:0 0 6px ${color}99;
      "></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
 
    const marker = L.marker([lat, lon], { icon });
 
    marker.bindTooltip(
      `<strong style="color:#3ddada;font-family:Outfit,sans-serif">${depS || dep}</strong>` +
      `<br><span style="font-family:Outfit,sans-serif;font-size:12px">${nom}</span>`,
      { direction: 'top', offset: [0, -6], opacity: 0.97 }
    );
 
    marker.bindPopup(
      `<div class="popup-nombre">${nom || 'Sin nombre'}</div>` +
      `<div class="popup-dep">${depS || dep || '–'}</div>`
    );
 
    cluster.addLayer(marker);
  });
}
 
function resolveColor(dep) {
  if (!dep) return DEP_COLORS.default;
  const d = dep.toLowerCase();
  if (d.includes('provincial') || d.includes('polici'))              return DEP_COLORS.provincial;
  if (d.includes('federal')    || d.includes('gendarm') ||
      d.includes('prefect'))                                          return DEP_COLORS.federal;
  if (d.includes('ejérci')     || d.includes('ejerci'))              return DEP_COLORS.ejercito;
  if (d.includes('armada')     || d.includes('marina'))              return DEP_COLORS.armada;
  if (d.includes('aérea')      || d.includes('aerea'))               return DEP_COLORS.aerea;
  return DEP_COLORS.otros;
}
 
function buildLegend() {
  const legend = document.getElementById('map-legend');
  legend.innerHTML = '<div class="legend-title">Dependencia</div>';
 
  const entries = [
    ['Fuerza de Seguridad Provincial', DEP_COLORS.provincial],
    ['Fuerza de Seguridad Federal',    DEP_COLORS.federal],
    ['Ejército',                        DEP_COLORS.ejercito],
    ['Armada',                          DEP_COLORS.armada],
    ['Fuerza Aérea',                    DEP_COLORS.aerea],
    ['Otros',                           DEP_COLORS.otros]
  ];
 
  entries.forEach(([label, color]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML =
      `<span class="legend-dot" style="background:${color}"></span>` +
      `<span class="legend-label">${label}</span>`;
    legend.appendChild(item);
  });
}
