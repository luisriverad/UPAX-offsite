/**
 * Las tres arquitecturas de referencia de "Ver ejemplos", en texto. En la
 * pantalla se ven como láminas (JPG); el modelo no puede leer una imagen, así
 * que lo que se le entrega es esto.
 *
 * Sirven para calibrar, no para copiar: enseñan a qué nivel de concreción se
 * escribe un imperativo. Sin una referencia así el modelo tiende a devolver
 * consignas genéricas.
 */

export interface EjemploArquitectura {
  empresa: string
  existimos: string
  promesa: string
  imperativos: { nombre: string; estandar: string }[]
}

export const EJEMPLOS_ARQUITECTURA: EjemploArquitectura[] = [
  {
    empresa: 'Walmart',
    existimos: 'Hacer rendir más el dinero del cliente.',
    promesa: 'Precios bajos siempre',
    imperativos: [
      {
        nombre: 'Estructura de costos excepcionalmente eficiente',
        estandar: 'Gasto operativo <12% de UMAC y ningún costo sin valor demostrable.',
      },
      {
        nombre: 'Inventario disponible con el mínimo capital atrapado',
        estandar: 'Fill rate >97%; inventario 28-35 días; obsolescencia <1.5%.',
      },
    ],
  },
  {
    empresa: 'Toyota',
    existimos: 'Hacer accesible una movilidad confiable, segura y de alta calidad.',
    promesa: 'Calidad TOTAL en cada vehículo',
    imperativos: [
      {
        nombre: 'Calidad en origen: ningún defecto pasa a la siguiente etapa',
        estandar: 'FPY >98.5%; defect escape <150 PPM; defecto crítico = paro inmediato.',
      },
      {
        nombre: 'Flujo eficiente: producir al ritmo de la demanda con mínimo desperdicio',
        estandar: 'OEE >85%; takt adherence >95%; WIP <1.5 turnos.',
      },
    ],
  },
  {
    empresa: 'WPP',
    existimos: 'Convertir creatividad, medios, datos y tecnología en crecimiento medible para los clientes.',
    promesa: 'Una sola red de capacidades para hacer crecer marcas y negocios',
    imperativos: [
      {
        nombre: 'Integración multiagencia: una sola experiencia para el cliente',
        estandar: 'Toda cuenta estratégica tiene un Client Lead, un plan integrado y una sola narrativa frente al cliente.',
      },
      {
        nombre: 'Efectividad y escala: creatividad, datos e IA convertidos en resultados medibles',
        estandar: 'Propuesta <7 días; kickoff <72 h; margen de contribución >28%; entrega on-time >95%.',
      },
    ],
  },
]
