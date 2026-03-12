# Cartografía del Terrorismo de Estado en Argentina
## Centros Clandestinos de Detención · 1976–1983

---

### ¿Por qué este trabajo?

A días de cumplirse el quincuagésimo aniversario del golpe cívico-militar del 24 de marzo de 1976, este proyecto tiene por objetivo constituir un pequeño aporte a la comprensión de ese período histórico. Durante la última dictadura, el Estado argentino —con la anuencia de amplios sectores de la burguesía nacional y el clero— desplegó un plan sistemático de tortura y exterminio contra su propia población civil, con particular énfasis en los sectores obreros organizados.

En un contexto en el que el actual gobierno impulsa un discurso plagado de tergiversaciones históricas y falsedades, con el único objetivo de reinstaurar la llamada *teoría de los dos demonios* —según la cual los militares habrían cometido meros "excesos" en el marco de una supuesta "guerra"—, esta cartografía del terror estatal busca visibilizar la organización, planificación y posterior despliegue de los numerosos centros clandestinos de detención y tortura que existieron a lo largo y ancho del país.

El trabajo no pretende ser exhaustivo ni académico. Es un **ensayo breve**, realizado con herramientas de programación accesibles, que busca poner en forma visual una información que el Estado argentino ya tiene sistematizada pero que merece seguir circulando.

---

### Fuente de información

Los datos utilizados provienen del **Registro Unificado de Víctimas del Terrorismo de Estado (RUVTE)**, dependiente de la Agencia Nacional de Memorias (ANM) del Ministerio de Justicia y Derechos Humanos de la Nación.

🔗 [https://www.argentina.gob.ar/derechoshumanos/ANM/rutve](https://www.argentina.gob.ar/derechoshumanos/ANM/rutve)

En particular, se procesó el **último informe oficial del RUVTE**, publicado en **octubre de 2022**, que sistematiza la información sobre los Centros Clandestinos de Detención (CCDs) identificados en todo el territorio nacional.

---

### Proceso de trabajo

El flujo de trabajo completo fue realizado en **Jupyter Notebook** con **Python**. Las etapas principales fueron:

#### 1. Extracción de datos desde PDF
El informe del RUVTE se encuentra disponible en formato PDF. Para extraer la información tabular se utilizó la librería **pdfplumber**, que permite leer y estructurar tablas embebidas en documentos PDF.

```python
import pdfplumber
import pandas as pd
```

#### 2. Procesamiento y limpieza
Una vez extraída la información, se procesó y limpió con **pandas**, conformando un DataFrame estructurado que luego se exportó como archivo `.csv` y `.xlsx`.

```python
import pandas as pd

df = pd.read_csv('data_raw.csv')
# limpieza, normalización de columnas, etc.
df.to_csv('data.csv', index=False)
```

#### 3. Geolocalización
Los establecimientos fueron geolocalizados a partir de sus nombres y ubicaciones utilizando **OpenStreetMap** a través de la librería **geopy**:

```python
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="ccd_arg")
location = geolocator.geocode("nombre del establecimiento, provincia, Argentina")
```

Las coordenadas obtenidas (latitud y longitud) fueron incorporadas al CSV final como columnas `LATITUD` y `LONGITUD`.

---

### ⚠️ Advertencia sobre la calidad de los datos

> **Los puntos de geolocalización pueden contener errores.**

La geolocalización automática mediante Nominatim/OpenStreetMap no siempre resuelve correctamente establecimientos históricos, nombres institucionales o direcciones que ya no existen tal como figuran en los registros. Los resultados fueron revisados en **una única ocasión** y de forma general, por lo que es posible que algunos puntos estén ubicados de forma inexacta o incorrecta.

Asimismo, por las limitaciones propias de la **brevedad en la realización de este ensayo**, el archivo CSV final puede contener errores involuntarios en otros campos (nombres, dependencias, jurisdicciones). Este trabajo no reemplaza ni pretende superar la rigurosidad del informe oficial del RUVTE.

Si encontrás un error, podés abrir un **Issue** o un **Pull Request** en este repositorio.

---

### Estructura del repositorio

```
📁 /
├── index.html          # Página principal (GitHub Pages)
├── style.css           # Estilos
├── script.js           # Lógica: D3.js, Leaflet, CountUp
├── data.csv            # Dataset procesado (CCDs geolocalizados)
└── README.md           # Este archivo
```

---

### Tecnologías utilizadas

| Herramienta | Uso |
|---|---|
| Python + Jupyter | Extracción, procesamiento y geolocalización |
| pdfplumber | Lectura de tablas desde PDF |
| pandas | Limpieza y estructuración de datos |
| geopy / Nominatim | Geolocalización vía OpenStreetMap |
| D3.js | Mapa coroplético interactivo |
| Leaflet.js | Mapa de puntos geolocalizados |
| PapaParse | Lectura del CSV en el frontend |
| CountUp.js | Animación de contadores |
| GitHub Pages | Hosting del sitio web |

---

### Licencia

Este trabajo es de libre uso y distribución con fines educativos, periodísticos y de memoria. Los datos originales pertenecen al **RUVTE / ANM / Ministerio de Justicia y Derechos Humanos de la Nación Argentina**.

---

*"La memoria es una forma de resistencia."*
