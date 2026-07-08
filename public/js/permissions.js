/**
 * Botones "Agregar Entrada" para páginas públicas
 * ===========================================
 * Inyecta botones que llevan al panel de administración web.
 */

(function(){
  'use strict';

  window.PermissionsManager = window.PermissionsManager || {};

  const SECTION_TO_MODULE = {
    'clubes': 'clubes',
    'eventos': 'eventos',
    'profesores': 'profesores',
    'grupos': 'grupos',
    'investigacion': 'grupos',
    'tesis': 'grupos',
    'papers': 'grupos',
    'noticias': 'noticias',
    'galeria': 'galeria'
  };

  /**
   * Inyecta un botón que lleva al panel de administración.
   */
  window.PermissionsManager.injectAddButton = function(section, buttonText, containerId) {
    const module = SECTION_TO_MODULE[section] || '';
    const url = module ? '/admin/' + module : '/admin';

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const link = document.createElement('a');
    link.href = url;
    link.className = 'btn custom-btn';
    link.innerHTML = buttonText || 'Agregar';
    link.style.cursor = 'pointer';

    container.appendChild(link);
  };

  window.PermissionsManager.goToAdmin = function(section) {
    const module = SECTION_TO_MODULE[section] || '';
    const url = module ? '/admin/' + module : '/admin';
    window.location.href = url;
  };

})();
