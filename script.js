/* ============================================================
   CENTROS CLANDESTINOS DE DETENCIÓN · script.js
   ============================================================ */

'use strict';

// ─── Tile layers ────────────────────────────────────────────
const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA'
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenTopoMap'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors'
  }
};

// ─── Province CCD counts (RUVTE data) ───────────────────────
const PROVINCE_DATA = {
  "Buenos Aires":                        259,
  "Ciudad Autónoma de Buenos Aires":      62,
  "Santa Fe":                             61,
  "Córdoba":                              57,
  "Corrientes":                           31,
  "Misiones":                             37,
  "Entre Ríos":                           29,
  "Mendoza":                              40,
  "Tucumán":                              14,
  "Chaco":                                14,
  "Jujuy":                                20,
  "Salta":                                16,
  "Formosa":                              12,
  "Santiago del Estero":                  12,
  "La Rioja":                              3,
  "Catamarca":                            14,
  "San Juan":                             19,
  "San Luis":                             13,
  "La Pampa":                             14,
  "Neuquén":                              19,
  "Río Negro":                            13,
  "Chubut":                                8,
  "Santa Cruz":                            4,
  "Tierra del Fuego":                      1
};

// ─── Dependencia color palette ───────────────────────────────
const DEP_COLORS = {
  "Fuerza de Seguridad Provincial": "#0a7a7a",
  "Fuerza de Seguridad Federal":    "#0db8b8",
  "Ejército":                       "#e8a020",
  "Armada":                         "#3a7fd5",
  "Fuerza Aérea":                   "#6cacee",
  "Otros":                          "#8888aa",
  "default":                        "#444455"
};

// ─── GeoJSON source ──────────────────────────────────────────
const GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/argentina.geojson';

// ============================================================
//  PANEL NAVIGATION
// ============================================================
const panels   = Array.from(document.querySelectorAll('.panel'));
const arrow    = document.getElementById('nav-arrow');
let current    = 0;
let isAnimating = false;

function showPanel(index) {
  if (isAnimating) return;
  isAnimating = true;

  panels.forEach((p, i) => {
    p.classList.remove('active', 'above');
    if (i < index)  p.classList.add('above');
    if (i === index) p.classList.add('active');
  });

  // Hide arrow on last panel
  if (index === panels.length - 1) {
    arrow.classList.add('hidden');
  } else {
    arrow.classList.remove('hidden');
  }

  // Trigger panel-specific init
  if (index === 2) initPanel3();
  if (index === 3) initPanel4();

  setTimeout(() => { isAnimating = false; }, 950);
}

function nextPanel() {
  if (current < panels.length - 1) {
    current++;
    showPanel(current);
  }
}

function prevPanel() {
  if (current > 0) {
    current--;
    showPanel(current);
  }
}

arrow.addEventListener('click', nextPanel);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') nextPanel();
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   prevPanel();
});

// Wheel / swipe navigation
let wheelLock = false;
document.addEventListener('wheel', (e) => {
  if (wheelLock) return;
  wheelLock = true;
  if (e.deltaY > 30)  nextPanel();
  if (e.deltaY < -30) prevPanel();
  setTimeout(() => { wheelLock = false; }, 1100);
}, { passive: true });

// Touch swipe
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) {
    if (dy > 0) nextPanel(); else prevPanel();
  }
}, { passive: true });

// Init first panel
showPanel(0);


// ============================================================
//  PANEL 3 · D3 CHOROPLETH + COUNTER
// ============================================================
let panel3Initialized = false;

function initPanel3() {
  if (panel3Initialized) return;
  panel3Initialized = true;

  // ── Counter 807 ────────────────────────────────────────────
  const cu = new countUp.CountUp('contador-807', 807, {
    duration: 3,
    useEasing: true,
    useGrouping: true,
    separator: '.',
    decimal: ','
  });
  setTimeout(() => cu.start(), 200);

  // ── Animate bars ───────────────────────────────────────────
  setTimeout(() => {
    document.querySelectorAll('.dep-bar-fill').forEach(bar => {
      bar.classList.add('animated');
    });
  }, 400);

  // ── D3 choropleth map ─────────────────────────────────────
  const svg = d3.select('#argentina-map');
  const bbox = document.getElementById('argentina-map').getBoundingClientRect();
  const W = 420, H = 720;

  const projection = d3.geoMercator()
    .center([-65, -38])
    .scale(800)
    .translate([W / 2, H / 2]);

  const path = d3.geoPath().projection(projection);

  // Color scale
  const maxVal = d3.max(Object.values(PROVINCE_DATA));
  const colorScale = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolate('#0d2626', '#1de8e8'));

  fetch(GEOJSON_URL)
    .then(r => r.json())
    .then(geojson => {
      const g = svg.append('g');

      g.selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('class', 'provincia-path')
        .attr('d', path)
        .attr('fill', d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = matchProvince(name);
          return count != null ? colorScale(count) : '#1a1a1a';
        })
        .append('title')
        .text(d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = matchProvince(name);
          return count != null ? `${name}: ${count} CCDs` : name;
        });

      // Province number labels
      g.selectAll('text')
        .data(geojson.features)
        .enter()
        .append('text')
        .attr('class', 'provincia-label')
        .attr('transform', d => {
          const c = path.centroid(d);
          return `translate(${c[0]},${c[1]})`;
        })
        .text(d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = matchProvince(name);
          return count != null ? count : '';
        })
        .style('font-size', d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = matchProvince(name);
          return count && count > 50 ? '11px' : '8.5px';
        })
        .style('font-weight', d => {
          const name  = d.properties.name || d.properties.nombre || '';
          const count = matchProvince(name);
          return count && count > 50 ? '800' : '700';
        });
    })
    .catch(err => {
      console.warn('GeoJSON no disponible:', err);
      svg.append('text')
        .attr('x', W / 2).attr('y', H / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#555')
        .attr('font-family', 'Outfit, sans-serif')
        .attr('font-size', '13px')
        .text('Mapa no disponible (sin conexión)');
    });
}

// Fuzzy province name matcher
function matchProvince(geoName) {
  if (!geoName) return null;

  // Direct match first
  if (PROVINCE_DATA[geoName] !== undefined) return PROVINCE_DATA[geoName];

  // Normalize and try again
  const norm = (s) => s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const gn = norm(geoName);

  for (const [key, val] of Object.entries(PROVINCE_DATA)) {
    if (norm(key) === gn) return val;
    if (gn.includes(norm(key)) || norm(key).includes(gn)) return val;
  }
  return null;
}


// ============================================================
//  PANEL 4 · LEAFLET INTERACTIVE MAP
// ============================================================
let panel4Initialized = false;
let leafletMap = null;
let tileLayer  = null;
let cluster    = null;
let allData    = [];

function initPanel4() {
  if (panel4Initialized) return;
  panel4Initialized = true;

  // Init Leaflet
  leafletMap = L.map('mapa-interactivo', {
    center: [-38, -63],
    zoom: 5,
    zoomControl: true,
    preferCanvas: true
  });

  // Default dark tile
  setTile('dark');

  // Marker cluster
  cluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  leafletMap.addLayer(cluster);

  // Load CSV
  Papa.parse('data.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      allData = results.data;
      buildMap(allData);
      buildLegend();
    },
    error: (err) => {
      console.warn('Error cargando data.csv:', err);
    }
  });

  // Tile selector
  document.getElementById('tile-select').addEventListener('change', (e) => {
    setTile(e.target.value);
  });

  // Fix map size after panel transition
  setTimeout(() => leafletMap.invalidateSize(), 1000);
}

function setTile(key) {
  const cfg = TILES[key] || TILES.dark;
  if (tileLayer) leafletMap.removeLayer(tileLayer);
  tileLayer = L.tileLayer(cfg.url, {
    attribution: cfg.attr,
    maxZoom: 18
  });
  tileLayer.addTo(leafletMap);
}

function buildMap(data) {
  cluster.clearLayers();

  data.forEach(row => {
    const lat  = parseFloat(row['LATITUD']  || row['latitud']  || row['lat']);
    const lon  = parseFloat(row['LONGITUD'] || row['longitud'] || row['lon']);
    const dep  = (row['DEPENDENCIA'] || row['dependencia'] || '').trim();
    const depS = (row['DEPENDENCIA SIMPLIF'] || row['dependencia_simplif'] || dep).trim();
    const nom  = (row['NOMBRE ESTABLECIMIENTO'] || row['nombre_establecimiento'] || row['nombre'] || '').trim();

    if (isNaN(lat) || isNaN(lon) || !lat || !lon) return;

    const color = getDepColor(dep);

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:10px; height:10px;
        border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.35);
        box-shadow:0 0 6px ${color}88;
      "></div>`,
      iconSize:   [10, 10],
      iconAnchor: [5, 5]
    });

    const marker = L.marker([lat, lon], { icon });

    marker.bindPopup(
      `<div class="popup-nombre">${nom || 'Sin nombre'}</div>` +
      `<div class="popup-dep">${depS || dep || 'Sin datos'}</div>`,
      { maxWidth: 280, className: '' }
    );

    // Tooltip on hover
    marker.bindTooltip(
      `<strong style="color:#3ddada">${depS || dep}</strong><br>${nom}`,
      { direction: 'top', offset: [0, -6], opacity: 0.95 }
    );

    cluster.addLayer(marker);
  });
}

function getDepColor(dep) {
  if (!dep) return DEP_COLORS.default;
  const d = dep.toLowerCase();

  if (d.includes('provincial') || d.includes('policía') || d.includes('policia'))
    return DEP_COLORS['Fuerza de Seguridad Provincial'];
  if (d.includes('federal') || d.includes('gendarm') || d.includes('prefect'))
    return DEP_COLORS['Fuerza de Seguridad Federal'];
  if (d.includes('ejército') || d.includes('ejercito') || d.includes('army'))
    return DEP_COLORS['Ejército'];
  if (d.includes('armada') || d.includes('navy') || d.includes('marina'))
    return DEP_COLORS['Armada'];
  if (d.includes('aérea') || d.includes('aerea') || d.includes('fuerza aérea'))
    return DEP_COLORS['Fuerza Aérea'];

  return DEP_COLORS['Otros'];
}

function buildLegend() {
  const legend = document.getElementById('map-legend');
  legend.innerHTML = '<div class="legend-title">Dependencia</div>';

  const entries = [
    ['Fuerza de Seguridad Provincial', DEP_COLORS['Fuerza de Seguridad Provincial']],
    ['Fuerza de Seguridad Federal',    DEP_COLORS['Fuerza de Seguridad Federal']],
    ['Ejército',                        DEP_COLORS['Ejército']],
    ['Armada',                          DEP_COLORS['Armada']],
    ['Fuerza Aérea',                    DEP_COLORS['Fuerza Aérea']],
    ['Otros',                           DEP_COLORS['Otros']]
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
