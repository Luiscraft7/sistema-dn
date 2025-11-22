// Trabajo App - Módulo Unificado Inteligente
const trabajoApp = {
  negocioId: null,
  negocioTipo: null, // 'Cabinas', 'Lavacar', 'Impresión'
  negocioNombre: null,
  negocios: [],
  clientes: [],
  trabajos: [],
  pollingInterval: null,
  plantillas: [],
  config: {
    iconos: {
      'Cabinas': '💻',
      'Lavacar': '🚗',
      'Impresión': '🖨️'
    },
    titulos: {
      'Cabinas': {
        nuevo: 'Nueva Sesión',
        enProceso: '💻 Sesiones Activas',
        labelPrecio: 'Precio por Hora'
      },
      'Lavacar': {
        nuevo: 'Nuevo Lavado',
        enProceso: '🚗 Lavados Activos',
        labelPrecio: 'Precio Estimado'
      },
      'Impresión': {
        nuevo: 'Nuevo Trabajo',
        enProceso: '🖨️ Imprimiendo',
        labelPrecio: 'Precio Estimado'
      }
    }
  },

  async init() {
    // Verificar autenticación
    if (!API.checkAuth()) {
      window.location.href = '/login.html';
      return;
    }

    const userData = await API.verifyAuth();
    if (!userData) {
      window.location.href = '/login.html';
      return;
    }

    // Actualizar navbar
    document.getElementById('navbarUser').textContent = userData.nombreCompleto || userData.usuario;
    document.getElementById('navbarRole').textContent = (userData.rol === 'dueno' || userData.rol === 'dueño') ? 'Dueño' : 'Trabajador';

    // Cargar negocios
    await this.loadNegocios();

    // Detectar negocio del usuario
    if (userData.negocioId) {
      const negocio = this.negocios.find(n => n.id === userData.negocioId);
      if (negocio) {
        this.negocioId = negocio.id;
        this.negocioTipo = negocio.nombre;
        this.negocioNombre = negocio.nombre;
        document.getElementById('navbarNegocio').textContent = negocio.nombre;
      } else {
        alert('No se encontró el negocio asignado');
        window.location.href = '/login.html';
        return;
      }
    } else {
      alert('Usuario sin negocio asignado');
      window.location.href = '/login.html';
      return;
    }

    // Personalizar interfaz según tipo de negocio
    this.personalizarInterfaz();

    // Cargar datos
    await this.loadAll();

    // Cargar plantillas
    this.loadPlantillas();

    // Setup event listeners
    this.setupEventListeners();

    // Iniciar polling
    this.startPolling();
  },

  personalizarInterfaz() {
    const config = this.config.titulos[this.negocioTipo] || this.config.titulos['Impresión'];
    const icono = this.config.iconos[this.negocioTipo] || '📋';

    // Actualizar títulos
    document.getElementById('modalTitulo').textContent = `${icono} ${config.nuevo}`;
    document.getElementById('btnNuevoTexto').textContent = config.nuevo;
    document.getElementById('tituloEnProceso').textContent = config.enProceso;
    document.getElementById('labelPrecio').textContent = config.labelPrecio;

    // Agregar campos específicos según tipo
    this.renderCamposEspecificos();
  },

  renderCamposEspecificos() {
    const containerTrabajo = document.getElementById('camposEspecificos');
    const containerCliente = document.getElementById('camposClienteEspecificos');

    // Campos específicos de Cabinas
    if (this.negocioTipo === 'Cabinas') {
      containerCliente.innerHTML = `
        <div class="form-group">
          <label class="form-label">Cédula</label>
          <input type="text" id="clienteCedula" class="form-input" placeholder="0-0000-0000">
        </div>
        <div class="form-group">
          <label class="form-label">Edad</label>
          <input type="number" id="clienteEdad" class="form-input" min="0" placeholder="18">
        </div>
      `;
    } else {
      containerCliente.innerHTML = '';
    }

    containerTrabajo.innerHTML = '';
  },

  async loadNegocios() {
    try {
      this.negocios = await API.negocios.getAll();
    } catch (error) {
      console.error('Error cargando negocios:', error);
      alert('Error al cargar los negocios');
    }
  },

  async loadClientes() {
    try {
      const todosClientes = await API.clientes.getAll();
      
      // Filtrar clientes según tipo de negocio
      if (this.negocioTipo === 'Cabinas') {
        this.clientes = todosClientes.filter(c => c.esCabina === true || c.esCabina === 1);
      } else {
        this.clientes = todosClientes.filter(c => !c.esCabina || c.esCabina === false || c.esCabina === 0);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error al cargar los clientes');
    }
  },

  async loadTrabajos() {
    try {
      const todosTrab = await API.trabajos.getAll();
      this.trabajos = todosTrab.filter(t => t.negocioId === this.negocioId);
    } catch (error) {
      console.error('Error cargando trabajos:', error);
    }
  },

  async loadAll() {
    await Promise.all([
      this.loadClientes(),
      this.loadTrabajos()
    ]);
    this.renderClientesSelect();
    this.renderTrabajos();
    this.updateStats();
    this.checkMobileView();
  },

  renderClientesSelect() {
    const select = document.getElementById('trabajoCliente');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccionar cliente</option>';
    
    this.clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      select.appendChild(option);
    });

    if (currentValue) {
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
      pendientes.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos pendientes</p>';
    }
    if (enProceso.children.length === 0) {
      enProceso.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos activos</p>';
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

    // Info específica por tipo de negocio
    let infoExtra = '';
    if (this.negocioTipo === 'Cabinas' && cliente) {
      infoExtra = `
        <div class="trabajo-info" style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 0.25rem; font-size: 0.85rem;">
          ${cliente.cedula ? `<div>📋 Cédula: ${cliente.cedula}</div>` : ''}
          ${cliente.edad ? `<div>👤 Edad: ${cliente.edad} años</div>` : ''}
        </div>
      `;
    }

    // Tiempo activo
    let tiempoInfo = '';
    if (trabajo.estado === 'en_proceso' && trabajo.fechaInicio) {
      const inicio = new Date(trabajo.fechaInicio);
      const ahora = new Date();
      const minutos = Math.floor((ahora - inicio) / 60000);
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      tiempoInfo = `<span class="tiempo-activo">⏱️ ${horas}h ${mins}m</span>`;
    }

    card.innerHTML = `
      <div class="trabajo-header">
        <div class="trabajo-cliente">${nombreCliente}</div>
        <span class="badge badge-${this.getEstadoColor(trabajo.estado)}">${this.getEstadoText(trabajo.estado)}</span>
      </div>
      ${infoExtra}
      <div class="trabajo-descripcion">${trabajo.descripcion || 'Sin descripción'}</div>
      <div class="trabajo-footer">
        ${tiempoInfo || `<span class="trabajo-precio">${trabajo.precioEstimado ? '₡' + parseFloat(trabajo.precioEstimado).toFixed(2) : 'Sin precio'}</span>`}
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
        <button class="btn btn-sm btn-primary" onclick="trabajoApp.cambiarEstado(${trabajo.id}, 'en_proceso')">
          ▶️ Iniciar
        </button>
        <button class="btn btn-sm btn-danger" onclick="trabajoApp.cambiarEstado(${trabajo.id}, 'cancelado')">
          ❌ Cancelar
        </button>
      `;
    } else if (trabajo.estado === 'en_proceso') {
      actions = `
        <button class="btn btn-sm btn-success" onclick="trabajoApp.cambiarEstado(${trabajo.id}, 'completado')">
          ✅ Finalizar
        </button>
        <button class="btn btn-sm btn-warning" onclick="trabajoApp.cambiarEstado(${trabajo.id}, 'pendiente')">
          ⏸️ Pausar
        </button>
      `;
    }

    return actions;
  },

  getEstadoColor(estado) {
    const colors = {
      'pendiente': 'warning',
      'en_proceso': 'success',
      'completado': 'primary',
      'cancelado': 'danger'
    };
    return colors[estado] || 'secondary';
  },

  getEstadoText(estado) {
    const texts = {
      'pendiente': 'Pendiente',
      'en_proceso': 'Activo',
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
    });

    const gananciasHoy = completadosHoy.reduce((total, t) => {
      return total + (parseFloat(t.precioEstimado) || 0);
    }, 0);

    document.getElementById('statPendientes').textContent = pendientes;
    document.getElementById('statEnProceso').textContent = enProceso;
    document.getElementById('statCompletados').textContent = completadosHoy.length;
    document.getElementById('statGanancias').textContent = `₡${gananciasHoy.toLocaleString('es-CR', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
  },

  async cambiarEstado(trabajoId, nuevoEstado) {
    try {
      await API.trabajos.updateEstado(trabajoId, { estado: nuevoEstado });
      await this.loadTrabajos();
      this.renderTrabajos();
      this.updateStats();
      this.autoSwitchTab(nuevoEstado);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del trabajo');
    }
  },

  autoSwitchTab(nuevoEstado) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const stateMap = {
      'pendiente': 'pendiente',
      'en_proceso': 'en_proceso',
      'completado': 'completado'
    };

    const targetState = stateMap[nuevoEstado];
    if (!targetState) return;

    const targetBtn = document.querySelector(`.mobile-state-btn[data-state="${targetState}"]`);
    const targetCol = document.querySelector(`.trabajos-column[data-state="${targetState}"]`);

    if (targetBtn && targetCol) {
      targetCol.style.opacity = '0';
      
      setTimeout(() => {
        document.querySelectorAll('.mobile-state-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        
        document.querySelectorAll('.trabajos-column').forEach(col => col.classList.remove('active'));
        targetCol.classList.add('active');
        
        setTimeout(() => {
          targetCol.style.opacity = '1';
        }, 50);
      }, 300);
    }
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
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.mobile-state-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = btn.dataset.state;
        
        document.querySelectorAll('.mobile-state-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
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

  // Sistema de Plantillas
  loadPlantillas() {
    const key = `${this.negocioTipo.toLowerCase()}_plantillas`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      this.plantillas = JSON.parse(saved);
    } else {
      // Plantillas por defecto según tipo
      this.plantillas = this.getPlantillasDefault();
    }
    
    this.renderQuickAccess();
    this.renderPlantillasList();
  },

  getPlantillasDefault() {
    const defaults = {
      'Cabinas': [
        {texto: '1 noche', precio: 1000},
        {texto: '2 noches', precio: 2000},
        {texto: 'Tareas', precio: 500}
      ],
      'Lavacar': [
        {texto: 'Lavado completo', precio: 5000},
        {texto: 'Encerado', precio: 3000}
      ],
      'Impresión': [
        {texto: '10 copias B/N', precio: 500},
        {texto: 'Anillado', precio: 1500}
      ]
    };
    return defaults[this.negocioTipo] || [];
  },

  savePlantillas() {
    const key = `${this.negocioTipo.toLowerCase()}_plantillas`;
    localStorage.setItem(key, JSON.stringify(this.plantillas));
  },

  renderQuickAccess() {
    const container = document.getElementById('quickAccessButtons');
    if (!container) return;

    container.innerHTML = this.plantillas.map((plantilla, index) => {
      const texto = typeof plantilla === 'string' ? plantilla : plantilla.texto;
      const precio = typeof plantilla === 'object' && plantilla.precio ? ` - ₡${plantilla.precio}` : '';
      return `
        <button type="button" class="quick-access-btn" onclick="trabajoApp.aplicarPlantilla(${index})">
          ${texto}${precio}
        </button>
      `;
    }).join('');
  },

  aplicarPlantilla(index) {
    const plantilla = this.plantillas[index];
    const texto = typeof plantilla === 'string' ? plantilla : plantilla.texto;
    const precio = typeof plantilla === 'object' && plantilla.precio ? plantilla.precio : null;
    
    const descripcionInput = document.getElementById('trabajoDescripcion');
    const precioInput = document.getElementById('trabajoPrecio');
    
    if (descripcionInput) {
      descripcionInput.value = texto;
      descripcionInput.focus();
    }
    
    if (precioInput && precio !== null) {
      precioInput.value = precio;
    }
  },

  renderPlantillasList() {
    const container = document.getElementById('plantillasList');
    if (!container) return;

    if (this.plantillas.length === 0) {
      container.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay plantillas guardadas</p>';
      return;
    }

    container.innerHTML = this.plantillas.map((plantilla, index) => {
      const texto = typeof plantilla === 'string' ? plantilla : plantilla.texto;
      const precio = typeof plantilla === 'object' && plantilla.precio ? ` - ₡${plantilla.precio}` : '';
      return `
        <div class="plantilla-item">
          <span class="plantilla-item-text">${texto}${precio}</span>
          <button class="plantilla-item-delete" onclick="trabajoApp.eliminarPlantilla(${index})">
            🗑️
          </button>
        </div>
      `;
    }).join('');
  },

  agregarPlantilla() {
    const inputNombre = document.getElementById('nuevaPlantillaNombre');
    const inputPrecio = document.getElementById('nuevaPlantillaPrecio');
    const nombre = inputNombre.value.trim();
    const precio = parseFloat(inputPrecio.value) || null;

    if (!nombre) {
      alert('Ingrese un nombre para la plantilla');
      return;
    }

    const existe = this.plantillas.some(p => {
      const texto = typeof p === 'string' ? p : p.texto;
      return texto === nombre;
    });

    if (existe) {
      alert('Esta plantilla ya existe');
      return;
    }

    this.plantillas.push({texto: nombre, precio: precio});
    this.savePlantillas();
    this.renderQuickAccess();
    this.renderPlantillasList();
    inputNombre.value = '';
    inputPrecio.value = '';
  },

  eliminarPlantilla(index) {
    if (confirm('¿Eliminar esta plantilla?')) {
      this.plantillas.splice(index, 1);
      this.savePlantillas();
      this.renderQuickAccess();
      this.renderPlantillasList();
    }
  },

  // Ganancias
  calcularGanancias() {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];
    
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesStr = inicioMes.toISOString().split('T')[0];
    
    const completados = this.trabajos.filter(t => t.estado === 'completado' && t.fechaCompletado);
    
    const hoyTrabajos = completados.filter(t => t.fechaCompletado.split('T')[0] === hoyStr);
    const semanaTrabajos = completados.filter(t => t.fechaCompletado.split('T')[0] >= inicioSemanaStr);
    const mesTrabajos = completados.filter(t => t.fechaCompletado.split('T')[0] >= inicioMesStr);
    
    return {
      hoy: hoyTrabajos.reduce((sum, t) => sum + (parseFloat(t.precioEstimado) || 0), 0),
      semana: semanaTrabajos.reduce((sum, t) => sum + (parseFloat(t.precioEstimado) || 0), 0),
      mes: mesTrabajos.reduce((sum, t) => sum + (parseFloat(t.precioEstimado) || 0), 0),
      total: completados.reduce((sum, t) => sum + (parseFloat(t.precioEstimado) || 0), 0),
      trabajosHoy: hoyTrabajos
    };
  },

  mostrarGanancias() {
    const ganancias = this.calcularGanancias();
    
    document.getElementById('gananciaHoy').textContent = `₡${ganancias.hoy.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
    document.getElementById('gananciaSemana').textContent = `₡${ganancias.semana.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
    document.getElementById('gananciaMes').textContent = `₡${ganancias.mes.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
    document.getElementById('gananciaTotal').textContent = `₡${ganancias.total.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
    
    const container = document.getElementById('trabajosCompletadosHoy');
    if (ganancias.trabajosHoy.length === 0) {
      container.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay trabajos completados hoy</p>';
    } else {
      container.innerHTML = ganancias.trabajosHoy.map(trabajo => {
        const cliente = this.clientes.find(c => c.id === trabajo.clienteId);
        const precio = parseFloat(trabajo.precioEstimado) || 0;
        return `
          <div class="trabajo-ganancia-item">
            <div class="trabajo-ganancia-info">
              <div class="trabajo-ganancia-cliente">${cliente ? cliente.nombre : 'Sin cliente'}</div>
              <div class="trabajo-ganancia-desc">${trabajo.descripcion || 'Sin descripción'}</div>
            </div>
            <div class="trabajo-ganancia-precio">₡${precio.toLocaleString('es-CR', {minimumFractionDigits: 2})}</div>
          </div>
        `;
      }).join('');
    }
  },

  // Event Listeners
  setupEventListeners() {
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
        await this.loadAll();
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
        esCabina: this.negocioTipo === 'Cabinas'
      };

      // Campos específicos de Cabinas
      if (this.negocioTipo === 'Cabinas') {
        const cedulaInput = document.getElementById('clienteCedula');
        const edadInput = document.getElementById('clienteEdad');
        if (cedulaInput) data.cedula = cedulaInput.value || null;
        if (edadInput) data.edad = parseInt(edadInput.value) || null;
      }

      try {
        await API.clientes.create(data);
        this.closeModal('nuevoCliente');
        e.target.reset();
        await this.loadClientes();
        this.renderClientesSelect();
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
      
      if (name === 'ganancias') {
        this.mostrarGanancias();
      }
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

// Init
document.addEventListener('DOMContentLoaded', () => {
  trabajoApp.init();
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
    if (trabajoApp.checkMobileView) {
      trabajoApp.checkMobileView();
    }
  }, 250);
});
