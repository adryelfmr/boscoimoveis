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
      let userRole = null;
      
      if (ADMIN_TEAM_ID) {
        try {
          const memberships = await teams.listMemberships(ADMIN_TEAM_ID);
          const myMembership = memberships.memberships.find(m => m.userId === userData.$id);
          
          if (myMembership) {
            isAdmin = true;
            if (myMembership.roles?.includes('owner')) {
              userRole = 'owner';
            } else if (myMembership.confirm) {
              userRole = 'member';
            } else {
              userRole = 'pending';
            }
          }
        } catch (error) {
          
          isAdmin = false;
        }
      }
      
      setUser({
        ...userData,
        isAdmin,
        adminRole: userRole, 
      });
    } catch (error) {
      if (error.message !== 'Not authenticated') {
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
      } catch (error) {
        // Ignorar erro se não houver sessão
      }
      
      // ✅ 2. Criar conta no Appwrite
      const newUser = await appwrite.auth.register(email, password, name);
      
      // ✅ 3. Fazer login automático
      await login(email, password);
      
      // ✅ 4. Atualizar telefone (se fornecido)
      if (telefone) {
        try {
          await account.updatePhone(telefone, password);
        } catch (phoneError) {
        }
      }
      
      // ✅ 5. Atualizar estado do usuário
      await checkUser();
      
      return newUser;
    } catch (error) {
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
    isOwner: user?.adminRole === 'owner', // ✅ NOVO: Flag específica para owner
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