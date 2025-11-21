// Carga dinámica de Socket.io si no está disponible
(function(){
  if (typeof io !== 'undefined') return; // Ya está cargado
  console.log('Intentando cargar cliente Socket.io local...');
  const script = document.createElement('script');
  script.src = '/socket.io/socket.io.js';
  script.onload = () => console.log('Cliente Socket.io cargado correctamente desde /socket.io/');
  script.onerror = () => console.error('No se pudo cargar /socket.io/socket.io.js');
  document.head.appendChild(script);
})();
