/**
 * Cria URL para navegação entre páginas
 * @param {string} pageName - Nome da página
 * @returns {string} URL da página
 */
export function createPageUrl(pageName) {
  return `/${pageName.toLowerCase()}`;
}

/**
 * Formata valor monetário
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata data
 * @param {string|Date} date - Data para formatar
 * @returns {string} Data formatada
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}