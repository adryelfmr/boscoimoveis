const sdk = require('node-appwrite');

module.exports = async ({ req, res, log, error }) => {
  try {
    log('=== 📞 CHECK PHONE EXISTS - INÍCIO ===');
    log('req.body:', JSON.stringify(req.body));
    log('req.bodyRaw:', req.bodyRaw);
    
    // ✅ CORRIGIDO: Parser do payload
    let payload;
    
    try {
      // Tentar bodyRaw primeiro (vem como string)
      if (req.bodyRaw) {
        payload = JSON.parse(req.bodyRaw);
        log('✅ Parsed from bodyRaw');
      }
      // Fallback para req.body
      else if (req.body) {
        if (typeof req.body === 'string') {
          payload = JSON.parse(req.body);
        } else {
          payload = req.body;
        }
        log('✅ Parsed from body');
      } else {
        throw new Error('Body não encontrado');
      }
    } catch (parseError) {
      error('❌ Erro ao parsear payload:', parseError.message);
      return res.json({ 
        error: 'Formato de payload inválido',
        details: parseError.message,
      }, 400);
    }
    
    log('✅ Payload parseado:', JSON.stringify(payload));

    // ✅ Extrair telefone
    const phone = payload?.phone || payload?.telefone;
    
    if (!phone) {
      error('❌ Telefone não fornecido');
      return res.json({ 
        error: 'Telefone é obrigatório',
        receivedPayload: payload,
      }, 400);
    }

    log('📞 Telefone a verificar:', phone);

    // ✅ Inicializar SDK do Appwrite
    const client = new sdk.Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const users = new sdk.Users(client);

    try {
      log('🔍 Buscando usuários com telefone:', phone);
      
      // ✅ Buscar com Query.equal
      const userList = await users.list([
        sdk.Query.equal('phone', phone)
      ]);

      log(`📊 Total de usuários encontrados: ${userList.total}`);

      if (userList.total > 0) {
        const user = userList.users[0];
        log('⚠️ TELEFONE JÁ CADASTRADO');
        log(`Usuário: ${user.email || user.name || user.$id}`);
        
        return res.json({
          exists: true,
          message: 'Este número já está cadastrado em outra conta',
          userId: user.$id,
        }, 200);
      }

      log('✅ TELEFONE DISPONÍVEL');
      return res.json({
        exists: false,
        message: 'Telefone disponível para cadastro',
      }, 200);

    } catch (searchError) {
      error('❌ Erro ao buscar usuários:', searchError.message);
      error('Stack:', searchError.stack);
      
      return res.json({
        exists: false,
        message: 'Não foi possível verificar. Prosseguindo...',
        warning: searchError.message,
      }, 200);
    }

  } catch (err) {
    error('=== ❌ ERRO CRÍTICO ===');
    error('Mensagem:', err.message);
    error('Stack:', err.stack);
    
    return res.json({
      exists: false,
      error: 'Erro ao verificar telefone',
      details: err.message,
    }, 500);
  }
};