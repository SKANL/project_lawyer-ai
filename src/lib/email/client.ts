import { Resend } from 'resend';

// Inicializar el SDK de Resend. Si no hay API KEY (desarrollo local), fallará gracefully en los envíos si enviamos desde una Edge Function / Route Handler.
export const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

/**
 * Dirección "From" por defecto.
 * Como tienes verificado mail.zentyar.com, los correos deben salir desde un usuario de ese dominio.
 */
export const DEFAULT_FROM_EMAIL = 'Soporte Abogado-Sala <hola@mail.zentyar.com>';

export async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  idempotencyKey?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ [EMAIL] RESEND_API_KEY no detectada. Ignorando envío de correo real.');
    return { error: 'RESEND_API_KEY no configurada' };
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from: DEFAULT_FROM_EMAIL,
        to,
        subject,
        react,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (error) {
      console.error('❌ [EMAIL] Error enviando correo:', error);
      return { error: error.message };
    }

    return { data };
  } catch (err: unknown) {
    console.error('❌ [EMAIL] Excepción inesperada:', err);
    return { error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
