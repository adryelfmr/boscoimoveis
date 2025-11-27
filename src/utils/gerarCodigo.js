/**
 * Gera código único para imóvel
 * Formato: TIPO-CIDADE-NUMERO
 * Exemplo: CAS-GOI-0001, APT-ANA-0234
 */

const PREFIXOS_TIPO = {
  'Casa': 'CAS',
  'Apartamento': 'APT',
  'Terreno': 'TER',
  'Comercial': 'COM',
  'Rural': 'RUR',
};

/**
 * Gera prefixo da cidade automaticamente
 * Remove acentos, espaços e pega as 3 primeiras letras
 * @param {string} cidade - Nome da cidade
 * @returns {string} Prefixo de 3 letras
 */
function gerarPrefixoCidade(cidade) {
  if (!cidade) return 'CID';
  
  // 1. Converter para maiúsculas
  let prefixo = cidade.toUpperCase();
  
  // 2. Remover acentos e caracteres especiais
  prefixo = prefixo
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover marcas diacríticas
    .replace(/[^A-Z]/g, ''); // Remover tudo que não for letra
  
  // 3. Se a cidade tem múltiplas palavras, pegar primeira letra de cada
  const palavras = cidade.split(/\s+/);
  
  if (palavras.length >= 3) {
    // Ex: "Aparecida de Goiânia" → "ADG"
    prefixo = palavras
      .slice(0, 3)
      .map(p => p.charAt(0).toUpperCase())
      .join('')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } else if (palavras.length === 2) {
    // Ex: "Rio Verde" → "RVE" (primeira letra + 2 letras da segunda palavra)
    const primeira = palavras[0].charAt(0).toUpperCase();
    const segunda = palavras[1]
      .substring(0, 2)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    prefixo = primeira + segunda;
  } else {
    // Ex: "Goiânia" → "GOI" (3 primeiras letras)
    prefixo = prefixo.substring(0, 3);
  }
  
  // 4. Garantir que tem exatamente 3 letras
  if (prefixo.length < 3) {
    prefixo = prefixo.padEnd(3, 'X');
  } else if (prefixo.length > 3) {
    prefixo = prefixo.substring(0, 3);
  }
  
  return prefixo;
}

/**
 * Gera código automático baseado nos dados do imóvel
 * @param {string} tipoImovel - Tipo do imóvel (Casa, Apartamento, etc)
 * @param {string} cidade - Cidade do imóvel
 * @param {number} contador - Número sequencial (vem do banco)
 * @returns {string} Código formatado (ex: CAS-GOI-0123)
 */
export function gerarCodigoAutomatico(tipoImovel, cidade, contador) {
  const prefixoTipo = PREFIXOS_TIPO[tipoImovel] || 'IMO';
  
  // ✅ NOVO: Gerar prefixo automaticamente
  const prefixoCidade = gerarPrefixoCidade(cidade);
  
  // Formatar contador com zeros à esquerda (4 dígitos)
  const numero = String(contador).padStart(4, '0');
  
  return `${prefixoTipo}-${prefixoCidade}-${numero}`;
}

/**
 * Valida formato de código personalizado
 * @param {string} codigo - Código a validar
 * @returns {boolean} true se válido
 */
export function validarCodigoPersonalizado(codigo) {
  if (!codigo || codigo.trim().length === 0) {
    return false;
  }
  
  // Remover espaços
  const codigoLimpo = codigo.trim();
  
  // Validações
  if (codigoLimpo.length < 3 || codigoLimpo.length > 20) {
    return false;
  }
  
  // Permitir apenas letras, números e hífens
  const regex = /^[A-Z0-9-]+$/;
  return regex.test(codigoLimpo.toUpperCase());
}

/**
 * Formata código (uppercase, remove espaços)
 * @param {string} codigo
 * @returns {string}
 */
export function formatarCodigo(codigo) {
  return codigo.trim().toUpperCase().replace(/\s+/g, '-');
}