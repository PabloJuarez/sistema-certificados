const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const myHandler = async () => {
  const diasAntes = 7;
  const fechaObjetivo = new Date();
  fechaObjetivo.setDate(fechaObjetivo.getDate() + diasAntes);
  const fechaFormateada = fechaObjetivo.toISOString().split('T')[0];

  const { data: certs, error } = await supabase
    .from('certificados')
    .select('*')
    .eq('fecha_vencimiento', fechaFormateada)
    .eq('notificado', false);

  if (error || !certs || certs.length === 0) {
    return { statusCode: 200, body: 'Sin vencimientos pendientes hoy.' };
  }

  for (const cert of certs) {
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: cert.email_notificacion,
        subject: `⚠️ ALERTA: Tu certificado "${cert.nombre}" vence en 7 días`,
        html: `<p>Hola, el certificado <strong>${cert.nombre}</strong> vencerá el <strong>${cert.fecha_vencimiento}</strong>. Quedan 7 días para renovarlo.</p>`
      });

      await supabase.from('certificados').update({ notificado: true }).eq('id', cert.id);
    } catch (err) {
      console.error(`Error enviando a ${cert.email_notificacion}:`, err);
    }
  }

  return { statusCode: 200, body: `Enviadas ${certs.length} alertas.` };
};

// Se ejecuta automáticamente todos los días a las 8:00 AM UTC
exports.handler = schedule('0 8 * * *', myHandler);