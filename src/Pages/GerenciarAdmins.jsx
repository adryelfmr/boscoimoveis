import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teams, ADMIN_TEAM_ID } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, Trash2, Loader2, Crown, RefreshCw, Mail, Check, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function GerenciarAdmins() {
  const { user, isAdmin, isOwner: userIsOwner } = useAuth(); // ✅ Usar isOwner do contexto
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
        
        const processedMembers = response.memberships.map((member) => {
          if (member.userId === user.$id) {
            return {
              ...member,
              displayName: user.name || 'Você',
              displayEmail: user.email,
              isCurrentUser: true,
            };
          }
          
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

  const copiarId = (userId) => {
    navigator.clipboard.writeText(userId);
    toast.success('ID copiado!', {
      description: 'ID do usuário copiado para a área de transferência.',
      duration: 2000,
    });
  };

  const addAdminMutation = useMutation({
    mutationFn: async (email) => {
      const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/aceitar-convite`;
      return await teams.createMembership(ADMIN_TEAM_ID, ['admin'], email, undefined, undefined, redirectUrl);
    },
    onSuccess: () => {
      toast.success('✅ Convite enviado!');
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
    if (!newAdminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminEmail)) {
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
            <p className="text-center text-slate-600">Você não tem permissão para acessar esta página.</p>
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
                <Users className="w-8 h-8 text-blue-900" />
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
                <strong>Você é Owner</strong> - Permissões completas
              </p>
            </div>
          )}
        </div>

        {/* Formulário */}
        {isOwner && (
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
                  <Button type="submit" disabled={addAdminMutation.isPending} className="bg-blue-900">
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
              </form>
            </CardContent>
          </Card>
        )}

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
              <p className="text-center text-slate-500 py-8">Nenhum administrador cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const memberIsOwner = member.roles?.includes('owner');
                  
                  return (
                    <div key={member.$id} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${memberIsOwner ? 'bg-amber-500' : 'bg-blue-900'} rounded-full flex items-center justify-center flex-shrink-0`}>
                          {memberIsOwner ? (
                            <Crown className="w-5 h-5 text-white" />
                          ) : (
                            <Shield className="w-5 h-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900">{member.displayName}</div>
                          <p className="text-sm text-slate-500">{member.displayEmail}</p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {member.isCurrentUser && <Badge className="bg-blue-500 text-white">Você</Badge>}
                          
                          {/* ✅ NOVO: Badge de Owner/Admin */}
                          {memberIsOwner ? (
                            <Badge className="bg-amber-500 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              Owner
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-700 text-white">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
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
                        
                        {!member.isCurrentUser && isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Remover ${member.displayName}?`)) {
                                removeAdminMutation.mutate(member.$id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {!member.isCurrentUser && (
                        <div className="flex items-center gap-2 pl-13 bg-slate-100 rounded p-2">
                          <span className="text-xs text-slate-600 font-medium">ID:</span>
                          <code className="text-xs font-mono text-slate-800 flex-1 select-all">{member.userId}</code>
                          <Button variant="ghost" size="sm" onClick={() => copiarId(member.userId)} className="h-6 px-2">
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
      </div>
    </div>
  );
}