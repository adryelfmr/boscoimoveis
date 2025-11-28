/**
 * Cliente simulado para a API Base44
 * Em produção, substitua por implementação real
 */
export const base44 = {
  auth: {
    me: async () => {
      // Simula usuário logado - substitua pela implementação real
      const userEmail = localStorage.getItem('user_email');
      if (!userEmail) throw new Error('Not authenticated');
      return { email: userEmail, name: 'Usuário' };
    },
    redirectToLogin: (returnUrl) => {
      localStorage.setItem('return_url', returnUrl || window.location.href);
      window.location.href = '/login';
    },
  },
  entities: {
    Imovel: {
      filter: async (filters = {}, orderBy = '', limit = 100) => {
        // Simula busca de imóveis - substitua pela implementação real
        return [];
      },
    },
    Favorito: {
      filter: async (filters = {}) => {
        const favorites = JSON.parse(localStorage.getItem('favoritos') || '[]');
        return favorites.filter(fav => {
          if (filters.user_email && fav.user_email !== filters.user_email) return false;
          return true;
        });
      },
      create: async (data) => {
        const favorites = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const newFavorite = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
        favorites.push(newFavorite);
        localStorage.setItem('favoritos', JSON.stringify(favorites));
        return newFavorite;
      },
      delete: async (id) => {
        const favorites = JSON.parse(localStorage.getItem('favoritos') || '[]');
        const updated = favorites.filter(fav => fav.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(updated));
      },
    },
    Visualizacao: {
      filter: async (filters = {}) => {
        return [];
      },
      create: async (data) => {
        return data;
      },
    },
  },
  integrations: {
    Core: {
      SendEmail: async (data) => {
        
        return { success: true };
      },
    },
  },
};