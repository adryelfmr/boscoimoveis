import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function MeusAlertas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [novoAlerta, setNovoAlerta] = useState({
    cidade: '',
    tipoImovel: 'Casa',
    precoMax: '',
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ['meus-alertas', user?.$id],
    queryFn: async () => {
      return await appwrite.entities.Alerta.filter({ userId: user.$id });
    },
    enabled: !!user?.$id,
  });

  const criarAlertaMutation = useMutation({
    mutationFn: async (data) => {
      return await appwrite.entities.Alerta.create({
        userId: user.$id,
        cidade: data.cidade,
        tipoImovel: data.tipoImovel,
        precoMax: parseFloat(data.precoMax) || null,
        ativo: true,
      });
    },
    onSuccess: () => {
      toast.success('Alerta criado com sucesso!');
      queryClient.invalidateQueries(['meus-alertas']);
      setNovoAlerta({ cidade: '', tipoImovel: 'Casa', precoMax: '' });
    },
  });

  const deletarAlertaMutation = useMutation({
    mutationFn: async (id) => {
      return await appwrite.entities.Alerta.delete(id);
    },
    onSuccess: () => {
      toast.success('Alerta removido!');
      queryClient.invalidateQueries(['meus-alertas']);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-8 h-8 text-blue-900" />
          <h1 className="text-3xl font-bold">Meus Alertas</h1>
        </div>

        {/* Criar Alerta */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criar Novo Alerta</CardTitle>
            <p className="text-sm text-slate-600">
              Receba notificações quando novos imóveis corresponderem aos seus critérios
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Cidade"
                value={novoAlerta.cidade}
                onChange={(e) => setNovoAlerta({ ...novoAlerta, cidade: e.target.value })}
              />
              <select
                className="border rounded-lg px-3 py-2"
                value={novoAlerta.tipoImovel}
                onChange={(e) => setNovoAlerta({ ...novoAlerta, tipoImovel: e.target.value })}
              >
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
              </select>
              <Input
                type="number"
                placeholder="Preço máximo (opcional)"
                value={novoAlerta.precoMax}
                onChange={(e) => setNovoAlerta({ ...novoAlerta, precoMax: e.target.value })}
              />
              <Button
                onClick={() => criarAlertaMutation.mutate(novoAlerta)}
                disabled={!novoAlerta.cidade}
                className="bg-blue-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Alerta
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {alertas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Você ainda não tem alertas configurados</p>
              </CardContent>
            </Card>
          ) : (
            alertas.map((alerta) => (
              <Card key={alerta.$id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Check className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge>{alerta.tipoImovel}</Badge>
                          <Badge variant="outline">{alerta.cidade}</Badge>
                          {alerta.precoMax && (
                            <Badge variant="outline">
                              Até R$ {alerta.precoMax.toLocaleString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          Criado em {new Date(alerta.$createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletarAlertaMutation.mutate(alerta.$id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}