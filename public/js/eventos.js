/**
 * Gestión de Eventos - AEFN
 * Maneja la carga y visualización de eventos
 */

(function(){
  'use strict';

  window.Eventos = window.Eventos || {};

  /**
   * Fetch JSON data
   */
  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    return await res.json();
  }

  /**
   * Escape HTML
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
   * Formatea la fecha
   */
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }

  /**
   * Obtiene el icono según el tipo de evento
   */
  function getEventIcon(type) {
    const icons = {
      'taller': 'bi-tools',
      'seminario': 'bi-chat-left-text',
      'charla': 'bi-chat-dots',
      'competencia': 'bi-trophy',
      'reunion': 'bi-people',
      'otro': 'bi-calendar-event'
    };
    return icons[type] || icons['otro'];
  }

  /**
   * Obtiene el badge color según el estado
   */
  function getStatusBadge(estado) {
    const badges = {
      'proximo': 'bg-success',
      'en-progreso': 'bg-info',
      'finalizado': 'bg-secondary',
      'cancelado': 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  }

  /**
   * Renderiza una tarjeta de evento
   */
  function createEventCard(evento) {
    const col = document.createElement('div');
    col.className = 'col-lg-6 col-12 mb-4';

    const icon = getEventIcon(evento.tipo);
    const statusBadge = getStatusBadge(evento.estado);
    const dateFormatted = formatDate(evento.fecha);

    col.innerHTML = `
      <div class="custom-block bg-white shadow-sm h-100 p-4">
        <div class="d-flex align-items-start gap-3">
          <div>
            <i class="bi ${icon} display-6 text-primary"></i>
          </div>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="mb-0">${escapeHtml(evento.titulo)}</h5>
              <span class="badge ${statusBadge} ms-2">${escapeHtml(evento.estado)}</span>
            </div>
            
            <p class="small text-muted mb-2">
              <i class="bi-calendar-event me-1"></i> ${dateFormatted}
            </p>
            
            ${evento.ubicacion ? `
              <p class="small text-muted mb-2">
                <i class="bi-geo-alt me-1"></i> ${escapeHtml(evento.ubicacion)}
              </p>
            ` : ''}
            
            <p class="mb-3">${escapeHtml(evento.descripcion)}</p>
            
            ${evento.link ? `
              <a href="${escapeHtml(evento.link)}" target="_blank" rel="noopener noreferrer" class="btn custom-btn btn-sm">
                <i class="bi-link-45deg me-1"></i> Más información
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    return col;
  }

  /**
   * Filtra eventos por estado
   */
  function filterEventsByStatus(eventos, status) {
    if (status === 'todos') return eventos;
    return eventos.filter(e => e.estado === status);
  }

  /**
   * Ordena eventos por fecha
   */
  function sortEventsByDate(eventos) {
    return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  /**
   * Renderiza eventos
   */
  async function renderEventos(containerId, filterStatus = 'todos') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const eventos = await fetchJSON('data/events.json');
      
      if (!eventos || eventos.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No hay eventos registrados.</p></div>';
        return;
      }

      let filtered = filterEventsByStatus(eventos, filterStatus);
      filtered = sortEventsByDate(filtered);

      const row = document.createElement('div');
      row.className = 'row';

      filtered.forEach(evento => {
        row.appendChild(createEventCard(evento));
      });

      container.innerHTML = '';
      container.appendChild(row);

      window.Eventos.data = eventos;
    } catch (e) {
      container.innerHTML = '<div class="col-12"><p class="text-danger">No se pudieron cargar los eventos.</p></div>';
      console.error(e);
    }
  }

  /**
   * Renderiza filtros de eventos
   */
  async function renderEventFilters(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const html = `
        <div class="d-flex flex-wrap gap-2 justify-content-center">
          <button class="btn custom-btn active" data-filter="todos">Todos</button>
          <button class="btn custom-btn" data-filter="proximo">Próximos</button>
          <button class="btn custom-btn" data-filter="en-progreso">En Progreso</button>
          <button class="btn custom-btn" data-filter="finalizado">Finalizados</button>
        </div>
      `;

      container.innerHTML = html;

      // Event listeners para filtros
      container.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', function() {
          container.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const filter = this.getAttribute('data-filter');
          renderEventos('eventosList', filter);
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Exponer funciones públicas
  window.Eventos.renderEventos = renderEventos;
  window.Eventos.renderEventFilters = renderEventFilters;
})();
