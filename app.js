const SUPABASE_URL = 'https://yizqjtuyfdfqlqspijgs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uAnHdms0QyDQq2HZjEs5Sg_7z4Vklt0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('cert-form');
const tableBody = document.getElementById('cert-table-body');

// Función para actualizar las métricas del panel superior
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

  // 1. Actualiza los contadores de las tarjetas de color
  actualizarTarjetas(data);

  // 2. Renderiza la tabla con los registros
  tableBody.innerHTML = data.map(c => `
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCertificado = {
    nombre: document.getElementById('nombre').value,
    fecha_creacion: document.getElementById('fecha_creacion').value,
    fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
    email_notificacion: document.getElementById('email').value
  };

  const { error } = await _supabase.from('certificados').insert([nuevoCertificado]);
  if (!error) {
    form.reset();
    cargarCertificados();
  } else {
    alert('Error al guardar certificado en la base de datos.');
  }
});

cargarCertificados();