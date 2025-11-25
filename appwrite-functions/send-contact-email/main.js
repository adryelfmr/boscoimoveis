const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async ({ req, res, log, error }) => {
  try {
    const payload = JSON.parse(req.body || req.payload);
    const { nome, email, telefone, mensagem } = payload;

    log('Recebendo dados de contato:', { nome, email });

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

    // ✅ Email para o ADMIN (seu email pessoal)
    const mailOptionsAdmin = {
      from: '"Bosco Imóveis" <9c6f2b001@smtp-brevo.com>',
      to: 'bosco.mr@hotmail.com', // ✅ SEU EMAIL PESSOAL
      replyTo: email, // ✅ Quando você responder, vai para o email do cliente
      subject: `🏠 Nova mensagem de contato - ${nome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; border-radius: 5px; }
            .label { font-weight: bold; color: #1e40af; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Nova Mensagem de Contato</h1>
              <p>Você recebeu uma nova mensagem pelo site</p>
            </div>
            <div class="content">
              <div class="info-box">
                <p><span class="label">👤 Nome:</span> ${nome}</p>
              </div>
              <div class="info-box">
                <p><span class="label">📧 Email:</span> <a href="mailto:${email}">${email}</a></p>
              </div>
              ${telefone ? `
                <div class="info-box">
                  <p><span class="label">📱 Telefone:</span> <a href="tel:${telefone}">${telefone}</a></p>
                  <p><a href="https://wa.me/55${telefone.replace(/\D/g, '')}" class="button" style="background: #25D366;">💬 Responder no WhatsApp</a></p>
                </div>
              ` : ''}
              <div class="info-box">
                <p><span class="label">💬 Mensagem:</span></p>
                <p style="white-space: pre-wrap; margin-top: 10px;">${mensagem}</p>
              </div>
              <div style="text-align: center;">
                <a href="https://boscoimoveis.com.br/gerenciar-contatos" class="button">Ver no Painel Admin</a>
              </div>
            </div>
            <div class="footer">
              <p>Bosco Imóveis - Sistema de Gestão de Contatos</p>
              <p>${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // ✅ Email de confirmação para o CLIENTE
    const mailOptionsCliente = {
      from: '"Bosco Imóveis" <9c6f2b001@smtp-brevo.com>',
      to: email, // ✅ Email do cliente
      replyTo: 'bosco.mr@hotmail.com', // ✅ Quando o cliente responder, vai para você
      subject: '✅ Recebemos sua mensagem - Bosco Imóveis',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mensagem Recebida!</h1>
              <p>Obrigado por entrar em contato</p>
            </div>
            <div class="content">
              <p>Olá <strong>${nome}</strong>,</p>
              <p>Recebemos sua mensagem e retornaremos em breve!</p>
              
              <div class="info-box">
                <p><strong>📝 Sua mensagem:</strong></p>
                <p style="white-space: pre-wrap; margin-top: 10px; color: #475569;">${mensagem}</p>
              </div>

              <p>Nossa equipe analisará sua solicitação e entrará em contato com você em breve.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://boscoimoveis.com.br" class="button">Visitar Site</a>
                <a href="https://wa.me/5562994045111" class="button" style="background: #25D366; margin-left: 10px;">💬 WhatsApp</a>
              </div>

              <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0;"><strong>📞 Contatos:</strong></p>
                <p style="margin: 5px 0;">Telefone: (62) 99404-5111</p>
                <p style="margin: 5px 0;">Email: bosco.mr@hotmail.com</p>
              </div>
            </div>
            <div class="footer">
              <p>Bosco Imóveis - Realizando o sonho da casa própria há mais de 10 anos</p>
              <p>Goiânia, GO</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Enviar emails
    log('Enviando email para admin...');
    await transporter.sendMail(mailOptionsAdmin);
    
    log('Enviando email de confirmação para cliente...');
    await transporter.sendMail(mailOptionsCliente);

    log('Emails enviados com sucesso!');

    return res.json({
      success: true,
      message: 'Emails enviados com sucesso',
    });
  } catch (err) {
    error('Erro ao enviar email:', err.message);
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};