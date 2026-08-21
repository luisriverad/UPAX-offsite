/**
 * El modelo VIBE ya trabajado con UPAX, escrito. Es material de lectura: no se
 * captura ni se edita desde la plataforma, por eso vive como dato fijo y no en
 * el store. Sirve para que el grupo vea cómo lo que ya hicieron baja al modelo.
 */

export interface CampoPdv {
  tag: string
  texto: string
  /** la promesa se cita y se destaca, como en los one-page de referencia */
  destacado?: boolean
}

export interface Rasgo {
  nombre: string
  texto: string
}

export interface ImperativoManifiesto {
  num: string
  nombre: string
  bajada: string
  cultura: {
    /** de dónde se toman los rasgos, en las palabras del propio ejercicio */
    entrada: string
    rasgos: Rasgo[]
    /** apunte al pie del bloque de conductas, cuando lo hay */
    nota?: string
    practicas: string[]
    mecanismos: string[]
  }
  negocio: {
    estandar: string
    indicadores: string[]
    procesos: string[]
    politicas: string[]
  }
}

export const PDV_MANIFIESTO: CampoPdv[] = [
  { tag: 'Para qué existimos', texto: 'Hacer que los negocios de nuestros clientes trasciendan.' },
  { tag: 'Promesa', texto: 'Encendemos la evolución empresarial.', destacado: true },
  {
    tag: 'Cómo lo hacemos',
    texto:
      'Para lograrlo, UPAX debe convertir creatividad, talento, datos y tecnología en soluciones que generen crecimiento y transformación medible para sus clientes.',
  },
]

export const IMPERATIVOS_MANIFIESTO: ImperativoManifiesto[] = [
  {
    num: '01',
    nombre: 'Integración',
    bajada: 'Una sola UPAX frente al cliente',
    cultura: {
      entrada: 'Del Manifiesto seleccionamos únicamente lo que este imperativo necesita:',
      rasgos: [
        { nombre: 'Directos', texto: 'Resolvemos entre empresas y áreas sin rodeos ni silos.' },
        {
          nombre: 'Automotivados',
          texto: 'No esperamos a que alguien coordine lo que nosotros podemos resolver.',
        },
        {
          nombre: 'Inconformes',
          texto: 'Señalamos aquello que fragmenta la experiencia del cliente y proponemos una solución.',
        },
      ],
      practicas: [
        'Una cuenta estratégica tiene un solo líder frente al cliente.',
        'Antes de presentar una propuesta se revisan capacidades de todo Grupo UPAX.',
        'Pipeline compartido de oportunidades entre empresas.',
        'Reunión semanal de oportunidades cross-company.',
      ],
      mecanismos: [
        'Bono por negocio generado entre empresas.',
        'Reconocimiento a proyectos integrados.',
        'Parte del variable comercial depende de ingresos compartidos.',
        'Las cuentas estratégicas se evalúan por resultado total, no por empresa individual.',
      ],
    },
    negocio: {
      estandar:
        'Toda cuenta estratégica tiene un responsable, un plan integrado y una sola narrativa frente al cliente.',
      indicadores: [
        '% de cuentas con más de una capacidad UPAX.',
        'Ingresos cross-company.',
        'Share of wallet.',
        'Retención de cuentas estratégicas.',
        'Pipeline generado entre empresas.',
      ],
      procesos: [
        'Account planning.',
        'Identificación de oportunidades.',
        'Diseño de soluciones integradas.',
        'Asignación de capacidades.',
        'Seguimiento ejecutivo de cuentas.',
      ],
      politicas: [
        'Ninguna empresa aborda aisladamente una cuenta estratégica.',
        'Toda oportunidad relevante se registra en un pipeline común.',
        'El responsable de la cuenta coordina la relación con el cliente.',
        'Las capacidades se asignan según lo que necesita el cliente, no según quién originó la oportunidad.',
      ],
    },
  },
  {
    num: '02',
    nombre: 'Ejecución impecable',
    bajada: 'Velocidad, calidad y resultados medibles',
    cultura: {
      entrada: 'Aquí activamos otros elementos del mismo Manifiesto:',
      rasgos: [
        { nombre: 'Apasionados', texto: 'Nos importa profundamente el cliente y el resultado.' },
        {
          nombre: 'Resilientes',
          texto: 'Nos adaptamos cuando cambian las condiciones sin detener la ejecución.',
        },
        { nombre: 'Innovadores', texto: 'Buscamos continuamente una mejor manera de hacer las cosas.' },
        { nombre: 'Inconformes', texto: 'No normalizamos retrasos, retrabajos o mediocridad.' },
      ],
      nota: 'Además, el propio Manifiesto establece: “se planea rápido y se ejecuta bien” y define la “Ejecución Impecable” como parte de cómo opera UPAX.',
      practicas: [
        'Kickoff formal de cada proyecto.',
        'Dueño único por entregable.',
        'Seguimiento semanal de avance, desviaciones y riesgos.',
        'Cierre de proyecto con resultados vs. objetivo.',
        'Identificación sistemática de mejoras.',
      ],
      mecanismos: [
        'Variable ligado a cumplimiento y satisfacción del cliente.',
        'Reconocimiento a entregas extraordinarias.',
        'Retrabajos recurrentes afectan evaluación.',
        'Mejores prácticas se documentan y replican.',
      ],
    },
    negocio: {
      estandar: 'Entregar correctamente, en tiempo y con impacto demostrado para el cliente.',
      indicadores: [
        '% entregas on-time.',
        '% proyectos dentro de presupuesto.',
        'Retrabajo.',
        'Satisfacción/NPS.',
        'Margen por proyecto.',
        'Resultado generado para el cliente.',
      ],
      procesos: [
        'Scoping.',
        'Planeación.',
        'Gestión de proyectos.',
        'Control de calidad.',
        'Gestión de cambios.',
        'Cierre y aprendizaje.',
      ],
      politicas: [
        'Ningún proyecto inicia sin alcance, responsable, presupuesto y fecha.',
        'Todo cambio de alcance debe documentarse.',
        'Toda desviación relevante se escala oportunamente.',
        'Ningún proyecto se cierra sin evaluar resultados y aprendizajes.',
      ],
    },
  },
]
