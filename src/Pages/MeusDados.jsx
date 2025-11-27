import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { appwrite } from '@/api/appwriteClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Eye, MessageCircle, TrendingUp } from 'lucide-react';

export default function MeusDados() {
  const { user } = useAuth();

  const { data: favoritos = [] } = useQuery({
    queryKey: ['meus-favoritos', user?.$id],
    queryFn: async () => {
      return await appwrite.entities.Favorito.filter({ userId: user.$id });
    },
    enabled: !!user?.$id,
  });

  const { data: visualizacoes = [] } = useQuery({
    queryKey: ['minhas-visualizacoes', user?.$id],
    queryFn: async () => {
      return await appwrite.entities.Visualizacao.filter({ userId: user.$id });
    },
    enabled: !!user?.$id,
  });

  const totalVisualizacoes = visualizacoes.length;
  const totalFavoritos = favoritos.length;
  const tempoMedioVisualizacao = Math.floor(
    visualizacoes.reduce((acc, v) => acc + (v.tempoTotal || 0), 0) / totalVisualizacoes
  );

  // Tipos de imóveis mais visualizados
  const tiposVisualizados = visualizacoes.reduce((acc, v) => {
    const tipo = v.tipoImovel || 'Outros';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Meus Dados e Estatísticas</h1>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Favoritos</CardTitle>
              <Heart className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFavoritos}</div>
              <p className="text-xs text-slate-600 mt-1">Imóveis salvos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisualizacoes}</div>
              <p className="text-xs text-slate-600 mt-1">Imóveis visualizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(tempoMedioVisualizacao / 60)}m {tempoMedioVisualizacao % 60}s
              </div>
              <p className="text-xs text-slate-600 mt-1">Por visualização</p>
            </CardContent>
          </Card>
        </div>

        {/* Tipos Mais Visualizados */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Interesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(tiposVisualizados)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tipo}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-900 h-2 rounded-full"
                          style={{
                            width: `${(count / totalVisualizacoes) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}