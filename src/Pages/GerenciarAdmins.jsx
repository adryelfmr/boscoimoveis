import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teams, ADMIN_TEAM_ID } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, Trash2, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function GerenciarAdmins() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Buscar membros da equipe admin
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

  const { data: members = [] } = useQuery({
    queryKey: ['adminMembers'],
    queryFn: async () => {
      try {
        const response = await teams.listMemberships(ADMIN_TEAM_ID);
        return response.memberships;
      } catch (error) {
        console.error('Erro ao buscar membros:', error);
        return [];
      }
    },
    enabled: isAdmin && !!ADMIN_TEAM_ID,
  });

  // Adicionar novo admin
  const addAdminMutation = useMutation({
    mutationFn: async (email) => {
      return await teams.createMembership(
        ADMIN_TEAM_ID,
        ['admin'],
        email
      );
    },
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!');
      setNewAdminEmail('');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      console.error('Erro ao adicionar admin:', error);
      toast.error('Erro ao enviar convite');
    },
  });

  // Remover admin
  const removeAdminMutation = useMutation({
    mutationFn: async (membershipId) => {
      return await teams.deleteMembership(ADMIN_TEAM_ID, membershipId);
    },
    onSuccess: () => {
      toast.success('Administrador removido com sucesso!');
      queryClient.invalidateQueries(['adminMembers']);
    },
    onError: (error) => {
      console.error('Erro ao remover admin:', error);
      toast.error('Erro ao remover administrador');
    },
  });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      toast.error('Digite um email válido');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-900" />
            Gerenciar Administradores
          </h1>
          <p className="text-slate-600 mt-2">
            Adicione ou remova administradores do sistema
          </p>
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
            <form onSubmit={handleAddAdmin} className="flex gap-3">
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
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Um convite será enviado para o email. O usuário precisará aceitar para se tornar administrador.
            </p>
          </CardContent>
        </Card>

        {/* Lista de admins */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Administradores Atuais ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nenhum administrador cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.$id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {member.userName || 'Nome não disponível'}
                        </p>
                        <p className="text-sm text-slate-500">{member.userEmail}</p>
                      </div>
                      {member.userId === user.$id && (
                        <Badge className="bg-amber-400 text-blue-900">
                          Você
                        </Badge>
                      )}
                      {member.confirm && (
                        <Badge className="bg-green-500 text-white">
                          Ativo
                        </Badge>
                      )}
                      {!member.confirm && (
                        <Badge variant="outline" className="text-slate-600">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    {member.userId !== user.$id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdminMutation.mutate(member.$id)}
                        disabled={removeAdminMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>💡 Dica:</strong> Para adicionar um novo administrador, ele precisa ter uma conta no sistema. 
            Se o usuário ainda não tem conta, peça para ele se registrar primeiro em{' '}
            <a href="/registro" className="underline hover:text-blue-700">/registro</a>
          </p>
        </div>
      </div>
    </div>
  );
}