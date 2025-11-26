const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== INÍCIO DA EXECUÇÃO ===');
    log('req.body:', JSON.stringify(req.body));
    
    // ✅ CORRIGIDO: Appwrite envia o body no campo "data"
    let payload;
    
    if (req.body && req.body.data) {
      // Se vier como JSON string no campo "data"
      payload = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body.data;
    } else if (req.bodyRaw) {
      // Fallback para bodyRaw
      payload = JSON.parse(req.bodyRaw);
    } else {
      // Usar req.body diretamente
      payload = req.body;
    }
    
    log('✅ Payload parseado:', JSON.stringify(payload));

    const { nome, email, telefone, mensagem } = payload;
    
    if (!nome || !email || !mensagem) {
      throw new Error(`Dados obrigatórios faltando. Recebido: ${JSON.stringify(payload)}`);
    }

    log('✅ Dados extraídos:', JSON.stringify({ nome, email, telefone }));

    // ✅ Usar variáveis de ambiente
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !FROM_EMAIL || !ADMIN_EMAIL) {
      throw new Error('Variáveis de ambiente SMTP não configuradas');
    }

    log('Configurando transporter...');
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    log('✅ Transporter configurado');

    // Email para o ADMIN
    const mailOptionsAdmin = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
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
                <p><span class="label">📧 Email:</span> <a href="mailto:${email}">${email}</a></p>
              </div>
              ${telefone ? `
                <div class="info-box">
                  <p><span class="label">📱 Telefone:</span> <a href="tel:${telefone}">${telefone}</a></p>
                  <p><a href="https://wa.me/55${telefone.replace(/\D/g, '')}" style="background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">💬 Responder no WhatsApp</a></p>
                </div>
              ` : ''}
              <div class="info-box">
                <p><span class="label">💬 Mensagem:</span></p>
                <p style="white-space: pre-wrap;">${mensagem}</p>
              </div>
              <div style="text-align: center; margin-top: 20px;">
                <a href="https://boscoimoveis.app/gerenciar-contatos" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver no Painel Admin</a>
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

    log('📧 Enviando email para admin...');
    const infoAdmin = await transporter.sendMail(mailOptionsAdmin);
    log('✅ Email admin enviado! MessageId:', infoAdmin.messageId);

    // Email de confirmação para o CLIENTE
    const mailOptionsCliente = {
      from: `"Bosco Imóveis" <${FROM_EMAIL}>`,
      to: email,
      replyTo: ADMIN_EMAIL,
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
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
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
                <a href="https://boscoimoveis.app" class="button">Visitar Site</a>
                <a href="https://wa.me/5562994045111" class="button" style="background: #25D366;">💬 WhatsApp</a>
              </div>

              <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0;"><strong>📞 Contatos:</strong></p>
                <p style="margin: 5px 0;">Telefone: (62) 99404-5111</p>
                <p style="margin: 5px 0;">Email: ${ADMIN_EMAIL}</p>
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
    
    log('📧 Enviando email para cliente...');
    const infoCliente = await transporter.sendMail(mailOptionsCliente);
    log('✅ Email cliente enviado! MessageId:', infoCliente.messageId);

    log('=== ✅ EMAILS ENVIADOS COM SUCESSO ===');

    return res.json({
      success: true,
      message: 'Emails enviados com sucesso',
      adminMessageId: infoAdmin.messageId,
      clienteMessageId: infoCliente.messageId,
    });
  } catch (err) {
    error('=== ❌ ERRO NA EXECUÇÃO ===');
    error('Mensagem:', err.message);
    error('Stack:', err.stack);
    
    return res.json({
      success: false,
      error: err.message,
      stack: err.stack,
    }, 500);
  }
};