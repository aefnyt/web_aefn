/**
 * Gallery Module
 * Maneja la galería de fotos con filtros y lightbox
 */

(function(){
  'use strict';

  window.Gallery = window.Gallery || {};

  let allAlbums = [];
  let currentFilter = 'all';
  let currentLightboxPhotos = [];
  let currentPhotoIndex = 0;

  /**
   * Inicializar la galería
   */
  function init() {
    loadGalleryData();
  }

  /**
   * Cargar datos de galería desde JSON
   */
  function loadGalleryData() {
    fetch('data/gallery.json')
      .then(resp => {
        if (!resp.ok) throw new Error('No se pudo cargar la galería');
        return resp.json();
      })
      .then(data => {
        allAlbums = data;
        renderFilters();
        renderGallery();
      })
      .catch(err => {
        console.error('Error cargando galería:', err);
        document.getElementById('galleryGrid').innerHTML = '<p class="no-photos">Error al cargar la galería</p>';
      });
  }

  /**
   * Renderizar botones de filtro
   */
  function renderFilters() {
    const container = document.getElementById('albumFilters');
    if (!container) return;

    container.innerHTML = '';

    // Botón "Todos"
    const allBtn = createFilterButton('all', 'Todos');
    container.appendChild(allBtn);

    // Obtener categorías únicas
    const categories = [...new Set(allAlbums.map(a => a.category))].sort();

    categories.forEach(category => {
      const btn = createFilterButton(category, category);
      container.appendChild(btn);
    });

    // Activar filtro actual
    updateActiveFilter();
  }

  /**
   * Crear botón de filtro
   */
  function createFilterButton(value, label) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-secondary gallery-filter-btn';
    btn.textContent = label;
    btn.dataset.filter = value;
    btn.addEventListener('click', function() {
      currentFilter = value;
      renderGallery();
      updateActiveFilter();
    });
    return btn;
  }

  /**
   * Actualizar estado del botón activo
   */
  function updateActiveFilter() {
    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
      if (btn.dataset.filter === currentFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Renderizar galería
   */
  function renderGallery() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;

    container.innerHTML = '';

    // Filtrar álbumes
    let filteredAlbums = allAlbums;
    if (currentFilter !== 'all') {
      filteredAlbums = allAlbums.filter(album => album.category === currentFilter);
    }

    if (filteredAlbums.length === 0) {
      container.innerHTML = '<p class="no-photos">No hay fotos en esta categoría</p>';
      return;
    }

    // Renderizar cada álbum
    filteredAlbums.forEach(album => {
      const albumSection = createAlbumSection(album);
      container.appendChild(albumSection);
    });
  }

  /**
   * Crear sección de álbum
   */
  function createAlbumSection(album) {
    const section = document.createElement('div');
    section.className = 'album-section w-100';

    // Grid de fotos del álbum (todas las fotos)
    const photosGrid = document.createElement('div');
    photosGrid.className = 'gallery-grid';
    photosGrid.style.gridColumn = '1 / -1';

    // Mostrar todas las fotos del álbum
    album.photos.forEach((photo, index) => {
      const item = createGalleryItem(photo, album.photos, album.album, index);
      photosGrid.appendChild(item);
    });

    section.appendChild(photosGrid);

    return section;
  }

  /**
   * Crear item de galería
   */
  function createGalleryItem(photo, albumPhotos, albumName, photoIndex) {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = photo.image;
    img.alt = photo.title;

    const overlay = document.createElement('div');
    overlay.className = 'gallery-item-overlay';
    overlay.innerHTML = '<i class="bi-zoom-in"></i>';

    const title = document.createElement('div');
    title.className = 'gallery-item-title';
    title.textContent = photo.title;

    item.appendChild(img);
    item.appendChild(title);
    item.appendChild(overlay);

    item.addEventListener('click', () => {
      openLightbox(albumPhotos, photoIndex);
    });

    return item;
  }

  /**
   * Abrir lightbox
   */
  function openLightbox(photos, index) {
    currentLightboxPhotos = photos;
    currentPhotoIndex = index;
    displayPhoto();
    document.getElementById('lightbox').classList.add('active');
  }

  /**
   * Cerrar lightbox
   */
  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
  }

  /**
   * Mostrar foto actual en lightbox
   */
  function displayPhoto() {
    if (currentLightboxPhotos.length === 0) return;

    const photo = currentLightboxPhotos[currentPhotoIndex];
    document.getElementById('lightboxImage').src = photo.image;
    document.getElementById('lightboxImage').alt = photo.title;
    document.getElementById('lightboxTitle').textContent = photo.title;
    document.getElementById('lightboxDescription').textContent = photo.description || 'Sin descripción';
    document.getElementById('lightboxCounter').textContent = 
      `${currentPhotoIndex + 1}/${currentLightboxPhotos.length}`;
  }

  /**
   * Ir a foto anterior
   */
  function prevImage() {
    currentPhotoIndex = (currentPhotoIndex - 1 + currentLightboxPhotos.length) % currentLightboxPhotos.length;
    displayPhoto();
  }

  /**
   * Ir a foto siguiente
   */
  function nextImage() {
    currentPhotoIndex = (currentPhotoIndex + 1) % currentLightboxPhotos.length;
    displayPhoto();
  }

  /**
   * Cerrar lightbox con tecla Escape
   */
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      prevImage();
    } else if (event.key === 'ArrowRight') {
      nextImage();
    }
  });

  // Exponer funciones públicas
  window.Gallery.init = init;
  window.closeLightbox = closeLightbox;
  window.prevImage = prevImage;
  window.nextImage = nextImage;

})();
