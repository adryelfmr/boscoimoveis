const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  try {
    log("=== INÍCIO DA EXECUÇÃO - RESET PASSWORD ===");
    log("req.body type:", typeof req.body);
    log("req.body:", JSON.stringify(req.body));
    log("req.bodyRaw:", req.bodyRaw);
    // ❌ REMOVIDO: log("req.bodyJson:", req.bodyJson);
    
    // ✅ Tentar parsear de diferentes formas
    let payload;
    
    if (typeof req.body === 'object' && req.body !== null && Object.keys(req.body).length > 0) {
      log("✅ req.body já é objeto válido");
      payload = req.body;
    } else if (typeof req.bodyRaw === 'string' && req.bodyRaw.trim() !== '') {
      log("✅ Parseando req.bodyRaw");
      payload = JSON.parse(req.bodyRaw);
    } else if (typeof req.body === 'string' && req.body.trim() !== '') {
      log("✅ Parseando req.body como string");
      payload = JSON.parse(req.body);
    } else {
      log("❌ Nenhum body válido encontrado");
      log("req.body:", req.body);
      log("req.bodyRaw:", req.bodyRaw);
      throw new Error("Nenhum payload válido recebido");
    }
    
    log("✅ Payload recebido:", JSON.stringify(payload));

    const { email, resetUrl } = payload;

    if (!email || !resetUrl) {
      throw new Error(`email e resetUrl são obrigatórios! Recebido: ${JSON.stringify(payload)}`);
    }

    log("✅ Dados extraídos:", JSON.stringify({ email, resetUrl }));

    // Variáveis de ambiente
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL || !ADMIN_EMAIL) {
      throw new Error("Variáveis SMTP faltando.");
    }

    log("✅ Variáveis SMTP configuradas");

    // Transporter
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

    // Conteúdo do e-mail
    const mailOptions = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: "🔐 Redefinir sua senha - Bosco Imóveis",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 15px 30px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinir Senha</h1>
              <p>Bosco Imóveis</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Este link expira em 1 hora</li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
                <li>Nunca compartilhe este link com ninguém</li>
              </ul>
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>Bosco Imóveis - Há mais de 10 anos realizando sonhos</p>
              <p>${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    log("📧 Enviando email...");
    const info = await transporter.sendMail(mailOptions);
    log("✅ Email enviado com sucesso! MessageId:", info.messageId);

    return res.json({
      success: true,
      message: "Email enviado com sucesso!",
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
