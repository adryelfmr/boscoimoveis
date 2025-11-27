const sdk = require('node-appwrite');
const nodemailer = require('nodemailer');

// ✅ NOVO: Armazenamento de rate limit em memória (persiste durante execução da função)
const rateLimitStore = new Map();

/**
 * Verifica rate limit no backend
 */
function checkRateLimit(email) {
  const now = Date.now();
  const key = `contact:${email}`;
  
  // Limpar registros antigos (mais de 1 hora)
  for (const [k, data] of rateLimitStore.entries()) {
    if (now - data.firstAttempt > 3600000) {
      rateLimitStore.delete(k);
    }
  }
  
  const userData = rateLimitStore.get(key) || { attempts: [], firstAttempt: now };
  
  // Filtrar apenas tentativas da última hora
  userData.attempts = userData.attempts.filter(timestamp => now - timestamp < 3600000);
  
  // Máximo 3 envios por hora
  if (userData.attempts.length >= 3) {
    const oldestAttempt = Math.min(...userData.attempts);
    const resetTime = oldestAttempt + 3600000;
    const waitMinutes = Math.ceil((resetTime - now) / 60000);
    
    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      waitMinutes,
    };
  }
  
  // Registrar tentativa
  userData.attempts.push(now);
  rateLimitStore.set(key, userData);
  
  return {
    allowed: true,
    remainingAttempts: 3 - userData.attempts.length,
  };
}

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== INÍCIO DA EXECUÇÃO ===');
    log('req.body:', JSON.stringify(req.body));
    
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
    
    log('✅ Payload parseado:', JSON.stringify(payload));

    const { nome, email, telefone, mensagem } = payload;
    
    if (!nome || !email || !mensagem) {
      throw new Error(`Dados obrigatórios faltando. Recebido: ${JSON.stringify(payload)}`);
    }

    // ✅ NOVO: Verificar rate limit no backend
    const limitCheck = checkRateLimit(email);
    
    if (!limitCheck.allowed) {
      log(`⚠️ Rate limit excedido para ${email}`);
      return res.json({
        success: false,
        error: 'rate_limit_exceeded',
        message: `Você excedeu o limite de envios. Aguarde ${limitCheck.waitMinutes} minutos.`,
        waitMinutes: limitCheck.waitMinutes,
      }, 429); // HTTP 429 Too Many Requests
    }

    log(`✅ Rate limit OK para ${email}. Envios restantes: ${limitCheck.remainingAttempts}`);
    log('✅ Dados extraídos:', JSON.stringify({ nome, email, telefone }));

    // ✅ Usar variáveis de ambiente corretas
    const SMTP_USER = process.env.BREVO_SMTP_USER;
    const SMTP_PASS = process.env.BREVO_SMTP_PASS;
    const CONTATO_EMAIL = process.env.CONTATO_EMAIL || 'contato@boscoimoveis.app'; // ✅ Email que aceita respostas
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SMTP_USER || !SMTP_PASS || !CONTATO_EMAIL || !ADMIN_EMAIL) {
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

    // ✅ Email para o ADMIN (como contato@boscoimoveis.app)
    const mailOptionsAdmin = {
      from: `"Bosco Imóveis - Formulário" <${CONTATO_EMAIL}>`, // ✅ Usar contato@
      to: ADMIN_EMAIL, // Seu Gmail pessoal
      replyTo: email, // ✅ Cliente pode responder diretamente
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

    // ✅ Email de confirmação para o CLIENTE
    const mailOptionsCliente = {
      from: `"Bosco Imóveis" <${CONTATO_EMAIL}>`, // ✅ Usar contato@
      to: email,
      replyTo: CONTATO_EMAIL, // ✅ Cliente pode responder para contato@
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
                <p style="margin: 5px 0;">Email: ${CONTATO_EMAIL}</p>
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
      remainingAttempts: limitCheck.remainingAttempts,
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