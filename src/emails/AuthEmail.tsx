import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Tailwind,
  pixelBasedPreset,
  Hr,
  Section,
} from '@react-email/components';

interface AuthEmailProps {
  emailActionType: 'signup' | 'recovery' | 'magiclink' | 'invite';
  actionUrl: string;
  userEmail?: string;
}

export default function AuthEmail({ emailActionType, actionUrl, userEmail }: AuthEmailProps) {
  // Configurar textos dinámicos basados en el tipo de acción
  let subject = '';
  let preview = '';
  let heading = '';
  let body = '';
  let buttonLabel = '';

  switch (emailActionType) {
    case 'signup':
      subject = 'Verifica tu correo electrónico - Abogado-Sala';
      preview = 'Completa tu registro confirmando tu correo';
      heading = 'Bienvenido a Abogado-Sala';
      body = 'Estás a un paso de digitalizar tu despacho. Haz clic en el siguiente enlace para verificar tu correo y comenzar a usar la plataforma.';
      buttonLabel = 'Verificar mi cuenta';
      break;
    case 'recovery':
      subject = 'Recuperación de contraseña - Abogado-Sala';
      preview = 'Instrucciones para restablecer tu contraseña';
      heading = 'Restablecer contraseña';
      body = 'Hemos recibido una solicitud para cambiar tu contraseña. Haz clic en el botón de abajo para elegir una nueva. Si no fuiste tú, ignora este correo de forma segura.';
      buttonLabel = 'Cambiar contraseña';
      break;
    case 'invite':
      subject = 'Has sido invitado a un despacho - Abogado-Sala';
      preview = 'Te han invitado a colaborar en Abogado-Sala';
      heading = 'Invitación al equipo';
      body = 'Un colega te ha invitado a unirte a su despacho en la plataforma. Acepta la invitación para acceder a sus expedientes y colaborar inmediatamente.';
      buttonLabel = 'Aceptar invitación';
      break;
    default:
      // Magic Link u otros
      subject = 'Inicia sesión en Abogado-Sala';
      preview = 'Tu enlace mágico para iniciar sesión';
      heading = 'Inicia sesión de forma segura';
      body = 'Usa este enlace rápido para entrar a tu cuenta. No requiere contraseña y expira en 24 horas.';
      buttonLabel = 'Iniciar Sesión Mágica';
      break;
  }

  return (
    <Html lang="es">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: '#4f46e5', // indigo-600
                bgDark: '#0f172a', // slate-900
              },
            },
          },
        }}
      >
        <Head />
        <Preview>{preview}</Preview>
        <Body className="bg-gray-100 font-sans py-10">
          <Container className="bg-white mx-auto border border-solid border-gray-200 rounded-lg shadow-sm max-w-[600px] overflow-hidden">
            {/* Header oscuro */}
            <Section className="bg-bgDark px-8 py-6 text-center border-0 border-b border-solid border-indigo-500/20">
              <Text className="text-white text-xl font-bold m-0 tracking-tight">
                Abogado-Sala
              </Text>
            </Section>

            {/* Contenido principal */}
            <Section className="px-8 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-4 mt-0">
                {heading}
              </Heading>
              
              <Text className="text-base text-gray-600 leading-relaxed mb-6">
                {body}
              </Text>

              <Section className="text-center my-8">
                <Button
                  href={actionUrl}
                  className="bg-brand box-border text-white px-6 py-3 rounded-md font-medium text-center no-underline cursor-pointer"
                >
                  {buttonLabel}
                </Button>
              </Section>

              {/* URL Fallback */}
              <Text className="text-sm text-gray-500 break-all bg-gray-50 p-4 rounded-md">
                Si el botón no funciona, copia y pega esta URL en tu navegador: <br />
                <a href={actionUrl} className="text-brand no-underline">{actionUrl}</a>
              </Text>
            </Section>

            <Hr className="border-solid border-gray-200 my-0 mx-8" />

            {/* Footer */}
            <Section className="px-8 py-6 bg-gray-50 text-center">
              <Text className="text-xs text-gray-500 m-0 leading-relaxed">
                Este correo fue enviado {userEmail ? `a ${userEmail} ` : ''}por Abogado-Sala. <br />
                © {new Date().getFullYear()} Abogado-Sala. Todos los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

AuthEmail.PreviewProps = {
  emailActionType: 'recovery',
  actionUrl: 'https://abogado-sala.com/auth/callback?code=fake-code',
  userEmail: 'ejemplo@correo.com',
} satisfies AuthEmailProps;
