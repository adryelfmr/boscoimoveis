import { Client, Users } from 'node-appwrite';
import fetch from 'node-fetch';

export default async ({ req, res, log, error }) => {
  try {
    const { email, resetUrl } = JSON.parse(req.body);

    if (!email || !resetUrl) {
      throw new Error('Email e resetUrl são obrigatórios');
    }

    log('📧 Solicitação de reset para:', email);

    // 1. Verificar se usuário existe no Appwrite
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new Users(client);

    let user;
    try {
      const userList = await users.list([`email=${email}`]);
      if (!userList.users.length) {
        throw new Error('Usuário não encontrado');
      }
      user = userList.users[0];
      log('✅ Usuário encontrado:', user.name);
    } catch (err) {
      error('❌ Usuário não encontrado:', err);
      return res.json({ success: false, message: 'Email não cadastrado' }, 404);
    }

    // 2. Gerar token de reset (Appwrite)
    log('🔑 Gerando token de reset...');
    const token = await users.createToken(user.$id);
    log('✅ Token gerado:', token.$id);

    // 3. Construir URL com token
    const resetUrlComplete = `${resetUrl}?userId=${user.$id}&secret=${token.secret}`;
    log('🔗 URL de reset:', resetUrlComplete);

    // 4. Enviar email via Brevo
    log('📧 Enviando email via Brevo...');
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Bosco Imóveis',
          email: 'noreply@boscoimoveis.app',
        },
        to: [{ email: email, name: user.name || 'Usuário' }],
        subject: '🔐 Redefinir sua senha - Bosco Imóveis',
        htmlContent: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: #f8fafc; 
                padding: 20px;
                margin: 0;
                line-height: 1.6;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
              }
              .header p {
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.95;
              }
              .content { 
                padding: 40px 30px;
              }
              .content p {
                margin: 0 0 15px;
                color: #334155;
                font-size: 16px;
              }
              .button-container {
                text-align: center;
                margin: 30px 0;
              }
              .button { 
                display: inline-block;
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white !important;
                padding: 16px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 6px rgba(30, 64, 175, 0.3);
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
              }
              .warning strong {
                color: #92400e;
                display: block;
                margin-bottom: 5px;
              }
              .warning p {
                color: #78350f;
                margin: 0;
                font-size: 14px;
              }
              .link-box {
                background: #f1f5f9;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
              }
              .link-box p {
                margin: 0 0 8px;
                color: #64748b;
                font-size: 13px;
                font-weight: 600;
              }
              .link-box a {
                color: #3b82f6;
                font-size: 13px;
                text-decoration: none;
              }
              .footer { 
                background: #f8fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
              }
              .footer p {
                margin: 5px 0;
                color: #64748b;
                font-size: 14px;
              }
              .footer strong {
                color: #1e293b;
                font-size: 16px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Redefinir Senha</h1>
                <p>Bosco Imóveis</p>
              </div>
              
              <div class="content">
                <p>Olá <strong>${user.name || 'Usuário'}</strong>,</p>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Bosco Imóveis</strong>.</p>
                
                <p>Para criar uma nova senha, clique no botão abaixo:</p>
                
                <div class="button-container">
                  <a href="${resetUrlComplete}" class="button">
                    🔑 Criar Nova Senha
                  </a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Informações importantes:</strong>
                  <p>• Este link expira em <strong>1 hora</strong></p>
                  <p>• Só pode ser usado <strong>uma vez</strong></p>
                  <p>• Se você não solicitou, ignore este email</p>
                </div>
                
                <div class="link-box">
                  <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
                  <a href="${resetUrlComplete}">${resetUrlComplete}</a>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>Bosco Imóveis</strong></p>
                <p>📍 Goiânia, GO</p>
                <p>📱 (62) 99404-5111</p>
                <p>🌐 <a href="https://boscoimoveis.app" style="color: #3b82f6; text-decoration: none;">boscoimoveis.app</a></p>
                <p style="margin-top: 15px; font-size: 12px; color: #94a3b8;">
                  Este é um email automático, por favor não responda.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      error('❌ Erro Brevo:', errorData);
      throw new Error(`Erro ao enviar email: ${errorData}`);
    }

    const brevoData = await brevoResponse.json();
    log('✅ Email enviado com sucesso! ID:', brevoData.messageId);

    return res.json({
      success: true,
      message: 'Email de redefinição enviado com sucesso!',
      messageId: brevoData.messageId,
    });

  } catch (err) {
    error('❌ Erro ao processar reset:', err);
    return res.json({
      success: false,
      message: err.message || 'Erro ao enviar email',
    }, 500);
  }
};