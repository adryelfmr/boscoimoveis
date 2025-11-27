/**
 * Serviço de Geocoding usando Nominatim (OpenStreetMap)
 * 
 * ⚠️ IMPORTANTE:
 * - A precisão varia de acordo com a qualidade dos dados do OpenStreetMap
 * - CEPs podem ter imprecisão de 50-200 metros
 * - Endereços novos podem não estar mapeados
 * - Use apenas como localização aproximada
 * 
 * API GRATUITA - Sem necessidade de chave
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Busca coordenadas de um endereço com múltiplas tentativas
 * @param {Object} endereco - {cep, endereco, numero, bairro, cidade, estado}
 * @returns {Object} {latitude, longitude} ou null
 */
export async function geocodeEndereco({ cep, endereco, numero, bairro, cidade, estado }) {
  try {
    // ✅ ESTRATÉGIA 1: Buscar pelo CEP (mais preciso)
    if (cep) {
      console.log('🔍 Tentativa 1: Buscando por CEP:', cep);
      const resultadoCEP = await buscarPorCEP(cep, cidade, estado);
      if (resultadoCEP) {
        console.log('✅ Coordenadas encontradas por CEP!');
        return resultadoCEP;
      }
    }

    // ✅ ESTRATÉGIA 2: Buscar por endereço completo com número
    if (endereco && numero && cidade && estado) {
      console.log('🔍 Tentativa 2: Buscando por endereço completo');
      const enderecoCompleto = `${endereco}, ${numero}, ${bairro || ''}, ${cidade}, ${estado}, Brasil`;
      const resultadoCompleto = await buscarPorQuery(enderecoCompleto);
      if (resultadoCompleto) {
        console.log('✅ Coordenadas encontradas por endereço completo!');
        return resultadoCompleto;
      }
    }

    // ✅ ESTRATÉGIA 3: Buscar por endereço sem número
    if (endereco && bairro && cidade && estado) {
      console.log('🔍 Tentativa 3: Buscando por endereço sem número');
      const enderecoSemNumero = `${endereco}, ${bairro}, ${cidade}, ${estado}, Brasil`;
      const resultadoSemNumero = await buscarPorQuery(enderecoSemNumero);
      if (resultadoSemNumero) {
        console.log('✅ Coordenadas encontradas por endereço sem número!');
        return resultadoSemNumero;
      }
    }

    // ✅ ESTRATÉGIA 4: Buscar apenas por bairro e cidade
    if (bairro && cidade && estado) {
      console.log('🔍 Tentativa 4: Buscando por bairro');
      const bairroQuery = `${bairro}, ${cidade}, ${estado}, Brasil`;
      const resultadoBairro = await buscarPorQuery(bairroQuery);
      if (resultadoBairro) {
        console.log('⚠️ Coordenadas encontradas apenas por bairro (menos preciso)');
        return resultadoBairro;
      }
    }

    // ✅ ESTRATÉGIA 5: Buscar apenas pela cidade (fallback)
    if (cidade && estado) {
      console.log('🔍 Tentativa 5: Buscando por cidade (fallback)');
      return await geocodeCidade(cidade, estado);
    }

    console.warn('⚠️ Nenhuma coordenada encontrada');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar coordenadas:', error);
    return null;
  }
}

/**
 * Busca coordenadas por CEP
 * @param {string} cep
 * @param {string} cidade
 * @param {string} estado
 * @returns {Object} {latitude, longitude} ou null
 */
async function buscarPorCEP(cep, cidade, estado) {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Formato brasileiro: 99999-999 ou 99.999-999
    const cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
    
    // Buscar com cidade e estado para maior precisão
    const query = `${cepFormatado}, ${cidade}, ${estado}, Brasil`;
    
    return await buscarPorQuery(query);
  } catch (error) {
    console.error('❌ Erro ao buscar por CEP:', error);
    return null;
  }
}

/**
 * Busca coordenadas por query genérica
 * @param {string} query
 * @returns {Object} {latitude, longitude} ou null
 */
async function buscarPorQuery(query) {
  try {
    console.log('📍 Buscando:', query);

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=1` +
      `&addressdetails=1` +
      `&countrycodes=br`, // ✅ NOVO: Limitar ao Brasil
      {
        headers: {
          'User-Agent': 'BoscoImoveis/1.0',
          'Accept-Language': 'pt-BR,pt;q=0.9', // ✅ NOVO: Priorizar português
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const resultado = data[0];
      
      console.log('📍 Resultado:', {
        display_name: resultado.display_name,
        latitude: resultado.lat,
        longitude: resultado.lon,
        importance: resultado.importance, // Relevância do resultado
      });

      return {
        latitude: parseFloat(resultado.lat),
        longitude: parseFloat(resultado.lon),
        displayName: resultado.display_name,
        importance: resultado.importance,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar por query:', error);
    return null;
  }
}

/**
 * Busca coordenadas apenas da cidade (fallback)
 * @param {string} cidade
 * @param {string} estado
 * @returns {Object} {latitude, longitude} ou null
 */
export async function geocodeCidade(cidade, estado) {
  try {
    const query = `${cidade}, ${estado}, Brasil`;
    console.log('🏙️ Buscando coordenadas da cidade:', query);

    return await buscarPorQuery(query);
  } catch (error) {
    console.error('❌ Erro ao buscar coordenadas da cidade:', error);
    return null;
  }
}

/**
 * Aguarda um tempo (rate limiting)
 * @param {number} ms - Milissegundos
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}