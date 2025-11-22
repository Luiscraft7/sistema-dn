// Cabinas App
const cabinasApp = {
  negocioId: null,
  negocios: [],
  clientes: [],
  trabajos: [],
  pollingInterval: null,
  plantillas: [],

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

    // Buscar el negocio Cabinas
    await this.loadNegocios();
    const cabinas = this.negocios.find(n => n.nombre === 'Cabinas');
    
    if (!cabinas) {
      alert('No se encontró el negocio Cabinas');
      window.location.href = '/login.html';
      return;
    }

    this.negocioId = cabinas.id;

    // Si es trabajador, verificar que esté asignado a Cabinas
    if (userData.rol === 'trabajador' && userData.negocioId !== this.negocioId) {
      alert('No tienes acceso a este negocio');
      window.location.href = '/login.html';
      return;
    }

    // Cargar datos iniciales
    await this.loadAll();

    // Cargar plantillas guardadas
    this.loadPlantillas();

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
      // Cabinas solo muestra clientes con esCabina = true
      this.clientes = allClientes.filter(c => c.esCabina === true);
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

    // Mostrar todas las sesiones completadas
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
      pendientes.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay sesiones en espera</p>';
    }
    if (enProceso.children.length === 0) {
      enProceso.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay sesiones activas</p>';
    }
    if (completados.children.length === 0) {
      completados.innerHTML = '<p style="color: var(--text-gray); text-align: center; padding: 1rem;">No hay sesiones completadas</p>';
    }
  },

  createTrabajoCard(trabajo) {
    const card = document.createElement('div');
    card.className = 'trabajo-item';

    const cliente = this.clientes.find(c => c.id === trabajo.clienteId);
    const nombreCliente = cliente ? cliente.nombre : 'Cliente desconocido';

    // Calcular tiempo activo si está en proceso
    let tiempoInfo = '';
    if (trabajo.estado === 'en_proceso' && trabajo.fechaInicio) {
      const inicio = new Date(trabajo.fechaInicio);
      const ahora = new Date();
      const minutos = Math.floor((ahora - inicio) / 60000);
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      tiempoInfo = `<span class="tiempo-activo">⏱️ ${horas}h ${mins}m</span>`;
    }

    // Mostrar info extra de cabinas (cédula y edad)
    let infoExtra = '';
    if (cliente && (cliente.cedula || cliente.edad)) {
      infoExtra = '<div class="trabajo-info">';
      if (cliente.cedula) {
        infoExtra += `<div class="info-row"><span class="info-label">Cédula:</span> ${cliente.cedula}</div>`;
      }
      if (cliente.edad) {
        infoExtra += `<div class="info-row"><span class="info-label">Edad:</span> ${cliente.edad} años</div>`;
      }
      infoExtra += '</div>';
    }

    card.innerHTML = `
      <div class="trabajo-header">
        <div class="trabajo-cliente">${nombreCliente}</div>
        <span class="badge badge-${this.getEstadoColor(trabajo.estado)}">${this.getEstadoText(trabajo.estado)}</span>
      </div>
      ${infoExtra}
      <div class="trabajo-descripcion">${trabajo.descripcion || 'Sin descripción'}</div>
      <div class="trabajo-footer">
        ${tiempoInfo || `<span class="trabajo-precio">${trabajo.precioEstimado ? '$' + parseFloat(trabajo.precioEstimado).toFixed(2) + '/h' : 'Sin precio'}</span>`}
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
        <button class="btn btn-sm btn-primary" onclick="cabinasApp.cambiarEstado(${trabajo.id}, 'en_proceso')">
          ▶️ Iniciar Trabajo
        </button>
        <button class="btn btn-sm btn-danger" onclick="cabinasApp.cambiarEstado(${trabajo.id}, 'cancelado')">
          ❌ Cancelar
        </button>
      `;
    } else if (trabajo.estado === 'en_proceso') {
      actions = `
        <button class="btn btn-sm btn-success" onclick="cabinasApp.cambiarEstado(${trabajo.id}, 'completado')">
          ✅ Finalizar Trabajo
        </button>
        <button class="btn btn-sm btn-warning" onclick="cabinasApp.cambiarEstado(${trabajo.id}, 'pendiente')">
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
      'pendiente': 'En Espera',
      'en_proceso': 'Activa',
      'completado': 'Completada',
      'cancelado': 'Cancelada'
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
    const enEspera = this.trabajos.filter(t => t.estado === 'pendiente').length;
    const activas = this.trabajos.filter(t => t.estado === 'en_proceso').length;
    
    const hoy = new Date().toISOString().split('T')[0];
    const completadosHoy = this.trabajos.filter(t => {
      if (t.estado !== 'completado') return false;
      const fecha = t.fechaCompletado?.split('T')[0];
      return fecha === hoy;
    });

    // Calcular ganancias de hoy
    const gananciasHoy = completadosHoy.reduce((total, t) => {
      return total + (parseFloat(t.precioEstimado) || 0);
    }, 0);

    document.getElementById('statEnEspera').textContent = enEspera;
    document.getElementById('statActivas').textContent = activas;
    document.getElementById('statCompletados').textContent = completadosHoy.length;
    document.getElementById('statGanancias').textContent = `₡${gananciasHoy.toLocaleString('es-CR', {minimumFractionDigits: 2})}`;
  },

  calcularGanancias() {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    
    // Inicio de semana (Lunes)
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);
    const inicioSemanaStr = inicioSemana.toISOString().split('T')[0];
    
    // Inicio de mes
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
    
    // Mostrar trabajos de hoy
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

  async cambiarEstado(trabajoId, nuevoEstado) {
    try {
      await API.trabajos.updateEstado(trabajoId, { estado: nuevoEstado });
      await this.loadTrabajos();
      this.updateStats();
      
      // Auto-cambiar pestaña en móvil con animación
      this.autoSwitchTab(nuevoEstado);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la sesión');
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
      // Animar cambio
      targetCol.style.opacity = '0';
      
      setTimeout(() => {
        // Actualizar botones
        document.querySelectorAll('.mobile-state-btn').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
        
        // Actualizar columnas
        document.querySelectorAll('.trabajos-column').forEach(col => col.classList.remove('active'));
        targetCol.classList.add('active');
        
        // Fade in
        setTimeout(() => {
          targetCol.style.opacity = '1';
        }, 50);
      }, 300);
    }
  },

  // Sistema de Plantillas
  loadPlantillas() {
    const saved = localStorage.getItem('cabinas_plantillas');
    if (saved) {
      this.plantillas = JSON.parse(saved);
    } else {
      // Plantillas por defecto con formato {texto, precio}
      this.plantillas = [
        {texto: '1 noche', precio: 1000},
        {texto: '2 noches', precio: 2000},
        {texto: '3 noches', precio: 3000},
        {texto: 'Tareas', precio: 500},
        {texto: 'Impresión', precio: null}
      ];
    }
    this.renderQuickAccess();
    this.renderPlantillasList();
  },

  savePlantillas() {
    localStorage.setItem('cabinas_plantillas', JSON.stringify(this.plantillas));
  },

  renderQuickAccess() {
    const container = document.getElementById('quickAccessButtons');
    if (!container) return;

    container.innerHTML = this.plantillas.map((plantilla, index) => {
      const texto = typeof plantilla === 'string' ? plantilla : plantilla.texto;
      const precio = typeof plantilla === 'object' && plantilla.precio ? ` - ₡${plantilla.precio}` : '';
      return `
        <button type="button" class="quick-access-btn" onclick="cabinasApp.aplicarPlantilla(${index})">
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
          <button class="plantilla-item-delete" onclick="cabinasApp.eliminarPlantilla(${index})">
            🗑️ Eliminar
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

  setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      API.auth.logout();
    });

    // Form nueva sesión
    document.getElementById('formNuevaSesion').addEventListener('submit', async (e) => {
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
        this.closeModal('nuevaSesion');
        e.target.reset();
        await this.loadTrabajos();
        this.updateStats();
      } catch (error) {
        console.error('Error creando sesión:', error);
        alert('Error al crear la sesión');
      }
    });

    // Form nuevo cliente
    document.getElementById('formNuevoCliente').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        nombre: document.getElementById('clienteNombre').value,
        telefono: document.getElementById('clienteTelefono').value || null,
        cedula: document.getElementById('clienteCedula').value || null,
        edad: parseInt(document.getElementById('clienteEdad').value) || null,
        notaExtra: document.getElementById('clienteNota').value || null,
        esCabina: true
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
      
      // Si es el modal de ganancias, cargar datos
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

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  cabinasApp.init();
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
    if (cabinasApp.checkMobileView) {
      cabinasApp.checkMobileView();
    }
  }, 250);
});
