const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  try {
    log("▶ INICIANDO FUNÇÃO DE RESET PASSWORD");

    let payload = null;

    // 1️⃣ VERIFICAR SE O FRONT ENVIADO JSON NO HTTP (bodyRaw)
    if (req.bodyRaw) {
      log("📩 Dados recebidos via req.bodyRaw");
      payload = JSON.parse(req.bodyRaw);
    }

    // 2️⃣ SE FOI ENVIADO DENTRO DE DATA (APPWRITE PADRÃO)
    else if (req.variables && req.variables.APPWRITE_FUNCTION_DATA) {
      log("📦 Dados recebidos via APPWRITE_FUNCTION_DATA");
      payload = JSON.parse(req.variables.APPWRITE_FUNCTION_DATA);
    }

    // 3️⃣ ERRO SE NADA FOI RECEBIDO
    if (!payload) {
      throw new Error("Nenhum body válido recebido.");
    }

    log("📦 PAYLOAD:", JSON.stringify(payload));

    const { email, resetUrl } = payload;

    if (!email || !resetUrl) {
      throw new Error("email e resetUrl são obrigatórios!");
    }

    // 4️⃣ Variáveis de ambiente
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL || !ADMIN_EMAIL) {
      throw new Error("Variáveis SMTP faltando.");
    }

    // 5️⃣ Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // 6️⃣ Conteúdo do e-mail
    const mailOptions = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: "🔐 Redefinir sua senha",
      html: `
        <h2>Redefinir senha</h2>
        <p>Clique abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="padding:12px 18px;background:#1e3a8a;color:white;border-radius:8px;text-decoration:none;">
          Redefinir Senha
        </a>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    log("✅ Email enviado:", info.messageId);

    return res.json({
      success: true,
      message: "Email enviado!",
      id: info.messageId
    });

  } catch (err) {
    error("❌ ERRO:", err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
