const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  try {
    log("=== INÍCIO DA EXECUÇÃO - RESET PASSWORD ===");
    log("req.body:", JSON.stringify(req.body));
    
    // ✅ CORRIGIDO: Appwrite envia o body no campo "data"
    let payload;
    
    if (req.body && req.body.data) {
      payload = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data;
    } else if (req.bodyRaw) {
      payload = JSON.parse(req.bodyRaw);
    } else {
      payload = req.body;
    }
    
    log("✅ Payload parseado:", JSON.stringify(payload));

    const { email, resetUrl } = payload;

    if (!email || !resetUrl) {
      throw new Error(`email e resetUrl são obrigatórios! Recebido: ${JSON.stringify(payload)}`);
    }

    log("✅ Dados extraídos:", JSON.stringify({ email, resetUrl }));

    // ✅ Variáveis de ambiente
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@boscoimoveis.app';

    if (!SMTP_USER || !SMTP_PASS || !NOREPLY_EMAIL) {
      throw new Error("Variáveis SMTP faltando.");
    }

    log("✅ Variáveis SMTP configuradas");

    // ✅ Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    log("✅ Transporter criado");

    // ✅ Email ÚNICO - Redefinição de Senha (noreply@)
    const mailOptions = {
      from: `"Bosco Imóveis - Segurança" <${NOREPLY_EMAIL}>`,
      to: email,
      // ❌ SEM replyTo - não aceita respostas
      subject: "🔐 Redefinir sua senha - Bosco Imóveis",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #1e293b; 
              background: #f8fafc;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              padding: 40px 30px;
            }
            .content p {
              margin-bottom: 20px;
              font-size: 16px;
              color: #475569;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button { 
              display: inline-block; 
              padding: 16px 32px; 
              background: #1e3a8a; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              transition: background 0.3s;
            }
            .button:hover {
              background: #1e40af;
            }
            .alert-box {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .alert-box strong {
              color: #92400e;
              display: block;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .alert-box ul {
              margin-left: 20px;
              color: #78350f;
            }
            .alert-box li {
              margin: 8px 0;
              font-size: 14px;
            }
            .link-box {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              word-break: break-all;
            }
            .link-box p {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .link-box a {
              color: #3b82f6;
              font-size: 13px;
            }
            .footer { 
              text-align: center; 
              padding: 30px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #64748b;
              font-size: 13px;
              margin: 5px 0;
            }
            .footer strong {
              color: #1e293b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinir Senha</h1>
              <p>Solicitação de Nova Senha</p>
            </div>
            
            <div class="content">
              <p>Olá,</p>
              
              <p>Recebemos uma solicitação para <strong>redefinir a senha</strong> da sua conta no <strong>Bosco Imóveis</strong>.</p>
              
              <p>Para criar uma nova senha de acesso, clique no botão abaixo:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">🔑 Criar Nova Senha</a>
              </div>

              <div class="alert-box">
                <strong>⚠️ Informações Importantes:</strong>
                <ul>
                  <li>Este link é válido por <strong>1 hora</strong></li>
                  <li>Se você <strong>não solicitou</strong> esta redefinição, ignore este email</li>
                  <li>Nunca compartilhe este link com ninguém</li>
                  <li>Por segurança, você será desconectado de todos os dispositivos</li>
                </ul>
              </div>

              <div class="link-box">
                <p><strong>Link alternativo:</strong></p>
                <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
                <a href="${resetUrl}">${resetUrl}</a>
              </div>

              <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                Este é um email automático, por favor não responda.
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Bosco Imóveis</strong></p>
              <p>Realizando sonhos há mais de 10 anos</p>
              <p style="margin-top: 10px;">📍 Goiânia, GO | 📱 (62) 99404-5111</p>
              <p style="margin-top: 15px; font-size: 12px;">${new Date().toLocaleString('pt-BR', { 
                timeZone: 'America/Sao_Paulo',
                dateStyle: 'full',
                timeStyle: 'short'
              })}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
    
    log('📧 Enviando email de redefinição de senha...');
    const info = await transporter.sendMail(mailOptions);
    log('✅ Email enviado! MessageId:', info.messageId);

    return res.json({
      success: true,
      message: "Email de redefinição enviado com sucesso!",
      messageId: info.messageId
    });

  } catch (err) {
    error("=== ❌ ERRO NA EXECUÇÃO ===");
    error("Mensagem:", err.message);
    error("Stack:", err.stack);
    
    return res.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, 500);
  }
};
