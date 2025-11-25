const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== INÍCIO DA EXECUÇÃO - RESET PASSWORD ===');
    log('req.body:', req.body);
    log('req.bodyRaw:', req.bodyRaw);
    log('req.payload:', req.payload);

    // ✅ CORRIGIR: Tentar diferentes formas de obter o payload
    let payload;
    
    if (req.body) {
      // Se body já é um objeto
      if (typeof req.body === 'string') {
        payload = JSON.parse(req.body);
      } else {
        payload = req.body;
      }
    } else if (req.bodyRaw) {
      // Tentar bodyRaw
      payload = JSON.parse(req.bodyRaw);
    } else if (req.payload) {
      // Tentar payload
      if (typeof req.payload === 'string') {
        payload = JSON.parse(req.payload);
      } else {
        payload = req.payload;
      }
    } else {
      throw new Error('Nenhum payload recebido');
    }

    const { email, resetUrl } = payload;

    log('Dados extraídos:', JSON.stringify({ email, resetUrl }));

    if (!email || !resetUrl) {
      throw new Error('Email e resetUrl são obrigatórios');
    }

    // Configurar transporter do Nodemailer com Brevo
    log('Configurando transporter...');
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: 'adryelrocha71@gmail.com',
        pass: 'Adryel195030!',
      },
    });

    log('Transporter configurado');

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
                <p>Se você não solicitou esta redefinição, ignore este email.</p>
              </div>

              <p>Para criar uma nova senha, clique no botão abaixo:</p>

              <div class="button-container">
                <a href="${resetUrl}" class="button">
                  Redefinir Minha Senha
                </a>
              </div>

              <p style="margin-top: 30px;">Se você tiver alguma dúvida, entre em contato:</p>
              
              <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0;"><strong>📞 Suporte:</strong></p>
                <p style="margin: 5px 0;">Email: bosco.mr@hotmail.com</p>
                <p style="margin: 5px 0;">Telefone: (62) 99404-5111</p>
              </div>
            </div>
            <div class="footer">
              <p><strong>Bosco Imóveis</strong></p>
              <p>Goiânia, GO</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Enviar email
    log('Enviando email de redefinição...');
    const info = await transporter.sendMail(mailOptions);
    log('Email enviado com sucesso! MessageId:', info.messageId);

    log('=== EMAIL ENVIADO COM SUCESSO ===');

    return res.json({
      success: true,
      message: 'Email de redefinição enviado com sucesso',
      messageId: info.messageId,
    });
  } catch (err) {
    error('=== ERRO NA EXECUÇÃO ===');
    error('Mensagem:', err.message);
    error('Stack:', err.stack);
    
    return res.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, 500);
  }
};