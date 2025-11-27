import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { appwrite } from '@/api/appwriteClient';
import { account, teams, ADMIN_TEAM_ID } from '@/lib/appwrite';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await appwrite.auth.me();
      
      if (!userData) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Verificar se o usuário faz parte da equipe de administradores
      let isAdmin = false;
      
      if (ADMIN_TEAM_ID) {
        try {
          const userTeams = await teams.list();
          isAdmin = userTeams.teams.some(team => team.$id === ADMIN_TEAM_ID);
        } catch (error) {
          console.log('Erro ao verificar equipes:', error);
          isAdmin = false;
        }
      }
      
      setUser({
        ...userData,
        isAdmin,
      });
    } catch (error) {
      if (error.message !== 'Not authenticated') {
        console.error('Erro ao verificar usuário:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const session = await appwrite.auth.login(email, password);
    await checkUser();
    queryClient.invalidateQueries();
    return session;
  };

  // ✅ ATUALIZADO: Usar Phone Session nativa do Appwrite
  const register = async (email, password, name, telefone) => {
    try {
      // 1. Criar conta no Appwrite
      const newUser = await appwrite.auth.register(email, password, name);
      
      // 2. Fazer login automático
      await login(email, password);
      
      // 3. ✅ NOVO: Atualizar telefone usando API nativa do Appwrite
      if (telefone) {
        await account.updatePhone(telefone, password);
      }
      
      // 4. Atualizar estado do usuário
      await checkUser();
      
      return newUser;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    await appwrite.auth.logout();
    setUser(null);
    queryClient.clear();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkUser,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}