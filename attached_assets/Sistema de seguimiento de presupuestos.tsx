import { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  ClipboardCheck, 
  Download, 
  Mail, 
  Phone, 
  FileSpreadsheet, 
  BarChart, 
  AlertCircle,
  Clock
} from 'lucide-react';

const SeguimientoPresupuestos = () => {
  // Estado para almacenar los datos
  const [activeTab, setActiveTab] = useState('dashboard');
  const [completedTasks, setCompletedTasks] = useState({});
  const [notes, setNotes] = useState({});
  const [selectedAction, setSelectedAction] = useState(null);
  const [contactInfo, setContactInfo] = useState({});
  const [actionStatus, setActionStatus] = useState({});
  const [isLicitacionState, setIsLicitacionState] = useState({}); // Estado para guardar si es licitación
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Datos de presupuestos según el análisis actualizado del nuevo CSV
  const presupuestosData = [
    // Confirmaciones Iniciales - Alta Prioridad
    {
      id: '39097',
      empresa: 'INTEMA',
      fechaCreacion: '21/04/2025 11:45',
      fabricante: 'TECNAL',
      monto: 21052.46,
      validez: 8,
      diasRestantes: 6,
      accion: 'Confirmación Inicial: Confirmar recepción del presupuesto, aclarar dudas iniciales y ofrecer asistencia.',
      tipo: 'Confirmación',
      prioridad: 'Alta',
      alertas: ['Validez corta (8 días)']
    },
    
    // Primer Seguimiento - Alta Prioridad
    {
      id: '39083',
      empresa: 'INDUSTRIAS PUGLIESE S.A.',
      fechaCreacion: '14/04/2025 14:19',
      fabricante: 'HACH',
      monto: 1180.19,
      validez: 15,
      diasRestantes: 6,
      accion: 'Primer Seguimiento: Proporcionar información adicional sobre productos, verificar interés y aclarar dudas.',
      tipo: 'Primer Seguimiento',
      prioridad: 'Alta',
      alertas: ['6 días para vencimiento']
    },
    
    // Confirmaciones Iniciales - Media Prioridad
    {
      id: '39101',
      empresa: 'HELIOS ENERGIA LIMPIA',
      fechaCreacion: '21/04/2025 15:56',
      fabricante: 'HACH',
      monto: 12621.59,
      validez: 30,
      diasRestantes: 28,
      accion: 'Confirmación Inicial: Confirmar recepción del presupuesto, aclarar dudas iniciales y ofrecer asistencia.',
      tipo: 'Confirmación',
      prioridad: 'Media'
    },
    {
      id: '39100',
      empresa: 'INTERCHEMISTRY S.A.',
      fechaCreacion: '21/04/2025 14:34',
      fabricante: 'MICROCLAR',
      monto: 9805.13,
      validez: 30,
      diasRestantes: 28,
      accion: 'Confirmación Inicial: Confirmar recepción del presupuesto, aclarar dudas iniciales y ofrecer asistencia.',
      tipo: 'Confirmación',
      prioridad: 'Media'
    },
    {
      id: '39099',
      empresa: 'MINERA ALUMBRERA LIMITED',
      fechaCreacion: '21/04/2025 12:54',
      fabricante: 'lobov',
      monto: 1882.06,
      validez: 30,
      diasRestantes: 28,
      accion: 'Confirmación Inicial: Confirmar recepción del presupuesto, aclarar dudas iniciales y ofrecer asistencia.',
      tipo: 'Confirmación',
      prioridad: 'Media'
    },
    {
      id: '39096',
      empresa: 'MEDITECNA SRL',
      fechaCreacion: '21/04/2025 10:44',
      fabricante: 'TECNAL',
      monto: 11482.70,
      validez: 30,
      diasRestantes: 28,
      accion: 'Confirmación Inicial: Confirmar recepción del presupuesto, aclarar dudas iniciales y ofrecer asistencia.',
      tipo: 'Confirmación',
      prioridad: 'Media'
    },
    
    // Primer Seguimiento - Media Prioridad
    {
      id: '39082',
      empresa: 'OBRAS SANITARIAS de SAN JUAN O.S.S.E',
      fechaCreacion: '14/04/2025 11:39',
      fabricante: 'EBOX',
      monto: 67638.52,
      validez: 30,
      diasRestantes: 21,
      accion: 'Primer Seguimiento: Proporcionar información adicional sobre productos, verificar interés y aclarar dudas.',
      tipo: 'Primer Seguimiento',
      prioridad: 'Media'
    },
    
    // Presupuestos Vencidos
    {
      id: '39120',
      empresa: 'MUNICIPALIDAD DE SARMIENTO',
      fechaCreacion: '24/04/2025 16:11',
      fabricante: 'BIOPACK',
      monto: 307.73,
      validez: 0,
      diasRestantes: 0,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39118',
      empresa: 'Universidad Tecnológica Nacional (UTN)',
      fechaCreacion: '24/04/2025 14:50',
      fabricante: 'BIOPACK',
      monto: 31.35,
      validez: 0,
      diasRestantes: 0,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39117',
      empresa: 'INSTITUTO NACIONAL DE TECNOLOGIA INDUSTRIAL (INTI)',
      fechaCreacion: '24/04/2025 12:59',
      fabricante: 'BIOPACK',
      monto: 21.70,
      validez: 0,
      diasRestantes: 0,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39110',
      empresa: 'MOLFINO HNOS.S.A.',
      fechaCreacion: '23/04/2025 10:02',
      fabricante: 'HACH',
      monto: 2196.03,
      validez: 0,
      diasRestantes: 0,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39109',
      empresa: 'OBRAS SANITARIAS M.D.PLATA S.E "OSSE"',
      fechaCreacion: '23/04/2025 8:49',
      fabricante: 'HACH',
      monto: 13419.58,
      validez: 0,
      diasRestantes: 0,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39106',
      empresa: 'TOYOTA ARGENTINA S.A.',
      fechaCreacion: '22/04/2025 14:43',
      fabricante: 'IVA',
      monto: 151.44,
      validez: 0,
      diasRestantes: -1,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    },
    {
      id: '39098',
      empresa: 'C.G.QUIMICA S.H.',
      fechaCreacion: '21/04/2025 12:04',
      fabricante: 'BIOPACK',
      monto: 59.57,
      validez: 0,
      diasRestantes: -2,
      accion: 'Presupuesto Vencido: Registrar estado final (aprobado, rechazado o vencido sin respuesta).',
      tipo: 'Vencido',
      prioridad: 'Baja'
    }
  ];

  // Datos de contacto ficticios
  const contactosData = {
    '39101': { nombre: 'Juan Pérez', email: 'jperez@heliosenergia.com', telefono: '+54 11 4523-7890' },
    '39100': { nombre: 'María González', email: 'mgonzalez@interchemistry.com.ar', telefono: '+54 11 4789-5432' },
    '39099': { nombre: 'Roberto Alvarez', email: 'ralvarez@minera-alumbrera.com', telefono: '+54 3834 42-1234' },
    '39097': { nombre: 'Ana Fernández', email: 'afernandez@intema.gob.ar', telefono: '+54 223 495-6789' },
    '39096': { nombre: 'Carlos Martínez', email: 'cmartinez@meditecna.com.ar', telefono: '+54 11 4345-6789' },
    '39083': { nombre: 'Diana Rodríguez', email: 'drodriguez@pugliese.com.ar', telefono: '+54 341 425-7890' },
    '39082': { nombre: 'Eduardo López', email: 'elopez@osse-sanjuan.gov.ar', telefono: '+54 264 422-5678' },
    '39110': { nombre: 'Facundo Gómez', email: 'fgomez@molfino.com.ar', telefono: '+54 341 456-7890' },
    '39109': { nombre: 'Gabriela Sánchez', email: 'gsanchez@osse-mdp.gov.ar', telefono: '+54 223 499-4500' },
    '39106': { nombre: 'Hernán Torres', email: 'htorres@toyota.com.ar', telefono: '+54 11 4002-7000' },
    '39098': { nombre: 'Inés Castro', email: 'icastro@cgquimica.com.ar', telefono: '+54 11 4567-8901' },
    '39092': { nombre: 'Jorge Méndez', email: 'jmendez@cosanic.com.ar', telefono: '+54 381 432-1098' },
    '39087': { nombre: 'Laura Díaz', email: 'ldiaz@meditecna.com.ar', telefono: '+54 11 4345-6790' },
    '39081': { nombre: 'Martín Acosta', email: 'macosta@ypfenergia.com.ar', telefono: '+54 11 5441-0000' },
    '39073': { nombre: 'Natalia Blanco', email: 'nblanco@ppe.com.ar', telefono: '+54 11 4300-5678' },
    '39072': { nombre: 'Oscar Pereyra', email: 'opereyra@nestle.com.ar', telefono: '+54 11 4589-7890' },
    '39070': { nombre: 'Patricia Vega', email: 'pvega@kdial.com.ar', telefono: '+54 11 4678-1234' },
    '39066': { nombre: 'Quirino Luna', email: 'qluna@concepcion.com.ar', telefono: '+54 381 421-3456' },
    '39059': { nombre: 'Raúl Suárez', email: 'rsuarez@balcanes.com.ar', telefono: '+54 381 456-7891' }
  };

  // Plantillas para las acciones
  const plantillas = {
    'Confirmación': [
      {
        titulo: 'Email de Confirmación de Recepción',
        contenido: `Estimado/a [CONTACTO]:

Esperamos que se encuentre bien. Nos comunicamos para confirmar la recepción de nuestro presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION].

Quisiéramos saber si ha tenido oportunidad de revisar nuestra propuesta y si tiene alguna duda inicial que podamos aclarar. Estamos a su disposición para brindar cualquier información adicional que necesite.

Quedamos atentos a su respuesta y le agradecemos su interés en nuestros productos [FABRICANTE].

Saludos cordiales,
[NOMBRE_VENDEDOR]
`
      },
      {
        titulo: 'Script para Llamada de Confirmación',
        contenido: `• Presentación: "Buenos días/tardes, mi nombre es [NOMBRE_VENDEDOR] de [NOMBRE_EMPRESA]. ¿Hablo con [CONTACTO]?"

• Motivo: "Me comunico para confirmar la recepción del presupuesto N° [ID_PRESUPUESTO] que le enviamos el [FECHA_CREACION] para los productos [FABRICANTE]."

• Preguntas clave:
  - "¿Ha tenido oportunidad de revisar la propuesta?"
  - "¿Tiene alguna duda sobre los productos o servicios cotizados?"
  - "¿Necesita información adicional sobre algún punto específico?"

• Cierre: "Quedo a su disposición para cualquier consulta. Mi número directo es [TELEFONO_VENDEDOR] y mi email es [EMAIL_VENDEDOR]. Le agradezco su tiempo."

• Recordatorio: "Tenga presente que el presupuesto tiene una validez de [VALIDEZ] días, es decir, hasta el [FECHA_VENCIMIENTO]."
`
      },
      {
        titulo: 'Mensaje de WhatsApp',
        contenido: `Hola [CONTACTO], soy [NOMBRE_VENDEDOR] de [NOMBRE_EMPRESA]. Me comunico para confirmar que haya recibido correctamente nuestro presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION]. Quedo atento por si tiene alguna consulta sobre los productos [FABRICANTE] cotizados. Saludos!`
      }
    ],
    'Primer Seguimiento': [
      {
        titulo: 'Email de Primer Seguimiento',
        contenido: `Estimado/a [CONTACTO]:

Espero que se encuentre bien. Me comunico nuevamente con relación al presupuesto N° [ID_PRESUPUESTO] que le enviamos el pasado [FECHA_CREACION].

Quisiera compartir con usted información adicional sobre nuestros productos [FABRICANTE] que podría resultarle de interés:

- Características destacadas de los productos cotizados
- Ventajas competitivas respecto a otras opciones del mercado
- Casos de éxito con clientes similares

Me gustaría saber si ha podido analizar nuestra propuesta y si tiene algún interés en avanzar o si necesita alguna aclaración adicional.

Quedo a su disposición para cualquier consulta.

Saludos cordiales,
[NOMBRE_VENDEDOR]
`
      },
      {
        titulo: 'Script para Llamada de Primer Seguimiento',
        contenido: `• Presentación: "Buenos días/tardes, mi nombre es [NOMBRE_VENDEDOR] de [NOMBRE_EMPRESA]. ¿Hablo con [CONTACTO]?"

• Contextualización: "Me comunico con usted para hacer un seguimiento del presupuesto N° [ID_PRESUPUESTO] que le enviamos hace aproximadamente 10 días, el [FECHA_CREACION]."

• Preguntas clave:
  - "¿Ha tenido oportunidad de revisar la propuesta en detalle?"
  - "¿Puedo proporcionarle información adicional sobre los productos [FABRICANTE]?"
  - "¿Hay algún aspecto particular que le interese conocer más a fondo?"

• Información adicional: Mencionar beneficios específicos del producto, características técnicas destacadas, casos de éxito.

• Cierre: "Quedamos atentos a sus comentarios. Recuerde que el presupuesto tiene validez hasta el [FECHA_VENCIMIENTO]."
`
      },
      {
        titulo: 'Recursos Adicionales para Compartir',
        contenido: `Documentos para compartir con el cliente:

1. Ficha técnica completa de los productos [FABRICANTE]
2. Folleto corporativo con casos de éxito
3. Comparativa técnica con productos similares
4. Certificaciones de calidad
5. Guía de instalación/uso rápido
6. Enlaces a videos demostrativos de los productos`
      }
    ],
    'Segundo Seguimiento': [
      {
        titulo: 'Email de Segundo Seguimiento',
        contenido: `Estimado/a [CONTACTO]:

Me comunico nuevamente con usted respecto al presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION].

Quisiera recordarle que nuestra propuesta mantiene su validez hasta el [FECHA_VENCIMIENTO], por lo que aún está a tiempo de aprovechar las condiciones ofrecidas.

¿Ha tomado alguna decisión respecto a nuestra propuesta? ¿Existe algún aspecto adicional que necesite aclarar para avanzar con el proceso?

Estamos a su disposición para coordinar los siguientes pasos o responder cualquier consulta pendiente.

Saludos cordiales,
[NOMBRE_VENDEDOR]
`
      },
      {
        titulo: 'Script para Llamada de Segundo Seguimiento',
        contenido: `• Presentación: "Buenos días/tardes, mi nombre es [NOMBRE_VENDEDOR] de [NOMBRE_EMPRESA]. ¿Hablo con [CONTACTO]?"

• Contextualización: "Me comunico con usted para hacer un seguimiento del presupuesto N° [ID_PRESUPUESTO] enviado hace aproximadamente tres semanas."

• Énfasis en vencimiento: "Le recuerdo que el presupuesto tiene validez hasta el [FECHA_VENCIMIENTO], por lo que aún está a tiempo de confirmar bajo las condiciones actuales."

• Preguntas clave:
  - "¿Ha tomado alguna decisión respecto a nuestra propuesta?"
  - "¿Existe algún aspecto que necesite renegociar o ajustar para avanzar con el proceso?"
  - "¿Hay algún impedimento para proceder con la aprobación?"

• Cierre: "Quedamos atentos a su decisión. Estamos disponibles para coordinar una reunión si lo considera necesario para despejar cualquier duda pendiente."
`
      }
    ],
    'Seguimiento Final': [
      {
        titulo: 'Email de Seguimiento Final',
        contenido: `Estimado/a [CONTACTO]:

Me comunico con usted por última vez respecto al presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION].

Le recuerdo que la validez de nuestra propuesta vence en 3 días, el [FECHA_VENCIMIENTO]. Después de esa fecha, los precios y condiciones podrían verse modificados.

Si está interesado en proceder con nuestra propuesta, le agradecería nos confirme a la brevedad para coordinar los siguientes pasos.

Quedo a su disposición para cualquier consulta o aclaración final que pueda necesitar para tomar su decisión.

Saludos cordiales,
[NOMBRE_VENDEDOR]
`
      },
      {
        titulo: 'Script para Llamada de Seguimiento Final',
        contenido: `• Presentación: "Buenos días/tardes, mi nombre es [NOMBRE_VENDEDOR] de [NOMBRE_EMPRESA]. ¿Hablo con [CONTACTO]?"

• Contextualización: "Me comunico con usted con relación al presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION]."

• Énfasis en vencimiento: "Le recuerdo que la validez de nuestra propuesta vence en 3 días, el [FECHA_VENCIMIENTO]. Después de esa fecha, los precios y condiciones podrían verse modificados."

• Preguntas clave:
  - "¿Ha tomado una decisión respecto a nuestra propuesta?"
  - "¿Existe algún impedimento para avanzar que podamos solucionar antes del vencimiento?"
  - "¿Necesita alguna aclaración final para tomar su decisión?"

• Propuesta de acción: "Si está interesado, podemos coordinar una reunión urgente para cerrar los detalles o preparar la documentación necesaria para formalizar el proceso."

• Cierre: "Agradezco su atención y quedo atento a su respuesta."
`
      }
    ],
    'Vencido': [
      {
        titulo: 'Email de Verificación Final',
        contenido: `Estimado/a [CONTACTO]:

Me comunico con usted para hacer un seguimiento final sobre el presupuesto N° [ID_PRESUPUESTO] enviado el [FECHA_CREACION], cuya validez ha expirado.

Quisiera confirmar si han tomado alguna decisión respecto a nuestra propuesta o si prefieren que emitamos un nuevo presupuesto actualizado.

Agradezco pueda indicarnos el estado final del presupuesto:
- Aprobado (requiere confirmación formal)
- Rechazado (agradecería conocer los motivos para mejorar nuestras futuras propuestas)
- Requiere nuevo presupuesto actualizado

Quedo atento a su respuesta.

Saludos cordiales,
[NOMBRE_VENDEDOR]
`
      },
      {
        titulo: 'Script para Registro de Estado Final',
        contenido: `• Verificación de estado del presupuesto N° [ID_PRESUPUESTO]

• Cliente: [EMPRESA]
• Contacto: [CONTACTO]
• Fecha de emisión: [FECHA_CREACION]
• Fecha de vencimiento: [FECHA_VENCIMIENTO]

• Estado final (marcar opción):
  ☐ Aprobado
  ☐ Rechazado
  ☐ Vencido sin respuesta
  ☐ Requiere nuevo presupuesto

• Motivo de rechazo/observaciones:
__________________________________________________
__________________________________________________

• Acciones de seguimiento requeridas:
__________________________________________________
__________________________________________________

• Registrado por: [NOMBRE_VENDEDOR]
• Fecha de registro: [FECHA_ACTUAL]
`
      }
    ]
  };

  // Función para filtrar presupuestos según búsqueda y estado
  const getFilteredPresupuestos = () => {
    return presupuestosData.filter(item => {
      const matchesSearch = 
        item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.empresa.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.fabricante.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = 
        filters.status === 'all' || 
        (filters.status === 'completed' && completedTasks[item.id]) || 
        (filters.status === 'pending' && !completedTasks[item.id]);
      
      return matchesSearch && matchesStatus;
    });
  };

  // Establecer el contactInfo inicial
  useEffect(() => {
    // Datos de contacto ficticios
    const contactosData = {
      '39101': { nombre: 'Juan Pérez', email: 'jperez@heliosenergia.com', telefono: '+54 11 4523-7890' },
      '39100': { nombre: 'María González', email: 'mgonzalez@interchemistry.com.ar', telefono: '+54 11 4789-5432' },
      '39099': { nombre: 'Roberto Alvarez', email: 'ralvarez@minera-alumbrera.com', telefono: '+54 3834 42-1234' },
      '39097': { nombre: 'Ana Fernández', email: 'afernandez@intema.gob.ar', telefono: '+54 223 495-6789' },
      '39096': { nombre: 'Carlos Martínez', email: 'cmartinez@meditecna.com.ar', telefono: '+54 11 4345-6789' },
      '39083': { nombre: 'Diana Rodríguez', email: 'drodriguez@pugliese.com.ar', telefono: '+54 341 425-7890' },
      '39082': { nombre: 'Eduardo López', email: 'elopez@osse-sanjuan.gov.ar', telefono: '+54 264 422-5678' },
      '39120': { nombre: 'Federico Silva', email: 'fsilva@munisarmiento.gob.ar', telefono: '+54 297 482-1234' },
      '39118': { nombre: 'Gabriela Moreno', email: 'gmoreno@utn.edu.ar', telefono: '+54 11 4867-7890' },
      '39117': { nombre: 'Héctor Ruiz', email: 'hruiz@inti.gob.ar', telefono: '+54 11 4724-6000' },
      '39110': { nombre: 'Inés Romero', email: 'iromero@molfino.com.ar', telefono: '+54 341 456-7890' },
      '39109': { nombre: 'Jorge Sánchez', email: 'jsanchez@osse-mdp.gov.ar', telefono: '+54 223 499-4500' },
      '39106': { nombre: 'Karen Torres', email: 'ktorres@toyota.com.ar', telefono: '+54 11 4002-7000' },
      '39098': { nombre: 'Leonardo Castro', email: 'lcastro@cgquimica.com.ar', telefono: '+54 11 4567-8901' }
    };
    
    setContactInfo(contactosData);
    
    // Establecer algunos valores iniciales para estado y notas
    setActionStatus({
      '39110': 'rechazado',
      '39109': 'aprobado',
      '39106': 'sin_respuesta'
    });
    
    setNotes({
      '39110': 'Cliente decidió adquirir productos de otra marca por precio.',
      '39109': 'Confirmó compra por email el 24/04. Enviar factura.',
      '39106': 'No responde llamadas ni emails desde el 23/04.'
    });
    
    // Establecer algunas licitaciones iniciales
    setIsLicitacionState({
      '39117': true,
      '39097': true,
      '39082': true
    });
    
    // Marcar algunas tareas como completadas
    setCompletedTasks({
      '39110': true,
      '39109': true,
      '39106': true
    });
  }, []);

  // Función para marcar tarea como completada
  const toggleTaskCompletion = (id) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Función para guardar nota
  const saveNote = (id, note) => {
    setNotes(prev => ({
      ...prev,
      [id]: note
    }));
    // No cerramos los detalles después de agregar notas
  };

  // Función para actualizar el estado de la acción
  const updateActionStatus = (id, status) => {
    setActionStatus(prev => ({
      ...prev,
      [id]: status
    }));
    // No cerramos los detalles después de seleccionar el estado
  };

  // Función para generar el reporte
  const generateReport = () => {
    const totalPresupuestos = presupuestosData.length;
    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    const pendingCount = totalPresupuestos - completedCount;
    
    // Obtener la fecha actual formateada para el reporte
    const fechaReporte = reportDate || new Date().toISOString().split('T')[0];
    const fechaFormateada = fechaReporte.split('-').reverse().join('/'); // Formato DD/MM/YYYY
    
    // Generar categorías
    const categorias = {
      'Confirmación': presupuestosData.filter(p => p.tipo === 'Confirmación'),
      'Primer Seguimiento': presupuestosData.filter(p => p.tipo === 'Primer Seguimiento'),
      'Segundo Seguimiento': presupuestosData.filter(p => p.tipo === 'Segundo Seguimiento'),
      'Seguimiento Final': presupuestosData.filter(p => p.tipo === 'Seguimiento Final'),
      'Vencido': presupuestosData.filter(p => p.tipo === 'Vencido')
    };
    
    // Función para sanitizar texto para CSV (eliminar caracteres problemáticos)
    const sanitizeForCSV = (text) => {
      if (!text) return '';
      
      // Reemplazar caracteres especiales y comas
      return String(text)
        .replace(/"/g, '""') // Escapar comillas dobles
        .replace(/;/g, ',') // Reemplazar punto y coma por coma
        .replace(/\n/g, ' ') // Reemplazar saltos de línea por espacios
        .replace(/\r/g, ''); // Eliminar retornos de carro
    };
    
    // Crear reporte en formato CSV con punto y coma como delimitador
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Agregar fecha del reporte en la primera fila
    csvContent += `Reporte de Seguimiento de Presupuestos - Fecha: ${fechaFormateada}\n\n`;
    
    // Encabezado
    csvContent += "ID;Empresa;Tipo de Accion;Estado;Notas;Es Licitacion;Monto;Fabricante;Fecha Creacion;Validez;Dias Restantes\n";
    
    // Datos
    presupuestosData.forEach(item => {
      const estadoTexto = actionStatus[item.id] || "Pendiente";
      const notaTexto = notes[item.id] || "";
      const esLicitacion = isLicitacionState[item.id] ? "Si" : "No";
      
      const row = [
        item.id,
        sanitizeForCSV(item.empresa),
        sanitizeForCSV(item.tipo),
        sanitizeForCSV(estadoTexto),
        `"${sanitizeForCSV(notaTexto)}"`,
        esLicitacion,
        item.monto.toString().replace('.', ','), // usar coma decimal para Excel
        sanitizeForCSV(item.fabricante),
        item.fechaCreacion,
        item.validez,
        item.diasRestantes
      ];
      
      csvContent += row.join(";") + "\n";
    });
    
    // Agregar resumen al final del reporte
    csvContent += `\nResumen del Reporte\n`;
    csvContent += `Total de Actividades;${totalPresupuestos}\n`;
    csvContent += `Completadas;${completedCount}\n`;
    csvContent += `Pendientes;${pendingCount}\n`;
    csvContent += `Confirmaciones;${categorias['Confirmación'].length}\n`;
    csvContent += `Primer Seguimiento;${categorias['Primer Seguimiento'].length}\n`;
    csvContent += `Segundo Seguimiento;${categorias['Segundo Seguimiento'].length}\n`;
    csvContent += `Seguimiento Final;${categorias['Seguimiento Final'].length}\n`;
    csvContent += `Vencidos;${categorias['Vencido'].length}\n`;
    
    // Crear elemento para descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Seguimiento_${fechaFormateada.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
  };

  // Componente de pestañas
  const TabButton = ({ label, icon, tabId }) => (
    <button 
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center p-3 rounded-lg transition-all ${activeTab === tabId ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  // Componente de tarjeta de acción
  const ActionCard = ({ item }) => {
    // Estado para controlar si el modal de detalles está abierto
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados locales para el formulario
    const [noteText, setNoteText] = useState(notes[item.id] || '');
    const [selectedStatus, setSelectedStatus] = useState(actionStatus[item.id] || '');
    const [isLicitacion, setIsLicitacion] = useState(isLicitacionState[item.id] || false);
    
    // Datos de contacto del cliente
    const contact = contactInfo[item.id] || {};
    
    // Color según prioridad
    const getPriorityColor = (priority) => {
      switch(priority) {
        case 'Alta': return 'text-red-600';
        case 'Media': return 'text-orange-500';
        case 'Baja': return 'text-blue-500';
        default: return 'text-gray-500';
      }
    };
    
    // Actualizar el estado global cuando cambia el checkbox de licitación
    const handleLicitacionChange = (checked) => {
      setIsLicitacion(checked);
      setIsLicitacionState(prev => ({
        ...prev,
        [item.id]: checked
      }));
    };
    
    // Verificar si la tarea se puede marcar como completada
    const canComplete = selectedStatus !== '' && noteText.trim() !== '';
    
    // Manejar cambio en el checkbox de completado
    const handleCompletionChange = () => {
      if (!completedTasks[item.id]) {
        // Si intenta marcar como completada
        if (canComplete) {
          toggleTaskCompletion(item.id);
        } else {
          // Mostrar modal y mensaje de advertencia
          setIsModalOpen(true);
          alert("Debe seleccionar un estado y agregar notas para completar esta actividad.");
        }
      } else {
        // Si está desmarcando, siempre permitir
        toggleTaskCompletion(item.id);
      }
    };
    
    // Guardar los cambios del formulario
    const handleSaveChanges = () => {
      // Guardar notas
      saveNote(item.id, noteText);
      
      // Guardar estado
      updateActionStatus(item.id, selectedStatus);
      
      // Cerrar el modal
      setIsModalOpen(false);
      
      // Si tiene estado y notas, y el usuario quiere marcar como completada, hacerlo
      if (canComplete && window.confirm('¿Desea marcar esta actividad como completada?')) {
        toggleTaskCompletion(item.id);
      }
    };
    
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 mb-4 ${completedTasks[item.id] ? 'opacity-70' : ''} transition-all`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-bold">{item.empresa}</h3>
              {item.alertas && item.alertas.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  {item.alertas[0]}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">ID: {item.id} | {item.fabricante}</p>
          </div>
          <div className="flex items-center">
            <span className={`mr-2 text-sm font-medium ${getPriorityColor(item.prioridad)}`}>
              {item.prioridad}
            </span>
            <input 
              type="checkbox" 
              checked={completedTasks[item.id] || false}
              onChange={handleCompletionChange}
              className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mb-1">
            {item.tipo}
          </span>
          <p className="text-sm text-gray-700">{item.accion}</p>
        </div>
        
        <div className="flex flex-wrap text-sm text-gray-600 mb-3">
          <div className="mr-4 mb-1">
            <ClipboardCheck className="inline h-4 w-4 mr-1" />
            Monto: ${item.monto.toLocaleString('es-AR')}
          </div>
          <div className="mr-4 mb-1">
            <CalendarClock className="inline h-4 w-4 mr-1" />
            Creación: {item.fechaCreacion}
          </div>
          <div className="mb-1">
            <Clock className="inline h-4 w-4 mr-1" />
            Validez: {item.validez} días {item.diasRestantes !== 0 && `(${Math.abs(item.diasRestantes)} días ${item.diasRestantes > 0 ? 'restantes' : 'vencido'})`}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={isLicitacion}
              onChange={(e) => handleLicitacionChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2 licitacion-checkbox"
              data-id={item.id}
            />
            <span className="text-sm text-gray-700">Licitación</span>
          </label>
        </div>
        
        <div className="flex justify-between">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar detalles
          </button>
          <button 
            onClick={() => setSelectedAction(item)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Ver plantillas
          </button>
        </div>
        
        {/* Modal para editar detalles */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Detalles del seguimiento - {item.empresa}
                  </h2>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Datos de contacto:</h4>
                  {contact ? (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm mb-1"><strong>Nombre:</strong> {contact.nombre}</p>
                      <p className="text-sm mb-1">
                        <Mail className="inline h-4 w-4 mr-1" />
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a>
                      </p>
                      <p className="text-sm">
                        <Phone className="inline h-4 w-4 mr-1" />
                        <a href={`tel:${contact.telefono}`} className="text-blue-600 hover:underline">{contact.telefono}</a>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay datos de contacto disponibles.</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Estado: <span className="text-red-500">*</span></h4>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className={`bg-gray-50 border ${!selectedStatus ? 'border-red-300' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                    required
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="interesado">Cliente interesado</option>
                    <option value="evaluando">Cliente evaluando</option>
                    <option value="negociacion">En negociación</option>
                    <option value="aprobado">Presupuesto aprobado</option>
                    <option value="rechazado">Presupuesto rechazado</option>
                    <option value="postergado">Decisión postergada</option>
                    <option value="sin_respuesta">Sin respuesta</option>
                    <option value="nuevo_presupuesto">Requiere nuevo presupuesto</option>
                  </select>
                  {!selectedStatus && (
                    <p className="text-sm text-red-500 mt-1">Seleccionar un estado es obligatorio</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Notas: <span className="text-red-500">*</span></h4>
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows="5"
                    className={`bg-gray-50 border ${!noteText.trim() ? 'border-red-300' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                    placeholder="Agregar notas sobre este seguimiento..."
                    required
                  ></textarea>
                  {!noteText.trim() && (
                    <p className="text-sm text-red-500 mt-1">Agregar notas es obligatorio</p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!canComplete}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      canComplete 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Componente modal de plantillas
  const TemplateModal = ({ item, onClose }) => {
    if (!item) return null;
    
    const templates = plantillas[item.tipo] || [];
    const [activeTemplate, setActiveTemplate] = useState(templates[0]?.titulo || '');
    const contact = contactInfo[item.id] || {};
    
    const getTemplateContent = () => {
      const template = templates.find(t => t.titulo === activeTemplate);
      if (!template) return '';
      
      // Reemplazar variables en la plantilla
      let content = template.contenido
        .replace(/\[CONTACTO\]/g, contact.nombre || '[Nombre de contacto]')
        .replace(/\[ID_PRESUPUESTO\]/g, item.id)
        .replace(/\[FECHA_CREACION\]/g, item.fechaCreacion)
        .replace(/\[FABRICANTE\]/g, item.fabricante)
        .replace(/\[EMPRESA\]/g, item.empresa)
        .replace(/\[VALIDEZ\]/g, item.validez.toString())
        .replace(/\[FECHA_ACTUAL\]/g, new Date().toLocaleDateString('es-AR'));
      
      // Calcular fecha de vencimiento si es necesario
      if (content.includes('[FECHA_VENCIMIENTO]')) {
        const fechaCreacion = item.fechaCreacion.split(' ')[0].split('/');
        const fechaCreacionObj = new Date(fechaCreacion[2], fechaCreacion[1] - 1, fechaCreacion[0]);
        const fechaVencimiento = new Date(fechaCreacionObj);
        fechaVencimiento.setDate(fechaCreacionObj.getDate() + item.validez);
        content = content.replace(/\[FECHA_VENCIMIENTO\]/g, fechaVencimiento.toLocaleDateString('es-AR'));
      }
      
      return content;
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Plantillas para {item.empresa} (ID: {item.id})
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de plantilla:</label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTemplate(template.titulo)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      activeTemplate === template.titulo 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {template.titulo}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenido:</label>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 whitespace-pre-wrap text-sm h-96 overflow-y-auto">
                {getTemplateContent()}
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getTemplateContent());
                  alert('Plantilla copiada al portapapeles');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Copiar plantilla
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calcular estadísticas para el dashboard
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const pendingCount = presupuestosData.length - completedCount;
  const completionPercentage = presupuestosData.length > 0 
    ? Math.round((completedCount / presupuestosData.length) * 100) 
    : 0;
  
  const categoryCounts = presupuestosData.reduce((acc, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema de Seguimiento de Presupuestos</h1>
        <p className="text-gray-600">Fecha actual: {new Date().toLocaleDateString('es-AR')} | Total actividades: {presupuestosData.length}</p>
      </header>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="space-y-2">
              <TabButton 
                label="Dashboard" 
                icon={<BarChart className="h-5 w-5" />}
                tabId="dashboard"
              />
              <TabButton 
                label="Confirmaciones Iniciales" 
                icon={<Mail className="h-5 w-5" />}
                tabId="confirmaciones"
              />
              <TabButton 
                label="Primer Seguimiento" 
                icon={<Phone className="h-5 w-5" />}
                tabId="primerSeguimiento"
              />
              <TabButton 
                label="Presupuestos Vencidos" 
                icon={<FileSpreadsheet className="h-5 w-5" />}
                tabId="vencidos"
              />
              <TabButton 
                label="Todas las Actividades" 
                icon={<ClipboardCheck className="h-5 w-5" />}
                tabId="todas"
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-bold mb-4">Generar Reporte</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del reporte:
              </label>
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
            </div>
            <button
              onClick={generateReport}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Descargar reporte CSV
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Progreso del día</h3>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-5 mr-2">
                      <div 
                        className="bg-blue-600 h-5 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{completionPercentage}%</span>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Completadas: {completedCount}</span>
                    <span>Pendientes: {pendingCount}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Por tipo de acción</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryCounts).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm">{category}:</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Acciones prioritarias</h3>
                  <div className="space-y-2">
                    {presupuestosData
                      .filter(item => item.prioridad === 'Alta')
                      .slice(0, 3)
                      .map(item => (
                        <div key={item.id} className="text-sm p-2 bg-red-50 rounded-md">
                          <div className="font-medium">{item.empresa}</div>
                          <div className="text-xs text-gray-600">{item.tipo} | ID: {item.id}</div>
                        </div>
                      ))}
                    {presupuestosData.filter(item => item.prioridad === 'Alta').length === 0 && (
                      <p className="text-sm text-gray-500">No hay acciones de alta prioridad para hoy.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Actividades para hoy</h3>
                <div className="mb-4">
                  <input 
                    type="text"
                    placeholder="Buscar por ID, empresa o fabricante..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </div>
                
                <div className="space-y-4">
                  {getFilteredPresupuestos()
                    .sort((a, b) => {
                      // Ordenar por prioridad primero
                      const prioridadOrder = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
                      if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
                        return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
                      }
                      // Luego por completado/pendiente
                      if (completedTasks[a.id] !== completedTasks[b.id]) {
                        return completedTasks[a.id] ? 1 : -1;
                      }
                      // Finalmente por tipo de acción
                      const tipoOrder = {
                        'Confirmación': 0,
                        'Primer Seguimiento': 1,
                        'Segundo Seguimiento': 2,
                        'Seguimiento Final': 3,
                        'Vencido': 4
                      };
                      return tipoOrder[a.tipo] - tipoOrder[b.tipo];
                    })
                    .slice(0, 5)
                    .map(item => (
                      <ActionCard key={item.id} item={item} />
                    ))}
                  
                  {getFilteredPresupuestos().length === 0 && (
                    <p className="text-gray-500 text-center py-4">No se encontraron actividades que coincidan con los criterios de búsqueda.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Confirmaciones View */}
          {activeTab === 'confirmaciones' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Confirmaciones Iniciales</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value="all">Todas</option>
                    <option value="completed">Completadas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {getFilteredPresupuestos()
                  .filter(item => item.tipo === 'Confirmación')
                  .map(item => (
                    <ActionCard key={item.id} item={item} />
                  ))}
                
                {getFilteredPresupuestos().filter(item => item.tipo === 'Confirmación').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No se encontraron confirmaciones iniciales para hoy.</p>
                )}
              </div>
            </div>
          )}
          
          {/* Primer Seguimiento View */}
          {activeTab === 'primerSeguimiento' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Primer Seguimiento</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value="all">Todas</option>
                    <option value="completed">Completadas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {getFilteredPresupuestos()
                  .filter(item => item.tipo === 'Primer Seguimiento')
                  .map(item => (
                    <ActionCard key={item.id} item={item} />
                  ))}
                
                {getFilteredPresupuestos().filter(item => item.tipo === 'Primer Seguimiento').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No se encontraron primeros seguimientos para hoy.</p>
                )}
              </div>
            </div>
          )}
          
          {/* Presupuestos Vencidos View */}
          {activeTab === 'vencidos' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Presupuestos Vencidos</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value="all">Todos</option>
                    <option value="completed">Completados</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {getFilteredPresupuestos()
                  .filter(item => item.tipo === 'Vencido')
                  .map(item => (
                    <ActionCard key={item.id} item={item} />
                  ))}
                
                {getFilteredPresupuestos().filter(item => item.tipo === 'Vencido').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No se encontraron presupuestos vencidos con los criterios seleccionados.</p>
                )}
              </div>
            </div>
          )}
          
          {/* Todas las Actividades View */}
          {activeTab === 'todas' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Todas las Actividades</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value="all">Todas</option>
                    <option value="completed">Completadas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {getFilteredPresupuestos().map(item => (
                  <ActionCard key={item.id} item={item} />
                ))}
                
                {getFilteredPresupuestos().length === 0 && (
                  <p className="text-gray-500 text-center py-4">No se encontraron actividades con los criterios seleccionados.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Template Modal */}
      {selectedAction && (
        <TemplateModal 
          item={selectedAction}
          onClose={() => setSelectedAction(null)}
        />
      )}
    </div>
  );
};

export default SeguimientoPresupuestos;