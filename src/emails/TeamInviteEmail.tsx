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

interface TeamInviteEmailProps {
  invitedByName: string; // Quien invita
  orgName: string; // Despacho al que te invitan
  inviteUrl: string; // Link con el token
  invitedEmail: string; // A quien invitan
}

export default function TeamInviteEmail({
  invitedByName,
  orgName,
  inviteUrl,
  invitedEmail,
}: TeamInviteEmailProps) {
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
        <Preview>Invitación para unirte al despacho {orgName}</Preview>
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
              <Heading className="text-2xl font-bold text-gray-900 mb-4 mt-0 text-center">
                Has sido invitado al equipo
              </Heading>
              
              <Text className="text-base text-gray-700 leading-relaxed mb-6 text-center">
                <strong>{invitedByName}</strong> te ha invitado a unirte y colaborar en la gestión de expedientes del despacho <strong>{orgName}</strong>.
              </Text>

              <Section className="text-center my-8">
                <Button
                  href={inviteUrl}
                  className="bg-brand box-border text-white px-6 py-3 rounded-md font-medium text-center no-underline cursor-pointer"
                >
                  Aceptar Invitación
                </Button>
              </Section>

              <Text className="text-sm text-gray-500 text-center">
                Este enlace de invitación es único e intransferible. Caducará en 7 días formales.
              </Text>
              
            </Section>

            <Hr className="border-solid border-gray-200 my-0 mx-8" />

            {/* Footer */}
            <Section className="px-8 py-6 bg-gray-50 text-center border-0 border-t border-solid border-gray-200">
              <Text className="text-xs text-gray-500 m-0 leading-relaxed">
                Este mensaje fue enviado a {invitedEmail}. <br />
                Si no esperabas esta invitación o no conoces al remitente, ignora este mensaje. <br />
                © {new Date().getFullYear()} Abogado-Sala. Todos los derechos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

TeamInviteEmail.PreviewProps = {
  invitedByName: 'Lic. Armando Gasca',
  orgName: 'Gasca & Asociados',
  invitedEmail: 'abogado@ejemplo.com',
  inviteUrl: 'https://abogados.zentyar.com/invite/tok_123abc',
} satisfies TeamInviteEmailProps;
