import React, { useState, useMemo } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Loader2, 
  Eye, 
  Check, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function GerenciarContatos() {
  const { isAdmin, isOwner } = useAuth();
  const queryClient = useQueryClient();
  
  // ✅ Estados para filtros e paginação
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recente'); // 'recente', 'antigo'
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const { data: contatos = [], isLoading } = useQuery({
    queryKey: ['contatos-admin'],
    queryFn: async () => {
      return await appwrite.entities.Contatos.filter({});
    },
    enabled: isAdmin,
  });

  // ✅ Filtrar e ordenar contatos
  const contatosFiltrados = useMemo(() => {
    let resultado = [...contatos];

    // Filtro por status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(c => c.status === filtroStatus);
    }

    // Filtro por busca (nome, email, mensagem)
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter(c => 
        c.nome.toLowerCase().includes(buscaLower) ||
        c.email.toLowerCase().includes(buscaLower) ||
        c.mensagem.toLowerCase().includes(buscaLower)
      );
    }

    // Ordenação
    resultado.sort((a, b) => {
      const dataA = new Date(a.$createdAt);
      const dataB = new Date(b.$createdAt);
      return ordenacao === 'recente' ? dataB - dataA : dataA - dataB;
    });

    return resultado;
  }, [contatos, filtroStatus, busca, ordenacao]);

  // ✅ Paginação
  const totalPaginas = Math.ceil(contatosFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const contatosPaginados = contatosFiltrados.slice(indiceInicial, indiceFinal);

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
    const configs = {
      novo: { class: 'bg-blue-500 text-white', label: 'Novo' },
      em_andamento: { class: 'bg-yellow-500 text-white', label: 'Em Andamento' },
      respondido: { class: 'bg-green-500 text-white', label: 'Respondido' },
      finalizado: { class: 'bg-slate-500 text-white', label: 'Finalizado' },
    };
    const config = configs[status] || configs.novo;
    return <Badge className={config.class}>{config.label}</Badge>;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Você não tem permissão.</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Gerenciar Contatos</h1>
          <p className="text-xl text-blue-100">
            {contatosFiltrados.length} {contatosFiltrados.length === 1 ? 'contato' : 'contatos'} 
            {filtroStatus !== 'todos' && ` (${filtroStatus.replace('_', ' ')})`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros e Busca */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, email ou mensagem..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1); // Reset para primeira página
                  }}
                  className="pl-10"
                />
              </div>

              {/* Ordenação */}
              <select
                className="border rounded-lg px-3 py-2 bg-white"
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
              >
                <option value="recente">Mais Recentes</option>
                <option value="antigo">Mais Antigos</option>
              </select>
            </div>

            {/* Filtros de Status */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => { setFiltroStatus('todos'); setPaginaAtual(1); }}
                size="sm"
              >
                Todos ({contatos.length})
              </Button>
              <Button
                variant={filtroStatus === 'novo' ? 'default' : 'outline'}
                onClick={() => { setFiltroStatus('novo'); setPaginaAtual(1); }}
                size="sm"
              >
                Novos ({contatos.filter(c => c.status === 'novo').length})
              </Button>
              <Button
                variant={filtroStatus === 'em_andamento' ? 'default' : 'outline'}
                onClick={() => { setFiltroStatus('em_andamento'); setPaginaAtual(1); }}
                size="sm"
              >
                Em Andamento ({contatos.filter(c => c.status === 'em_andamento').length})
              </Button>
              <Button
                variant={filtroStatus === 'respondido' ? 'default' : 'outline'}
                onClick={() => { setFiltroStatus('respondido'); setPaginaAtual(1); }}
                size="sm"
              >
                Respondidos ({contatos.filter(c => c.status === 'respondido').length})
              </Button>
              <Button
                variant={filtroStatus === 'finalizado' ? 'default' : 'outline'}
                onClick={() => { setFiltroStatus('finalizado'); setPaginaAtual(1); }}
                size="sm"
              >
                Finalizados ({contatos.filter(c => c.status === 'finalizado').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contatos */}
        <div className="space-y-4">
          {contatosPaginados.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-500">Nenhum contato encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            contatosPaginados.map((contato, index) => (
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
                          {!contato.lido && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          <CardTitle className="text-xl">{contato.nome}</CardTitle>
                          {getStatusBadge(contato.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          <a href={`mailto:${contato.email}`} className="flex items-center gap-1 hover:text-blue-900">
                            <Mail className="w-4 h-4" />
                            {contato.email}
                          </a>
                          {contato.telefone && (
                            <a href={`tel:${contato.telefone}`} className="flex items-center gap-1 hover:text-blue-900">
                              <Phone className="w-4 h-4" />
                              {contato.telefone}
                            </a>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(contato.$createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 mb-4 whitespace-pre-wrap">{contato.mensagem}</p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {!contato.lido && (
                        <Button size="sm" variant="outline" onClick={() => marcarComoLidoMutation.mutate(contato.$id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Marcar como Lido
                        </Button>
                      )}
                      
                      {contato.status !== 'em_andamento' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarStatusMutation.mutate({ id: contato.$id, status: 'em_andamento' })}
                        >
                          Em Andamento
                        </Button>
                      )}
                      
                      {contato.status !== 'respondido' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarStatusMutation.mutate({ id: contato.$id, status: 'respondido' })}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Respondido
                        </Button>
                      )}
                      
                      {contato.status !== 'finalizado' && isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => atualizarStatusMutation.mutate({ id: contato.$id, status: 'finalizado' })}
                        >
                          Finalizar
                        </Button>
                      )}
                      
                      {contato.telefone && (
                        <a
                          href={`https://wa.me/55${contato.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${contato.nome}! Recebi sua mensagem.`)}`}
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
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-slate-600">
              Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, contatosFiltrados.length)} de {contatosFiltrados.length} contatos
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {[...Array(totalPaginas)].map((_, i) => (
                <Button
                  key={i}
                  variant={paginaAtual === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaginaAtual(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}