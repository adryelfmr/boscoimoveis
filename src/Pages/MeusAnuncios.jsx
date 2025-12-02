import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Home, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit, 
  Trash2,
  Eye,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import LazyImage from '@/components/LazyImage';

export default function MeusAnuncios() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [deletandoId, setDeletandoId] = useState(null);

  const { data: meusAnuncios = [], isLoading } = useQuery({
    queryKey: ['meus-anuncios', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      return await appwrite.entities.Imovel.filterMeusAnuncios(user.$id);
    },
    enabled: !!user?.$id,
  });

  const deletarAnuncioMutation = useMutation({
    mutationFn: async (id) => {
      return await appwrite.entities.Imovel.delete(id);
    },
    onSuccess: () => {
      toast.success('Anúncio excluído com sucesso!');
      queryClient.invalidateQueries(['meus-anuncios']);
      setDeletandoId(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir anúncio');
      setDeletandoId(null);
    },
  });

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      setDeletandoId(id);
      await deletarAnuncioMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando Aprovação
          </Badge>
        );
      case 'rejeitado':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800">
            {status}
          </Badge>
        );
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Necessário</h2>
            <p className="text-slate-600 mb-6">
              Você precisa estar logado para ver seus anúncios.
            </p>
            <Link to="/login">
              <Button>Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Home className="w-10 h-10" />
            Meus Anúncios
          </h1>
          <p className="text-xl text-blue-100">
            {meusAnuncios.length} {meusAnuncios.length === 1 ? 'anúncio' : 'anúncios'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Informativo */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Como funciona?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Seus anúncios ficam <strong>pendentes</strong> até um administrador aprovar</li>
                <li>• Após aprovação, seu imóvel aparece no catálogo público</li>
                <li>• Você pode editar ou excluir seus anúncios a qualquer momento</li>
                <li>• Se rejeitado, você verá o motivo e poderá reenviar após correção</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96" />
            ))}
          </div>
        ) : meusAnuncios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meusAnuncios.map((anuncio) => {
              const imagemPrincipal = anuncio.imagemPrincipal || 
                (anuncio.imagens ? anuncio.imagens.split(',')[0] : null);

              return (
                <Card key={anuncio.$id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Imagem */}
                  <div className="relative h-48 bg-slate-200">
                    {imagemPrincipal ? (
                      <LazyImage
                        src={imagemPrincipal}
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(anuncio.statusAprovacao)}
                    </div>
                    {anuncio.statusAprovacao === 'aprovado' && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-slate-800 border-0">
                          <Eye className="w-3 h-3 mr-1" />
                          Público
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Título */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {anuncio.titulo}
                    </h3>

                    {/* Preço */}
                    <p className="text-2xl font-bold text-blue-900 mb-3">
                      {formatPrice(anuncio.preco)}
                    </p>

                    {/* Localização */}
                    <p className="text-sm text-slate-600 mb-4">
                      📍 {anuncio.bairro}, {anuncio.cidade} - {anuncio.estado}
                    </p>

                    {/* ✅ NOVO: Informações de Aprovação */}
                    {anuncio.statusAprovacao === 'aprovado' && anuncio.dataAprovacao && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-800 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Aprovado!
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Aprovado em {new Date(anuncio.dataAprovacao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {anuncio.aprovadoPorNome && (
                          <p className="text-xs text-green-600 mt-1">
                            por {anuncio.aprovadoPorNome}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ✅ ATUALIZADO: Motivo de Rejeição com mais detalhes */}
                    {anuncio.statusAprovacao === 'rejeitado' && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Anúncio Rejeitado
                        </p>
                        
                        {anuncio.dataRejeicao && (
                          <p className="text-xs text-red-700 mb-2">
                            Rejeitado em {new Date(anuncio.dataRejeicao).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        
                        {anuncio.rejeitadoPorNome && (
                          <p className="text-xs text-red-600 mb-2">
                            por {anuncio.rejeitadoPorNome}
                          </p>
                        )}
                        
                        {anuncio.motivoRejeicao && (
                          <>
                            <p className="text-xs font-semibold text-red-800 mb-1">
                              Motivo:
                            </p>
                            <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                              "{anuncio.motivoRejeicao}"
                            </p>
                          </>
                        )}
                        
                        <p className="text-xs text-red-600 mt-2 font-medium">
                          💡 Você pode editar e reenviar
                        </p>
                      </div>
                    )}

                    {/* ✅ NOVO: Aviso de Pendente */}
                    {anuncio.statusAprovacao === 'pendente' && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Aguardando Aprovação
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Seu anúncio será revisado em breve por um administrador
                        </p>
                      </div>
                    )}

                    {/* Data */}
                    <p className="text-xs text-slate-500 mb-4">
                      Criado em {new Date(anuncio.$createdAt).toLocaleDateString('pt-BR')}
                    </p>

                    {/* Ações */}
                    <div className="flex gap-2">
                      {anuncio.statusAprovacao === 'aprovado' && (
                        <Link to={`/detalhes?id=${anuncio.$id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      )}
                      
                      {anuncio.statusAprovacao !== 'aprovado' && (
                        <Link to={`/anunciar?edit=${anuncio.$id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:bg-red-50 border-red-300"
                        size="sm"
                        onClick={() => handleDeletar(anuncio.$id)}
                        disabled={deletandoId === anuncio.$id}
                      >
                        {deletandoId === anuncio.$id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Nenhum anúncio ainda
              </h3>
              <p className="text-slate-600 mb-6">
                Comece anunciando seu primeiro imóvel gratuitamente!
              </p>
              <Link to="/anunciar">
                <Button className="bg-blue-900 hover:bg-blue-800">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Anunciar Meu Primeiro Imóvel
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}