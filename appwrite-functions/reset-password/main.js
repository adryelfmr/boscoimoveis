const nodemailer = require("nodemailer");

module.exports = async ({ req, res, log, error }) => {
  try {
    log("▶ INICIANDO FUNÇÃO DE RESET PASSWORD");

    // 1️⃣ PEGAR O PAYLOAD DO APPWRITE (única fonte confiável)
    if (!req.variables || !req.variables.APPWRITE_FUNCTION_DATA) {
      throw new Error("Nenhum payload recebido. Envie via { data: JSON.stringify(...) }");
    }

    const payload = JSON.parse(req.variables.APPWRITE_FUNCTION_DATA);
    log("📦 PAYLOAD RECEBIDO:", JSON.stringify(payload));

    const { email, resetUrl } = payload;

    if (!email || !resetUrl) {
      throw new Error("Campos obrigatórios ausentes: email e resetUrl.");
    }

    // 2️⃣ Variáveis de ambiente
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL || !ADMIN_EMAIL) {
      throw new Error("Variáveis de ambiente SMTP faltando.");
    }

    // 3️⃣ Configurar envio via Brevo
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // 4️⃣ Email
    const mailOptions = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
      subject: "🔐 Redefinir sua senha - Bosco Imóveis",
      html: `
        <h2>Olá!</h2>
        <p>Clique abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}" style="padding:12px 22px;background:#1e40af;color:white;border-radius:8px;text-decoration:none;">
          Redefinir Senha
        </a>
        <p>Se não foi você, ignore este email.</p>
      `,
    };

    // 5️⃣ Enviar email
    const info = await transporter.sendMail(mailOptions);
    log("✅ EMAIL ENVIADO:", info.messageId);

    return res.json({ success: true, message: "Email enviado!" });

  } catch (err) {
    error("❌ ERRO:", err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
