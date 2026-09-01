const SUPABASE_URL = 'https://yizqjtuyfdfqlqspijgs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uAnHdms0QyDQq2HZjEs5Sg_7z4Vklt0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos DOM
const certForm = document.getElementById('cert-form');
const certTableBody = document.getElementById('cert-table-body');
const userForm = document.getElementById('user-form');
const userTableBody = document.getElementById('user-table-body');

// --- SECCIÓN CERTIFICADOS ---

function actualizarTarjetas(data) {
  const total = data.length;
  const pendientes = data.filter(c => !c.notificado).length;
  const notificados = data.filter(c => c.notificado).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pendientes').textContent = pendientes;
  document.getElementById('stat-notificados').textContent = notificados;
}

async function cargarCertificados() {
  const { data, error } = await _supabase.from('certificados').select('*');
  if (error) return console.error(error);

  actualizarTarjetas(data);

  certTableBody.innerHTML = data.map(c => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-6 font-medium text-slate-800">${c.nombre}</td>
      <td class="py-3 px-6 text-slate-600">${c.fecha_vencimiento}</td>
      <td class="py-3 px-6">
        ${c.notificado 
          ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">✅ Alerta Enviada</span>' 
          : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏳ Pendiente</span>'}
      </td>
    </tr>
  `).join('');
}

certForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCertificado = {
    nombre: document.getElementById('nombre').value,
    fecha_creacion: document.getElementById('fecha_creacion').value,
    fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
    email_notificacion: document.getElementById('email').value
  };

  const { error } = await _supabase.from('certificados').insert([nuevoCertificado]);
  if (!error) {
    certForm.reset();
    cargarCertificados();
    alert('Certificado guardado con éxito.');
  } else {
    alert('Error al guardar certificado en la base de datos.');
  }
});

// --- SECCIÓN USUARIOS ---

async function cargarUsuarios() {
  const { data, error } = await _supabase.from('usuarios').select('*');
  if (error) return console.error(error);

  userTableBody.innerHTML = data.map(u => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-6 font-medium text-slate-800">${u.nombre}</td>
      <td class="py-3 px-6 text-slate-600">${u.email}</td>
      <td class="py-3 px-6">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">${u.rol}</span>
      </td>
      <td class="py-3 px-6">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">● ${u.estado}</span>
      </td>
    </tr>
  `).join('');
}

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoUsuario = {
    nombre: document.getElementById('user-nombre').value,
    email: document.getElementById('user-email').value,
    rol: document.getElementById('user-rol').value
  };

  const { error } = await _supabase.from('usuarios').insert([nuevoUsuario]);
  if (!error) {
    userForm.reset();
    cargarUsuarios();
    alert('Usuario creado con éxito.');
  } else {
    alert('Error al guardar el usuario o el correo ya existe.');
  }
});

// --- EJECUCIÓN MANUAL ALERTAS ---

async function ejecutarChequeoManual() {
  const btn = document.getElementById('btn-ejecutar-cron');
  const textoOriginal = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando...';

    const res = await fetch('/.netlify/functions/check-expirations');
    const data = await res.text();

    alert(data && data.trim() !== '' ? `Respuesta: ${data}` : 'Alertas procesadas correctamente.');
    window.location.reload();
  } catch (error) {
    console.error('Error al ejecutar la función:', error);
    alert('Hubo un error al intentar enviar las alertas.');
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

// Cargas iniciales
cargarCertificados();
cargarUsuarios();