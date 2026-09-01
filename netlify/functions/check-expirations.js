const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async () => {
  // Definir margen de aviso: 7 días antes del vencimiento

  const fechaFormateada = new Date().toISOString().split('T')[0];

  // Buscar certificados que vencen en 7 días exactos
  const { data: certs, error } = await supabase
    .from('certificados')
    .select('*')
    .eq('fecha_vencimiento', fechaFormateada)
    .eq('notificado', false);

  if (error || !certs || certs.length === 0) {
    return { statusCode: 200, body: 'Revisión finalizada: No hay vencimientos próximos hoy.' };
  }

  for (const cert of certs) {
    // Enviar correo electrónico
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: cert.email_notificacion,
      subject: `⚠️ ALERTA: Tu certificado "${cert.nombre}" vence pronto`,
      html: `<p>Hola, el certificado <strong>${cert.nombre}</strong> vencerá el <strong>${cert.fecha_vencimiento}</strong>. Quedan 7 días para renovarlo.</p>`
    });

    // Marcar en la base de datos como enviado
    await supabase.from('certificados').update({ notificado: true }).eq('id', cert.id);
  }

  return { statusCode: 200, body: `Se enviaron ${certs.length} alertas.` };
};