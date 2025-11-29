/**
 * Sistema de cache local DESABILITADO
 * Motivo: Causava exibição de dados desatualizados
 */

const CACHE_DURATION = 0; // ✅ MUDOU: 0 = desabilitado

export const cache = {
  set(key, data) {
    // ❌ DESABILITADO: Não fazer cache mais
    return;
  },

  get(key) {
    // ❌ DESABILITADO: Sempre retornar null (buscar dados frescos)
    return null;
  },

  remove(key) {
    localStorage.removeItem(`cache_${key}`);
  },

  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => localStorage.removeItem(key));
  },
};

// ✅ NOVO: Limpar cache antigo ao carregar
cache.clear();