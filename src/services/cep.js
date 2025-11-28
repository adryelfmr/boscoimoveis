/**
 * Serviço de busca de endereço por CEP usando ViaCEP
 * API GRATUITA - Sem necessidade de chave
 */

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

/**
 * Busca endereço pelo CEP
 * @param {string} cep - CEP com ou sem formatação (99999-999 ou 99999999)
 * @returns {Object} Dados do endereço ou null
 */
export async function buscarEnderecoPorCEP(cep) {
  try {
    // Remover caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');

    // Validar CEP (deve ter 8 dígitos)
    if (cepLimpo.length !== 8) {
      console.error('CEP inválido:', cep);
      return null;
    }

    

    const response = await fetch(`${VIACEP_BASE_URL}/${cepLimpo}/json/`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    // ViaCEP retorna erro: true quando CEP não encontrado
    if (data.erro) {
      console.warn('⚠️ CEP não encontrado:', cepLimpo);
      return null;
    }

    

    return {
      cep: data.cep,
      endereco: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      complemento: data.complemento || '',
    };
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error);
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