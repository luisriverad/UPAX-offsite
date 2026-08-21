# UPAX · Arquitectura de Cultura

Plataforma del proceso que convierte el Excel de arquitectura en un producto vivo. **12 pantallas** agrupadas en 10 secciones: Mapa → CEO → DGs → Consolidado → Propuesta → Imperativos → Cultura → Negocio → Off-Site → Final.

Implementa el diseño funcional de `UPAX_Culture_Architecture_Brightmode_Profit120_Integrated.pdf`.

Stack: Vite + React 18 + TypeScript. Sin librerías de UI: todo el diseño vive en un solo CSS.

---

## Arrancar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build  →  dist/
```

---

## Las 12 pantallas

| # | Sección | Pantalla | Qué hace |
|---|---|---|---|
| 01 | Mapa | Matriz maestra | Los bloques del Excel con su avance y estado, calculados desde lo capturado |
| 02 | CEO | Entrevista con el CEO | 4 bloques × 4 preguntas, respuesta con autoguardado |
| 03 | DGs | Entrevistas + archivos | Mismo guion por unidad de negocio, con los 5 archivos a pedir y su revisión |
| 04 | Consolidado | Evidencia por tema | Qué dijo el CEO, cuántos DGs contestaron, cuántos archivos, síntesis editable |
| 05 | Propuesta | Propuesta de valor | Para qué existimos · Promesa · Cómo lo hacemos |
| 06 | Imperativos | Imperativos estratégicos | Lista variable; cada uno se vuelve columna en Cultura y Negocio |
| 07 | Cultura | Cómo pensamos, decidimos y actuamos | Cuadrícula conductas × imperativos, con vista alterna de lista |
| 08 | Cultura | Prácticas y mecanismos | Una práctica y un mecanismo por imperativo |
| 09 | Negocio | Estándares e indicadores | Estándar por imperativo + tabla actual / 2027 / fuente |
| 10 | Negocio | Procesos y políticas | Proceso y política por imperativo + validación cruzada |
| 11 | Off-Site | Trabajo en vivo | Versión preliminar, alternativas, evidencia y aprobación |
| 12 | Final | Matriz completada | Misma matriz aprobada + exportar PDF / Excel / historial |

Cada pantalla lleva a la derecha el panel **Asistente** con sus cuatro directrices y los botones **Analizar** y **Cuestionar**.

---

## Cómo se conecta todo

No hay datos de adorno: cada número sale de lo capturado.

| Origen | Alimenta |
|---|---|
| 02 · Entrevista con el CEO | Columna CEO y contador de fuentes de la 04 |
| 03 · Entrevistas y archivos de DGs | Columna DGs, evidencia de la 04, fuentes de la 06 y la 11 |
| 05 · Propuesta de valor | Bloque PROPUESTA DE VALOR de la matriz y de la 11 |
| 06 · Imperativos | Columnas de las pantallas 07, 08, 09 y 10 |
| 07–10 · Cultura y Negocio | Avance de la matriz maestra y contadores de la 11 |
| 11 · Aprobaciones del Off-Site | Estado APROBADO en la matriz e historial de versiones de la 12 |

La matriz de las pantallas 01 y 12 es la misma tabla: los estados (`SIN DEFINIR`, `PENDIENTE`, `BORRADOR`, `REVISAR`, `APROBADO`) se derivan del avance real de cada bloque, no se escriben a mano.

---

## Asistente

Los botones **Analizar** y **Cuestionar** mandan lo capturado en la pantalla activa, más el estado del proceso (propuesta, imperativos y volumen de evidencia), a la API de Anthropic.

1. Copia `.env.example` a `.env`.
2. Pon tu llave en `ANTHROPIC_API_KEY`.
3. Reinicia `npm run dev`.

La llamada pasa por el proxy de Vite (`/api/anthropic`), definido en `vite.config.ts`, así que la llave nunca llega al navegador. Para producción hay que reemplazar ese proxy por un endpoint propio de servidor.

---

## Estructura

```
src/
  data/
    screens.ts        ← las 12 pantallas y las 10 pestañas
    content.ts        ← matriz, preguntas, archivos, temas y campos
  lib/
    store.tsx         ← estado global + autoguardado en localStorage
    model.ts          ← imperativos, conteos, estados, avance y exportación
    ai.ts             ← prompt y llamada del asistente (modelo de Anthropic)
  components/
    ui.tsx            ← chips, paneles, pestañas y campos
    Asistente.tsx     ← panel derecho
    Modal.tsx         ← exportar / importar JSON
    screens/          ← una pantalla por archivo (S01…S12)
  styles/globals.css  ← todo el diseño (tokens al inicio)
```

---

## Cómo se edita el contenido

Casi todo vive en `src/data/content.ts`, sin tocar código:

- **Preguntas del CEO** → `BLOQUES_CEO`
- **Unidades de negocio** → `UNIDADES` (el `id` es parte de la clave de guardado: no lo cambies al reordenar)
- **Guion y archivos de los DGs** → `PREGUNTAS_DG`, `ARCHIVOS_DG`
- **Temas del consolidado** → `VISTAS_CONSOLIDADO`
- **Campos de la propuesta** → `CAMPOS_PROPUESTA`
- **Bloques de la matriz** → `MATRIZ_BLOQUES` (Propuesta de Valor e Imperativos se generan solos, un renglón por tema)
- **Cuántos imperativos arrancan** → `IMP_DEFAULT` en `src/lib/model.ts`

Los títulos, subtítulos y las cuatro directrices del asistente de cada pantalla están en `src/data/screens.ts`.

---

## Entrevistas a distancia (PDF editable)

Cuando no se puede hacer el 1:1, las pantallas 02 y 03 traen **Descargar PDF editable** y una zona para **subir el PDF contestado** (arrastrar o hacer clic; acepta varios a la vez).

El PDF lleva un campo de formulario por pregunta y cada campo se llama como su llave del store (`dg.3.pdv.0`), así que al regresar la respuesta cae exactamente en la pregunta que le toca. Lo que se sube **se mezcla** con lo capturado: solo escribe las llaves que el PDF trae con texto, nunca reemplaza la sesión, y subir dos veces el mismo archivo es inofensivo.

Se rechazan los PDFs sin campos —los que alguien imprimió o re-exportó como imagen— y los que no son entrevistas de UPAX. `pdf-lib` se carga bajo demanda: no entra en el bundle inicial.

Todo vive en `src/lib/pdfEntrevista.ts` y `src/components/PdfEntrevista.tsx`. Si cambian las preguntas no hay que tocar nada; si cambian las **llaves** de `K` en `model.ts`, los PDFs viejos dejan de importar.

---

## Datos de la sesión

Se guardan solos en `localStorage` con la llave `upax_arquitectura_v2`. En la barra superior están **Exportar** e **Importar** (JSON completo) y **Limpiar**. En la pantalla 12 hay además **Exportar PDF** (impresión), **Exportar Excel** (CSV) e **Historial de versiones**.

---

## Diseño

Los tokens están al inicio de `src/styles/globals.css`:

```css
--ink:#15161A;  --muted:#8B8D96;  --line:#E7E7EA;
--orange:#FF4B17;  --orange-soft:#FFF0EA;  --violet:#6B46E0;
```

Cambiar el naranja y el wordmark de `App.tsx` es todo lo que se necesita para migrar la identidad visual. Light mode permanente.
