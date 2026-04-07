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

interface WelcomeEmailProps {
  lawyerName: string;
  dashboardUrl: string;
}

export default function WelcomeEmail({ lawyerName, dashboardUrl }: WelcomeEmailProps) {
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
        <Preview>Bienvenido a tu nuevo Despacho Digital en Abogado-Sala</Preview>
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
                ¡Hola {lawyerName}, bienvenido! 👋
              </Heading>
              
              <Text className="text-base text-gray-700 leading-relaxed mb-4">
                Has completado la configuración de tu despacho exitosamente. Estamos emocionados de acompañarte en 
                la digitalización y optimización de tus procesos legales.
              </Text>

              <Text className="text-base text-gray-700 leading-relaxed mb-6">
                En Abogado-Sala podrás gestionar tus expedientes y mantenerte conectado con tus clientes 
                en un entorno centralizado, usando poderosas herramientas como nuestro editor inteligente.
              </Text>

              <Section className="text-center my-8">
                <Button
                  href={dashboardUrl}
                  className="bg-brand box-border text-white px-6 py-3 rounded-md font-medium text-center no-underline cursor-pointer"
                >
                  Ir al Dashboard
                </Button>
              </Section>
              
              <Hr className="border-solid border-gray-200 my-6 mx-0" />

              <Heading className="text-lg font-semibold text-gray-900 mb-3 mt-0">
                Siguientes pasos recomendados
              </Heading>
              <Text className="text-sm text-gray-600 leading-relaxed mb-2">
                1. <strong>Explora el editor:</strong> Prueba el editor de documentos para redactar más rápido. <br />
                2. <strong>Inicia tu primer caso:</strong> Crea un expediente y asigna tareas pendientes. <br />
                3. <strong>Invita a tu equipo:</strong> Si trabajas con colaboradores, envíales una invitación.
              </Text>
              
            </Section>

            {/* Footer */}
            <Section className="px-8 py-6 bg-gray-50 text-center border-0 border-t border-solid border-gray-200">
              <Text className="text-xs text-gray-500 m-0 leading-relaxed">
                Este correo te fue enviado porque te registraste en Abogado-Sala. <br />
                Si tienes dudas, responde a este correo para conectar con nuestro equipo de soporte. <br />
                © {new Date().getFullYear()} Abogado-Sala.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  lawyerName: 'Lic. García',
  dashboardUrl: 'https://abogados.zentyar.com/dashboard',
} satisfies WelcomeEmailProps;
