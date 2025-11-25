const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== INÍCIO DA EXECUÇÃO ===');
    
    // ✅ SIMPLIFICAR: Tentar pegar o body direto
    let payload;
    
    // O Appwrite já faz o parse do JSON automaticamente
    if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    } else if (typeof req.body === 'string') {
      payload = JSON.parse(req.body);
    } else {
      throw new Error('Payload inválido recebido');
    }

    log('Payload recebido:', JSON.stringify(payload));

    const { nome, email, telefone, mensagem } = payload;
    
    if (!nome || !email || !mensagem) {
      throw new Error('Dados obrigatórios faltando: nome, email ou mensagem');
    }

    log('Dados extraídos:', JSON.stringify({ nome, email, telefone }));

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

    // Email para o ADMIN
    const mailOptionsAdmin = {
      from: '"Bosco Imóveis" <9c6f2b001@smtp-brevo.com>',
      to: 'bosco.mr@hotmail.com',
      replyTo: email,
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
            .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Nova Mensagem de Contato</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <p><span class="label">👤 Nome:</span> ${nome}</p>
              </div>
              <div class="info-box">
                <p><span class="label">📧 Email:</span> ${email}</p>
              </div>
              ${telefone ? `
                <div class="info-box">
                  <p><span class="label">📱 Telefone:</span> ${telefone}</p>
                </div>
              ` : ''}
              <div class="info-box">
                <p><span class="label">💬 Mensagem:</span></p>
                <p>${mensagem}</p>
              </div>
            </div>
            <div class="footer">
              <p>Bosco Imóveis</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    log('Enviando email para admin...');
    const infoAdmin = await transporter.sendMail(mailOptionsAdmin);
    log('Email admin enviado! MessageId:', infoAdmin.messageId);

    log('=== SUCESSO ===');

    return res.json({
      success: true,
      message: 'Email enviado',
      messageId: infoAdmin.messageId,
    });
  } catch (err) {
    error('ERRO:', err.message);
    error('Stack:', err.stack);
    
    return res.json({
      success: false,
      error: err.message,
    }, 500);
  }
};