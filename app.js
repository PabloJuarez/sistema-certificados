const SUPABASE_URL = 'https://esfplstkffzksmndjptb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzZnBsc3Rrb2Z6a3NtbmRqcHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODc2OTIsImV4cCI6MjA1Njg2MzY5Mn0.q1Xv30dK8NnK8yR2iT-N7372dZzG828y4O83z-nJp1k';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;
let perfilActual = null;

// ELEMENTOS DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// VERIFICAR SESIÓN AL CARGAR
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    usuarioActual = session.user;
    await cargarPerfil();
    mostrarApp();
  } else {
    mostrarLogin();
  }
});

// ESCUCHAR CAMBIOS DE ESTADO DE AUTH
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    usuarioActual = session.user;
    await cargarPerfil();
    mostrarApp();
  } else if (event === 'SIGNED_OUT') {
    usuarioActual = null;
    perfilActual = null;
    mostrarLogin();
  }
});

// INICIAR SESIÓN
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = 'Correo o contraseña incorrectos.';
    loginError.classList.remove('hidden');
  }
});

// CERRAR SESIÓN
async function cerrarSesion() {
  await supabaseClient.auth.signOut();
}

// CARGAR PERFIL DE USUARIO
async function cargarPerfil() {
  if (!usuarioActual) return;
  const { data, error } = await supabaseClient
    .from('perfiles')
    .select('*')
    .eq('id', usuarioActual.id)
    .single();

  if (data) {
    perfilActual = data;
    document.getElementById('user-display-name').textContent = data.nombre || usuarioActual.email;
    document.getElementById('user-display-role').textContent = data.rol;

    if (data.rol === 'Administrador') {
      document.getElementById('nav-usuarios').classList.remove('hidden');
    } else {
      document.getElementById('nav-usuarios').classList.add('hidden');
    }
  }
}

function mostrarLogin() {
  loginContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

function mostrarApp() {
  loginContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  cargarEstadisticas();
  cargarCertificados();
}

// NAVEGACIÓN
function cambiarSeccion(seccion) {
  document.getElementById('sec-panel').classList.add('hidden');
  document.getElementById('sec-certificados').classList.add('hidden');
  document.getElementById('sec-usuarios').classList.add('hidden');

  document.getElementById(`sec-${seccion}`).classList.remove('hidden');
}

// LÓGICA DE CERTIFICADOS
document.getElementById('cert-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('cert-nombre').value;
  const fecha_creacion = document.getElementById('cert-creacion').value;
  const fecha_vencimiento = document.getElementById('cert-vencimiento').value;
  const email_notificacion = document.getElementById('cert-email').value;

  const { error } = await supabaseClient.from('certificados').insert([{
    nombre, fecha_creacion, fecha_vencimiento, email_notificacion, estado: 'Activo'
  }]);

  if (!error) {
    e.target.reset();
    cargarEstadisticas();
    cargarCertificados();
    alert('Certificado guardado con éxito');
  }
});

async function cargarEstadisticas() {
  const { data } = await supabaseClient.from('certificados').select('*');
  if (data) {
    document.getElementById('stat-total').textContent = data.length;
  }
}

async function cargarCertificados() {
  const { data } = await supabaseClient.from('certificados').select('*');
  const tbody = document.getElementById('tabla-certificados');
  if (!tbody || !data) return;

  tbody.innerHTML = data.map(c => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-4 font-medium">${c.nombre}</td>
      <td class="p-4 text-slate-500">${c.fecha_creacion}</td>
      <td class="p-4 text-slate-500">${c.fecha_vencimiento}</td>
      <td class="p-4 text-slate-500">${c.email_notificacion}</td>
      <td class="p-4"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">${c.estado}</span></td>
    </tr>
  `).join('');
}