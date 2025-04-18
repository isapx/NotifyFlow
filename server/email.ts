import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const DEFAULT_FROM_EMAIL = 'noreply@notifyflow.app';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Servicio para enviar correos electrónicos usando SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: DEFAULT_FROM_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

/**
 * Enviar correo de verificación de cuenta
 */
export async function sendVerificationEmail(
  email: string,
  displayName: string,
  verificationToken: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verifica tu correo electrónico</h2>
      <p>Hola ${displayName},</p>
      <p>Gracias por registrarte en NotifyFlow. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente enlace:</p>
      <p style="margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verificar correo electrónico
        </a>
      </p>
      <p>Si no creaste una cuenta con nosotros, por favor ignora este correo.</p>
      <p>Atentamente,<br>El equipo de NotifyFlow</p>
    </div>
  `;
  
  const textContent = `
    Verifica tu correo electrónico
    
    Hola ${displayName},
    
    Gracias por registrarte en NotifyFlow. Para completar tu registro, por favor verifica tu correo electrónico visitando el siguiente enlace:
    
    ${verificationUrl}
    
    Si no creaste una cuenta con nosotros, por favor ignora este correo.
    
    Atentamente,
    El equipo de NotifyFlow
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - NotifyFlow',
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Enviar correo de restablecimiento de contraseña
 */
export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  resetToken: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Restablece tu contraseña</h2>
      <p>Hola ${displayName},</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en NotifyFlow. Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo y tu contraseña permanecerá sin cambios.</p>
      <p>Este enlace expirará en 1 hora por seguridad.</p>
      <p>Atentamente,<br>El equipo de NotifyFlow</p>
    </div>
  `;
  
  const textContent = `
    Restablece tu contraseña
    
    Hola ${displayName},
    
    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en NotifyFlow. Visita el siguiente enlace para establecer una nueva contraseña:
    
    ${resetUrl}
    
    Si no solicitaste restablecer tu contraseña, puedes ignorar este correo y tu contraseña permanecerá sin cambios.
    
    Este enlace expirará en 1 hora por seguridad.
    
    Atentamente,
    El equipo de NotifyFlow
  `;
  
  return sendEmail({
    to: email,
    subject: 'Restablece tu contraseña - NotifyFlow',
    html: htmlContent,
    text: textContent,
  });
}