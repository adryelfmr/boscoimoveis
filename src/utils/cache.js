/**
 * Sistema de cache local para reduzir requisições
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const cache = {
  set(key, data) {
    const item = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },

  get(key) {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item);
    
    // Verificar se expirou
    if (Date.now() - timestamp > CACHE_DURATION) {
      this.remove(key);
      return null;
    }

    return data;
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