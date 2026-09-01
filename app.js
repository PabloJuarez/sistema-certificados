const SUPABASE_URL = 'https://yizqjtuyfdfqlqspijgs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uAnHdms0QyDQq2HZjEs5Sg_7z4Vklt0';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('cert-form');
const tableBody = document.getElementById('cert-table-body');

// 1. Función para actualizar las tarjetas de métricas
function actualizarTarjetas(data) {
  const total = data.length;
  const pendientes = data.filter(c => !c.notificado).length;
  const notificados = data.filter(c => c.notificado).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pendientes').textContent = pendientes;
  document.getElementById('stat-notificados').textContent = notificados;
}

// 2. Cargar registros y renderizar en la tabla del módulo Certificados
async function cargarCertificados() {
  const { data, error } = await _supabase.from('certificados').select('*');
  if (error) return console.error(error);

  actualizarTarjetas(data);

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

// 3. Registrar un nuevo certificado y limpiar campos
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
    alert('Certificado guardado con éxito.');
  } else {
    alert('Error al guardar certificado en la base de datos.');
  }
});

// 4. Ejecutar chequeo manual llamando a la Netlify Function
async function ejecutarChequeoManual() {
  const btn = document.getElementById('btn-ejecutar-cron');
  const textoOriginal = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '⏳ Procesando...';

    const res = await fetch('/.netlify/functions/check-expirations');
    const data = await res.text();

    alert(`Respuesta del servidor: ${data}`);
    cargarCertificados();
  } catch (error) {
    console.error('Error al ejecutar la función:', error);
    alert('Hubo un error al intentar enviar las alertas.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

// Inicializar la carga de datos
cargarCertificados();