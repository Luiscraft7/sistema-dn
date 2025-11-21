// Impresión App
const impresionApp = {
  negocioId: null,
  negocios: [],
  clientes: [],
  trabajos: [],
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

    // Actualizar navbar
    document.getElementById('navbarUser').textContent = userData.nombreCompleto || userData.usuario;
    document.getElementById('navbarRole').textContent = (userData.rol === 'dueno' || userData.rol === 'dueño') ? 'Dueño' : 'Trabajador';

    // Buscar el negocio Impresión
    await this.loadNegocios();
    const impresion = this.negocios.find(n => n.nombre === 'Impresión');
    
    if (!impresion) {
      alert('No se encontró el negocio Impresión');
      window.location.href = '/login.html';
      return;
    }

    this.negocioId = impresion.id;

    // Si es trabajador, verificar que esté asignado a Impresión
    if (userData.rol === 'trabajador' && userData.negocioId !== this.negocioId) {
      alert('No tienes acceso a este negocio');
      window.location.href = '/login.html';
      return;
    }

    // Cargar datos iniciales
    await this.loadAll();

    // Setup event listeners
    this.setupEventListeners();

    // Iniciar polling cada 15 segundos
    this.startPolling();
  },

  async loadNegocios() {
    try {
      this.negocios = await API.negocios.getAll();
    } catch (error) {
      console.error('Error cargando negocios:', error);
    }
  },

  async loadAll() {
    await Promise.all([
      this.loadClientes(),
      this.loadTrabajos()
    ]);
    this.updateStats();
    this.checkMobileView();
  },

  checkMobileView() {
    const isMobile = window.innerWidth <= 768;
    const container = document.querySelector('.trabajos-container');
    const selector = document.getElementById('mobileStateSelector');
    
    if (container) {
      if (isMobile) {
        container.classList.add('mobile-single-view');
        if (selector) selector.style.display = 'flex';
        this.setupMobileNavigation();
      } else {
        container.classList.remove('mobile-single-view');
        if (selector) selector.style.display = 'none';
        // Mostrar todas las columnas en desktop
        document.querySelectorAll('.trabajos-column').forEach(col => {
          col.classList.remove('active');
        });
      }
    }
  },

  setupMobileNavigation() {
    const buttons = document.querySelectorAll('.mobile-state-btn');
    const columns = document.querySelectorAll('.trabajos-column');

    buttons.forEach(btn => {
      btn.replaceWith(btn.cloneNode(true)); // Remove old listeners
    });

    document.querySelectorAll('.mobile-state-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = btn.dataset.state;
        
        // Update buttons
        document.querySelectorAll('.mobile-state-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update columns
        columns.forEach(col => {
          if (col.dataset.state === state) {
            col.classList.add('active');
          } else {
            col.classList.remove('active');
          }
        });
      });
    });
  },

  async loadClientes() {
    try {
      const allClientes = await API.clientes.getAll();
      // Impresión muestra clientes que no son de cabinas
      this.clientes = allClientes.filter(c => c.esCabina !== true);
      this.renderClientesSelect();
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  },

  async loadTrabajos() {
    try {
      const allTrabajos = await API.trabajos.getAll();
      this.trabajos = allTrabajos.filter(t => t.negocioId === this.negocioId);
      this.renderTrabajos();
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    }
  },

  renderClientesSelect() {
    const select = document.getElementById('trabajoCliente');
    if (!select) return;
    
    // Guardar valor seleccionado actual
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    
    this.clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      select.appendChild(option);
    });
    
    // Restaurar valor seleccionado si existe
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
      select.value = currentValue;
    }
  },

  renderTrabajos() {
    const pendientes = document.getElementById('trabajosPendientes');
    const enProceso = document.getElementById('trabajosEnProceso');
    const completados = document.getElementById('trabajosCompletados');

    pendientes.innerHTML = '';
    enProceso.innerHTML = '';
    completados.innerHTML = '';

    // Mostrar todos los trabajos completados
    this.trabajos.forEach(trabajo => {
      const card = this.createTrabajoCard(trabajo);

      if (trabajo.estado === 'pendiente') {
        pendientes.appendChild(card);
      } else if (trabajo.estado === 'en_proceso') {
        enProceso.appendChild(card);
      } else if (trabajo.estado === 'completado') {
        completados.appendChild(card);
      }
    });

    // Mensajes si no hay trabajos
    if (pendientes.children.length === 0) {
      pendientes.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos en cola</p>';
    }
    if (enProceso.children.length === 0) {
      enProceso.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos en proceso</p>';
    }
    if (completados.children.length === 0) {
      completados.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos completados</p>';
    }
  },

  createTrabajoCard(trabajo) {
    const card = document.createElement('div');
    card.className = 'trabajo-item';

    const cliente = this.clientes.find(c => c.id === trabajo.clienteId);
    const nombreCliente = cliente ? cliente.nombre : 'Cliente desconocido';

    card.innerHTML = `
      <div class="trabajo-header">
        <div class="trabajo-cliente">${nombreCliente}</div>
        <span class="badge badge-${this.getEstadoColor(trabajo.estado)}">${this.getEstadoText(trabajo.estado)}</span>
      </div>
      <div class="trabajo-descripcion">${trabajo.descripcion || 'Sin descripción'}</div>
      <div class="trabajo-footer">
        <span class="trabajo-precio">${trabajo.precioEstimado ? '$' + parseFloat(trabajo.precioEstimado).toFixed(2) : 'Sin precio'}</span>
        <span style="color: var(--text-gray);">${this.formatDate(trabajo.fechaCreacion)}</span>
      </div>
      <div class="trabajo-actions">
        ${this.getTrabajoActions(trabajo)}
      </div>
    `;

    return card;
  },

  getTrabajoActions(trabajo) {
    let actions = '';

    if (trabajo.estado === 'pendiente') {
      actions = `
        <button class="btn btn-sm btn-primary" onclick="impresionApp.cambiarEstado(${trabajo.id}, 'en_proceso')">
          🖨️ Imprimir
        </button>
        <button class="btn btn-sm btn-danger" onclick="impresionApp.cambiarEstado(${trabajo.id}, 'cancelado')">
          ❌ Cancelar
        </button>
      `;
    } else if (trabajo.estado === 'en_proceso') {
      actions = `
        <button class="btn btn-sm btn-success" onclick="impresionApp.cambiarEstado(${trabajo.id}, 'completado')">
          ✅ Completar
        </button>
        <button class="btn btn-sm btn-warning" onclick="impresionApp.cambiarEstado(${trabajo.id}, 'pendiente')">
          ⏸️ Pausar
        </button>
      `;
    }

    return actions;
  },

  getEstadoColor(estado) {
    const colors = {
      'pendiente': 'warning',
      'en_proceso': 'primary',
      'completado': 'success',
      'cancelado': 'danger'
    };
    return colors[estado] || 'secondary';
  },

  getEstadoText(estado) {
    const texts = {
      'pendiente': 'En Cola',
      'en_proceso': 'Imprimiendo',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return texts[estado] || estado;
  },

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy ' + date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' });
  },

  updateStats() {
    const pendientes = this.trabajos.filter(t => t.estado === 'pendiente').length;
    const enProceso = this.trabajos.filter(t => t.estado === 'en_proceso').length;
    
    const hoy = new Date().toISOString().split('T')[0];
    const completadosHoy = this.trabajos.filter(t => {
      if (t.estado !== 'completado') return false;
      const fecha = t.fechaCompletado?.split('T')[0];
      return fecha === hoy;
    }).length;

    document.getElementById('statPendientes').textContent = pendientes;
    document.getElementById('statEnProceso').textContent = enProceso;
    document.getElementById('statCompletados').textContent = completadosHoy;
  },

  async cambiarEstado(trabajoId, nuevoEstado) {
    try {
      await API.trabajos.updateEstado(trabajoId, { estado: nuevoEstado });
      await this.loadTrabajos();
      this.updateStats();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del trabajo');
    }
  },

  setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      API.auth.logout();
    });

    // Form nuevo trabajo
    document.getElementById('formNuevoTrabajo').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        negocioId: this.negocioId,
        clienteId: parseInt(document.getElementById('trabajoCliente').value),
        descripcion: document.getElementById('trabajoDescripcion').value,
        precioEstimado: parseFloat(document.getElementById('trabajoPrecio').value) || null,
        estado: 'pendiente'
      };

      try {
        await API.trabajos.create(data);
        this.closeModal('nuevoTrabajo');
        e.target.reset();
        await this.loadTrabajos();
        this.updateStats();
      } catch (error) {
        console.error('Error creando trabajo:', error);
        alert('Error al crear el trabajo');
      }
    });

    // Form nuevo cliente
    document.getElementById('formNuevoCliente').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        nombre: document.getElementById('clienteNombre').value,
        telefono: document.getElementById('clienteTelefono').value || null,
        notaExtra: document.getElementById('clienteNota').value || null,
        esCabina: false
      };

      try {
        await API.clientes.create(data);
        this.closeModal('nuevoCliente');
        e.target.reset();
        await this.loadClientes();
      } catch (error) {
        console.error('Error creando cliente:', error);
        alert('Error al crear el cliente');
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
    }, 15000);
  },

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  impresionApp.init();
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Detectar cambios de tamaño/orientación
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (impresionApp.checkMobileView) {
      impresionApp.checkMobileView();
    }
  }, 250);
});
