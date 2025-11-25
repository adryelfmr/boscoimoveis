import React, { createContext, useContext, useState, useEffect } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { teams, ADMIN_TEAM_ID } from '@/lib/appwrite';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
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
      
      // Verificar se o usuário faz parte da equipe de administradores
      let isAdmin = false;
      
      if (ADMIN_TEAM_ID) {
        try {
          // Listar todas as equipes do usuário
          const userTeams = await teams.list();
          
          // Verificar se está na equipe de administradores
          isAdmin = userTeams.teams.some(team => team.$id === ADMIN_TEAM_ID);
          
        } catch (error) {
          console.error('Erro ao verificar equipes:', error);
          isAdmin = false;
        }
      }
      
      setUser({
        ...userData,
        isAdmin,
      });
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
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

  const register = async (email, password, name) => {
    await appwrite.auth.register(email, password, name);
    await login(email, password);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}