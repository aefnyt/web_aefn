/**
 * Sistema de Botones "Agregar Entrada"
 * Muestra botones para agregar contenido via Pull Request
 */

(function(){
  'use strict';

  window.PermissionsManager = window.PermissionsManager || {};

  const DATA_FILE_MAP = {
    'clubes': 'data/clubes.json',
    'eventos': 'data/events.json',
    'profesores': 'data/profesores.json',
    'grupos': 'data/investigation-groups.json',
    'tesis': 'data/theses.json',
    'papers': 'data/papers.json'
  };

  /**
   * Asegurar que el modal tutorial existe en la página
   */
  function ensureTutorialModal() {
    if (document.getElementById('tutorialModal')) return;

    const modalHTML = `
    <div class="modal fade" id="tutorialModal" tabindex="-1" aria-labelledby="tutorialTitle" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="tutorialTitle">
              <i class="bi-git me-2"></i>Cómo Agregar Nuevas Entradas
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p class="lead">Sigue estos pasos para agregar nuevas entradas al sitio:</p>
            
            <div class="accordion" id="tutorialAccordion">
              <!-- Paso 1 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#paso1">
                    1. Bifurcar (Fork) el Repositorio
                  </button>
                </h2>
                <div id="paso1" class="accordion-collapse collapse show" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <ol>
                      <li>Ve a <a href="https://github.com/DaVas1410/web_aefn" target="_blank">GitHub - web_aefn</a></li>
                      <li>Haz clic en el botón <strong>"Fork"</strong> (arriba a la derecha)</li>
                      <li>Se creará una copia del repositorio en tu cuenta</li>
                    </ol>
                  </div>
                </div>
              </div>

              <!-- Paso 2 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#paso2">
                    2. Editar el Archivo JSON
                  </button>
                </h2>
                <div id="paso2" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <p><strong>Ubica el archivo a editar en tu fork:</strong></p>
                    <ul id="dataFilesList">
                      <li><code>data/clubes.json</code> → para agregar clubes</li>
                      <li><code>data/events.json</code> → para agregar eventos</li>
                      <li><code>data/profesores.json</code> → para agregar profesores</li>
                      <li><code>data/investigation-groups.json</code> → para grupos de investigación</li>
                      <li><code>data/theses.json</code> → para tesis</li>
                      <li><code>data/papers.json</code> → para papers</li>
                    </ul>
                    <p><strong>Haz clic en el lápiz</strong> <i class="bi-pencil"></i> para editar</p>
                  </div>
                </div>
              </div>

              <!-- Paso 3 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#paso3">
                    3. Agregar tu Entrada
                  </button>
                </h2>
                <div id="paso3" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <p><strong>Ejemplo para agregar tu entrada en JSON:</strong></p>
                    <pre><code id="exampleCode" class="bg-light p-2">{
  "id": "nueva-entrada",
  "nombre": "Nombre",
  "descripcion": "Descripción corta",
  ...
}</code></pre>
                    <p class="small text-muted mt-2">Copia el formato de otra entrada y edita los valores</p>
                    <p><strong>Consulta <a href="CONTRIBUTING.md" target="_blank">CONTRIBUTING.md</a> para ver todos los formatos JSON</strong></p>
                  </div>
                </div>
              </div>

              <!-- Paso 4 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#paso4">
                    4. Guardar Cambios
                  </button>
                </h2>
                <div id="paso4" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <ol>
                      <li>Desplázate al final de la página</li>
                      <li>En <strong>"Commit changes"</strong>, escribe un mensaje descriptivo:
                        <br><code>feat: Agregar nueva entrada</code>
                      </li>
                      <li>Selecciona <strong>"Create a new branch"</strong></li>
                      <li>Haz clic en <strong>"Commit changes"</strong></li>
                    </ol>
                  </div>
                </div>
              </div>

              <!-- Paso 5 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#paso5">
                    5. Crear una Pull Request (PR)
                  </button>
                </h2>
                <div id="paso5" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <ol>
                      <li>Vuelve a tu repositorio fork</li>
                      <li>Verás un botón <strong>"Compare & pull request"</strong></li>
                      <li>Haz clic en él</li>
                      <li>Revisa que los cambios sean correctos</li>
                      <li>Haz clic en <strong>"Create pull request"</strong></li>
                    </ol>
                    <p class="small text-muted mt-2">Tu PR será revisada y aprobada ✅</p>
                  </div>
                </div>
              </div>

              <!-- Paso 6 -->
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#paso6">
                    ✅ ¡Listo! Tu cambio está publicado
                  </button>
                </h2>
                <div id="paso6" class="accordion-collapse collapse" data-bs-parent="#tutorialAccordion">
                  <div class="accordion-body">
                    <p>Una vez que el administrador aprueba tu PR, los cambios se publican automáticamente en GitHub Pages.</p>
                    <p><strong>¡Tu nueva entrada aparecerá en el sitio web! 🎉</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div class="alert alert-info mt-4 mb-0">
              <i class="bi-info-circle me-2"></i>
              <strong>¿Necesitas ayuda?</strong> 
              <a href="https://docs.github.com/es/get-started/using-git" target="_blank">Aprende más sobre Git y GitHub</a>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <a href="https://github.com/DaVas1410/web_aefn" target="_blank" class="btn custom-btn">
              <i class="bi-github me-1"></i>Ir al Repositorio
            </a>
          </div>
        </div>
      </div>
    </div>
    `;

    const main = document.querySelector('main') || document.body;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHTML;
    main.appendChild(tempDiv.firstElementChild);
  }

  /**
   * Crea un botón "Agregar Entrada" mejorado
   */
  function createAddButton(zone, label) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-add-entry btn-lg';
    btn.innerHTML = `
      <i class="bi bi-plus-circle"></i>
      <span>${label}</span>
    `;
    btn.setAttribute('data-bs-toggle', 'modal');
    btn.setAttribute('data-bs-target', '#tutorialModal');
    btn.dataset.zone = zone;
    btn.style.cursor = 'pointer';

    return btn;
  }

  /**
   * Inyecta botones de agregar en el HTML
   */
  function injectAddButton(zone, label, containerId) {
    // Asegurar que el modal exista
    ensureTutorialModal();

    const container = document.getElementById(containerId);
    if (!container) return;

    const btn = createAddButton(zone, label);
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-5 text-center add-entry-container';
    wrapper.dataset.zone = zone;
    wrapper.appendChild(btn);

    // Insertar al inicio del contenedor
    if (container.parentNode) {
      container.parentNode.insertBefore(wrapper, container);
    } else {
      container.insertBefore(wrapper, container.firstChild);
    }
  }

  // Exponer funciones públicas
  window.PermissionsManager.injectAddButton = injectAddButton;
  window.PermissionsManager.createAddButton = createAddButton;

})();
