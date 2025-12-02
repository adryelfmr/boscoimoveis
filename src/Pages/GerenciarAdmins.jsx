import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teams, ADMIN_TEAM_ID, account } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, Trash2, Loader2, Crown, RefreshCw, Mail, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GerenciarAdmins() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [userRole, setUserRole] = useState(null);

  // ✅ Verificar papel do usuário no time
  const { data: membership, refetch: refetchMembership } = useQuery({
    queryKey: ['my-team-membership', ADMIN_TEAM_ID],
    queryFn: async () => {
      try {
        const response = await teams.listMemberships(ADMIN_TEAM_ID);
        const myMembership = response.memberships.find(m => m.userId === user.$id);
        
        console.log('📋 Meu membership:', myMembership);
        console.log('👑 Minhas roles:', myMembership?.roles);
        
        if (myMembership?.roles?.includes('owner')) {
          setUserRole('owner');
        } else if (myMembership?.confirm) {
          setUserRole('member');
        } else {
          setUserRole('pending');
        }
        
        return myMembership;
      } catch (error) {
        console.error('Erro ao verificar membership:', error);
        return null;
      }
    },
    enabled: isAdmin && !!ADMIN_TEAM_ID && !!user?.$id,
    staleTime: 0,
  });

  // ✅ NOVO: Buscar membros com dados completos
  const { data: members = [], refetch: refetchMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['adminMembers'],
    queryFn: async () => {
      try {
        const response = await teams.listMemberships(ADMIN_TEAM_ID);
        console.log('📋 Membros do time:', response.memberships);
        
        // ✅ Enriquecer com dados dos usuários
        const membersWithUserData = await Promise.all(
          response.memberships.map(async (member) => {
            try {
              // Tentar buscar dados do usuário
              const userData = await account.get(member.userId);
              return {
                ...member,
                userName: userData.name || member.userEmail.split('@')[0],
                userEmail: member.userEmail || userData.email,
              };
            } catch (error) {
              // Se não conseguir buscar, usar dados do membership
              return {
                ...member,
                userName: member.userName || member.userEmail?.split('@')[0] || 'Nome não disponível',
              };
            }
          })
        );
        
        return membersWithUserData;
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
        return [];
      }
    },
    enabled: isAdmin && !!ADMIN_TEAM_ID,
  });

  const { data: adminTeam, isLoading } = useQuery({
    queryKey: ['adminTeam'],
    queryFn: async () => {
      try {
        return await teams.get(ADMIN_TEAM_ID);
      } catch (error) {
        console.error('Erro ao buscar equipe:', error);
        return null;
      }
    },
    enabled: isAdmin && !!ADMIN_TEAM_ID,
  });

  // ✅ Função para recarregar dados
  const handleRecarregar = async () => {
    toast.promise(
      Promise.all([
        refetchMembership(),
        refetchMembers(),
        queryClient.invalidateQueries(['my-team-membership']),
        queryClient.invalidateQueries(['adminMembers'])
      ]),
      {
        loading: 'Recarregando dados...',
        success: '✅ Dados atualizados!',
        error: '❌ Erro ao recarregar',
      }
    );
  };

  // Adicionar novo admin
  const addAdminMutation = useMutation({
    mutationFn: async (email) => {
      // ✅ MUDANÇA: URL para página de aceitar convite
      const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/aceitar-convite`;
      
      return await teams.createMembership(
        ADMIN_TEAM_ID,
        ['admin'],
        email,
        undefined,
        undefined,
        redirectUrl
      );
    },
    onSuccess: () => {
      toast.success('✅ Convite enviado com sucesso!', {
        description: 'O usuário receberá um email com instruções.',
      });
      setNewAdminEmail('');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      console.error('❌ Erro ao adicionar admin:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem:', error.message);
      
      if (error.code === 401) {
        toast.error('❌ Sem permissão para enviar convites', {
          description: 'Recarregue a página ou faça logout/login novamente.',
          duration: 10000,
          action: {
            label: 'Recarregar',
            onClick: handleRecarregar,
          },
        });
      } else if (error.message?.includes('already a member') || error.code === 409) {
        toast.error('❌ Usuário já é membro', {
          description: 'Este email já está cadastrado como administrador.',
        });
      } else if (error.message?.includes('User (role: guests) missing scope')) {
        toast.error('❌ Usuário não encontrado', {
          description: 'Este email não possui uma conta no sistema. Peça para o usuário criar uma conta primeiro em /registro.',
          duration: 10000,
        });
      } else if (error.message?.includes('Invalid email')) {
        toast.error('❌ Email inválido', {
          description: 'Digite um endereço de email válido.',
        });
      } else {
        toast.error('❌ Erro ao enviar convite', {
          description: error.message || 'Tente novamente.',
          duration: 8000,
        });
      }
    },
  });

  // Remover admin
  const removeAdminMutation = useMutation({
    mutationFn: async (membershipId) => {
      return await teams.deleteMembership(ADMIN_TEAM_ID, membershipId);
    },
    onSuccess: () => {
      toast.success('✅ Administrador removido com sucesso!');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      console.error('❌ Erro ao remover admin:', error);
      
      if (error.code === 401) {
        toast.error('❌ Sem permissão para remover membros', {
          description: 'Apenas owners podem remover outros membros.',
        });
      } else {
        toast.error('❌ Erro ao remover administrador', {
          description: error.message,
        });
      }
    },
  });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    // ✅ Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Email inválido', {
        description: 'Digite um endereço de email válido.',
      });
      return;
    }

    // ✅ Com "Team invites" ativado, qualquer membro pode enviar convites
    addAdminMutation.mutate(newAdminEmail);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || loadingMembers) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
      </div>
    );
  }

  const isOwner = userRole === 'owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-900" />
                Gerenciar Administradores
              </h1>
              <p className="text-slate-600 mt-2">
                Adicione ou remova administradores do sistema
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleRecarregar}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </Button>
          </div>

          {isOwner && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <strong>Você é Owner</strong> - Você tem permissões completas para gerenciar administradores.
              </p>
            </div>
          )}
        </div>

        {/* Adicionar novo admin */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Adicionar Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="flex-1"
                  disabled={addAdminMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={addAdminMutation.isPending}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  {addAdminMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>📋 Como funciona:</strong>
                </p>
                <ol className="text-xs text-blue-800 mt-1 space-y-1 list-decimal list-inside">
                  <li>O usuário deve ter uma conta no sistema (<a href="/registro" className="underline">/registro</a>)</li>
                  <li>Ele receberá um email com link de convite</li>
                  <li>Ao clicar, será redirecionado para aceitar o convite</li>
                  <li>Após aceitar, terá acesso às funções administrativas</li>
                </ol>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de admins */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Administradores ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nenhum administrador cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const memberIsOwner = member.roles?.includes('owner');
                  const isCurrentUser = member.userId === user.$id;
                  
                  return (
                    <div
                      key={member.$id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 ${memberIsOwner ? 'bg-amber-500' : 'bg-blue-900'} rounded-full flex items-center justify-center`}>
                          {memberIsOwner ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <Shield className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {member.userName}
                          </p>
                          <p className="text-sm text-slate-500">{member.userEmail}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {isCurrentUser && (
                            <Badge className="bg-blue-400 text-white">
                              Você
                            </Badge>
                          )}
                          {memberIsOwner && (
                            <Badge className="bg-amber-500 text-white">
                              👑 Owner
                            </Badge>
                          )}
                          {member.confirm ? (
                            <Badge className="bg-green-500 text-white">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <Mail className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!isCurrentUser && isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover ${member.userName}?`)) {
                              removeAdminMutation.mutate(member.$id);
                            }
                          }}
                          disabled={removeAdminMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                          title="Remover administrador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Usuários com status "Pendente" ainda não aceitaram o convite. Peça para verificarem o email (inclusive spam).
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>⚠️ Importante:</strong> Apenas owners podem remover outros administradores. Se precisar transferir a propriedade do time, acesse o Appwrite Console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}