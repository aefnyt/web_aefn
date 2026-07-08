// Lightweight renderer for Investigación listing and group pages
(function(){
  async function fetchJSON(path){
    const res = await fetch(path);
    if(!res.ok) throw new Error('Failed to load ' + path);
    return await res.json();
  }

  async function fetchGroups(){ return await fetchJSON('data/investigation-groups.json'); }
  async function fetchTheses(){ return await fetchJSON('data/theses.json'); }
  async function fetchPapers(){ return await fetchJSON('data/papers.json'); }

  function createCard(group){
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 col-12 mb-4';

    col.innerHTML = `
      <div class="custom-block bg-white shadow-lg h-100">
        <a href="group.html?id=${encodeURIComponent(group.id)}" class="stretched-link text-decoration-none text-dark">
          <div class="p-3 text-center">
            <img src="${group.image}" alt="${group.title}" class="img-fluid mb-3" style="max-height:160px; object-fit:cover; width:100%;" />
            <h5 class="mb-2">${group.title}</h5>
            <p class="small text-muted">${group.short_description}</p>
            <p class="mt-2"><strong>Miembros:</strong> ${group.participants.map(p=>p.name).slice(0,3).join(', ')}${group.participants.length>3? ', ...':''}</p>
          </div>
        </a>
      </div>
    `;

    return col;
  }

  async function renderListing(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    try{
      const groups = await fetchGroups();
      const row = document.createElement('div');
      row.className = 'row';
      groups.forEach(g=> row.appendChild(createCard(g)));
      container.innerHTML = '';
      container.appendChild(row);
    }catch(e){
      container.innerHTML = '<p class="text-danger">No se pudo cargar la lista de grupos.</p>';
      console.error(e);
    }
  }

  // Render theses list
  async function renderTheses(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    try{
      const theses = await fetchTheses();
      if(!theses || theses.length===0){ container.innerHTML = '<p class="text-muted">No hay tesis registradas.</p>'; return; }
      const row = document.createElement('div'); row.className = 'row';
      theses.forEach(t => {
        const col = document.createElement('div'); col.className = 'col-lg-6 col-12 mb-4';
        col.innerHTML = `
          <div class="custom-block bg-white shadow-sm h-100 p-3">
            <h5>${t.title}</h5>
            <p class="small text-muted">Autor: ${t.author} — Año: ${t.year}</p>
            <p>${t.abstract || ''}</p>
            ${t.link ? `<p><a href="${t.link}" target="_blank" rel="noopener noreferrer">Ver documento</a></p>` : ''}
          </div>
        `;
        row.appendChild(col);
      });
      container.innerHTML = '';
      container.appendChild(row);
    }catch(e){ container.innerHTML = '<p class="text-danger">No se pudo cargar las tesis.</p>'; console.error(e); }
  }

  // Render papers list (published & in-progress)
  async function renderPapers(containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    try{
      const papers = await fetchPapers();
      if(!papers || papers.length===0){ container.innerHTML = '<p class="text-muted">No hay papers registrados.</p>'; return; }
      const row = document.createElement('div'); row.className = 'row';
      papers.forEach(p => {
        const col = document.createElement('div'); col.className = 'col-lg-6 col-12 mb-4';
        col.innerHTML = `
          <div class="custom-block bg-white shadow-sm h-100 p-3">
            <h5>${p.title}</h5>
            <p class="small text-muted">Autores: ${p.authors.join(', ')} — Año: ${p.year} ${p.published? '- Publicado':''}</p>
            <p>${p.abstract || ''}</p>
            ${p.link ? `<p><a href="${p.link}" target="_blank" rel="noopener noreferrer">Leer</a></p>` : ''}
          </div>
        `;
        row.appendChild(col);
      });
      container.innerHTML = '';
      container.appendChild(row);
    }catch(e){ container.innerHTML = '<p class="text-danger">No se pudo cargar los papers.</p>'; console.error(e); }
  }

  function renderGroupDetail(group, container){
    container.innerHTML = `
      <div class="row">
        <div class="col-lg-4 col-12 mb-4">
          <img src="${group.image}" alt="${group.title}" class="img-fluid rounded shadow-sm" />
          <p class="mt-3"><strong>Contacto:</strong> <a href="mailto:${group.contact_email}">${group.contact_email}</a></p>
        </div>
        <div class="col-lg-8 col-12">
          <h2>${group.title}</h2>
          <p class="lead">${group.short_description}</p>
          <p>${group.long_description}</p>

          <h5>Miembros</h5>
          <ul>
            ${group.participants.map(p=>`<li>${p.name} — <em>${p.role}</em></li>`).join('')}
          </ul>

          <h5>Proyectos</h5>
          <ul>
            ${group.projects.map(pr=>`<li>${pr.title} <small class="text-muted">(${pr.year})</small></li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  async function renderGroupFromQuery(containerId){
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById(containerId);
    if(!container) return;
    if(!id){ container.innerHTML = '<p class="text-muted">No se especificó el grupo.</p>'; return; }
    try{
      const groups = await fetchGroups();
      const group = groups.find(g=> g.id === id);
      if(!group){ container.innerHTML = '<p class="text-danger">Grupo no encontrado.</p>'; return; }
      renderGroupDetail(group, container);
    }catch(e){ console.error(e); container.innerHTML = '<p class="text-danger">Error cargando el grupo.</p>'; }
  }

  // Expose to global
  window.Investigation = {
    renderListing,
    renderGroupFromQuery,
    renderTheses,
    renderPapers
  };
})();
