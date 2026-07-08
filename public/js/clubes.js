/**
 * Gestión de la página de Clubes - AEFN
 * Maneja la carga, filtrado y visualización de clubes estudiantiles
 */

(function(){
  'use strict';

  // Objeto global para exponer funciones
  window.Clubes = window.Clubes || {};

  /**
   * Fetch JSON data
   */
  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    return await res.json();
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Crea una tarjeta de club
   */
  function createClubCard(club, index) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 col-12 mb-4';

    const directivaHTML = club.directiva
      .map(d => `
        <div class="col-md-6 mb-3">
          <p class="mb-1"><strong>${escapeHtml(d.cargo)}:</strong></p>
          <p class="mb-0 small">${escapeHtml(d.nombre)}</p>
          ${d.email !== '[Email]' ? `<p class="small text-muted">${escapeHtml(d.email)}</p>` : ''}
        </div>
      `)
      .join('');

    const actividadesHTML = club.actividades && club.actividades.length > 0
      ? club.actividades
          .map(a => `
            <li class="mb-2">
              <i class="bi-calendar-event me-2"></i>
              <strong>${escapeHtml(a.fecha)}</strong> - ${escapeHtml(a.titulo)}
            </li>
          `)
          .join('')
      : '<li class="text-muted">No hay actividades programadas</li>';

    col.innerHTML = `
      <div class="custom-block bg-white shadow-lg h-100">
        <div class="row h-100">
          <div class="col-lg-4 col-md-5">
            <div class="club-logo-container p-4 text-center bg-light h-100 d-flex align-items-center justify-content-center">
              <i class="bi ${escapeHtml(club.icono)} display-1"></i>
            </div>
          </div>
          <div class="col-lg-8 col-md-7">
            <div class="p-4 h-100 d-flex flex-column">
              <div class="mb-3 flex-grow-1">
                <h4 class="mb-2">${escapeHtml(club.nombre)}</h4>
                <p class="small text-muted mb-2">${escapeHtml(club.descripcion)}</p>
              </div>
              
              <button class="btn custom-btn btn-sm w-100" data-bs-toggle="modal" data-bs-target="#clubModal" data-club-id="${escapeHtml(club.id)}">
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    return col;
  }

  /**
   * Renderiza el listado de clubes
   */
  async function renderClubes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const clubes = await fetchJSON('data/clubes.json');
      const row = document.createElement('div');
      row.className = 'row';

      clubes.forEach((club, i) => {
        row.appendChild(createClubCard(club, i));
      });

      container.innerHTML = '';
      container.appendChild(row);

      // Guardar datos globales para el modal
      window.Clubes.data = clubes;
    } catch (e) {
      container.innerHTML = '<div class="col-12"><p class="text-danger">No se pudo cargar la lista de clubes.</p></div>';
      console.error(e);
    }
  }

  /**
   * Renderiza el modal con detalles del club
   */
  function renderClubModal(clubId) {
    const club = window.Clubes.data.find(c => c.id === clubId);
    if (!club) return;

    const modalTitle = document.querySelector('#clubModal .modal-title');
    const modalBody = document.querySelector('#clubModal .modal-body');

    if (!modalTitle || !modalBody) return;

    modalTitle.textContent = club.nombre;

    const directivaHTML = club.directiva
      .map(d => `
        <div class="col-md-6 mb-3">
          <p class="mb-1"><strong>${escapeHtml(d.cargo)}:</strong></p>
          <p class="mb-0">${escapeHtml(d.nombre)}</p>
          ${d.email !== '[Email]' ? `<p class="small text-muted"><a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a></p>` : '<p class="small text-muted text-secondary">Por confirmar</p>'}
        </div>
      `)
      .join('');

    const actividadesHTML = club.actividades && club.actividades.length > 0
      ? club.actividades
          .map(a => `
            <li class="mb-2">
              <i class="bi-calendar-event me-2"></i>
              <strong>${escapeHtml(a.fecha)}</strong> - ${escapeHtml(a.titulo)}
              <p class="small text-muted ms-4 mb-0">${escapeHtml(a.descripcion)}</p>
            </li>
          `)
          .join('')
      : '<li class="text-muted">No hay actividades programadas. ¡Proximamente!</li>';

    modalBody.innerHTML = `
      <div class="club-detail">
        <h5 class="mb-3">Descripción</h5>
        <p>${escapeHtml(club.descripcion_larga)}</p>

        <hr class="my-4">

        <h5 class="mb-3">Directiva</h5>
        <div class="row">
          ${directivaHTML}
        </div>

        <hr class="my-4">

        <h5 class="mb-3">Próximas Actividades</h5>
        <ul class="list-unstyled">
          ${actividadesHTML}
        </ul>

        <hr class="my-4">

        <h5 class="mb-3">Unirse al Club</h5>
        <p class="small text-muted mb-2">Para solicitar unirte a este club, envía un correo a:</p>
        <p class="mb-0">
          <a href="mailto:${escapeHtml(club.contacto_email)}" class="btn custom-btn btn-sm">
            <i class="bi-envelope me-2"></i> ${escapeHtml(club.contacto_email)}
          </a>
        </p>
      </div>
    `;
  }

  /**
   * Inicialización
   */
  function init() {
    // Renderizar lista de clubes
    renderClubes('clubesList');

    // Event listener para modales
    document.addEventListener('show.bs.modal', function(e) {
      if (e.target.id === 'clubModal') {
        const button = e.relatedTarget;
        const clubId = button.getAttribute('data-club-id');
        renderClubModal(clubId);
      }
    });
  }

  // Exponer función pública
  window.Clubes.renderClubes = renderClubes;
  window.Clubes.renderClubModal = renderClubModal;

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
