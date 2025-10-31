// ============================================
// VARIABLES GLOBALES Y ALMACENAMIENTO
// ============================================

// Simulación de base de datos en memoria
let database = {
  usuarios: [
    { id: 1, nombre: "Agustín", email: "agustin@nexo.com", password: "1234" }
  ],
  reseñas: [],
  biblioteca: {
    videojuegos: [],
    anime: [],
    peliculas: [],
    series: []
  }
};

// Usuario actual (null si no hay sesión)
let usuarioActual = null;

// ============================================
// FUNCIONES DE ALMACENAMIENTO PERSISTENTE
// ============================================

// Verificar si el almacenamiento está disponible
function storageDisponible() {
  return typeof window !== 'undefined' && window.storage;
}

// Cargar reseñas desde el almacenamiento (compartido)
async function cargarReseñas() {
  if (!storageDisponible()) {
    console.log('⚠️ Almacenamiento no disponible');
    return;
  }
  
  try {
    const result = await window.storage.get('reseñas-compartidas', true);
    if (result && result.value) {
      database.reseñas = JSON.parse(result.value);
      console.log('✅ Reseñas cargadas:', database.reseñas.length);
    }
  } catch (error) {
    console.log('ℹ️ No hay reseñas previas');
    database.reseñas = [];
  }
}

// Guardar reseñas en el almacenamiento (compartido)
async function guardarReseñas() {
  if (!storageDisponible()) {
    console.log('⚠️ Almacenamiento no disponible');
    return false;
  }
  
  try {
    const result = await window.storage.set('reseñas-compartidas', JSON.stringify(database.reseñas), true);
    if (result) {
      console.log('✅ Reseñas guardadas exitosamente');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al guardar reseñas:', error);
    return false;
  }
}

// Cargar biblioteca personal desde el almacenamiento (personal)
async function cargarBiblioteca() {
  if (!storageDisponible()) {
    console.log('⚠️ Almacenamiento no disponible');
    return;
  }
  
  try {
    const result = await window.storage.get('mi-biblioteca', false);
    if (result && result.value) {
      database.biblioteca = JSON.parse(result.value);
      console.log('✅ Biblioteca cargada');
      actualizarEstadisticasBiblioteca();
    }
  } catch (error) {
    console.log('ℹ️ No hay biblioteca previa');
    database.biblioteca = {
      videojuegos: [],
      anime: [],
      peliculas: [],
      series: []
    };
  }
}

// Guardar biblioteca personal en el almacenamiento (personal)
async function guardarBiblioteca() {
  if (!storageDisponible()) {
    console.log('⚠️ Almacenamiento no disponible');
    return false;
  }
  
  try {
    const result = await window.storage.set('mi-biblioteca', JSON.stringify(database.biblioteca), false);
    if (result) {
      console.log('✅ Biblioteca guardada exitosamente');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al guardar biblioteca:', error);
    return false;
  }
}

// ============================================
// FUNCIONES DE INICIO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  inicializarApp();
});

async function inicializarApp() {
  // Cargar datos guardados sin mostrar notificación
  await cargarReseñas();
  await cargarBiblioteca();

  // Inicializar eventos del formulario de reseñas
  const formsReseña = document.querySelectorAll('.review-form');
  formsReseña.forEach((form, index) => {
    // Hacer únicos los IDs de cada formulario
    hacerIDsUnicos(form, index);
    form.addEventListener('submit', manejarEnvioReseña);
  });

  // Inicializar botones "Ver Reseñas"
  const botonesVerReseñas = document.querySelectorAll('.btn-primary');
  botonesVerReseñas.forEach(boton => {
    if (boton.textContent === 'Ver Reseñas') {
      boton.addEventListener('click', mostrarModalReseñas);
    }
  });

  // Inicializar botones de biblioteca
  const btnAgregar = document.querySelector('.biblioteca-actions .btn-primary');
  const btnVerTodo = document.querySelector('.biblioteca-actions .btn-secondary');
  
  if (btnAgregar) {
    btnAgregar.addEventListener('click', mostrarModalAgregar);
  }
  
  if (btnVerTodo) {
    btnVerTodo.addEventListener('click', mostrarBibliotecaCompleta);
  }

  // Desplazamiento suave para navegación
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('🎮 El Nexo Digital iniciado correctamente');
}

// Hacer únicos los IDs de los formularios para evitar conflictos
function hacerIDsUnicos(form, index) {
  const elementos = form.querySelectorAll('[id]');
  elementos.forEach(elemento => {
    const idOriginal = elemento.id;
    const nuevoId = `${idOriginal}-${index}`;
    elemento.id = nuevoId;
    
    // Actualizar los labels que apuntan a este ID
    const label = form.querySelector(`label[for="${idOriginal}"]`);
    if (label) {
      label.setAttribute('for', nuevoId);
    }
  });
  
  // Actualizar los radio buttons de estrellas
  const radioButtons = form.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    const nameOriginal = radio.name;
    radio.name = `${nameOriginal}-${index}`;
  });
}

// ============================================
// SISTEMA DE RESEÑAS
// ============================================

async function manejarEnvioReseña(e) {
  e.preventDefault();
  
  const form = e.target;
  const seccion = form.closest('section').id;
  
  // Obtener valores del formulario usando selectores más flexibles
  const inputNombre = form.querySelector('input[type="text"]');
  const selectCategoria = form.querySelector('select');
  const puntuacion = form.querySelector('input[name^="rating"]:checked');
  const textoReseña = form.querySelector('textarea');

  // Validar campos
  if (!inputNombre || !inputNombre.value.trim()) {
    mostrarNotificacion('⚠️ Por favor ingresa el nombre', 'warning');
    return;
  }

  if (!selectCategoria || !selectCategoria.value) {
    mostrarNotificacion('⚠️ Por favor selecciona una categoría', 'warning');
    return;
  }

  if (!puntuacion) {
    mostrarNotificacion('⚠️ Por favor selecciona una puntuación', 'warning');
    return;
  }

  if (!textoReseña || !textoReseña.value.trim()) {
    mostrarNotificacion('⚠️ Por favor escribe tu reseña', 'warning');
    return;
  }

  // Crear objeto de reseña
  const nuevaReseña = {
    id: Date.now(),
    nombreJuego: inputNombre.value.trim(),
    categoria: selectCategoria.value,
    puntuacion: parseInt(puntuacion.value),
    texto: textoReseña.value.trim(),
    fecha: new Date().toLocaleDateString('es-ES'),
    autor: usuarioActual ? usuarioActual.nombre : 'Anónimo',
    likes: 0,
    tipo: seccion
  };

  // Guardar en la "base de datos"
  database.reseñas.push(nuevaReseña);

  // Guardar en almacenamiento persistente
  const guardado = await guardarReseñas();
  
  if (guardado) {
    mostrarNotificacion('✅ ¡Reseña publicada y guardada exitosamente!', 'success');
  } else {
    mostrarNotificacion('✅ Reseña publicada (guardado local)', 'success');
  }

  // Limpiar formulario
  form.reset();

  console.log('Nueva reseña agregada:', nuevaReseña);
  console.log('Total de reseñas:', database.reseñas.length);
}

function mostrarModalReseñas(e) {
  const card = e.target.closest('.card');
  const titulo = card.querySelector('h3').textContent;
  
  // Filtrar reseñas de este juego/anime/película
  const reseñasDelItem = database.reseñas.filter(r => 
    r.nombreJuego.toLowerCase() === titulo.toLowerCase()
  );

  let contenidoReseñas = '';
  
  if (reseñasDelItem.length === 0) {
    contenidoReseñas = '<p style="text-align: center; color: #b0b0b0;">Aún no hay reseñas para este título. ¡Sé el primero en opinar!</p>';
  } else {
    reseñasDelItem.forEach(reseña => {
      const estrellas = '★'.repeat(reseña.puntuacion) + '☆'.repeat(5 - reseña.puntuacion);
      contenidoReseñas += `
        <div style="background: rgba(22, 33, 62, 0.6); padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border-left: 3px solid #e94560;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="color: #e94560;">${reseña.autor}</strong>
            <span style="color: #ffd700; font-size: 1.2rem;">${estrellas}</span>
          </div>
          <p style="color: #c0c0c0; margin-bottom: 0.5rem;">${reseña.texto}</p>
          <small style="color: #808080;">${reseña.fecha} • ${reseña.likes} me gusta</small>
        </div>
      `;
    });
  }

  mostrarModal(`Reseñas de ${titulo}`, contenidoReseñas);
}

// ============================================
// SISTEMA DE BIBLIOTECA
// ============================================

function mostrarModalAgregar() {
  const contenido = `
    <form id="form-agregar-biblioteca" style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Tipo de contenido:</label>
        <select id="tipo-contenido-modal" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="videojuegos">Videojuego</option>
          <option value="anime">Anime</option>
          <option value="peliculas">Película</option>
          <option value="series">Serie</option>
        </select>
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Nombre:</label>
        <input type="text" id="nombre-item-modal" placeholder="Ej: The Witcher 3" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;" required>
      </div>
      <div id="campo-horas-modal" style="display: none;">
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Horas jugadas:</label>
        <input type="number" id="horas-jugadas-modal" placeholder="Ej: 50" min="0" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Estado:</label>
        <select id="estado-item-modal" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="completado">Completado</option>
          <option value="jugando">Jugando/Viendo</option>
          <option value="pendiente">Pendiente</option>
          <option value="abandonado">Abandonado</option>
        </select>
      </div>
      <button type="submit" style="padding: 1rem; background: #e94560; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
        Agregar a Biblioteca
      </button>
    </form>
  `;

  mostrarModal('📚 Agregar a Mi Biblioteca', contenido);

  // Manejar el envío del formulario
  setTimeout(() => {
    const form = document.getElementById('form-agregar-biblioteca');
    const tipoSelect = document.getElementById('tipo-contenido-modal');
    const campoHoras = document.getElementById('campo-horas-modal');
    
    if (form && tipoSelect && campoHoras) {
      // Mostrar/ocultar campo de horas según el tipo
      tipoSelect.addEventListener('change', function() {
        if (this.value === 'videojuegos') {
          campoHoras.style.display = 'block';
        } else {
          campoHoras.style.display = 'none';
        }
      });
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        agregarABiblioteca();
      });
    }
  }, 100);
}

async function agregarABiblioteca() {
  const tipo = document.getElementById('tipo-contenido-modal').value;
  const nombre = document.getElementById('nombre-item-modal').value;
  const estado = document.getElementById('estado-item-modal').value;
  const horas = document.getElementById('horas-jugadas-modal')?.value || null;

  if (!nombre.trim()) {
    mostrarNotificacion('⚠️ Por favor ingresa un nombre', 'warning');
    return;
  }

  const nuevoItem = {
    id: Date.now(),
    nombre: nombre.trim(),
    estado: estado,
    fechaAgregado: new Date().toLocaleDateString('es-ES'),
    ...(tipo === 'videojuegos' && horas ? { horasJugadas: parseInt(horas) } : {})
  };

  database.biblioteca[tipo].push(nuevoItem);
  
  // Guardar en almacenamiento persistente
  const guardado = await guardarBiblioteca();
  
  if (guardado) {
    mostrarNotificacion(`✅ ${nombre} agregado y guardado en tu biblioteca!`, 'success');
  } else {
    mostrarNotificacion(`✅ ${nombre} agregado a tu biblioteca (guardado local)`, 'success');
  }
  
  cerrarModal();
  actualizarEstadisticasBiblioteca();

  console.log('Item agregado a biblioteca:', nuevoItem);
}

function mostrarBibliotecaCompleta() {
  let contenido = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

  // Recorrer cada categoría
  ['videojuegos', 'anime', 'peliculas', 'series'].forEach(categoria => {
    const items = database.biblioteca[categoria];
    const categoriaCapitalizada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    
    contenido += `
      <div>
        <h3 style="color: #e94560; margin-bottom: 1rem; border-bottom: 2px solid rgba(233, 69, 96, 0.3); padding-bottom: 0.5rem;">
          ${categoriaCapitalizada} (${items.length})
        </h3>
    `;

    if (items.length === 0) {
      contenido += '<p style="color: #808080;">No tienes ningún item en esta categoría.</p>';
    } else {
      items.forEach(item => {
        const iconoEstado = {
          'completado': '✅',
          'jugando': '▶️',
          'pendiente': '⏳',
          'abandonado': '❌'
        };

        const infoHoras = item.horasJugadas ? 
          `<br><small style="color: #ffd700;">⏱️ ${item.horasJugadas} horas</small>` : '';

        contenido += `
          <div style="background: rgba(22, 33, 62, 0.6); padding: 1rem; margin-bottom: 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #e0e0e0;">${item.nombre}</strong>
              <br>
              <small style="color: #808080;">Agregado: ${item.fechaAgregado}</small>
              ${infoHoras}
            </div>
            <span style="font-size: 1.5rem;">${iconoEstado[item.estado]}</span>
          </div>
        `;
      });
    }

    contenido += '</div>';
  });

  contenido += '</div>';

  mostrarModal('📚 Mi Biblioteca Completa', contenido);
}

function actualizarEstadisticasBiblioteca() {
  const statCards = document.querySelectorAll('.stat-card');
  const categorias = ['videojuegos', 'anime', 'peliculas', 'series'];

  statCards.forEach((card, index) => {
    const cantidad = database.biblioteca[categorias[index]].length;
    card.querySelector('.stat-number').textContent = cantidad;
  });
}

// ============================================
// SISTEMA DE MODALES
// ============================================

function mostrarModal(titulo, contenido) {
  // Crear overlay si no existe
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    `;
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
      border-radius: 10px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      border: 2px solid #e94560;
    ">
      <div style="padding: 1.5rem; border-bottom: 2px solid rgba(233, 69, 96, 0.3); display: flex; justify-content: space-between; align-items: center;">
        <h2 style="color: #e94560; margin: 0;">${titulo}</h2>
        <button onclick="cerrarModal()" style="
          background: transparent;
          border: none;
          color: #e94560;
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      </div>
      <div style="padding: 1.5rem;">
        ${contenido}
      </div>
    </div>
  `;

  // Cerrar al hacer clic fuera del modal
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      cerrarModal();
    }
  });
}

function cerrarModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

function mostrarNotificacion(mensaje, tipo = 'info') {
  const colores = {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
  };

  const notificacion = document.createElement('div');
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colores[tipo]};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  notificacion.textContent = mensaje;

  document.body.appendChild(notificacion);

  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);