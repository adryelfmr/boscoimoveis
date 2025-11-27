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

const PREFIXOS_CIDADE = {
  'Goiânia': 'GOI',
  'Aparecida de Goiânia': 'APA',
  'Anápolis': 'ANA',
  'Rio Verde': 'RIO',
  'Trindade': 'TRI',
  'Senador Canedo': 'SEN',
  'Catalão': 'CAT',
  'Luziânia': 'LUZ',
  'Valparaíso de Goiás': 'VAL',
  'Águas Lindas de Goiás': 'AGU',
};

/**
 * Gera código automático baseado nos dados do imóvel
 * @param {string} tipoImovel - Tipo do imóvel (Casa, Apartamento, etc)
 * @param {string} cidade - Cidade do imóvel
 * @param {number} contador - Número sequencial (vem do banco)
 * @returns {string} Código formatado (ex: CAS-GOI-0123)
 */
export function gerarCodigoAutomatico(tipoImovel, cidade, contador) {
  const prefixoTipo = PREFIXOS_TIPO[tipoImovel] || 'IMO';
  
  // Pegar primeiras 3 letras da cidade (uppercase) se não estiver no mapa
  const prefixoCidade = PREFIXOS_CIDADE[cidade] || 
    cidade.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  
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