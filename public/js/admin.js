// Admin Dashboard App
const adminApp = {
  negocios: [],
  usuarios: [],
  trabajos: [],
  clientes: [],
  pollingInterval: null,

  async init() {
    // Verificar token
    if (!API.checkAuth()) {
      window.location.href = '/login.html';
      return;
    }

    // Verificar con servidor
    const userData = await API.verifyAuth();
    if (!userData) {
      window.location.href = '/login.html';
      return;
    }

    // Verificar que sea dueño
    if (userData.rol !== 'dueno') {
      alert('No tienes permisos de administrador');
      
      // Redirigir al trabajador a su negocio correspondiente
      if (userData.rol === 'trabajador' && userData.negocioId) {
        const negocios = await API.negocios.getAll();
        const negocio = negocios.find(n => n.id === userData.negocioId);
        
        if (negocio) {
          if (negocio.nombre === 'Cabinas') {
            window.location.href = '/cabinas.html';
          } else if (negocio.nombre === 'Impresión') {
            window.location.href = '/impresion.html';
          } else if (negocio.nombre === 'Lavacar') {
            window.location.href = '/lavacar.html';
          } else {
            window.location.href = '/login.html';
          }
        } else {
          window.location.href = '/login.html';
        }
      } else {
        window.location.href = '/login.html';
      }
      return;
    }

    // Actualizar navbar
    document.getElementById('navbarUser').textContent = userData.nombreCompleto || userData.usuario;

    // Cargar datos iniciales
    await this.loadAll();

    // Setup event listeners
    this.setupEventListeners();

    // Iniciar polling
    this.startPolling();
  },

  async loadAll() {
    await Promise.all([
      this.loadNegocios(),
      this.loadUsuarios(),
      this.loadTrabajos(),
      this.loadClientes()
    ]);
    this.updateStats();
    this.renderNegocios();
    this.renderUsuarios();
    this.renderTrabajosResumen();
  },

  async loadNegocios() {
    try {
      this.negocios = await API.negocios.getAll();
    } catch (error) {
      console.error('Error cargando negocios:', error);
    }
  },

  async loadUsuarios() {
    try {
      this.usuarios = await API.usuarios.getAll();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  },

  async loadTrabajos() {
    try {
      this.trabajos = await API.trabajos.getAll();
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    }
  },

  async loadClientes() {
    try {
      this.clientes = await API.clientes.getAll();
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  },

  updateStats() {
    // Total negocios
    document.getElementById('totalNegocios').textContent = this.negocios.length;

    // Total usuarios activos
    const usuariosActivos = this.usuarios.filter(u => u.activo).length;
    document.getElementById('totalUsuarios').textContent = usuariosActivos;

    // Trabajos activos (pendientes + en proceso)
    const trabajosActivos = this.trabajos.filter(t => 
      t.estado === 'pendiente' || t.estado === 'en_proceso'
    ).length;
    document.getElementById('totalTrabajos').textContent = trabajosActivos;

    // Ingresos hoy (trabajos completados)
    const hoy = new Date().toISOString().split('T')[0];
    const ingresosHoy = this.trabajos
      .filter(t => {
        if (t.estado !== 'completado' || !t.precioEstimado) return false;
        const fecha = t.fechaCompletado?.split('T')[0];
        return fecha === hoy;
      })
      .reduce((sum, t) => sum + parseFloat(t.precioEstimado || 0), 0);
    
    document.getElementById('totalIngresos').textContent = '$' + ingresosHoy.toFixed(2);
  },

  renderNegocios() {
    const container = document.getElementById('negociosGrid');
    container.innerHTML = '';

    const iconos = {
      'Cabinas': '🖥️',
      'Impresión': '🖨️',
      'Lavacar': '🚗'
    };

    this.negocios.forEach(negocio => {
      const trabajosNegocio = this.trabajos.filter(t => t.negocioId === negocio.id);
      const pendientes = trabajosNegocio.filter(t => t.estado === 'pendiente').length;
      const enProceso = trabajosNegocio.filter(t => t.estado === 'en_proceso').length;
      const completados = trabajosNegocio.filter(t => t.estado === 'completado').length;

      const url = negocio.nombre === 'Cabinas' ? '/cabinas.html' : 
                  negocio.nombre === 'Impresión' ? '/impresion.html' : 
                  '/lavacar.html';

      const card = document.createElement('a');
      card.href = url;
      card.className = 'negocio-card';
      card.innerHTML = `
        <div class="negocio-header">
          <div class="negocio-icon">${iconos[negocio.nombre] || '🏢'}</div>
          <div class="negocio-info">
            <h3>${negocio.nombre}</h3>
          </div>
        </div>
        <div class="negocio-stats">
          <div class="negocio-stat">
            <div class="negocio-stat-value">${pendientes}</div>
            <div class="negocio-stat-label">Pendientes</div>
          </div>
          <div class="negocio-stat">
            <div class="negocio-stat-value">${enProceso}</div>
            <div class="negocio-stat-label">En Proceso</div>
          </div>
          <div class="negocio-stat">
            <div class="negocio-stat-value">${completados}</div>
            <div class="negocio-stat-label">Completados</div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  },

  renderUsuarios() {
    const tbody = document.getElementById('usuariosTable');
    tbody.innerHTML = '';

    this.usuarios.forEach(usuario => {
      const negocio = usuario.negocioId ? 
        this.negocios.find(n => n.id === usuario.negocioId) : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="user-info">
            <span class="user-name">${usuario.nombreCompleto || 'Sin nombre'}</span>
            <span class="user-username">@${usuario.usuario}</span>
          </div>
        </td>
        <td>${usuario.nombreCompleto || '-'}</td>
        <td>
          <span class="badge ${usuario.rol === 'dueno' ? 'badge-dueno' : 'badge-trabajador'}">
            ${usuario.rol === 'dueno' ? 'Dueño' : 'Trabajador'}
          </span>
        </td>
        <td>${negocio ? negocio.nombre : '-'}</td>
        <td>
          <span class="badge ${usuario.activo ? 'badge-active' : 'badge-inactive'}">
            ${usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-secondary" onclick="adminApp.editarUsuario(${usuario.id})">
              ✏️ Editar
            </button>
            <button class="btn btn-sm btn-danger" onclick="adminApp.eliminarUsuario(${usuario.id}, '${usuario.usuario}')">
              🗑️ Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (this.usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-gray);">No hay usuarios registrados</td></tr>';
    }
  },

  renderTrabajosResumen() {
    const container = document.getElementById('trabajosResumen');
    container.innerHTML = '';

    this.negocios.forEach(negocio => {
      const trabajosNegocio = this.trabajos.filter(t => t.negocioId === negocio.id);
      const pendientes = trabajosNegocio.filter(t => t.estado === 'pendiente').length;
      const enProceso = trabajosNegocio.filter(t => t.estado === 'en_proceso').length;
      const completados = trabajosNegocio.filter(t => t.estado === 'completado').length;

      const card = document.createElement('div');
      card.className = 'resumen-card';
      card.innerHTML = `
        <h3>${negocio.nombre}</h3>
        <div class="resumen-stats">
          <div class="resumen-stat">
            <div class="resumen-stat-value warning">${pendientes}</div>
            <div class="resumen-stat-label">Pendientes</div>
          </div>
          <div class="resumen-stat">
            <div class="resumen-stat-value info">${enProceso}</div>
            <div class="resumen-stat-label">En Proceso</div>
          </div>
          <div class="resumen-stat">
            <div class="resumen-stat-value success">${completados}</div>
            <div class="resumen-stat-label">Completados</div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  },

  editarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;

    document.getElementById('editUsuarioId').value = usuario.id;
    document.getElementById('editUsuarioNombre').value = usuario.nombreCompleto || '';
    document.getElementById('editUsuarioUsername').value = usuario.usuario;
    document.getElementById('editUsuarioPassword').value = '';
    document.getElementById('editUsuarioRol').value = usuario.rol;
    document.getElementById('editUsuarioNegocio').value = usuario.negocioId || '';
    document.getElementById('editUsuarioActivo').value = usuario.activo ? '1' : '0';

    // Mostrar/ocultar selector de negocio según rol
    const editNegocioGroup = document.getElementById('editNegocioGroup');
    if (usuario.rol === 'trabajador') {
      editNegocioGroup.style.display = 'block';
    } else {
      editNegocioGroup.style.display = 'none';
    }

    this.showModal('editarUsuario');
  },

  async eliminarUsuario(id, username) {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      await API.usuarios.delete(id);
      await this.loadUsuarios();
      this.renderUsuarios();
      this.updateStats();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar el usuario');
    }
  },

  setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      API.auth.logout();
    });

    // Cambio de rol en nuevo usuario
    document.getElementById('usuarioRol').addEventListener('change', (e) => {
      const negocioGroup = document.getElementById('negocioGroup');
      const negocioSelect = document.getElementById('usuarioNegocio');
      
      if (e.target.value === 'trabajador') {
        negocioGroup.style.display = 'block';
        negocioSelect.required = true;
      } else {
        negocioGroup.style.display = 'none';
        negocioSelect.required = false;
        negocioSelect.value = '';
      }
    });

    // Cambio de rol en editar usuario
    document.getElementById('editUsuarioRol').addEventListener('change', (e) => {
      const editNegocioGroup = document.getElementById('editNegocioGroup');
      const editNegocioSelect = document.getElementById('editUsuarioNegocio');
      
      if (e.target.value === 'trabajador') {
        editNegocioGroup.style.display = 'block';
      } else {
        editNegocioGroup.style.display = 'none';
        editNegocioSelect.value = '';
      }
    });

    // Cargar negocios en selects
    const negocioSelects = [
      document.getElementById('usuarioNegocio'),
      document.getElementById('editUsuarioNegocio')
    ];

    negocioSelects.forEach(select => {
      this.negocios.forEach(negocio => {
        const option = document.createElement('option');
        option.value = negocio.id;
        option.textContent = negocio.nombre;
        select.appendChild(option);
      });
    });

    // Form nuevo usuario
    document.getElementById('formNuevoUsuario').addEventListener('submit', async (e) => {
      e.preventDefault();

      const rol = document.getElementById('usuarioRol').value;
      const data = {
        nombreCompleto: document.getElementById('usuarioNombre').value,
        usuario: document.getElementById('usuarioUsername').value,
        password: document.getElementById('usuarioPassword').value,
        rol: rol,
        negocioId: rol === 'trabajador' ? parseInt(document.getElementById('usuarioNegocio').value) : null,
        activo: true
      };

      try {
        await API.usuarios.create(data);
        this.closeModal('nuevoUsuario');
        e.target.reset();
        document.getElementById('negocioGroup').style.display = 'none';
        await this.loadUsuarios();
        this.renderUsuarios();
        this.updateStats();
      } catch (error) {
        console.error('Error creando usuario:', error);
        alert('Error al crear el usuario');
      }
    });

    // Form editar usuario
    document.getElementById('formEditarUsuario').addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = parseInt(document.getElementById('editUsuarioId').value);
      const rol = document.getElementById('editUsuarioRol').value;
      const password = document.getElementById('editUsuarioPassword').value;

      const data = {
        nombreCompleto: document.getElementById('editUsuarioNombre').value,
        usuario: document.getElementById('editUsuarioUsername').value,
        rol: rol,
        negocioId: rol === 'trabajador' ? parseInt(document.getElementById('editUsuarioNegocio').value) || null : null,
        activo: document.getElementById('editUsuarioActivo').value === '1'
      };

      // Solo incluir password si se especificó uno nuevo
      if (password) {
        data.password = password;
      }

      try {
        await API.usuarios.update(id, data);
        this.closeModal('editarUsuario');
        await this.loadUsuarios();
        this.renderUsuarios();
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        alert('Error al actualizar el usuario');
      }
    });
  },

  showModal(name) {
    const modal = document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`);
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeModal(name) {
    const modal = document.getElementById(`modal${name.charAt(0).toUpperCase() + name.slice(1)}`);
    if (modal) {
      modal.style.display = 'none';
    }
  },

  startPolling() {
    this.pollingInterval = setInterval(async () => {
      await this.loadAll();
    }, 30000); // Cada 30 segundos para admin
  },

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  adminApp.init();
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});
