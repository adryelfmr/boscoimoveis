const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.body || req.payload);
    const { email, resetUrl } = payload;

    log('Enviando email de redefinição de senha para:', email);

    // Configurar transporter do Nodemailer com Brevo
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: 'adryelrocha71@gmail.com',
        pass: 'Adryel195030!',
      },
    });

    // Email de redefinição de senha
    const mailOptions = {
      from: '"Bosco Imóveis" <9c6f2b001@smtp-brevo.com>',
      to: email,
      replyTo: 'bosco.mr@hotmail.com',
      subject: '🔐 Redefinir sua senha - Bosco Imóveis',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 40px auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .header p {
              margin: 0;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px; 
            }
            .content p {
              margin: 0 0 20px 0;
              color: #475569;
            }
            .warning-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .warning-box strong {
              color: #92400e;
              display: block;
              margin-bottom: 8px;
            }
            .warning-box p {
              margin: 0;
              color: #78350f;
              font-size: 14px;
            }
            .button { 
              display: inline-block; 
              padding: 16px 40px; 
              background: #3b82f6; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
            }
            .button:hover {
              background: #2563eb;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .alternative-link {
              background: #f1f5f9;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .alternative-link p {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #64748b;
            }
            .alternative-link code {
              display: block;
              background: white;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              word-break: break-all;
              font-size: 12px;
              color: #1e293b;
              margin-top: 8px;
            }
            .info-list {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .info-list li {
              color: #475569;
              margin: 8px 0;
              padding-left: 8px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 5px 0;
              color: #64748b;
              font-size: 13px;
            }
            .security-notice {
              background: #dbeafe;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .security-notice p {
              margin: 0;
              color: #1e40af;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinir Senha</h1>
              <p>Solicitação de redefinição de senha</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Bosco Imóveis</strong>.</p>
              
              <div class="warning-box">
                <strong>⚠️ Atenção!</strong>
                <p>Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada e sua conta estará segura.</p>
              </div>

              <p>Para criar uma nova senha, clique no botão abaixo:</p>

              <div class="button-container">
                <a href="${resetUrl}" class="button">
                  Redefinir Minha Senha
                </a>
              </div>

              <div class="security-notice">
                <p><strong>🔒 Dica de Segurança:</strong> Este link expira em 1 hora por motivos de segurança.</p>
              </div>

              <div class="alternative-link">
                <p><strong>O botão não está funcionando?</strong></p>
                <p>Copie e cole o link abaixo no seu navegador:</p>
                <code>${resetUrl}</code>
              </div>

              <div class="info-list">
                <p><strong>📋 Informações importantes:</strong></p>
                <ul>
                  <li>Este link é válido por apenas <strong>1 hora</strong></li>
                  <li>Após redefinir, você precisará fazer login novamente</li>
                  <li>Escolha uma senha forte com pelo menos 8 caracteres</li>
                  <li>Não compartilhe sua senha com ninguém</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">Se você tiver alguma dúvida ou problema, entre em contato conosco:</p>
              
              <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0;"><strong>📞 Suporte:</strong></p>
                <p style="margin: 5px 0; color: #0c4a6e;">Email: bosco.mr@hotmail.com</p>
                <p style="margin: 5px 0; color: #0c4a6e;">Telefone: (62) 99404-5111</p>
                <p style="margin: 5px 0; color: #0c4a6e;">WhatsApp: <a href="https://wa.me/5562994045111" style="color: #0c4a6e;">Clique aqui</a></p>
              </div>
            </div>
            <div class="footer">
              <p><strong>Bosco Imóveis</strong></p>
              <p>Realizando o sonho da casa própria</p>
              <p>Goiânia, GO</p>
              <p style="margin-top: 15px; font-size: 11px; color: #94a3b8;">
                Este é um email automático, por favor não responda.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Enviar email
    log('Enviando email de redefinição...');
    await transporter.sendMail(mailOptions);

    log('Email enviado com sucesso!');

    return res.json({
      success: true,
      message: 'Email de redefinição enviado com sucesso',
    });
  } catch (err) {
    error('Erro ao enviar email:', err.message);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};