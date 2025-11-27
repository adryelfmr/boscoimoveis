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

  const register = async (email, password, name, telefone) => {
    try {
      // ✅ 1. FAZER LOGOUT SE HOUVER SESSÃO ATIVA
      try {
        await account.deleteSession('current');
        console.log('✅ Sessão anterior encerrada');
      } catch (error) {
        // Ignorar se não houver sessão ativa
        console.log('ℹ️ Nenhuma sessão ativa para encerrar');
      }
      
      // ✅ 2. Criar conta no Appwrite
      const newUser = await appwrite.auth.register(email, password, name);
      console.log('✅ Conta criada:', newUser);
      
      // ✅ 3. Fazer login automático
      await login(email, password);
      console.log('✅ Login automático realizado');
      
      // ✅ 4. Atualizar telefone (se fornecido)
      if (telefone) {
        try {
          await account.updatePhone(telefone, password);
          console.log('✅ Telefone atualizado:', telefone);
        } catch (phoneError) {
          console.warn('⚠️ Erro ao atualizar telefone (não crítico):', phoneError);
          // Não falhar o registro por causa do telefone
        }
      }
      
      // ✅ 5. Atualizar estado do usuário
      await checkUser();
      
      return newUser;
    } catch (error) {
      console.error('❌ Erro ao registrar:', error);
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