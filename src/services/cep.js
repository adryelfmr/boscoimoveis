const VIACEP_BASE_URL = 'https://viacep.com.br/ws';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';



/**
 * Busca coordenadas usando Nominatim
 * @param {string} query - Endereço formatado
 * @returns {Object} {latitude, longitude} ou null
 */
async function buscarComNominatim(query) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=1` +
      `&countrycodes=br` +
      `&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'BoscoImoveis/1.0',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Busca coordenadas com estratégia inteligente (múltiplas tentativas)
 * @param {string} cep - CEP formatado
 * @param {string} endereco - Logradouro
 * @param {string} bairro - Bairro
 * @param {string} cidade - Cidade
 * @param {string} estado - UF
 * @returns {Object} {latitude, longitude, precision} ou null
 */
async function buscarCoordenadasInteligente(cep, endereco, bairro, cidade, estado) {
  let coords = null;
  let precision = 'city';

  // ✅ TENTATIVA 1: Endereço completo (apenas Nominatim)
  if (endereco) {
    const queryCompleta = `${endereco}, ${bairro}, ${cidade}, ${estado}, Brasil`;
    
    
    
    coords = await buscarComNominatim(queryCompleta);
    
    if (coords) {
      precision = 'street';
      return { ...coords, precision };
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Aumentar delay
  }

  // ✅ TENTATIVA 2: Bairro + Cidade
  if (bairro) {
    const queryBairro = `${bairro}, ${cidade}, ${estado}, Brasil`;
   
    
    coords = await buscarComNominatim(queryBairro);
    
    if (coords) {
      precision = 'neighborhood';
      return { ...coords, precision };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ✅ TENTATIVA 3: Apenas cidade
  const queryCidade = `${cidade}, ${estado}, Brasil`;
  
  coords = await buscarComNominatim(queryCidade);
  
  if (coords) {
    precision = 'city';
    return { ...coords, precision };
  }

  return null;
}

/**
 * Busca endereço pelo CEP (com coordenadas incluídas)
 * @param {string} cep - CEP com ou sem formatação
 * @returns {Object} Dados do endereço + coordenadas ou null
 */
export async function buscarEnderecoPorCEP(cep) {
  try {
    // Remover caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Validar CEP (deve ter 8 dígitos)
    if (cepLimpo.length !== 8) {
      return null;
    }

    // 1. Buscar endereço no ViaCEP
    const response = await fetch(`${VIACEP_BASE_URL}/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    // ViaCEP retorna erro: true quando CEP não encontrado
    if (data.erro) {
      return null;
    }

    // 2. Buscar coordenadas com estratégia inteligente
    const coordenadas = await buscarCoordenadasInteligente(
      data.cep,
      data.logradouro,
      data.bairro,
      data.localidade,
      data.uf
    );

    // 3. Retornar dados completos
    return {
      cep: data.cep,
      endereco: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      complemento: data.complemento || '',
      latitude: coordenadas?.latitude || null,
      longitude: coordenadas?.longitude || null,
      precision: coordenadas?.precision || null, // ✅ NOVO: nível de precisão
    };
  } catch (error) {
    return null;
  }
}

/**
 * Formata CEP (99999999 -> 99999-999)
 * @param {string} cep
 * @returns {string}
 */
export function formatarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return cep;
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
}

/**
 * Valida CEP
 * @param {string} cep
 * @returns {boolean}
 */
export function validarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}