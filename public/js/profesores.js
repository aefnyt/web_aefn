/**
 * Gestión de la página de Profesores - AEFN
 * Maneja la carga, filtrado y visualización de perfiles de profesores
 */

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('profesores-grid');
    const filterButtons = document.querySelectorAll('[data-filter]');
    const modalEl = document.getElementById('profesorModal');
    const modalTitle = modalEl.querySelector('.modal-title');
    const modalBody = modalEl.querySelector('.modal-body');

    let profesores = [];

    // Cargar datos desde el archivo JSON
    fetch('data/profesores.json')
        .then(res => {
            if (!res.ok) throw new Error('No se pudo cargar el archivo');
            return res.json();
        })
        .then(data => {
            profesores = data;
            renderGrid(profesores);
        })
        .catch(err => {
            console.error('Error cargando profesores.json:', err);
            grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning" role="alert">
                        <i class="bi-exclamation-triangle-fill me-2"></i>
                        No se pudieron cargar los profesores. Por favor, intenta más tarde.
                    </div>
                </div>`;
        });

    /**
     * Renderiza las tarjetas de profesores en el grid
     * @param {Array} list - Lista de profesores a mostrar
     */
    function renderGrid(list) {
        grid.innerHTML = '';
        
        if (list.length === 0) {
            grid.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info" role="alert">
                        <i class="bi-info-circle-fill me-2"></i>
                        No se encontraron profesores en esta categoría.
                    </div>
                </div>`;
            return;
        }
        
        list.forEach((p, i) => {
            const areasHTML = p.areas_investigacion
                .map(a => `<li class="mb-2"><i class="bi-check-circle-fill me-2"></i>${escapeHtml(a)}</li>`)
                .join('');
            
            const fotoStyle = p.foto ? 
                `background-image:url('${p.foto}'); background-size:cover; background-position:center;` : '';
            
            // Manejar áreas múltiples - convertir a array si no lo es
            const areasArray = Array.isArray(p.area) ? p.area : [p.area];
            const areasDataAttr = areasArray.join(',');
            
            // Crear badges para cada área
            const badgesHTML = areasArray.map(area => 
                `<span class="badge bg-primary me-1 mb-1">${escapeHtml(areaLabel(area))}</span>`
            ).join('');
            
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 col-12 mb-4 profesor-item';
            card.dataset.areas = areasDataAttr; // Guardar todas las áreas
            
            card.innerHTML = `
                <div class="custom-block bg-white shadow-lg h-100">
                    <div class="profesor-card">
                        <div class="position-relative">
                            <div class="profesor-foto" style="height:250px; ${fotoStyle}">
                                ${p.foto ? '' : '<i class="bi-person display-1 position-absolute top-50 start-50 translate-middle"></i>'}
                            </div>
                            <div class="badge-area position-absolute bottom-0 start-0 m-3">
                                ${badgesHTML}
                            </div>
                        </div>
                        <div class="p-4">
                            <h4 class="mb-2">${escapeHtml(p.nombre)}</h4>
                            <p class="mb-3">${escapeHtml(p.titulo)}</p>
                            <h6 class="mb-3">Áreas de Investigación</h6>
                            <ul class="list-unstyled mb-4">${areasHTML}</ul>
                            <div class="d-flex justify-content-between align-items-center">
                                <button class="btn custom-btn ver-perfil-btn" 
                                        data-index="${i}" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#profesorModal">
                                    Ver Perfil Completo
                                </button>
                                <div class="social-links">
                                    ${renderSocialLinks(p.social)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            
            grid.appendChild(card);
        });

        // Adjuntar event listeners a los botones de perfil
        attachProfileButtonListeners();
    }

    /**
     * Adjunta event listeners a los botones de "Ver Perfil"
     */
    function attachProfileButtonListeners() {
        const perfilBtns = grid.querySelectorAll('.ver-perfil-btn');
        perfilBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                openModal(profesores[idx]);
            });
        });
    }

    /**
     * Configura los botones de filtrado
     */
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            if (filterValue === 'all') {
                showAll();
            } else {
                filterByArea(filterValue);
            }
        });
    });

    /**
     * Muestra todos los profesores
     */
    function showAll() {
        const items = document.querySelectorAll('.profesor-item');
        items.forEach(el => el.classList.remove('d-none'));
    }

    /**
     * Filtra profesores por área específica
     * Muestra profesores que tienen el área seleccionada (entre todas sus áreas)
     * @param {string} area - Área de filtrado
     */
    function filterByArea(area) {
        const items = document.querySelectorAll('.profesor-item');
        items.forEach(el => {
            const profesorAreas = el.dataset.areas.split(',');
            
            // Mostrar si el profesor tiene el área seleccionada
            if (profesorAreas.includes(area)) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });
    }

    /**
     * Abre el modal con la información completa del profesor
     * @param {Object} p - Objeto con datos del profesor
     */
    function openModal(p) {
        modalTitle.textContent = p.nombre;
        
        const fotoStyle = p.foto ? 
            `background-image:url('${p.foto}'); background-size:cover; background-position:center;` : 
            'background-color: #f0f0f0;';
        
        // Manejar áreas múltiples para el modal
        const areasArray = Array.isArray(p.area) ? p.area : [p.area];
        const areasBadgesHTML = areasArray.map(area => 
            `<span class="badge bg-primary me-1 mb-1">${escapeHtml(areaLabel(area))}</span>`
        ).join('');
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="profesor-foto mb-3 position-relative" style="height:200px; ${fotoStyle}">
                        ${p.foto ? '' : '<i class="bi-person display-1 position-absolute top-50 start-50 translate-middle"></i>'}
                    </div>
                    
                    <div class="mb-3">
                        <h6>Áreas</h6>
                        <div>${areasBadgesHTML}</div>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Contacto</h6>
                        <p class="mb-1">
                            <i class="bi-envelope me-2"></i>
                            ${p.email ? `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : 'No disponible'}
                        </p>
                        <p class="mb-1">
                            <i class="bi-telephone me-2"></i>
                            ${p.telefono ? `<a href="tel:${escapeHtml(p.telefono)}">${escapeHtml(p.telefono)}</a>` : 'No disponible'}
                        </p>
                        <p class="mb-0">
                            <i class="bi-geo-alt me-2"></i>
                            ${escapeHtml(p.oficina || 'No disponible')}
                        </p>
                    </div>
                    ${renderModalSocialLinks(p.social)}
                </div>
                <div class="col-md-8">
                    <h6>Biografía</h6>
                    <p>${escapeHtml(p.bio || 'No disponible')}</p>
                    
                    <h6 class="mt-3">Educación</h6>
                    <ul class="list-unstyled">
                        ${renderList(p.educacion)}
                    </ul>
                    
                    <h6 class="mt-3">Publicaciones Destacadas</h6>
                    <ul class="list-unstyled">
                        ${renderList(p.publicaciones)}
                    </ul>
                    
                    <h6 class="mt-3">Proyectos de Investigación</h6>
                    <ul class="list-unstyled">
                        ${renderList(p.proyectos)}
                    </ul>
                </div>
            </div>
        `;
    }

    // ==================== FUNCIONES AUXILIARES ====================

    /**
     * Renderiza los iconos de redes sociales
     * @param {Object} social - Objeto con enlaces a redes sociales
     * @returns {string} HTML con los iconos
     */
    function renderSocialLinks(social = {}) {
        const icons = { 
            linkedin: 'bi-linkedin', 
            google_scholar: 'bi-google', 
            github: 'bi-github',
            researchgate: 'bi-journal-text',
            orcid: 'bi-person-badge'
        };
        
        return Object.entries(social)
            .map(([key, url]) => {
                if (!url) return '';
                return `<a href="${escapeHtml(url)}" 
                           class="me-2" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           title="${key}">
                    <i class="${icons[key] || 'bi-link-45deg'}"></i>
                </a>`;
            })
            .join('');
    }

    /**
     * Renderiza los enlaces sociales en el modal con más detalle
     * @param {Object} social - Objeto con enlaces a redes sociales
     * @returns {string} HTML con los enlaces
     */
    function renderModalSocialLinks(social = {}) {
        if (!social || Object.keys(social).length === 0) return '';
        
        const links = renderSocialLinks(social);
        if (!links) return '';
        
        return `
            <div class="mb-3">
                <h6>Redes Académicas</h6>
                <div class="social-links fs-4">
                    ${links}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una lista de elementos
     * @param {Array} items - Array de items a renderizar
     * @returns {string} HTML con la lista
     */
    function renderList(items) {
        if (!items || items.length === 0) {
            return '<li class="text-muted">No disponible</li>';
        }
        return items.map(item => `<li class="mb-2">${escapeHtml(item)}</li>`).join('');
    }

    /**
     * Convierte el código de área a su etiqueta legible
     * @param {string} area - Código del área
     * @returns {string} Etiqueta legible del área
     */
    function areaLabel(area) {
        const areaMap = {
            'fisica-teorica': 'Física Teórica',
            'fisica-experimental': 'Física Experimental',
            'nanotecnologia': 'Nanotecnología',
            'matematicas': 'Matemáticas',
            'computacion': 'Computación',
            'optica': 'Óptica',
            'astronomia': 'Astronomía',
            'fisica-aplicada': 'Física Aplicada'
        };
        return areaMap[area] || area;
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} unsafe - String no seguro
     * @returns {string} String escapado y seguro
     */
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString().replace(/[&<>"']/g, function(match) { 
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return escapeMap[match];
        });
    }
});