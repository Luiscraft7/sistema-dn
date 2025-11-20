let currentUser = null;

// Initialize dashboard
(async () => {
  currentUser = await api.checkAuth();
  if (!currentUser) return;

  // Set user name
  document.getElementById('userName').textContent = currentUser.nombre;

  // Show/hide nav links based on role
  if (currentUser.rol === 'dueño') {
    document.getElementById('linkCabinas')?.classList.remove('hidden');
    document.getElementById('linkUsuarios')?.classList.remove('hidden');
    loadDashboardDueno();
  } else {
    loadDashboardTrabajador();
  }
})();

// Dashboard para dueño
async function loadDashboardDueno() {
  const content = document.getElementById('dashboardContent');
  
  try {
    const negocios = await api.negocios.getAll();
    
    content.innerHTML = `
      <div class="grid grid-3">
        ${negocios.map(negocio => `
          <div class="card">
            <h2>${negocio.nombre}</h2>
            <button class="btn btn-primary" onclick="verTrabajos(${negocio.id})">
              Ver Trabajos
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="card">Error: ${error.message}</div>`;
  }
}

// Dashboard para trabajador
async function loadDashboardTrabajador() {
  const content = document.getElementById('dashboardContent');
  
  try {
    const trabajos = await api.trabajos.getAll({ negocioId: currentUser.negocioId });
    
    if (trabajos.length === 0) {
      content.innerHTML = `
        <div class="empty-message">
          <p>No hay trabajos pendientes</p>
          <button class="btn btn-primary" onclick="mostrarModalNuevoTrabajo()">+ Nuevo Trabajo</button>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="mb-2 flex justify-between items-center">
        <h2>Mis Trabajos</h2>
        <button class="btn btn-primary" onclick="mostrarModalNuevoTrabajo()">+ Nuevo Trabajo</button>
      </div>
      <div class="grid grid-2">
        ${trabajos.map(trabajo => `
          <div class="card">
            <div class="flex justify-between items-center mb-1">
              <h3>${trabajo.cliente.nombre}</h3>
              <span class="badge badge-${trabajo.estadoActual === 'pendiente' ? 'pending' : trabajo.estadoActual === 'en_proceso' ? 'progress' : 'completed'}">
                ${trabajo.estadoActual}
              </span>
            </div>
            <p>${trabajo.descripcion}</p>
            <p class="text-gray">₡${trabajo.precioEstimado || 0}</p>
            <div class="mt-2">
              ${trabajo.estadoActual === 'pendiente' ? `
                <button class="btn btn-small btn-primary" onclick="cambiarEstado(${trabajo.id}, 'en_proceso')">
                  Iniciar
                </button>
              ` : ''}
              ${trabajo.estadoActual === 'en_proceso' ? `
                <button class="btn btn-small btn-success" onclick="cambiarEstado(${trabajo.id}, 'completado')">
                  Completar
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="card">Error: ${error.message}</div>`;
  }
}

// Ver trabajos de un negocio
async function verTrabajos(negocioId) {
  window.location.href = `/trabajos.html?negocioId=${negocioId}`;
}

// Cambiar estado de trabajo
async function cambiarEstado(trabajoId, nuevoEstado) {
  try {
    await api.trabajos.updateEstado(trabajoId, { estado: nuevoEstado });
    // Reload
    if (currentUser.rol === 'dueño') {
      loadDashboardDueno();
    } else {
      loadDashboardTrabajador();
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Modal nuevo trabajo (simplificado)
function mostrarModalNuevoTrabajo() {
  alert('Funcionalidad de nuevo trabajo - por implementar en siguiente versión');
  // TODO: Implementar modal completo
}
