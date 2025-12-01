const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== 📞 CHECK PHONE EXISTS - INÍCIO ===');
    
    // ✅ CORRIGIDO: Ler telefone da query string
    const phone = req.query?.phone || req.path?.split('phone=')[1];
    
    log('Query params:', JSON.stringify(req.query));
    log('Path:', req.path);
    log('Telefone recebido:', phone);
    
    // ✅ Validar telefone
    if (!phone) {
      error('❌ Telefone não fornecido');
      return res.json({ 
        error: 'Telefone é obrigatório',
        receivedQuery: req.query,
        receivedPath: req.path,
      }, 400);
    }

    // ✅ Limpar formato do telefone
    const phoneClean = phone.replace(/\D/g, '');
    log(`📱 Telefone limpo: ${phoneClean}`);

    // ✅ Inicializar SDK
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