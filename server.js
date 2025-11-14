// Iniciar todo el sistema (backend + frontend) con un solo comando
// Uso: node server.js

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('========================================');
console.log('  🚀 Sistema DN - Iniciando...');
console.log('========================================\n');

// Función para matar procesos en un puerto (Windows)
async function killPort(port) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      
      if (pid && !isNaN(pid)) {
        try {
          await execPromise(`taskkill /PID ${pid} /F`);
          console.log(`   ✅ Proceso anterior en puerto ${port} cerrado`);
        } catch (e) {
          // Ignorar errores si el proceso ya no existe
        }
      }
    }
  } catch (e) {
    // Puerto no está en uso, continuar
  }
}

// Limpiar puertos antes de iniciar
console.log('🧹 Limpiando puertos...');
await killPort(3000); // Backend
await killPort(5173); // Frontend
console.log('');

// Iniciar Backend
console.log('📊 [1/2] Iniciando Backend...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

// Esperar 3 segundos y luego iniciar Frontend
setTimeout(() => {
  console.log('\n💻 [2/2] Iniciando Frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: join(__dirname, 'frontend'),
    shell: true,
    stdio: 'inherit'
  });

  frontend.on('error', (err) => {
    console.error('❌ Error al iniciar Frontend:', err);
  });
}, 3000);

backend.on('error', (err) => {
  console.error('❌ Error al iniciar Backend:', err);
});

// Manejar Ctrl+C para cerrar todo
process.on('SIGINT', () => {
  console.log('\n\n🛑 Deteniendo sistema...');
  backend.kill();
  process.exit();
});

console.log('\n========================================');
console.log('  ✅ Sistema Iniciado!');
console.log('========================================');
console.log('\n📱 Frontend: http://localhost:5173');
console.log('🔌 Backend:  http://localhost:3000\n');
console.log('Presiona Ctrl+C para detener todo\n');
