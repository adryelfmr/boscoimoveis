const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  try {
    log("=== INÍCIO DA EXECUÇÃO - RESET PASSWORD ===");

    // 🟦 1. Capturar payload corretamente no Appwrite
    let payload;

    if (req.variables && req.variables.APPWRITE_FUNCTION_DATA) {
      log("➡ Dados vieram de APPWRITE_FUNCTION_DATA");
      payload = JSON.parse(req.variables.APPWRITE_FUNCTION_DATA);
    } else if (req.bodyRaw) {
      log("➡ Dados vieram de req.bodyRaw");
      payload = JSON.parse(req.bodyRaw);
    } else if (typeof req.body === "object" && req.body !== null) {
      log("➡ Dados vieram de req.body (objeto)");
      payload = req.body;
    } else {
      throw new Error("Nenhum body válido encontrado");
    }

    log("📦 Payload recebido:", JSON.stringify(payload));

    const { email, resetUrl } = payload;

    if (!email || !resetUrl) {
      throw new Error(
        `Email e resetUrl são obrigatórios. Recebido: ${JSON.stringify(payload)}`
      );
    }

    // 🟦 2. Variáveis de ambiente (Brevo)
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL || !ADMIN_EMAIL) {
      throw new Error(
        "Variáveis de ambiente SMTP faltando. Necessárias: BREVO_SMTP_USER, BREVO_SMTP_PASS, BREVO_FROM_EMAIL, ADMIN_EMAIL"
      );
    }

    log("🔐 Variáveis de ambiente carregadas com sucesso");

    // 🟦 3. Configurar transporter da Brevo (Nodemailer)
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    log("📡 Transporter configurado com sucesso");

    // 🟦 4. Conteúdo do e-mail
    const mailOptions = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: "🔐 Redefinir sua senha - Bosco Imóveis",
      html: `
        <h2>Olá!</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Para continuar, clique no botão abaixo:</p>

        <p>
          <a href="${resetUrl}" 
          style="display:inline-block;padding:12px 24px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;">
            Redefinir Senha
          </a>
        </p>

        <p>Se você não solicitou isso, ignore este e-mail.</p>

        <p style="margin-top:30px;font-size:12px;color:#555;">
          Atenciosamente,<br>
          <strong>Bosco Imóveis</strong>
        </p>
      `,
    };

    // 🟦 5. Enviar email
    log("📧 Enviando email de redefinição...");
    const info = await transporter.sendMail(mailOptions);

    log("✅ Email enviado! MessageId:", info.messageId);

    return res.json({
      success: true,
      message: "Email enviado com sucesso.",
      messageId: info.messageId,
    });
  } catch (err) {
    error("❌ ERRO:", err.message);
    error(err.stack);

    return res.json(
      {
        success: false,
        error: err.message,
        stack: err.stack,
      },
      500
    );
  }
};
