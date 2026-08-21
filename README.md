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

## Supabase (archivos + sesión compartida)

Con Supabase configurado, la app hace dos cosas en la nube:

- **Storage (`dg-archivos`)**: los cinco entregables de *ARCHIVOS A PEDIR* (pantalla 03) y el PDF de entrevista contestado (pantallas 02 y 03).
- **Tabla `app_state` (opción A)**: **una sola sesión compartida**. Todo el store (respuestas, imperativos, consolidado, etc.) vive en una fila `id = 'default'`. Cualquier dispositivo con la app abierta ve y edita lo mismo; `localStorage` queda como caché.

1. Crea un proyecto en [supabase.com](https://supabase.com) (o usa el que ya tengas).
2. Abre **SQL Editor** y corre **todo** `supabase/schema.sql`: bucket, políticas, tabla `app_state` y Realtime.
3. En **Project Settings → API** copia la URL y la llave `anon` (nunca la `service_role` en el front).
4. Ponlas en `.env.local` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Reinicia `npm run dev`. En Vercel, las mismas dos variables van en **Settings → Environment Variables** y hay que **redeploy**.

Cómo queda organizado el bucket:

```
dg-archivos/
  unidad-1/0-1755712345678-plan-2027.pdf                 ← Research Land, primera casilla
  unidad-1/2-1755712400000-organigrama.pdf
  unidad-3/0-1755712500000-presupuesto.xlsx              ← Promo Espacio
  entrevistas/ceo/1755712600000-upax-entrevista-ceo.pdf
  entrevistas/unidad-3/1755712700000-upax-entrevista-promo-espacio.pdf
```

En los entregables el índice al frente es la casilla de **ARCHIVOS A PEDIR**, así que el bucket se lee de corrido sin cruzarlo contra la app. El sufijo de tiempo evita que resubir el mismo nombre pise la versión anterior.

Las entrevistas van aparte porque la zona de subida acepta **varios PDFs a la vez**: cada archivo se guarda bajo la unidad que declara él mismo en sus metadatos, no bajo la pestaña abierta. Si el PDF perdió los metadatos —hay editores que reescriben el `Subject` al guardar—, se deduce de las llaves que trae; si mezcla unidades y no se puede deducir, se archiva en la pestaña donde se soltó.

Detalles que conviene saber:

- El bucket es **privado**. La app abre cada archivo con una URL firmada que dura una hora, así que la liga no se puede repartir.
- Tope de **25 MB** por archivo, validado en el navegador y en el bucket.
- **Sin las variables la app no se rompe**: sigue registrando el nombre del archivo como antes, el PDF contestado sigue volcando sus respuestas al store, y *Revisar archivos* avisa cuál quedó sin subir.
- **No hay login todavía**: quien alcance la llave anon puede tocar el bucket. Si los entregables no pueden quedar así, hay que montar Supabase Auth y cambiar `to anon` por `to authenticated` en las políticas de `supabase/schema.sql`.

---

## Estructura

```
src/
  data/
    screens.ts        ← las 12 pantallas y las 10 pestañas
    content.ts        ← matriz, preguntas, archivos, temas y campos
  lib/
    supabase.ts       ← cliente de Supabase (Storage + app_state)
    appState.ts       ← cargar / guardar / Realtime de la sesión compartida
    archivosRemotos.ts← subir / abrir / borrar los entregables de los DGs
    store.tsx         ← estado global + sync nube + caché localStorage
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

- **Con Supabase**: la fuente de verdad es la fila `app_state` (`default`). Al abrir, la app carga esa sesión; al editar, sincroniza con debounce (~0,7 s) y por Realtime. `localStorage` (`upax_arquitectura_v2`) es caché offline/arranque.
- **Sin Supabase**: solo `localStorage` (comportamiento anterior).

En la barra superior: **Guardar**, respaldo **Exportar/Importar** JSON y **Limpiar**. En la pantalla 12: **Exportar PDF**, **Exportar Excel** e **Historial de versiones**.

Si la nube está vacía y este navegador ya tenía captura, la primera carga **siembra** ese contenido en `app_state` para no perderlo.

---

## Diseño

Los tokens están al inicio de `src/styles/globals.css`:

```css
--ink:#15161A;  --muted:#8B8D96;  --line:#E7E7EA;
--orange:#FF4B17;  --orange-soft:#FFF0EA;  --violet:#6B46E0;
```

Cambiar el naranja y el wordmark de `App.tsx` es todo lo que se necesita para migrar la identidad visual. Light mode permanente.
