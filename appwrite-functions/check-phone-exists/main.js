const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== 📞 CHECK PHONE EXISTS - INÍCIO ===');
    
    // ✅ 1. Parsear payload (funciona com diferentes formatos)
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
    
    log('Payload recebido:', JSON.stringify(payload));

    const { phone } = payload;
    
    // ✅ 2. Validar telefone
    if (!phone) {
      error('❌ Telefone não fornecido');
      return res.json({ 
        error: 'Telefone é obrigatório' 
      }, 400);
    }

    // ✅ 3. Limpar formato do telefone (remover espaços, parênteses, etc)
    const phoneClean = phone.replace(/\D/g, '');
    log(`📱 Telefone limpo: ${phoneClean}`);

    // ✅ 4. Inicializar SDK do Appwrite com permissões de admin
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY); // ⚠️ API Key com permissão de leitura

    const users = new sdk.Users(client);

    try {
      // ✅ 5. Buscar usuários por telefone
      log('🔍 Buscando usuários com telefone:', phone);
      
      const userList = await users.list([
        sdk.Query.equal('phone', phone) // Formato E.164: +5562999999999
      ]);

      log(`📊 Total de usuários encontrados: ${userList.total}`);

      // ✅ 6. Verificar se encontrou algum usuário
      if (userList.total > 0) {
        log('⚠️ TELEFONE JÁ CADASTRADO');
        log(`Usuário: ${userList.users[0].email}`);
        
        return res.json({
          exists: true,
          message: 'Este número já está cadastrado em outra conta',
        }, 200);
      }

      // ✅ 7. Telefone disponível
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