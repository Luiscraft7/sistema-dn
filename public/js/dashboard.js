// dashboard.js - Lógica completa del Dashboard
// API se carga globalmente desde api.js

// Estado global de la aplicación
const state = {
  user: null,
  negocios: [],
  clientes: [],
  trabajos: [],
  usuarios: [],
  selectedNegocio: null,
  pollingInterval: null
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar que existe token
  if (!API.checkAuth()) {
    window.location.href = '/login.html';
    return;
  }

  try {
    // Verificar autenticación con el servidor
    const userData = await API.verifyAuth();
    
    if (!userData) {
      // Token inválido o expirado
      window.location.href = '/login.html';
      return;
    }
    
    state.user = userData;
    
    // Cargar negocios
    state.negocios = await API.negocios.getAll();
    
    // Renderizar UI inicial
    renderNavbar();
    renderDashboard();
    
    // Iniciar polling para actualizaciones automáticas
    startPolling();
    
  } catch (error) {
    console.error('Error al inicializar:', error);
    // En caso de error, limpiar y redirigir
    API.removeToken();
    window.location.href = '/login.html';
  }
});

// ============================================
// NAVBAR
// ============================================
function renderNavbar() {
  const navbarUser = document.getElementById('navbarUser');
  const navbarRole = document.getElementById('navbarRole');
  const logoutBtn = document.getElementById('logoutBtn');

  navbarUser.textContent = state.user.nombre;
  navbarRole.textContent = state.user.rol;
  navbarRole.className = `badge badge-${state.user.rol === 'dueño' ? 'success' : 'info'}`;

  logoutBtn.addEventListener('click', logout);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
function renderDashboard() {
  const dashboardContent = document.getElementById('dashboardContent');
  
  if (state.user.rol === 'dueño') {
    dashboardContent.innerHTML = renderDuenoDashboard();
    initDuenoHandlers();
  } else {
    dashboardContent.innerHTML = renderTrabajadorDashboard();
    initTrabajadorHandlers();
  }
}

// Dashboard del Dueño
function renderDuenoDashboard() {
  return `
    <div class="dashboard-header">
      <h1>Dashboard - Todos los Negocios</h1>
      <div class="dashboard-actions">
        <button class="btn btn-primary" onclick="window.dashboardApp.showModal('nuevoTrabajo')">
          ➕ Nuevo Trabajo
        </button>
        <button class="btn btn-secondary" onclick="window.dashboardApp.showModal('gestionUsuarios')">
          👥 Gestión de Usuarios
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-section card">
      <div class="filters-grid">
        <div class="form-group">
          <label class="form-label">Negocio</label>
          <select id="filterNegocio" class="form-input">
            <option value="">Todos los negocios</option>
            ${state.negocios.map(n => `<option value="${n.id}">${n.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select id="filterEstado" class="form-input">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="form-group">
          <button class="btn btn-primary" onclick="window.dashboardApp.applyFilters()">
            🔍 Filtrar
          </button>
        </div>
      </div>
    </div>

    <!-- Grid de trabajos por negocio -->
    <div id="trabajosGrid" class="negocios-grid">
      ${state.negocios.map(negocio => `
        <div class="negocio-section card">
          <h2>${negocio.nombre}</h2>
          <div id="trabajos-${negocio.id}" class="trabajos-list">
            <p class="text-muted">Cargando trabajos...</p>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Modales -->
    ${renderModalNuevoTrabajo()}
    ${renderModalGestionUsuarios()}
    ${renderModalEditarTrabajo()}
  `;
}

// Dashboard del Trabajador
function renderTrabajadorDashboard() {
  const negocio = state.negocios.find(n => n.id === state.user.negocioId);
  
  return `
    <div class="dashboard-header">
      <h1>Dashboard - ${negocio ? negocio.nombre : 'Sin negocio asignado'}</h1>
      <div class="dashboard-actions">
        <button class="btn btn-primary" onclick="window.dashboardApp.showModal('nuevoTrabajo')">
          ➕ Nuevo Trabajo
        </button>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-value" id="statPendientes">0</div>
        <div class="stat-label">Pendientes</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value" id="statEnProceso">0</div>
        <div class="stat-label">En Proceso</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value" id="statCompletados">0</div>
        <div class="stat-label">Completados Hoy</div>
      </div>
    </div>

    <!-- Lista de trabajos -->
    <div class="card">
      <h2>Trabajos Activos</h2>
      <div id="trabajosList" class="trabajos-list">
        <p class="text-muted">Cargando trabajos...</p>
      </div>
    </div>

    <!-- Modales -->
    ${renderModalNuevoTrabajo()}
    ${renderModalEditarTrabajo()}
  `;
}

// ============================================
// MODALES
// ============================================
function renderModalNuevoTrabajo() {
  const isCabinas = state.user.negocioId === state.negocios.find(n => n.nombre === 'Cabinas')?.id;
  
  return `
    <div id="modalNuevoTrabajo" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Nuevo Trabajo</h2>
          <button class="modal-close" onclick="window.dashboardApp.closeModal('nuevoTrabajo')">&times;</button>
        </div>
        <form id="formNuevoTrabajo" class="modal-body">
          ${state.user.rol === 'dueño' ? `
            <div class="form-group">
              <label class="form-label">Negocio *</label>
              <select id="trabajoNegocio" class="form-input" required>
                <option value="">Seleccionar negocio</option>
                ${state.negocios.map(n => `<option value="${n.id}">${n.nombre}</option>`).join('')}
              </select>
            </div>
          ` : ''}
          
          <div class="form-group">
            <label class="form-label">Cliente *</label>
            <select id="trabajoCliente" class="form-input" required>
              <option value="">Seleccionar cliente</option>
            </select>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.dashboardApp.showModal('nuevoCliente')" style="margin-top: 0.5rem;">
              ➕ Nuevo Cliente
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción del Trabajo *</label>
            <textarea id="trabajoDescripcion" class="form-input" rows="3" required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Precio Estimado</label>
            <input type="number" id="trabajoPrecio" class="form-input" step="0.01" min="0">
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.dashboardApp.closeModal('nuevoTrabajo')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Crear Trabajo
            </button>
          </div>
        </form>
      </div>
    </div>

    ${renderModalNuevoCliente()}
  `;
}

function renderModalNuevoCliente() {
  const negocioId = state.user.negocioId || document.getElementById('trabajoNegocio')?.value;
  const isCabinas = negocioId && state.negocios.find(n => n.id === parseInt(negocioId))?.nombre === 'Cabinas';
  
  return `
    <div id="modalNuevoCliente" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Nuevo Cliente</h2>
          <button class="modal-close" onclick="window.dashboardApp.closeModal('nuevoCliente')">&times;</button>
        </div>
        <form id="formNuevoCliente" class="modal-body">
          ${isCabinas ? `
            <div class="form-group">
              <label class="form-label">Cédula *</label>
              <input type="text" id="clienteCedula" class="form-input" required>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">Nombre *</label>
            <input type="text" id="clienteNombre" class="form-input" required>
          </div>

          ${isCabinas ? `
            <div class="form-group">
              <label class="form-label">Edad *</label>
              <input type="number" id="clienteEdad" class="form-input" min="1" max="120" required>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input type="tel" id="clienteTelefono" class="form-input">
          </div>

          <div class="form-group">
            <label class="form-label">Nota Extra</label>
            <textarea id="clienteNota" class="form-input" rows="2"></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.dashboardApp.closeModal('nuevoCliente')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderModalEditarTrabajo() {
  return `
    <div id="modalEditarTrabajo" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Editar Trabajo</h2>
          <button class="modal-close" onclick="window.dashboardApp.closeModal('editarTrabajo')">&times;</button>
        </div>
        <div class="modal-body">
          <div id="editarTrabajoContent"></div>
        </div>
      </div>
    </div>
  `;
}

function renderModalGestionUsuarios() {
  return `
    <div id="modalGestionUsuarios" class="modal">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>👥 Gestión de Usuarios</h2>
          <button class="modal-close" onclick="window.dashboardApp.closeModal('gestionUsuarios')">&times;</button>
        </div>
        <div class="modal-body">
          <button class="btn btn-primary" onclick="window.dashboardApp.showModal('nuevoUsuario')" style="margin-bottom: 1rem;">
            ➕ Nuevo Usuario
          </button>
          <div id="usuariosList">
            <p class="text-muted">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    </div>

    ${renderModalNuevoUsuario()}
  `;
}

function renderModalNuevoUsuario() {
  return `
    <div id="modalNuevoUsuario" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>➕ Nuevo Usuario</h2>
          <button class="modal-close" onclick="window.dashboardApp.closeModal('nuevoUsuario')">&times;</button>
        </div>
        <form id="formNuevoUsuario" class="modal-body">
          <div class="form-group">
            <label class="form-label">Nombre Completo *</label>
            <input type="text" id="usuarioNombre" class="form-input" required>
          </div>

          <div class="form-group">
            <label class="form-label">Usuario *</label>
            <input type="text" id="usuarioUsername" class="form-input" required>
          </div>

          <div class="form-group">
            <label class="form-label">Contraseña *</label>
            <input type="password" id="usuarioPassword" class="form-input" required minlength="6">
          </div>

          <div class="form-group">
            <label class="form-label">Rol *</label>
            <select id="usuarioRol" class="form-input" required onchange="window.dashboardApp.toggleNegocioField()">
              <option value="">Seleccionar rol</option>
              <option value="dueño">Dueño</option>
              <option value="trabajador">Trabajador</option>
            </select>
          </div>

          <div class="form-group" id="usuarioNegocioGroup" style="display: none;">
            <label class="form-label">Negocio Asignado *</label>
            <select id="usuarioNegocio" class="form-input">
              <option value="">Seleccionar negocio</option>
              ${state.negocios.map(n => `<option value="${n.id}">${n.nombre}</option>`).join('')}
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="window.dashboardApp.closeModal('nuevoUsuario')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ============================================
// HANDLERS E INICIALIZACIÓN
// ============================================
function initDuenoHandlers() {
  loadAllTrabajos();
  
  const filterNegocio = document.getElementById('filterNegocio');
  const filterEstado = document.getElementById('filterEstado');
  
  if (filterNegocio) {
    filterNegocio.addEventListener('change', loadAllTrabajos);
  }
  if (filterEstado) {
    filterEstado.addEventListener('change', loadAllTrabajos);
  }

  // Form handlers
  setupFormHandlers();
}

function initTrabajadorHandlers() {
  loadTrabajadorTrabajos();
  setupFormHandlers();
}

function setupFormHandlers() {
  // Nuevo Trabajo
  const formNuevoTrabajo = document.getElementById('formNuevoTrabajo');
  if (formNuevoTrabajo) {
    formNuevoTrabajo.addEventListener('submit', handleNuevoTrabajo);
    
    // Cargar clientes cuando cambia el negocio
    const trabajoNegocio = document.getElementById('trabajoNegocio');
    if (trabajoNegocio) {
      trabajoNegocio.addEventListener('change', loadClientesForTrabajo);
    } else {
      // Si es trabajador, cargar clientes de su negocio
      loadClientesForTrabajo();
    }
  }

  // Nuevo Cliente
  const formNuevoCliente = document.getElementById('formNuevoCliente');
  if (formNuevoCliente) {
    formNuevoCliente.addEventListener('submit', handleNuevoCliente);
  }

  // Nuevo Usuario
  const formNuevoUsuario = document.getElementById('formNuevoUsuario');
  if (formNuevoUsuario) {
    formNuevoUsuario.addEventListener('submit', handleNuevoUsuario);
  }
}

// ============================================
// CARGAR DATOS
// ============================================
async function loadAllTrabajos() {
  const filterNegocio = document.getElementById('filterNegocio')?.value;
  const filterEstado = document.getElementById('filterEstado')?.value;

  try {
    const params = {};
    if (filterNegocio) params.negocioId = filterNegocio;
    if (filterEstado) params.estado = filterEstado;

    state.trabajos = await API.trabajos.getAll(params);

    // Agrupar por negocio
    state.negocios.forEach(negocio => {
      const trabajosNegocio = state.trabajos.filter(t => t.negocioId === negocio.id);
      const container = document.getElementById(`trabajos-${negocio.id}`);
      if (container) {
        container.innerHTML = renderTrabajosList(trabajosNegocio);
      }
    });
  } catch (error) {
    console.error('Error al cargar trabajos:', error);
  }
}

async function loadTrabajadorTrabajos() {
  try {
    state.trabajos = await API.trabajos.getAll({ negocioId: state.user.negocioId });
    
    // Actualizar estadísticas
    updateStats();
    
    // Renderizar lista
    const container = document.getElementById('trabajosList');
    if (container) {
      container.innerHTML = renderTrabajosList(state.trabajos);
    }
  } catch (error) {
    console.error('Error al cargar trabajos:', error);
  }
}

function updateStats() {
  const pendientes = state.trabajos.filter(t => t.estadoActual === 'pendiente').length;
  const enProceso = state.trabajos.filter(t => t.estadoActual === 'en_proceso').length;
  const completadosHoy = state.trabajos.filter(t => {
    if (t.estadoActual !== 'completado') return false;
    const hoy = new Date().toDateString();
    const fecha = new Date(t.fechaFinalizacion).toDateString();
    return hoy === fecha;
  }).length;

  document.getElementById('statPendientes').textContent = pendientes;
  document.getElementById('statEnProceso').textContent = enProceso;
  document.getElementById('statCompletados').textContent = completadosHoy;
}

async function loadClientesForTrabajo() {
  const negocioId = state.user.rol === 'dueño' 
    ? document.getElementById('trabajoNegocio')?.value 
    : state.user.negocioId;

  if (!negocioId) return;

  const negocio = state.negocios.find(n => n.id === parseInt(negocioId));
  const isCabinas = negocio?.nombre === 'Cabinas';

  try {
    state.clientes = isCabinas 
      ? await API.clientes.getCabinas()
      : await API.clientes.getAll();

    const select = document.getElementById('trabajoCliente');
    if (select) {
      select.innerHTML = '<option value="">Seleccionar cliente</option>' +
        state.clientes.map(c => `
          <option value="${c.id}">
            ${c.nombre}${c.cedula ? ` - ${c.cedula}` : ''}${c.telefono ? ` (${c.telefono})` : ''}
          </option>
        `).join('');
    }
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
}

// ============================================
// RENDERIZAR TRABAJOS
// ============================================
function renderTrabajosList(trabajos) {
  if (!trabajos || trabajos.length === 0) {
    return '<p class="text-muted">No hay trabajos para mostrar</p>';
  }

  return trabajos.map(trabajo => `
    <div class="trabajo-card card">
      <div class="trabajo-header">
        <h3>${trabajo.cliente.nombre}</h3>
        <span class="badge badge-${getEstadoBadgeClass(trabajo.estadoActual)}">
          ${formatEstado(trabajo.estadoActual)}
        </span>
      </div>
      <p class="trabajo-descripcion">${trabajo.descripcion}</p>
      <div class="trabajo-footer">
        <span class="text-muted">${formatFecha(trabajo.fechaCreacion)}</span>
        ${trabajo.precioEstimado ? `<span class="trabajo-precio">$${trabajo.precioEstimado.toFixed(2)}</span>` : ''}
      </div>
      <div class="trabajo-actions">
        ${renderEstadoButtons(trabajo)}
      </div>
    </div>
  `).join('');
}

function renderEstadoButtons(trabajo) {
  const buttons = [];

  if (trabajo.estadoActual === 'pendiente') {
    buttons.push(`<button class="btn btn-sm btn-info" onclick="window.dashboardApp.cambiarEstado(${trabajo.id}, 'en_proceso')">▶️ Iniciar</button>`);
  }

  if (trabajo.estadoActual === 'en_proceso') {
    buttons.push(`<button class="btn btn-sm btn-success" onclick="window.dashboardApp.cambiarEstado(${trabajo.id}, 'completado')">✅ Completar</button>`);
  }

  if (trabajo.estadoActual !== 'cancelado' && trabajo.estadoActual !== 'completado') {
    buttons.push(`<button class="btn btn-sm btn-danger" onclick="window.dashboardApp.cambiarEstado(${trabajo.id}, 'cancelado')">❌ Cancelar</button>`);
  }

  buttons.push(`<button class="btn btn-sm btn-secondary" onclick="window.dashboardApp.verDetalle(${trabajo.id})">👁️ Ver</button>`);

  return buttons.join('');
}

// ============================================
// FORM HANDLERS
// ============================================
async function handleNuevoTrabajo(e) {
  e.preventDefault();

  const negocioId = state.user.rol === 'dueño' 
    ? document.getElementById('trabajoNegocio').value 
    : state.user.negocioId;
  
  const clienteId = document.getElementById('trabajoCliente').value;
  const descripcion = document.getElementById('trabajoDescripcion').value;
  const precioEstimado = document.getElementById('trabajoPrecio').value;

  try {
    await API.trabajos.create({
      negocioId: parseInt(negocioId),
      clienteId: parseInt(clienteId),
      descripcion,
      precioEstimado: precioEstimado ? parseFloat(precioEstimado) : null
    });

    closeModal('nuevoTrabajo');
    e.target.reset();
    
    // Recargar trabajos
    if (state.user.rol === 'dueño') {
      await loadAllTrabajos();
    } else {
      await loadTrabajadorTrabajos();
    }

    showNotification('Trabajo creado exitosamente', 'success');
  } catch (error) {
    showNotification(error.message || 'Error al crear trabajo', 'error');
  }
}

async function handleNuevoCliente(e) {
  e.preventDefault();

  const negocioId = state.user.negocioId || document.getElementById('trabajoNegocio')?.value;
  const isCabinas = state.negocios.find(n => n.id === parseInt(negocioId))?.nombre === 'Cabinas';

  const clienteData = {
    nombre: document.getElementById('clienteNombre').value,
    telefono: document.getElementById('clienteTelefono').value,
    nota: document.getElementById('clienteNota').value,
    esCabina: isCabinas ? 1 : 0
  };

  if (isCabinas) {
    clienteData.cedula = document.getElementById('clienteCedula').value;
    clienteData.edad = parseInt(document.getElementById('clienteEdad').value);
  }

  try {
    const nuevoCliente = await API.clientes.create(clienteData);
    
    closeModal('nuevoCliente');
    e.target.reset();
    
    // Recargar clientes y seleccionar el nuevo
    await loadClientesForTrabajo();
    document.getElementById('trabajoCliente').value = nuevoCliente.id;

    showNotification('Cliente creado exitosamente', 'success');
  } catch (error) {
    showNotification(error.message || 'Error al crear cliente', 'error');
  }
}

async function handleNuevoUsuario(e) {
  e.preventDefault();

  const rol = document.getElementById('usuarioRol').value;
  const negocioId = rol === 'trabajador' ? document.getElementById('usuarioNegocio').value : null;

  const usuarioData = {
    nombre: document.getElementById('usuarioNombre').value,
    username: document.getElementById('usuarioUsername').value,
    password: document.getElementById('usuarioPassword').value,
    rol,
    negocioId: negocioId ? parseInt(negocioId) : null
  };

  try {
    await API.usuarios.create(usuarioData);
    
    closeModal('nuevoUsuario');
    e.target.reset();
    
    await loadUsuarios();

    showNotification('Usuario creado exitosamente', 'success');
  } catch (error) {
    showNotification(error.message || 'Error al crear usuario', 'error');
  }
}

async function loadUsuarios() {
  try {
    state.usuarios = await API.usuarios.getAll();
    
    const container = document.getElementById('usuariosList');
    if (container) {
      container.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Negocio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${state.usuarios.map(u => `
              <tr>
                <td>${u.nombre}</td>
                <td>${u.username}</td>
                <td><span class="badge badge-${u.rol === 'dueño' ? 'success' : 'info'}">${u.rol}</span></td>
                <td>${u.negocio ? u.negocio.nombre : '-'}</td>
                <td><span class="badge badge-${u.activo ? 'success' : 'danger'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button class="btn btn-sm btn-${u.activo ? 'danger' : 'success'}" 
                    onclick="window.dashboardApp.toggleUsuario(${u.id}, ${!u.activo})">
                    ${u.activo ? '🔒 Desactivar' : '🔓 Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
  }
}

// ============================================
// ACCIONES
// ============================================
async function cambiarEstado(trabajoId, nuevoEstado) {
  const nota = prompt(`Nota para el cambio a "${formatEstado(nuevoEstado)}":`);
  
  try {
    await API.trabajos.updateEstado(trabajoId, {
      estado: nuevoEstado,
      nota: nota || null
    });

    // Recargar trabajos
    if (state.user.rol === 'dueño') {
      await loadAllTrabajos();
    } else {
      await loadTrabajadorTrabajos();
    }

    showNotification('Estado actualizado exitosamente', 'success');
  } catch (error) {
    showNotification(error.message || 'Error al actualizar estado', 'error');
  }
}

async function toggleUsuario(usuarioId, activo) {
  try {
    await API.usuarios.update(usuarioId, { activo });
    await loadUsuarios();
    showNotification(`Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
  } catch (error) {
    showNotification(error.message || 'Error al actualizar usuario', 'error');
  }
}

function verDetalle(trabajoId) {
  const trabajo = state.trabajos.find(t => t.id === trabajoId);
  if (!trabajo) return;

  alert(`
Trabajo #${trabajo.id}
Cliente: ${trabajo.cliente.nombre}
${trabajo.cliente.telefono ? `Teléfono: ${trabajo.cliente.telefono}\n` : ''}
Descripción: ${trabajo.descripcion}
Estado: ${formatEstado(trabajo.estadoActual)}
Precio: ${trabajo.precioEstimado ? `$${trabajo.precioEstimado.toFixed(2)}` : 'No especificado'}
Fecha: ${formatFecha(trabajo.fechaCreacion)}
  `);
}

// ============================================
// UTILIDADES
// ============================================
function showModal(modalId) {
  const modal = document.getElementById(`modal${capitalize(modalId)}`);
  if (modal) {
    modal.style.display = 'flex';
    
    // Cargar datos específicos del modal
    if (modalId === 'gestionUsuarios') {
      loadUsuarios();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(`modal${capitalize(modalId)}`);
  if (modal) {
    modal.style.display = 'none';
  }
}

function toggleNegocioField() {
  const rol = document.getElementById('usuarioRol').value;
  const negocioGroup = document.getElementById('usuarioNegocioGroup');
  const negocioSelect = document.getElementById('usuarioNegocio');
  
  if (rol === 'trabajador') {
    negocioGroup.style.display = 'block';
    negocioSelect.required = true;
  } else {
    negocioGroup.style.display = 'none';
    negocioSelect.required = false;
  }
}

function applyFilters() {
  loadAllTrabajos();
}

function showNotification(message, type = 'info') {
  // Simple alert por ahora, puedes mejorarlo con un toast
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  alert(`${icon} ${message}`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatEstado(estado) {
  const estados = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'completado': 'Completado',
    'cancelado': 'Cancelado'
  };
  return estados[estado] || estado;
}

function getEstadoBadgeClass(estado) {
  const classes = {
    'pendiente': 'warning',
    'en_proceso': 'info',
    'completado': 'success',
    'cancelado': 'danger'
  };
  return classes[estado] || 'secondary';
}

function formatFecha(fecha) {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================
// POLLING
// ============================================
function startPolling() {
  // Actualizar cada 15 segundos
  state.pollingInterval = setInterval(() => {
    if (state.user.rol === 'dueño') {
      loadAllTrabajos();
    } else {
      loadTrabajadorTrabajos();
    }
  }, 15000);
}

// Limpiar interval al salir
window.addEventListener('beforeunload', () => {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
  }
});

// Exportar funciones al scope global para onclick handlers
window.dashboardApp = {
  showModal,
  closeModal,
  cambiarEstado,
  toggleUsuario,
  verDetalle,
  applyFilters,
  toggleNegocioField
};
