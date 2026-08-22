// Catálogo central de servicios.
// Cada servicio se renderiza en / y en /servicio/:slug reutilizando la misma vista.
// icono = nombre de archivo SVG en /public/img/iconos/ (placeholders, reemplázalos por los tuyos)

module.exports = [
  {
    slug: 'pintura',
    titulo: 'Pintura',
    resumen: 'Pintura interior y exterior, terminaciones prolijas y sin olor a obra.',
    icono: 'pintura.svg',
    descripcion: [
      'Pintamos interiores, exteriores, fachadas y cielos, con preparación de superficie incluida (lijado, sellado y tapado de grietas).',
      'Trabajamos con esmaltes al agua y óleos, según el ambiente y el uso del espacio.',
      'Presupuesto según metros cuadrados y estado actual del muro.'
    ],
    incluye: [
      'Preparación y protección de superficies y muebles',
      'Aplicación de sellador donde corresponda',
      'Dos manos de pintura como mínimo',
      'Limpieza final del área de trabajo'
    ]
  },
  {
    slug: 'gasfiteria',
    titulo: 'Gasfitería',
    resumen: 'Reparación de filtraciones, cambio de llaves y guarniciones, destape de cañerías.',
    icono: 'gasfiteria.svg',
    descripcion: [
      'Atendemos filtraciones, goteras, cambio de llaves de agua, WC, lavaplatos y guarniciones.',
      'Detección de fugas ocultas y destape de cañerías tapadas.',
      'Diagnóstico en visita, con presupuesto antes de intervenir.'
    ],
    incluye: [
      'Diagnóstico de la falla',
      'Reparación o recambio de piezas',
      'Prueba de funcionamiento y sellado final'
    ]
  },
  {
    slug: 'electricidad',
    titulo: 'Electricidad',
    resumen: 'Instalación de enchufes, luminarias, tableros y soluciones a cortocircuitos.',
    icono: 'electricidad.svg',
    descripcion: [
      'Instalación y reparación de enchufes, interruptores, luminarias y tableros eléctricos domiciliarios.',
      'Revisión de cortocircuitos, caídas de tensión y problemas intermitentes.',
      'Trabajo conforme a norma, con materiales certificados.'
    ],
    incluye: [
      'Revisión del circuito afectado',
      'Recambio o instalación de componentes',
      'Prueba de carga y funcionamiento'
    ]
  },
  {
    slug: 'remodelaciones-menores',
    titulo: 'Remodelaciones menores',
    resumen: 'Renovación de baños y cocinas: cerámica, tabiques, muebles empotrados.',
    icono: 'remodelaciones.svg',
    descripcion: [
      'Renovamos baños y cocinas a escala acotada: cambio de cerámica, tabiquería liviana, muebles empotrados e instalaciones asociadas.',
      'Coordinamos gasfitería y electricidad si el proyecto lo requiere, sin necesidad de contratar por separado.',
      'Visita técnica previa para levantar el alcance real del trabajo.'
    ],
    incluye: [
      'Visita técnica y levantamiento de medidas',
      'Demolición y retiro de escombros',
      'Ejecución de obra y terminaciones',
      'Coordinación de gasfitería/electricidad si aplica'
    ]
  },
  {
    slug: 'construccion-menor',
    titulo: 'Construcción a pequeña escala',
    resumen: 'Ampliaciones, muros, quinchos y estructuras livianas.',
    icono: 'construccion.svg',
    descripcion: [
      'Construcción de ampliaciones, muros divisorios, quinchos y estructuras livianas en madera o metalcon.',
      'Trabajamos con planos simples o a partir de una idea general que definimos juntos en la visita.',
      'Ideal para proyectos que no requieren un permiso de edificación mayor.'
    ],
    incluye: [
      'Visita técnica y definición de alcance',
      'Materiales y mano de obra',
      'Supervisión de avance',
      'Entrega final con revisión conjunta'
    ]
  },
  {
    slug: 'reparaciones-generales',
    titulo: 'Reparaciones generales',
    resumen: 'Mantención del hogar: puertas, cierres, filtraciones menores y arreglos varios.',
    icono: 'reparaciones.svg',
    descripcion: [
      'Para todo lo que no encaja en una sola categoría: puertas que no cierran bien, filtraciones menores, arreglos de mueblería, fijaciones y mantención general.',
      'Ideal si tienes una lista de "pendientes del hogar" y prefieres resolverlos en una sola visita.'
    ],
    incluye: [
      'Diagnóstico de cada ítem',
      'Reparación en la misma visita cuando es posible',
      'Recomendación si algo requiere una intervención mayor'
    ]
  },
  {
    slug: 'carpinteria',
    titulo: 'Carpintería',
    resumen: 'Muebles a medida, closets, repisas y estructuras en madera.',
    icono: 'carpinteria.svg',
    descripcion: [
      'Fabricación de muebles a medida, closets, repisas y estructuras en madera, ajustados al espacio disponible.',
      'Trabajamos con melamina, MDF o madera sólida según presupuesto y uso.'
    ],
    incluye: [
      'Medición en terreno',
      'Fabricación a medida',
      'Instalación y ajuste final'
    ]
  },
  {
    slug: 'cerrajeria',
    titulo: 'Cerrajería',
    resumen: 'Cambio de cerraduras, apertura de puertas y refuerzo de seguridad.',
    icono: 'cerrajeria.svg',
    descripcion: [
      'Cambio e instalación de cerraduras, apertura de puertas sin llave y refuerzo de seguridad en accesos.',
      'Atención para casos urgentes de bloqueo.'
    ],
    incluye: [
      'Diagnóstico del sistema actual',
      'Recambio o instalación de cerradura',
      'Prueba de funcionamiento y entrega de llaves'
    ]
  }
];
