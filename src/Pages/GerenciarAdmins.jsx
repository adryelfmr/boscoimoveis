import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teams, ADMIN_TEAM_ID } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, Trash2, Loader2, Crown, RefreshCw, Mail, Check, Copy } from 'lucide-react';
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

  // ✅ Buscar membros do time
  const { data: members = [], refetch: refetchMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['adminMembers'],
    queryFn: async () => {
      try {
        const response = await teams.listMemberships(ADMIN_TEAM_ID);
        
        // ✅ Processar cada membro
        const processedMembers = response.memberships.map((member) => {
          // Se é o usuário logado, usar seus dados
          if (member.userId === user.$id) {
            return {
              ...member,
              displayName: user.name || 'Você',
              displayEmail: user.email,
              isCurrentUser: true,
            };
          }
          
          // ✅ Para outros usuários, criar identificador com ID completo
          const inviteDate = member.invited 
            ? new Date(member.invited).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : null;
          
          return {
            ...member,
            displayName: `Administrador`,
            displayEmail: inviteDate ? `Convidado em ${inviteDate}` : 'Data não disponível',
            isCurrentUser: false,
          };
        });
        
        return processedMembers;
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
        return [];
      }
    },
    enabled: isAdmin && !!ADMIN_TEAM_ID,
  });

  const handleRecarregar = async () => {
    toast.promise(
      Promise.all([
        refetchMembership(),
        refetchMembers(),
        queryClient.invalidateQueries(['my-team-membership']),
        queryClient.invalidateQueries(['adminMembers'])
      ]),
      {
        loading: 'Recarregando...',
        success: '✅ Atualizado!',
        error: '❌ Erro ao recarregar',
      }
    );
  };

  // ✅ NOVO: Copiar ID para clipboard
  const copiarId = (userId) => {
    navigator.clipboard.writeText(userId);
    toast.success('ID copiado!', {
      description: 'ID do usuário copiado para a área de transferência.',
      duration: 2000,
    });
  };

  // Adicionar novo admin
  const addAdminMutation = useMutation({
    mutationFn: async (email) => {
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
      toast.success('✅ Convite enviado!', {
        description: `Email enviado para ${newAdminEmail}`,
      });
      setNewAdminEmail('');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      if (error.code === 401) {
        toast.error('❌ Sem permissão', {
          action: { label: 'Recarregar', onClick: handleRecarregar },
        });
      } else if (error.code === 409) {
        toast.error('❌ Usuário já é membro');
      } else if (error.message?.includes('user_target_not_found')) {
        toast.error('❌ Usuário não encontrado', {
          description: 'Este email não possui conta. Peça para criar em /registro',
        });
      } else {
        toast.error('❌ Erro ao enviar convite');
      }
    },
  });

  // Remover admin
  const removeAdminMutation = useMutation({
    mutationFn: async (membershipId) => {
      return await teams.deleteMembership(ADMIN_TEAM_ID, membershipId);
    },
    onSuccess: () => {
      toast.success('✅ Administrador removido!');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      toast.error('❌ Erro ao remover', { description: error.message });
    },
  });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Email inválido');
      return;
    }

    if (newAdminEmail.toLowerCase() === user.email.toLowerCase()) {
      toast.error('❌ Você já é administrador');
      return;
    }

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

  if (loadingMembers) {
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-900" />
                Gerenciar Administradores
              </h1>
              <p className="text-slate-600 mt-2">
                {members.length} {members.length === 1 ? 'administrador' : 'administradores'} no sistema
              </p>
            </div>
            <Button variant="outline" onClick={handleRecarregar} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar
            </Button>
          </div>

          {isOwner && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <strong>Você é Owner</strong> - Permissões completas para gerenciar administradores
              </p>
            </div>
          )}
        </div>

        {/* Formulário: Adicionar Admin */}
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
                <p className="text-xs font-semibold text-blue-900 mb-1">
                  📋 Como funciona:
                </p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>O usuário deve ter uma conta (<a href="/registro" className="underline font-medium">/registro</a>)</li>
                  <li>Ele receberá um email com link de convite</li>
                  <li>Ao clicar, aceitará o convite automaticamente (se logado)</li>
                  <li>Após aceitar, terá acesso às funções administrativas</li>
                </ol>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Administradores */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Administradores Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nenhum administrador cadastrado.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const memberIsOwner = member.roles?.includes('owner');
                  
                  return (
                    <div
                      key={member.$id}
                      className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {/* Linha 1: Avatar + Nome + Badges */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 ${memberIsOwner ? 'bg-amber-500' : 'bg-blue-900'} rounded-full flex items-center justify-center flex-shrink-0`}>
                          {memberIsOwner ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <Shield className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        {/* Nome e Email */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900">
                            {member.displayName}
                          </div>
                          <p className="text-sm text-slate-500">{member.displayEmail}</p>
                        </div>
                        
                        {/* Badges de Status */}
                        <div className="flex gap-2 flex-wrap">
                          {member.isCurrentUser && (
                            <Badge className="bg-blue-500 text-white flex-shrink-0">
                              Você
                            </Badge>
                          )}
                          {memberIsOwner && (
                            <Badge className="bg-amber-500 text-white flex-shrink-0">
                              👑 Owner
                            </Badge>
                          )}
                          {member.confirm ? (
                            <Badge className="bg-green-500 text-white flex-shrink-0">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 flex-shrink-0">
                              <Mail className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </div>
                        
                        {/* Botão Remover */}
                        {!member.isCurrentUser && isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover este administrador?`)) {
                                removeAdminMutation.mutate(member.$id);
                              }
                            }}
                            disabled={removeAdminMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            title="Remover administrador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Linha 2: ID completo (apenas para outros usuários) */}
                      {!member.isCurrentUser && (
                        <div className="flex items-center gap-2 pl-13 bg-slate-100 rounded p-2">
                          <span className="text-xs text-slate-600 font-medium">ID:</span>
                          <code className="text-xs font-mono text-slate-800 flex-1 select-all">
                            {member.userId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copiarId(member.userId)}
                            className="h-6 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                            title="Copiar ID"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações */}
        <div className="mt-6 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Usuários com status "Pendente" ainda não aceitaram o convite. Peça para verificarem o email (inclusive spam).
            </p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>ℹ️ Nota:</strong> Por limitações de segurança do Appwrite, não é possível exibir o nome completo de outros administradores. Use o ID para identificação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}