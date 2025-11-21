// Admin Dashboard App
const adminApp = {
  negocios: [],
  usuarios: [],
  trabajos: [],
  clientes: [],
  pollingInterval: null,
  currentTab: 'trabajos',
  filtrosUsuarios: {
    negocioId: '',
    buscar: ''
  },
  filtrosClientes: {
    tipo: '',
    buscar: ''
  },
  filtroNegocio: null,

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
    if (!(userData.rol === 'dueno' || userData.rol === 'dueño')) {
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
    this.renderClientes();
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

      // Trabajadores asignados a negocio
      const trabajadores = this.usuarios.filter(u => u.rol === 'trabajador' && u.negocioId === negocio.id && u.activo);
      const trabajadorResumen = trabajadores.length
        ? trabajadores.map(t => `<span class="badge badge-trabajador" style="margin:2px">@${t.username}</span>`).join('')
        : '<span style="color:var(--text-gray);font-size:0.75rem">Sin trabajadores</span>';

      const url = negocio.nombre === 'Cabinas' ? '/cabinas.html' : 
                  negocio.nombre === 'Impresión' ? '/impresion.html' : 
                  '/lavacar.html';

      const card = document.createElement('div');
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
        <div style="margin-top:1rem">
          <div style="font-size:0.75rem; color:var(--text-gray); margin-bottom:0.25rem">Trabajadores:</div>
          <div>${trabajadorResumen}</div>
        </div>
        <div style="margin-top:0.75rem; display:flex; gap:0.5rem; flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" data-negocio="${negocio.id}" data-nombre="${negocio.nombre}" onclick="adminApp.nuevoTrabajador(${negocio.id})">Asignar Trabajador</button>
        </div>
      `;
      container.appendChild(card);
    });
  },

  renderUsuarios() {
    const tbody = document.getElementById('usuariosTable');
    tbody.innerHTML = '';
    // Aplicar filtros
    const filtrados = this.usuarios.filter(u => {
      if (this.filtrosUsuarios.negocioId && parseInt(this.filtrosUsuarios.negocioId) !== u.negocioId) return false;
      if (this.filtrosUsuarios.buscar) {
        const term = this.filtrosUsuarios.buscar.toLowerCase();
        if (!((u.username || '').toLowerCase().includes(term) || (u.nombre || '').toLowerCase().includes(term))) return false;
      }
      return true;
    });

    filtrados.forEach(usuario => {
      const negocio = usuario.negocioId ? 
        this.negocios.find(n => n.id === usuario.negocioId) : null;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="user-info">
            <span class="user-name">${usuario.nombre || 'Sin nombre'}</span>
            <span class="user-username">@${usuario.username}</span>
          </div>
        </td>
        <td>${usuario.nombre || '-'}</td>
        <td>
          <span class="badge ${(usuario.rol === 'dueno' || usuario.rol === 'dueño') ? 'badge-dueno' : 'badge-trabajador'}">
            ${(usuario.rol === 'dueno' || usuario.rol === 'dueño') ? 'Dueño' : 'Trabajador'}
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
            <button class="btn btn-sm btn-danger" onclick="adminApp.eliminarUsuario(${usuario.id}, '${usuario.username}')">
              🗑️ Eliminar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (filtrados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-gray);">No hay usuarios registrados</td></tr>';
    }
  },

  renderClientes() {
    const tbody = document.getElementById('clientesTable');
    tbody.innerHTML = '';

    // Aplicar filtros
    let filtrados = [...this.clientes];
    
    if (this.filtrosClientes.tipo) {
      if (this.filtrosClientes.tipo === 'cabina') {
        filtrados = filtrados.filter(c => c.esCabina === true);
      } else if (this.filtrosClientes.tipo === 'general') {
        filtrados = filtrados.filter(c => c.esCabina !== true);
      }
    }

    if (this.filtrosClientes.buscar) {
      const term = this.filtrosClientes.buscar.toLowerCase();
      filtrados = filtrados.filter(c => 
        (c.nombre || '').toLowerCase().includes(term) ||
        (c.telefono || '').toLowerCase().includes(term) ||
        (c.cedula || '').toLowerCase().includes(term)
      );
    }

    filtrados.forEach(cliente => {
      const trabajosCount = cliente._count?.trabajos || 0;
      const fecha = cliente.creadoEn ? new Date(cliente.creadoEn).toLocaleDateString() : '-';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cliente.nombre || '-'}</td>
        <td>${cliente.telefono || '-'}</td>
        <td>${cliente.cedula || '-'}</td>
        <td>${cliente.edad || '-'}</td>
        <td>
          <span class="badge ${cliente.esCabina ? 'badge-info' : 'badge-secondary'}">
            ${cliente.esCabina ? 'Cabina' : 'General'}
          </span>
        </td>
        <td>${cliente.negocioOrigen || '-'}</td>
        <td>${trabajosCount}</td>
        <td>${fecha}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="adminApp.eliminarCliente(${cliente.id}, '${cliente.nombre}')">
            🗑️ Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (filtrados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-gray);">No hay clientes registrados</td></tr>';
    }
  },

  renderTrabajosResumen() {
    const container = document.getElementById('trabajosResumen');
    container.innerHTML = '';

    // Recopilar todos los trabajos con información del negocio
    const todosTrabajos = [];
    this.trabajos.forEach(trabajo => {
      const negocio = this.negocios.find(n => n.id === trabajo.negocioId);
      if (negocio) {
        todosTrabajos.push({...trabajo, negocioNombre: negocio.nombre, negocioIcono: this.getIconoNegocio(negocio.nombre)});
      }
    });

    // Ordenar: primero en_proceso, luego pendiente, luego completado, por fecha
    todosTrabajos.sort((a,b) => {
      const order = {en_proceso:1, pendiente:2, completado:3};
      const diffEstado = (order[a.estado]||999) - (order[b.estado]||999);
      if (diffEstado !== 0) return diffEstado;
      return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
    });

    // Resumen por negocio (tarjetas superiores) - ahora son filtros
    const resumenGrid = document.createElement('div');
    resumenGrid.className = 'trabajos-resumen-grid';
    
    // Botón "Todos"
    const cardTodos = document.createElement('div');
    cardTodos.className = `resumen-card filtro-card ${!this.filtroNegocio ? 'active' : ''}`;
    const totalTrabajos = this.trabajos.length;
    const totalPendientes = this.trabajos.filter(t => t.estado === 'pendiente').length;
    const totalEnProceso = this.trabajos.filter(t => t.estado === 'en_proceso').length;
    const totalCompletados = this.trabajos.filter(t => t.estado === 'completado').length;
    cardTodos.innerHTML = `
      <h3>🏢 Todos <span class="resumen-total">${totalTrabajos} trabajos</span></h3>
      <div class="resumen-stats">
        <div class="resumen-stat">
          <div class="resumen-stat-value warning">${totalPendientes}</div>
          <div class="resumen-stat-label">Pendientes</div>
        </div>
        <div class="resumen-stat">
          <div class="resumen-stat-value info">${totalEnProceso}</div>
          <div class="resumen-stat-label">En Proceso</div>
        </div>
        <div class="resumen-stat">
          <div class="resumen-stat-value success">${totalCompletados}</div>
          <div class="resumen-stat-label">Completados</div>
        </div>
      </div>
    `;
    cardTodos.addEventListener('click', () => {
      this.filtroNegocio = null;
      this.renderTrabajosResumen();
    });
    resumenGrid.appendChild(cardTodos);

    this.negocios.forEach(negocio => {
      const trabajosNegocio = this.trabajos.filter(t => t.negocioId === negocio.id);
      const pendientes = trabajosNegocio.filter(t => t.estado === 'pendiente').length;
      const enProceso = trabajosNegocio.filter(t => t.estado === 'en_proceso').length;
      const completados = trabajosNegocio.filter(t => t.estado === 'completado').length;

      const card = document.createElement('div');
      card.className = `resumen-card filtro-card ${this.filtroNegocio === negocio.id ? 'active' : ''}`;
      const icono = this.getIconoNegocio(negocio.nombre);
      card.innerHTML = `
        <h3>${icono} ${negocio.nombre} <span class="resumen-total">${trabajosNegocio.length} trabajos</span></h3>
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
      card.addEventListener('click', () => {
        this.filtroNegocio = negocio.id;
        this.renderTrabajosResumen();
      });
      resumenGrid.appendChild(card);
    });
    container.appendChild(resumenGrid);

    // Filtrar trabajos según selección
    const trabajosFiltrados = this.filtroNegocio 
      ? todosTrabajos.filter(t => t.negocioId === this.filtroNegocio)
      : todosTrabajos;

    // Lista de trabajos
    const listaSection = document.createElement('div');
    listaSection.className = 'trabajos-lista-section';
    const negocioSeleccionado = this.filtroNegocio ? this.negocios.find(n => n.id === this.filtroNegocio) : null;
    const tituloFiltro = negocioSeleccionado ? `${this.getIconoNegocio(negocioSeleccionado.nombre)} ${negocioSeleccionado.nombre}` : '🏢 Todos los Negocios';
    listaSection.innerHTML = `<h3 style="margin:1.5rem 0 .75rem; font-size:1rem">📋 Trabajos Recientes - ${tituloFiltro}</h3>`;
    const lista = document.createElement('div');
    lista.className = 'trabajos-lista';

    if (trabajosFiltrados.length === 0) {
      lista.innerHTML = '<div class="lista-empty">No hay trabajos registrados</div>';
    } else {
      trabajosFiltrados.slice(0,20).forEach(trabajo => {
        const item = document.createElement('div');
        item.className = `lista-item lista-item-${trabajo.estado}`;
        const clienteNombre = trabajo.cliente?.nombre || 'Cliente';
        const estadoLabel = {pendiente:'⏳ Pendiente', en_proceso:'▶️ En Proceso', completado:'✅ Completado', cancelado:'❌ Cancelado'}[trabajo.estado] || trabajo.estado;
        const fecha = new Date(trabajo.fechaCreacion);
        const fechaStr = fecha.toLocaleDateString('es-CR') + ' ' + fecha.toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'});
        
        // Calcular progreso según estado
        let progresoHTML = '';
        
        if (trabajo.estado === 'pendiente') {
          // Pendiente: 0% - esperando
          const fechaCreacion = new Date(trabajo.fechaCreacion);
          const horaCreacion = fechaCreacion.toLocaleTimeString('es-CR', {hour: '2-digit', minute: '2-digit'});
          
          progresoHTML = `
            <div class="lista-progreso progreso-pendiente">
              <div class="progreso-info">
                <span class="progreso-label">⏳ Esperando inicio desde ${horaCreacion}</span>
                <span class="progreso-estado">Pendiente</span>
              </div>
              <div class="progreso-barra">
                <div class="progreso-fill progreso-fill-pendiente" style="width: 0%"></div>
              </div>
            </div>
          `;
        } else if (trabajo.estado === 'en_proceso') {
          // En proceso: 50% - trabajando
          const inicio = trabajo.fechaInicio ? new Date(trabajo.fechaInicio) : new Date(trabajo.fechaCreacion);
          const horaInicio = inicio.toLocaleTimeString('es-CR', {hour: '2-digit', minute: '2-digit'});
          
          progresoHTML = `
            <div class="lista-progreso progreso-en-proceso">
              <div class="progreso-info">
                <span class="progreso-label">▶️ En progreso desde ${horaInicio}</span>
                <span class="progreso-porcentaje">50%</span>
              </div>
              <div class="progreso-barra">
                <div class="progreso-fill progreso-fill-en-proceso" style="width: 50%"></div>
              </div>
            </div>
          `;
        } else if (trabajo.estado === 'completado') {
          // Completado: 100% - terminado
          const horaFin = trabajo.fechaCompletado ? new Date(trabajo.fechaCompletado).toLocaleTimeString('es-CR', {hour: '2-digit', minute: '2-digit'}) : '';
          
          progresoHTML = `
            <div class="lista-progreso progreso-completado">
              <div class="progreso-info">
                <span class="progreso-label">✅ Terminado ${horaFin ? 'a las ' + horaFin : ''}</span>
                <span class="progreso-porcentaje">100%</span>
              </div>
              <div class="progreso-barra">
                <div class="progreso-fill progreso-fill-completado" style="width: 100%"></div>
              </div>
            </div>
          `;
        }
        
        item.innerHTML = `
          <div class="lista-item-header">
            <div class="lista-negocio">${trabajo.negocioIcono} ${trabajo.negocioNombre}</div>
            <div class="lista-estado">${estadoLabel}</div>
          </div>
          <div class="lista-cliente">${clienteNombre}</div>
          <div class="lista-descripcion">${trabajo.descripcion || 'Sin descripción'}</div>
          ${progresoHTML}
          <div class="lista-footer">
            <span class="lista-precio">${trabajo.precioEstimado ? '$'+parseFloat(trabajo.precioEstimado).toFixed(2) : 'Sin precio'}</span>
            <span class="lista-fecha">${fechaStr}</span>
          </div>
        `;
        lista.appendChild(item);
      });
    }
    listaSection.appendChild(lista);
    container.appendChild(listaSection);
  },

  getIconoNegocio(nombre) {
    return {'Cabinas':'🖥️','Impresión':'🖨️','Lavacar':'🚗'}[nombre] || '🏢';
  },

  abrirDetalleNegocio(negocioId) {
    const negocio = this.negocios.find(n => n.id === negocioId);
    if (!negocio) return;
    document.getElementById('detalleNegocioTitulo').textContent = `📂 ${negocio.nombre}`;
    this.detalleNegocioId = negocioId;
    this.estadoDetalleActivo = 'en_proceso';
    this.renderDetalleNegocio();
    this.showModal('detalleNegocio');
    // Tabs eventos
    document.querySelectorAll('#modalDetalleNegocio .detalle-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#modalDetalleNegocio .detalle-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.estadoDetalleActivo = btn.getAttribute('data-estado');
        this.renderDetalleNegocio();
      };
    });
  },

  renderDetalleNegocio() {
    const listado = document.getElementById('detalleListado');
    listado.innerHTML = '';
    const trabajosNegocio = this.trabajos.filter(t => t.negocioId === this.detalleNegocioId);
    const filtrados = trabajosNegocio.filter(t => this.estadoDetalleActivo === 'completado' ? t.estado === 'completado' : t.estado === this.estadoDetalleActivo);

    // Resumen counts
    const pendientes = trabajosNegocio.filter(t => t.estado === 'pendiente').length;
    const enProceso = trabajosNegocio.filter(t => t.estado === 'en_proceso').length;
    const completados = trabajosNegocio.filter(t => t.estado === 'completado').length;
    document.getElementById('detalleResumenCounts').textContent = `Pendientes: ${pendientes} | En Proceso: ${enProceso} | Completados: ${completados}`;

    if (filtrados.length === 0) {
      listado.innerHTML = '<div class="detalle-empty">No hay trabajos en esta categoría</div>';
      return;
    }

    filtrados.forEach(trabajo => {
      const clienteNombre = trabajo.cliente?.nombre || 'Cliente';
      const card = document.createElement('div');
      card.className = 'detalle-item';

      let meta = '';
      if (trabajo.estado === 'en_proceso') {
        const inicio = trabajo.fechaCreacion ? new Date(trabajo.fechaCreacion) : null;
        if (inicio) {
          const mins = Math.floor((Date.now() - inicio.getTime()) / 60000);
          meta = `<div class="detalle-progreso"><div class="barra"><div class="fill" style="width:${Math.min(100, mins)}%"></div></div><span>${mins} min</span></div>`;
        }
      }
      if (trabajo.estado === 'completado') {
        meta = `<span class="badge badge-success">Finalizado</span>`;
      }
      if (trabajo.estado === 'pendiente') {
        meta = `<span class="badge badge-warning">Pendiente</span>`;
      }

      card.innerHTML = `
        <div class="detalle-head">
          <div class="detalle-cliente">${clienteNombre}</div>
          <div class="detalle-estado ${trabajo.estado}">${trabajo.estado.replace('_',' ')}</div>
        </div>
        <div class="detalle-descripcion">${trabajo.descripcion || 'Sin descripción'}</div>
        ${meta}
        <div class="detalle-footer">
          <span class="detalle-precio">${trabajo.precioEstimado ? '$'+parseFloat(trabajo.precioEstimado).toFixed(2) : 'Sin precio'}</span>
          <span class="detalle-fecha">${new Date(trabajo.fechaCreacion).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      `;
      listado.appendChild(card);
    });
  },

  editarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) return;
    document.getElementById('editUsuarioId').value = usuario.id;
    document.getElementById('editUsuarioNombre').value = usuario.nombre || '';
    document.getElementById('editUsuarioUsername').value = usuario.username;
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
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            this.currentTab = tab;
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');
          });
        });

        // Filtros usuarios
        const filterNegocio = document.getElementById('filterNegocio');
        const filterBuscar = document.getElementById('filterBuscar');
        if (filterNegocio) {
          filterNegocio.addEventListener('change', () => {
            this.filtrosUsuarios.negocioId = filterNegocio.value;
            this.renderUsuarios();
          });
        }
        if (filterBuscar) {
          filterBuscar.addEventListener('input', () => {
            this.filtrosUsuarios.buscar = filterBuscar.value.trim();
            this.renderUsuarios();
          });
        }

        // Filtros clientes
        const filterTipoCliente = document.getElementById('filterTipoCliente');
        const filterBuscarCliente = document.getElementById('filterBuscarCliente');
        if (filterTipoCliente) {
          filterTipoCliente.addEventListener('change', () => {
            this.filtrosClientes.tipo = filterTipoCliente.value;
            this.renderClientes();
          });
        }
        if (filterBuscarCliente) {
          filterBuscarCliente.addEventListener('input', () => {
            this.filtrosClientes.buscar = filterBuscarCliente.value.trim();
            this.renderClientes();
          });
        }
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
      if (!select) return;
      this.negocios.forEach(negocio => {
        const option = document.createElement('option');
        option.value = negocio.id;
        option.textContent = negocio.nombre;
        select.appendChild(option);
      });
    });

    // Llenar filtro negocio
    if (filterNegocio) {
      this.negocios.forEach(negocio => {
        const opt = document.createElement('option');
        opt.value = negocio.id;
        opt.textContent = negocio.nombre;
        filterNegocio.appendChild(opt);
      });
    }

    // Form nuevo usuario
    document.getElementById('formNuevoUsuario').addEventListener('submit', async (e) => {
      e.preventDefault();

      const rol = document.getElementById('usuarioRol').value;
      const data = {
        nombre: document.getElementById('usuarioNombre').value,
        username: document.getElementById('usuarioUsername').value,
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
        nombre: document.getElementById('editUsuarioNombre').value,
        username: document.getElementById('editUsuarioUsername').value,
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

  nuevoTrabajador(negocioId) {
    // Abrir modal preseleccionando trabajador y negocio
    this.showModal('nuevoUsuario');
    document.getElementById('usuarioRol').value = 'trabajador';
    document.getElementById('negocioGroup').style.display = 'block';
    document.getElementById('usuarioNegocio').required = true;
    document.getElementById('usuarioNegocio').value = negocioId;
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

  eliminarCliente(id, nombre) {
    document.getElementById('deleteClienteId').value = id;
    document.getElementById('deleteClienteNombre').textContent = nombre;
    this.showModal('eliminarCliente');
  },

  async confirmarEliminarCliente() {
    const id = parseInt(document.getElementById('deleteClienteId').value);
    if (!id) return;

    try {
      await API.clientes.delete(id);
      this.closeModal('eliminarCliente');
      await this.loadClientes();
      this.renderClientes();
      alert('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar el cliente. Puede que tenga trabajos asociados.');
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
