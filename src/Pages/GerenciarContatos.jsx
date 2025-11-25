import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MessageCircle, Calendar, Loader2, Eye, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function GerenciarContatos() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ['contatos-admin', filtroStatus],
    queryFn: async () => {
      const filters = filtroStatus !== 'todos' ? { status: filtroStatus } : {};
      return await appwrite.entities.Contatos.filter(filters);
    },
    enabled: isAdmin,
  });

  const marcarComoLidoMutation = useMutation({
    mutationFn: async (id) => {
      return await appwrite.entities.Contatos.update(id, { lido: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contatos-admin']);
      toast.success('Marcado como lido');
    },
  });

  const atualizarStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await appwrite.entities.Contatos.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contatos-admin']);
      toast.success('Status atualizado');
    },
  });

  const getStatusBadge = (status) => {
    const styles = {
      novo: 'bg-blue-500 text-white',
      em_andamento: 'bg-yellow-500 text-white',
      respondido: 'bg-green-500 text-white',
      finalizado: 'bg-slate-500 text-white',
    };

    const labels = {
      novo: 'Novo',
      em_andamento: 'Em Andamento',
      respondido: 'Respondido',
      finalizado: 'Finalizado',
    };

    return (
      <Badge className={styles[status]}>
        {labels[status]}
      </Badge>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Gerenciar Contatos</h1>
          <p className="text-xl text-blue-100">
            {contatos.length} {contatos.length === 1 ? 'contato' : 'contatos'} registrados
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filtroStatus === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos
          </Button>
          <Button
            variant={filtroStatus === 'novo' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('novo')}
          >
            Novos
          </Button>
          <Button
            variant={filtroStatus === 'em_andamento' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('em_andamento')}
          >
            Em Andamento
          </Button>
          <Button
            variant={filtroStatus === 'respondido' ? 'default' : 'outline'}
            onClick={() => setFiltroStatus('respondido')}
          >
            Respondidos
          </Button>
        </div>

        {/* Lista de Contatos */}
        <div className="space-y-4">
          {contatos.map((contato, index) => (
            <motion.div
              key={contato.$id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`border-0 shadow-lg ${!contato.lido ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {!contato.lido && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        <CardTitle className="text-xl">{contato.nome}</CardTitle>
                        {getStatusBadge(contato.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${contato.email}`} className="hover:text-blue-900">
                            {contato.email}
                          </a>
                        </div>
                        {contato.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${contato.telefone}`} className="hover:text-blue-900">
                              {contato.telefone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(contato.$createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-4 whitespace-pre-wrap">{contato.mensagem}</p>
                  
                  <div className="flex gap-2">
                    {!contato.lido && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marcarComoLidoMutation.mutate(contato.$id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Marcar como Lido
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => atualizarStatusMutation.mutate({ 
                        id: contato.$id, 
                        status: 'em_andamento' 
                      })}
                      disabled={contato.status === 'em_andamento'}
                    >
                      Em Andamento
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => atualizarStatusMutation.mutate({ 
                        id: contato.$id, 
                        status: 'respondido' 
                      })}
                      disabled={contato.status === 'respondido'}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Respondido
                    </Button>
                    
                    {contato.telefone && (
                      <a
                        href={`https://wa.me/55${contato.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${contato.nome}! Recebi sua mensagem pelo site.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-green-500 hover:bg-green-600">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}