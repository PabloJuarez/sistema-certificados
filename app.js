const SUPABASE_URL = 'https://yizqjtuyfdfqlqspijgs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uAnHdms0QyDQq2HZjEs5Sg_7z4Vklt0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const pantallaLogin = document.getElementById('pantalla-login');
const pantallaApp = document.getElementById('pantalla-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const certForm = document.getElementById('cert-form');
const certTableBody = document.getElementById('cert-table-body');
const userForm = document.getElementById('user-form');
const userTableBody = document.getElementById('user-table-body');

let usuarioActualPerfil = null;

// --- GESTIÓN DE AUTH & SESIÓN ---

async function verificarSesion() {
  const { data: { session } } = await _supabase.auth.getSession();

  if (session) {
    pantallaLogin.classList.add('hidden');
    pantallaApp.classList.remove('hidden');

    // Obtener datos del perfil
    const { data: perfil } = await _supabase.from('perfiles').select('*').eq('id', session.user.id).single();
    usuarioActualPerfil = perfil || { nombre: session.user.email, rol: 'Operador' };

    document.getElementById('user-display-email').textContent = usuarioActualPerfil.nombre || session.user.email;
    document.getElementById('user-display-rol').textContent = usuarioActualPerfil.rol;

    if (usuarioActualPerfil.rol !== 'Administrador') {
      document.getElementById('nav-btn-usuarios').classList.add('hidden');
    } else {
      document.getElementById('nav-btn-usuarios').classList.remove('hidden');
    }

    cargarCertificados();
    if (usuarioActualPerfil.rol === 'Administrador') cargarUsuarios();
  } else {
    pantallaLogin.classList.remove('hidden');
    pantallaApp.classList.add('hidden');
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { error } = await _supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = 'Credenciales inválidas. Revisa tu correo o contraseña.';
    loginError.classList.remove('hidden');
  } else {
    loginForm.reset();
    verificarSesion();
  }
});

async function cerrarSesion() {
  await _supabase.auth.signOut();
  window.location.reload();
}

// --- GESTIÓN DE CERTIFICADOS ---

function actualizarTarjetas(data) {
  document.getElementById('stat-total').textContent = data.length;
  document.getElementById('stat-pendientes').textContent = data.filter(c => !c.notificado).length;
  document.getElementById('stat-notificados').textContent = data.filter(c => c.notificado).length;
}

async function cargarCertificados() {
  const { data, error } = await _supabase.from('certificados').select('*');
  if (error) return console.error(error);

  actualizarTarjetas(data);

  if (certTableBody) {
    certTableBody.innerHTML = data.map(c => `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-6 font-medium text-slate-800">${c.nombre}</td>
        <td class="py-3 px-6 text-slate-600">${c.fecha_vencimiento}</td>
        <td class="py-3 px-6 text-slate-600">${c.email_notificacion || c.email || '-'}</td>
        <td class="py-3 px-6">
          ${c.notificado 
            ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">✅ Enviado</span>' 
            : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏳ Pendiente</span>'}
        </td>
      </tr>
    `).join('');
  }
}

certForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCertificado = {
    nombre: document.getElementById('nombre').value,
    fecha_creacion: document.getElementById('fecha_creacion').value,
    fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
    email_notificacion: document.getElementById('email').value,
    notificado: false
  };

  const { error } = await _supabase.from('certificados').insert([nuevoCertificado]);

  if (!error) {
    certForm.reset();
    cargarCertificados();
    alert('Certificado guardado con éxito.');
  } else {
    alert('Error al guardar en Supabase: ' + error.message);
  }
});

// --- GESTIÓN DE USUARIOS ---

async function cargarUsuarios() {
  const { data: perfiles, error } = await _supabase.from('perfiles').select('*');
  if (error) return console.error(error);

  if (userTableBody) {
    userTableBody.innerHTML = perfiles.map(u => `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-6 font-medium text-slate-800">${u.nombre}</td>
        <td class="py-3 px-6">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">${u.rol}</span>
        </td>
      </tr>
    `).join('');
  }
}

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('user-nombre').value;
  const email = document.getElementById('user-email').value;
  const rol = document.getElementById('user-rol').value;
  const password = document.getElementById('user-pass').value;

  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, rol } }
  });

  if (error) {
    alert('Error al registrar usuario en Auth: ' + error.message);
    return;
  }

  if (data?.user) {
    await _supabase.from('perfiles').insert([{ id: data.user.id, nombre, rol }]);
    userForm.reset();
    cargarUsuarios();
    alert('Usuario creado correctamente.');
  }
});

// --- ACCIÓN MANUAL DE ALERTAS ---

async function ejecutarChequeoManual() {
  const btn = document.getElementById('btn-ejecutar-cron');
  const textoOriginal = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando...';

    const res = await fetch('/.netlify/functions/check-expirations');
    const data = await res.text();

    alert(data && data.trim() !== '' ? `Resultado: ${data}` : 'Alertas ejecutadas.');
    window.location.reload();
  } catch (err) {
    alert('Error al conectar con la función de Netlify.');
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

verificarSesion();