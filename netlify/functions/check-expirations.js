const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async () => {
  const fechaFormateada = new Date().toISOString().split('T')[0];

  // Buscar certificados que vencen hoy (o días pasados con .lte)
  const { data: certs, error } = await supabase
    .from('certificados')
    .select('*')
    .lte('fecha_vencimiento', fechaFormateada)
    .eq('notificado', false);

  if (error || !certs || certs.length === 0) {
    return { statusCode: 200, body: 'Revisión finalizada: No hay vencimientos pendientes.' };
  }

  for (const cert of certs) {
    try {
      // Enviar correo electrónico
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: cert.email_notificacion,
        subject: `⚠️ ALERTA: Tu certificado "${cert.nombre}" vence pronto`,
        html: `<p>Hola, el certificado <strong>${cert.nombre}</strong> vence el día de hoy (<strong>${cert.fecha_vencimiento}</strong>).</p>`
      });

      // Marcar en la base de datos como enviado
      await supabase.from('certificados').update({ notificado: true }).eq('id', cert.id);
    } catch (err) {
      console.error(`Error enviando a ${cert.email_notificacion}:`, err);
    }
  }

  return { statusCode: 200, body: `Proceso completado para ${certs.length} registros.` };
};