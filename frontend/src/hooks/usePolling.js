import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para polling (actualización periódica)
 * @param {Function} callback - Función a ejecutar periódicamente
 * @param {number} interval - Intervalo en milisegundos (por defecto 15000 = 15 segundos)
 * @param {boolean} enabled - Si el polling está activo (por defecto true)
 */
export const usePolling = (callback, interval = 15000, enabled = true) => {
  const savedCallback = useRef();

  // Guardar el callback actual
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurar el polling
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Ejecutar inmediatamente
    tick();

    // Configurar intervalo
    const id = setInterval(tick, interval);

    // Limpiar al desmontar
    return () => clearInterval(id);
  }, [interval, enabled]);
};

export default usePolling;
