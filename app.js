const SUPABASE_URL = 'https://yizqjtuyfdfqlqspijgs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uAnHdms0QyDQq2HZjEs5Sg_7z4Vklt0'; // Pega aquí tu Publishable key
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('cert-form');
const tableBody = document.getElementById('cert-table-body');

async function cargarCertificados() {
  const { data, error } = await _supabase.from('certificados').select('*');
  if (error) return console.error(error);

  tableBody.innerHTML = data.map(c => `
    <tr>
      <td>${c.nombre}</td>
      <td>${c.fecha_vencimiento}</td>
      <td>${c.notificado ? '✅ Alerta Enviada' : '⏳ Pendiente'}</td>
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