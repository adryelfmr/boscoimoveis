/**
 * Utilitário de Telefone - Formato E.164 (Appwrite)
 * 
 * ✅ FORMATO E.164 (salvar no banco):
 * - +5562999999999 (celular com 9 dígitos)
 * - +5562999999999 (fixo com 8 dígitos)
 * 
 * ✅ FORMATO BRASILEIRO (exibir):
 * - (62) 99999-9999 (celular)
 * - (62) 9999-9999 (fixo)
 */

/**
 * Converte telefone brasileiro para E.164
 * @param {string} telefone - (62) 99999-9999 ou 62999999999
 * @returns {string} +5562999999999
 */
export function converterParaE164(telefone) {
  // Remover tudo que não é número
  const numeros = telefone.replace(/\D/g, '');
  
  // Se não começar com código do país, adicionar +55
  if (numeros.startsWith('55')) {
    return `+${numeros}`;
  }
  
  return `+55${numeros}`;
}

/**
 * Converte E.164 para formato brasileiro
 * @param {string} telefone - +5562999999999
 * @returns {string} (62) 99999-9999
 */
export function converterParaBrasileiro(telefone) {
  // Remover tudo que não é número
  const numeros = telefone.replace(/\D/g, '');
  
  // Remover código do país (55)
  const semPais = numeros.startsWith('55') ? numeros.substring(2) : numeros;
  
  // Extrair DDD e número
  const ddd = semPais.substring(0, 2);
  const numero = semPais.substring(2);
  
  // Formatar baseado no tamanho (celular tem 9 dígitos, fixo tem 8)
  if (numero.length === 11) {
    // Celular: (62) 99999-9999
    return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
  } else if (numero.length === 10) {
    // Celular sem 9: (62) 9999-9999
    return `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
  } else if (numero.length === 9) {
    // Celular: 99999-9999
    return `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
  } else if (numero.length === 8) {
    // Fixo: 9999-9999
    return `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
  }
  
  return telefone; // Retornar original se formato inválido
}

/**
 * Formata telefone enquanto digita (brasileiro)
 * @param {string} value - Texto digitado
 * @returns {string} Texto formatado
 */
export function formatarTelefoneAoDigitar(value) {
  const numeros = value.replace(/\D/g, '');
  
  if (numeros.length <= 2) {
    return numeros;
  } else if (numeros.length <= 6) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2)}`;
  } else if (numeros.length <= 10) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
  } else {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7, 11)}`;
  }
}

/**
 * Valida telefone brasileiro
 * @param {string} telefone
 * @returns {boolean}
 */
export function validarTelefone(telefone) {
  const numeros = telefone.replace(/\D/g, '');
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (numeros.length < 10 || numeros.length > 11) {
    return false;
  }
  
  // DDD válido (11 a 99)
  const ddd = parseInt(numeros.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Celular deve começar com 9
  if (numeros.length === 11 && numeros[2] !== '9') {
    return false;
  }
  
  return true;
}

/**
 * Extrai apenas números do telefone
 * @param {string} telefone
 * @returns {string}
 */
export function extrairNumeros(telefone) {
  return telefone.replace(/\D/g, '');
}