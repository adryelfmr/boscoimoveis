import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/ImageUploader';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '@/services/cep';
import { Home, Loader2, CheckCircle, AlertCircle, Phone, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { converterParaBrasileiro } from '@/utils/telefone';
import { rateLimits } from '@/utils/rateLimit'; // ✅ ADICIONAR

export default function AnunciarImovel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipoImovel: 'Casa',
    finalidade: 'Residencial',
    tipoNegocio: 'Venda',
    preco: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: 'GO',
    area: '',
    numeroQuartos: '',
    numeroBanheiros: '',
    vagas: '',
    images: [],
  });

  const [buscandoCep, setBuscandoCep] = useState(false);
  const telefone = user?.phone; // ✅ MUDADO: usar phone nativo
  const telefoneFormatado = telefone ? converterParaBrasileiro(telefone) : null;

  // Buscar anúncio para edição
  const { data: anuncioParaEditar } = useQuery({
    queryKey: ['anuncio-editar', editId],
    queryFn: async () => {
      if (!editId) return null;
      return await appwrite.entities.Imovel.get(editId);
    },
    enabled: !!editId,
  });

  // Preencher formulário ao editar
  useEffect(() => {
    if (anuncioParaEditar) {
      const imagensArray = anuncioParaEditar.imagens 
        ? anuncioParaEditar.imagens.split(',').map((url, index) => ({
            url: url.trim(),
            fileId: null,
            name: `Imagem ${index + 1}`
          }))
        : [];

      setFormData({
        titulo: anuncioParaEditar.titulo || '',
        descricao: anuncioParaEditar.descricao || '',
        tipoImovel: anuncioParaEditar.tipoImovel === 'house' ? 'Casa' : 
                    anuncioParaEditar.tipoImovel === 'apartment' ? 'Apartamento' :
                    anuncioParaEditar.tipoImovel === 'land' ? 'Terreno' : 'Casa',
        finalidade: anuncioParaEditar.finalidade || 'Residencial',
        tipoNegocio: anuncioParaEditar.tipoNegocio || 'Venda',
        preco: anuncioParaEditar.preco?.toString() || '',
        cep: anuncioParaEditar.cep || '',
        endereco: anuncioParaEditar.endereco || '',
        numero: anuncioParaEditar.numero || '',
        bairro: anuncioParaEditar.bairro || '',
        cidade: anuncioParaEditar.cidade || '',
        estado: anuncioParaEditar.estado || 'GO',
        area: anuncioParaEditar.area?.toString() || '',
        numeroQuartos: anuncioParaEditar.numeroQuartos?.toString() || '',
        numeroBanheiros: anuncioParaEditar.numeroBanheiros?.toString() || '',
        vagas: anuncioParaEditar.vagas?.toString() || '',
        images: imagensArray,
      });
    }
  }, [anuncioParaEditar]);

  // Buscar CEP
  const handleBuscarCEP = async () => {
    if (!validarCEP(formData.cep)) {
      toast.error('CEP inválido');
      return;
    }

    setBuscandoCep(true);
    try {
      const endereco = await buscarEnderecoPorCEP(formData.cep);
      if (endereco) {
        setFormData({
          ...formData,
          endereco: endereco.logradouro || '',
          bairro: endereco.bairro || '',
          cidade: endereco.localidade || '',
          estado: endereco.uf || 'GO',
        });
        toast.success('Endereço encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  // Mutation para criar/editar anúncio
  const criarAnuncioMutation = useMutation({
    mutationFn: async (data) => {
      if (!telefone) {
        throw new Error('Você precisa cadastrar um telefone para anunciar');
      }

      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls[0] || '';

      const imovelData = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipoImovel: data.tipoImovel.toLowerCase(),
        finalidade: data.finalidade,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        cep: data.cep || null,
        endereco: data.endereco,
        numero: data.numero || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        area: parseFloat(data.area) || null,
        numeroQuartos: parseInt(data.numeroQuartos) || null,
        numeroBanheiros: parseInt(data.numeroBanheiros) || null,
        vagas: parseInt(data.vagas) || null,
        imagens: imagensUrls.join(','),
        imagemPrincipal: imagemPrincipal,
        criadoPor: user.$id,
        tipoAnuncio: 'cliente',
        statusAprovacao: 'pendente',
        disponibilidade: 'indisponivel',
        destaque: false,
        promocao: false,
        documentacaoRegular: true,
      };

      if (editId) {
        return await appwrite.entities.Imovel.update(editId, imovelData);
      } else {
        return await appwrite.entities.Imovel.create(imovelData);
      }
    },
    onSuccess: () => {
      toast.success(editId ? '✅ Anúncio atualizado!' : '🎉 Anúncio enviado!', {
        description: editId 
          ? 'Suas alterações foram salvas com sucesso.'
          : 'Aguarde a aprovação de um administrador.',
      });
      queryClient.invalidateQueries(['meus-anuncios']);
      navigate('/meus-anuncios');
    },
    onError: (error) => {
      console.error('Erro ao salvar anúncio:', error);
      toast.error(error.message || 'Erro ao salvar anúncio');
    },
  });

  // ✅ NOVO: Verificar limite de anúncios
  const { data: meusAnuncios = [] } = useQuery({
    queryKey: ['meus-anuncios-count', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      return await appwrite.entities.Imovel.filterMeusAnuncios(user.$id);
    },
    enabled: !!user?.$id,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDAÇÃO 1: Limite de anúncios por usuário (ex: 10)
    const LIMITE_ANUNCIOS_POR_USUARIO = 10;
    
    if (!editId && meusAnuncios.length >= LIMITE_ANUNCIOS_POR_USUARIO) {
      toast.error(`Você atingiu o limite de ${LIMITE_ANUNCIOS_POR_USUARIO} anúncios`, {
        description: 'Para anunciar mais imóveis, remova alguns anúncios antigos ou entre em contato conosco.',
        duration: 10000,
      });
      return;
    }

    // ✅ VALIDAÇÃO 2: Rate limit de criação (3 anúncios por dia)
    const limitCheck = rateLimits.createAd(user.$id);
    
    if (!limitCheck.allowed) {
      toast.error('Limite diário atingido', {
        description: `Você pode criar no máximo 3 anúncios por dia. Aguarde até ${limitCheck.resetTime.toLocaleString('pt-BR')}.`,
        duration: 10000,
      });
      return;
    }

    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma foto do imóvel');
      return;
    }

    if (!telefone) {
      toast.error('Atualize seu perfil com um telefone para anunciar', {
        action: {
          label: 'Ir para Perfil',
          onClick: () => navigate('/perfil'),
        },
      });
      return;
    }

    if (!formData.titulo || !formData.descricao || !formData.preco) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await criarAnuncioMutation.mutateAsync(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Necessário</h2>
            <p className="text-slate-600 mb-6">
              Você precisa estar logado para anunciar imóveis.
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/meus-anuncios" className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Meus Anúncios
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Home className="w-8 h-8 text-blue-900" />
            <h1 className="text-3xl font-bold text-slate-900">
              {editId ? 'Editar Anúncio' : 'Anuncie seu Imóvel Grátis'}
            </h1>
          </div>
          <p className="text-slate-600">
            {editId 
              ? 'Atualize as informações do seu imóvel'
              : 'Preencha os dados do seu imóvel e aguarde a aprovação'}
          </p>
          
          {telefoneFormatado ? (
            <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-4 h-4 mr-1" />
              Telefone cadastrado: {telefoneFormatado}
            </Badge>
          ) : (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Telefone não cadastrado
                  </p>
                  <p className="text-sm text-amber-700">
                    Você precisa adicionar um telefone no seu perfil para anunciar.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate('/perfil')}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Cadastrar Telefone
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload de Imagens */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fotos do Imóvel * <span className="text-slate-500">(mínimo 1, máximo 10)</span>
                </label>
                <ImageUploader
                  images={formData.images}
                  onImagesChange={(images) => setFormData({...formData, images})}
                  maxImages={20} // ✅ MUDANÇA: 10 → 20
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Dica: Fotos de boa qualidade aumentam as chances de aprovação. Você pode adicionar até 20 fotos.
                </p>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título do Anúncio *
                </label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ex: Casa com 3 quartos no Setor Bueno"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.titulo.length}/100 caracteres
                </p>
              </div>

              {/* Grid de Campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Imóvel */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Imóvel *</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.tipoImovel}
                    onChange={(e) => setFormData({...formData, tipoImovel: e.target.value})}
                    required
                  >
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>

                {/* Finalidade */}
                <div>
                  <label className="block text-sm font-medium mb-2">Finalidade *</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.finalidade}
                    onChange={(e) => setFormData({...formData, finalidade: e.target.value})}
                    required
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>

                {/* Tipo de Negócio */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Negócio *</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.tipoNegocio}
                    onChange={(e) => setFormData({...formData, tipoNegocio: e.target.value})}
                    required
                  >
                    <option value="Venda">Venda</option>
                    <option value="Aluguel">Aluguel</option>
                  </select>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preço (R$) *
                  </label>
                  <Input
                    type="number"
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    placeholder="450000"
                    required
                    min="0"
                    step="1000"
                  />
                </div>

                {/* CEP */}
                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: formatarCEP(e.target.value)})}
                      placeholder="74000-000"
                      maxLength={9}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleBuscarCEP}
                      disabled={buscandoCep || !validarCEP(formData.cep)}
                      variant="outline"
                    >
                      {buscandoCep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Buscar'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium mb-2">Estado *</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                  >
                    <option value="GO">Goiás</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="DF">Distrito Federal</option>
                  </select>
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Endereço *</label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, Avenida..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número</label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bairro *</label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    placeholder="Setor Bueno"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cidade *</label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Goiânia"
                    required
                  />
                </div>
              </div>

              {/* Características */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Área (m²)</label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    placeholder="150"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quartos</label>
                  <Input
                    type="number"
                    value={formData.numeroQuartos}
                    onChange={(e) => setFormData({...formData, numeroQuartos: e.target.value})}
                    placeholder="3"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Banheiros</label>
                  <Input
                    type="number"
                    value={formData.numeroBanheiros}
                    onChange={(e) => setFormData({...formData, numeroBanheiros: e.target.value})}
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vagas</label>
                  <Input
                    type="number"
                    value={formData.vagas}
                    onChange={(e) => setFormData({...formData, vagas: e.target.value})}
                    placeholder="2"
                    min="0"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição *
                </label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows={5}
                  placeholder="Descreva as características do imóvel, pontos positivos, localização privilegiada..."
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.descricao.length}/1000 caracteres
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/meus-anuncios')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={criarAnuncioMutation.isPending || !telefone}
                  className="flex-1 bg-blue-900 hover:bg-blue-800"
                >
                  {criarAnuncioMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editId ? 'Salvando...' : 'Enviando...'}
                    </>
                  ) : editId ? (
                    'Salvar Alterações'
                  ) : (
                    'Enviar para Aprovação'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ✅ NOVO: Mostrar aviso de limite */}
        {meusAnuncios.length >= 10 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Limite de anúncios atingido
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Você atingiu o limite de 10 anúncios ativos. 
                  Para anunciar novos imóveis, remova alguns anúncios antigos em "Meus Anúncios".
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}