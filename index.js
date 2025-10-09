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
// FUNCIONES DE INICIO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  inicializarApp();
});

function inicializarApp() {
  // Inicializar eventos del formulario de reseñas
  const formReseña = document.querySelector('.review-form');
  if (formReseña) {
    formReseña.addEventListener('submit', manejarEnvioReseña);
  }

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

  // desplazamiento suave para navegación
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

// ============================================
// SISTEMA DE RESEÑAS
// ============================================

function manejarEnvioReseña(e) {
  e.preventDefault();
  
  // Obtener valores del formulario
  const nombreJuego = document.getElementById('game-name').value;
  const categoria = document.getElementById('game-category').value;
  const puntuacion = document.querySelector('input[name="rating"]:checked');
  const textoReseña = document.getElementById('review-text').value;

  // Validar que se haya seleccionado una puntuación
  if (!puntuacion) {
    mostrarNotificacion('⚠️ Por favor selecciona una puntuación', 'warning');
    return;
  }

  // Crear objeto de reseña
  const nuevaReseña = {
    id: Date.now(),
    nombreJuego: nombreJuego,
    categoria: categoria,
    puntuacion: parseInt(puntuacion.value),
    texto: textoReseña,
    fecha: new Date().toLocaleDateString('es-ES'),
    autor: usuarioActual ? usuarioActual.nombre : 'Anónimo',
    likes: 0
  };

  // Guardar en la "base de datos"
  database.reseñas.push(nuevaReseña);

  // Mostrar mensaje de éxito
  mostrarNotificacion('✅ ¡Reseña publicada exitosamente!', 'success');

  // Limpiar formulario
  e.target.reset();

  // Resetear estrellas visualmente
  document.querySelectorAll('.star-rating input[type="radio"]').forEach(input => {
    input.checked = false;
  });

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
        <select id="tipo-contenido" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
          <option value="videojuegos">Videojuego</option>
          <option value="anime">Anime</option>
          <option value="peliculas">Película</option>
          <option value="series">Serie</option>
        </select>
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Nombre:</label>
        <input type="text" id="nombre-item" placeholder="Ej: The Witcher 3" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;" required>
      </div>
      <div>
        <label style="color: #e0e0e0; display: block; margin-bottom: 0.5rem;">Estado:</label>
        <select id="estado-item" style="width: 100%; padding: 0.8rem; background: rgba(15, 52, 96, 0.6); border: 2px solid rgba(233, 69, 96, 0.3); border-radius: 5px; color: #e0e0e0;">
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
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        agregarABiblioteca();
      });
    }
  }, 100);
}

function agregarABiblioteca() {
  const tipo = document.getElementById('tipo-contenido').value;
  const nombre = document.getElementById('nombre-item').value;
  const estado = document.getElementById('estado-item').value;

  const nuevoItem = {
    id: Date.now(),
    nombre: nombre,
    estado: estado,
    fechaAgregado: new Date().toLocaleDateString('es-ES')
  };

  database.biblioteca[tipo].push(nuevoItem);
  
  mostrarNotificacion(`✅ ${nombre} agregado a tu biblioteca!`, 'success');
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

        contenido += `
          <div style="background: rgba(22, 33, 62, 0.6); padding: 1rem; margin-bottom: 0.8rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #e0e0e0;">${item.nombre}</strong>
              <br>
              <small style="color: #808080;">Agregado: ${item.fechaAgregado}</small>
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
