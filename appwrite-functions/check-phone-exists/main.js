const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== 📞 CHECK PHONE EXISTS - INÍCIO ===');
    
    let phone;
    
    // ✅ Tentar ler de variáveis de ambiente primeiro
    phone = process.env.PHONE_TO_CHECK;
    
    // ✅ Se não tiver, tentar ler do body
    if (!phone) {
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
      
      phone = payload?.PHONE_TO_CHECK || payload?.phone;
    }
    
    log('Telefone recebido:', phone);
    
    if (!phone) {
      error('❌ Telefone não fornecido');
      return res.json({ 
        error: 'Telefone é obrigatório',
      }, 400);
    }

    const phoneClean = phone.replace(/\D/g, '');
    log(`📱 Telefone limpo: ${phoneClean}`);

    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new sdk.Users(client);

    try {
      log('🔍 Buscando usuários com telefone:', phone);
      
      const userList = await users.list([
        sdk.Query.equal('phone', phone)
      ]);

      log(`📊 Total de usuários encontrados: ${userList.total}`);

      if (userList.total > 0) {
        log('⚠️ TELEFONE JÁ CADASTRADO');
        log(`Usuário: ${userList.users[0].email}`);
        
        return res.json({
          exists: true,
          message: 'Este número já está cadastrado em outra conta',
        }, 200);
      }

      log('✅ TELEFONE DISPONÍVEL');
      return res.json({
        exists: false,
        message: 'Telefone disponível para cadastro',
      }, 200);

    } catch (searchError) {
      error('❌ Erro ao buscar usuários:', searchError.message);
      throw searchError;
    }

  } catch (err) {
    error('=== ❌ ERRO NA EXECUÇÃO ===');
    error('Mensagem:', err.message);
    error('Stack:', err.stack);
    
    return res.json({
      error: 'Erro ao verificar telefone',
      details: err.message,
    }, 500);
  }
};