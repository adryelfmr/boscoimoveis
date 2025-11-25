import { account, databases, storage, DATABASE_ID, BUCKET_ID, ID, Query } from '@/lib/appwrite';

// ✅ IMPORTAR COLLECTIONS do lib/appwrite.js ao invés de redeclarar
export const COLLECTIONS = {
  IMOVEIS: import.meta.env.VITE_APPWRITE_COLLECTION_IMOVEIS,
  FAVORITOS: import.meta.env.VITE_APPWRITE_COLLECTION_FAVORITOS,
  VISUALIZACOES: import.meta.env.VITE_APPWRITE_COLLECTION_VISUALIZACOES,
  COMPARACOES: import.meta.env.VITE_APPWRITE_COLLECTION_COMPARACOES,
  ALERTAS: import.meta.env.VITE_APPWRITE_COLLECTION_ALERTAS,
  CONTATOS: import.meta.env.VITE_APPWRITE_COLLECTION_CONTATOS, // ✅ NOVO
};

export const appwrite = {
  auth: {
    me: async () => {
      try {
        return await account.get();
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        throw new Error('Not authenticated');
      }
    },
    
    login: async (email, password) => {
      try {
        return await account.createEmailPasswordSession(email, password);
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        
        // Tratar erros específicos do Appwrite
        if (error.code === 401) {
          throw new Error('Invalid credentials');
        } else if (error.message?.includes('user-not-found')) {
          throw new Error('user-not-found');
        } else if (error.message?.includes('Invalid credentials')) {
          throw new Error('invalid-email-password');
        }
        
        throw error;
      }
    },
    
    register: async (email, password, name) => {
      try {
        return await account.create(ID.unique(), email, password, name);
      } catch (error) {
        console.error('Erro ao registrar:', error);
        
        // Tratar erros específicos
        if (error.code === 409 || error.message?.includes('already exists')) {
          throw new Error('user_already_exists');
        } else if (error.message?.includes('Invalid email')) {
          throw new Error('Invalid email');
        } else if (error.message?.includes('Password')) {
          throw new Error('Password requirements not met');
        }
        
        throw error;
      }
    },
    
    logout: async () => {
      try {
        return await account.deleteSession('current');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
    },
    
    redirectToLogin: (returnUrl) => {
      localStorage.setItem('return_url', returnUrl || window.location.href);
      window.location.href = '/login';
    },
  },

  entities: {
    Imovel: {
      filter: async (filters = {}, orderBy = '$createdAt', limit = 100) => {
        const queries = [Query.limit(limit)];
        
        // Ordenação
        if (orderBy) {
          if (orderBy.startsWith('-')) {
            queries.push(Query.orderDesc(orderBy.substring(1)));
          } else {
            queries.push(Query.orderAsc(orderBy));
          }
        }
        
        // Filtros
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && value !== 'todos' && value !== 'todas') {
            queries.push(Query.equal(key, value));
          }
        });

        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.IMOVEIS,
            queries
          );
          
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar imóveis:', error);
          return [];
        }
      },

      get: async (id) => {
        try {
          return await databases.getDocument(DATABASE_ID, COLLECTIONS.IMOVEIS, id);
        } catch (error) {
          console.error('Erro ao buscar imóvel:', error);
          return null;
        }
      },

      create: async (data) => {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.IMOVEIS,
          ID.unique(),
          data
        );
      },

      update: async (id, data) => {
        return await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.IMOVEIS,
          id,
          data
        );
      },

      delete: async (id) => {
        return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.IMOVEIS, id);
      },

      search: async (searchTerm, limit = 50) => {
        try {
          const queries = [
            Query.limit(limit),
            Query.search('titulo', searchTerm),
          ];
          
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.IMOVEIS,
            queries
          );
          
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar imóveis:', error);
          return [];
        }
      },
    },

    Favorito: {
      filter: async (filters = {}) => {
        const queries = [Query.limit(100)];
        
        if (filters.userId) { 
          queries.push(Query.equal('userId', filters.userId));
        }
        
        if (filters.imovelId) { 
          queries.push(Query.equal('imovelId', filters.imovelId));
        }

        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.FAVORITOS,
            queries
          );
          
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar favoritos:', error);
          return [];
        }
      },

      create: async (data) => {
        console.log('Criando favorito no Appwrite:', data); 
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.FAVORITOS,
          ID.unique(),
          {
            imovelId: data.imovelId,
            userId: data.userId,
            notas: data.notas || '',
            alertaPreco: data.alertaPreco !== false,
          }
        );
      },

      delete: async (id) => {
        return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FAVORITOS, id);
      },
    },

    Visualizacao: {
      filter: async (filters = {}) => {
        const queries = [Query.limit(100)];
        
        if (filters.imovelId) { 
          queries.push(Query.equal('imovelId', filters.imovelId));
        }

        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.VISUALIZACOES,
            queries
          );
          
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar visualizações:', error);
          return [];
        }
      },

      create: async (data) => {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.VISUALIZACOES,
          ID.unique(),
          {
            imovelId: data.imovelId,
            userId: data.userId || null,
            sessionId: data.sessionId,
            tempoVisualizacao: data.tempoVisualizacao || 0,
            origem: data.origem || 'direto',
          }
        );
      },
    },

    Alerta: {
      filter: async (filters = {}) => {
        const queries = [Query.limit(100)];
        
        if (filters.userId) {
          queries.push(Query.equal('userId', filters.userId));
        }

        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ALERTAS,
            queries
          );
          
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar alertas:', error);
          return [];
        }
      },

      create: async (data) => {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ALERTAS,
          ID.unique(),
          data
        );
      },

      update: async (id, data) => {
        return await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.ALERTAS,
          id,
          data
        );
      },

      delete: async (id) => {
        return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ALERTAS, id);
      },
    },

    // ✅ ENTIDADE CONTATOS (PLURAL)
    Contatos: {
      create: async (data) => {
        return await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CONTATOS,
          ID.unique(),
          {
            nome: data.nome,
            email: data.email,
            telefone: data.telefone || null,
            mensagem: data.mensagem,
            origem: data.origem || 'formulario',
            status: 'novo',
            lido: false,
          }
        );
      },

      filter: async (filters = {}) => {
        const queries = [Query.limit(100), Query.orderDesc('$createdAt')];
        
        if (filters.status) {
          queries.push(Query.equal('status', filters.status));
        }

        try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CONTATOS,
            queries
          );
          return response.documents;
        } catch (error) {
          console.error('Erro ao buscar contatos:', error);
          return [];
        }
      },

      update: async (id, data) => {
        return await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CONTATOS,
          id,
          data
        );
      },
    },
  },

  storage: {
    uploadFile: async (file) => {
      return await storage.createFile(BUCKET_ID, ID.unique(), file);
    },

    getFileUrl: (fileId) => {
      return storage.getFileView(BUCKET_ID, fileId);
    },

    deleteFile: async (fileId) => {
      return await storage.deleteFile(BUCKET_ID, fileId);
    },
  },

  integrations: {
    Core: {
      SendEmail: async (data) => {
        try {
          // Usar Appwrite Functions para enviar email
          const response = await fetch(`${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/${import.meta.env.VITE_APPWRITE_FUNCTION_EMAIL}/executions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
            },
            body: JSON.stringify({
              to: data.to,
              subject: data.subject,
              body: data.body,
              from: data.from || 'noreply@boscoimoveis.com.br',
            }),
          });

          if (!response.ok) {
            throw new Error('Erro ao enviar email');
          }

          return await response.json();
        } catch (error) {
          console.error('Erro ao enviar email:', error);
          throw error;
        }
      },
    },
  },
};