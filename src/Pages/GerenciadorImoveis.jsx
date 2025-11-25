import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/Components/ImageUploader';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2,
  X,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// Mapeamento de tipos de imóvel
const TIPO_IMOVEL_MAP = {
  'Casa': 'casa',
  'Apartamento': 'apartamento',
  'Terreno': 'terreno',
  'Comercial': 'comercial',
  'Rural': 'rural',
};

const TIPO_IMOVEL_REVERSE_MAP = {
  'casa': 'Casa',
  'apartamento': 'Apartamento',
  'terreno': 'Terreno',
  'comercial': 'Comercial',
  'rural': 'Rural',
};

// Mapeamento de disponibilidade
const DISPONIBILIDADE_MAP = {
  'Disponível': 'disponivel',
  'Indisponível': 'indisponivel',
  'Reservado': 'reservado',
  'Vendido': 'indisponivel',
  'Alugado': 'indisponivel',
};

const DISPONIBILIDADE_REVERSE_MAP = {
  'disponivel': 'Disponível',
  'indisponivel': 'Indisponível',
  'reservado': 'Reservado',
};

export default function GerenciadorImoveis() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipoImovel: 'Casa',
    finalidade: 'Residencial',
    tipoNegocio: 'Venda',
    preco: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    area: '',
    numeroQuartos: '',
    numeroBanheiros: '',
    vagas: '',
    images: [],
    disponibilidade: 'Disponível',
    destaque: false,
    promocao: false,
    anoConstrucao: '',
    condominio: false,
    valorCondominio: '',
    valorIptu: '',
    garagemDisponivel: false,
    documentacaoRegular: true,
    acessibilidade: true,
  });

  const { data: imoveis = [], isLoading } = useQuery({
    queryKey: ['admin-imoveis'],
    queryFn: async () => {
      return await appwrite.entities.Imovel.filter({}, '-$createdAt');
    },
    enabled: isAdmin,
  });

  const imoveisFiltrados = imoveis.filter(imovel => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      imovel.titulo?.toLowerCase().includes(termo) ||
      imovel.bairro?.toLowerCase().includes(termo) ||
      imovel.cidade?.toLowerCase().includes(termo)
    );
  });

  const criarImovelMutation = useMutation({
    mutationFn: async (data) => {
      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls.length > 0 ? imagensUrls[0] : '';

      const imovelData = {
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipoImovel: TIPO_IMOVEL_MAP[data.tipoImovel] || 'house',
        finalidade: data.finalidade,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        endereco: data.endereco,
        bairro: data.bairro || '',
        cidade: data.cidade,
        estado: data.estado,
        area: parseFloat(data.area) || null,
        numeroQuartos: parseInt(data.numeroQuartos) || null,
        numeroBanheiros: parseInt(data.numeroBanheiros) || null,
        vagas: parseInt(data.vagas) || null,
        imagens: imagensUrls.join(','),
        imagemPrincipal: imagemPrincipal,
        disponibilidade: DISPONIBILIDADE_MAP[data.disponibilidade] || 'disponivel',
        destaque: data.destaque,
        promocao: data.promocao,
        anoConstrucao: parseInt(data.anoConstrucao) || null,
        condominio: data.condominio,
        valorCondominio: parseFloat(data.valorCondominio) || null,
        valorIptu: parseFloat(data.valorIptu) || null,
        garagemDisponivel: data.garagemDisponivel,
        documentacaoRegular: data.documentacaoRegular,
        acessibilidade: data.acessibilidade,
        dataDisponivel: new Date().toISOString(),
        ultimaVisualizacao: new Date().toISOString(),
      };

      console.log('Criando imóvel com dados:', imovelData);
      return await appwrite.entities.Imovel.create(imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel criado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
      console.error('Erro ao criar imóvel:', error);
      toast.error(`Erro ao criar imóvel: ${error.message}`);
    },
  });

  const atualizarImovelMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls.length > 0 ? imagensUrls[0] : '';

      const imovelData = {
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipoImovel: TIPO_IMOVEL_MAP[data.tipoImovel] || 'house',
        finalidade: data.finalidade,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        endereco: data.endereco,
        bairro: data.bairro || '',
        cidade: data.cidade,
        estado: data.estado,
        area: parseFloat(data.area) || null,
        numeroQuartos: parseInt(data.numeroQuartos) || null,
        numeroBanheiros: parseInt(data.numeroBanheiros) || null,
        vagas: parseInt(data.vagas) || null,
        imagens: imagensUrls.join(','),
        imagemPrincipal: imagemPrincipal,
        disponibilidade: DISPONIBILIDADE_MAP[data.disponibilidade] || 'disponivel',
        destaque: data.destaque,
        promocao: data.promocao,
        anoConstrucao: parseInt(data.anoConstrucao) || null,
        condominio: data.condominio,
        valorCondominio: parseFloat(data.valorCondominio) || null,
        valorIptu: parseFloat(data.valorIptu) || null,
        garagemDisponivel: data.garagemDisponivel,
        documentacaoRegular: data.documentacaoRegular,
        acessibilidade: data.acessibilidade,
        ultimaVisualizacao: new Date().toISOString(),
      };

      console.log('Atualizando imóvel com dados:', imovelData);
      return await appwrite.entities.Imovel.update(id, imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel atualizado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
      console.error('Erro ao atualizar imóvel:', error);
      toast.error(`Erro ao atualizar imóvel: ${error.message}`);
    },
  });

  const deletarImovelMutation = useMutation({
    mutationFn: async (imovel) => {
      if (imovel.images && imovel.images.length > 0) {
        for (const image of imovel.images) {
          if (image.fileId) {
            try {
              await appwrite.storage.deleteFile(image.fileId);
            } catch (error) {
              console.error('Erro ao deletar imagem:', error);
            }
          }
        }
      }
      
      return await appwrite.entities.Imovel.delete(imovel.$id);
    },
    onSuccess: () => {
      toast.success('Imóvel deletado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
    },
    onError: () => {
      toast.error('Erro ao deletar imóvel');
    },
  });

  const abrirModalNovo = () => {
    setImovelEditando(null);
    setFormData({
      titulo: '',
      descricao: '',
      tipoImovel: 'Casa',
      finalidade: 'Residencial',
      tipoNegocio: 'Venda',
      preco: '',
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      area: '',
      numeroQuartos: '',
      numeroBanheiros: '',
      vagas: '',
      images: [],
      disponibilidade: 'Disponível',
      destaque: false,
      promocao: false,
      anoConstrucao: '',
      condominio: false,
      valorCondominio: '',
      valorIptu: '',
      garagemDisponivel: false,
      documentacaoRegular: true,
      acessibilidade: true,
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (imovel) => {
    setImovelEditando(imovel);
    
    const imagensArray = imovel.imagens ? imovel.imagens.split(',') : [];
    const images = imagensArray.map((url, index) => ({
      url: url.trim(),
      fileId: null,
      name: `Imagem ${index + 1}`
    }));

    setFormData({
      titulo: imovel.titulo || '',
      descricao: imovel.descricao || '',
      tipoImovel: TIPO_IMOVEL_REVERSE_MAP[imovel.tipoImovel] || 'Casa',
      finalidade: imovel.finalidade || 'Residencial',
      tipoNegocio: imovel.tipoNegocio || 'Venda',
      preco: imovel.preco?.toString() || '',
      endereco: imovel.endereco || '',
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      estado: imovel.estado || '',
      area: imovel.area?.toString() || '',
      numeroQuartos: imovel.numeroQuartos?.toString() || '',
      numeroBanheiros: imovel.numeroBanheiros?.toString() || '',
      vagas: imovel.vagas?.toString() || '',
      images,
      disponibilidade: DISPONIBILIDADE_REVERSE_MAP[imovel.disponibilidade] || 'Disponível',
      destaque: imovel.destaque || false,
      promocao: imovel.promocao || false,
      anoConstrucao: imovel.anoConstrucao?.toString() || '',
      condominio: imovel.condominio || false,
      valorCondominio: imovel.valorCondominio?.toString() || '',
      valorIptu: imovel.valorIptu?.toString() || '',
      garagemDisponivel: imovel.garagemDisponivel || false,
      documentacaoRegular: imovel.documentacaoRegular !== false,
      acessibilidade: imovel.acessibilidade !== false,
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setImovelEditando(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma imagem do imóvel');
      return;
    }
    
    if (imovelEditando) {
      atualizarImovelMutation.mutate({ id: imovelEditando.$id, data: formData });
    } else {
      criarImovelMutation.mutate(formData);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTipoImovelLabel = (tipo) => {
    return TIPO_IMOVEL_REVERSE_MAP[tipo] || tipo;
  };

  const getDisponibilidadeLabel = (disponibilidade) => {
    return DISPONIBILIDADE_REVERSE_MAP[disponibilidade] || disponibilidade;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-900" />
              Gerenciar Imóveis
            </h1>
            <p className="text-slate-600 mt-2">
              {imoveis.length} {imoveis.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}
            </p>
          </div>
          <Button
            onClick={abrirModalNovo}
            className="bg-blue-900 hover:bg-blue-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Imóvel
          </Button>
        </div>

        {/* Busca */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por título, bairro ou cidade..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Imóveis */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
          </div>
        ) : imoveisFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveisFiltrados.map((imovel) => (
              <Card key={imovel.$id} className="overflow-hidden">
                <div className="relative h-48 bg-slate-200">
                  <img
                    src={imovel.imagemPrincipal || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'}
                    alt={imovel.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {imovel.destaque && (
                      <Badge className="bg-amber-400 text-blue-900">Destaque</Badge>
                    )}
                    {imovel.promocao && (
                      <Badge className="bg-red-500 text-white">Promoção</Badge>
                    )}
                    <Badge className={
                      imovel.disponibilidade === 'disponivel' ? 'bg-green-500' :
                      imovel.disponibilidade === 'reservado' ? 'bg-yellow-500' :
                      'bg-slate-500'
                    }>
                      {getDisponibilidadeLabel(imovel.disponibilidade)}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2">{getTipoImovelLabel(imovel.tipoImovel)}</Badge>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                    {imovel.titulo}
                  </h3>
                  <p className="text-2xl font-bold text-blue-900 mb-4">
                    {formatPrice(imovel.preco)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalEditar(imovel)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Deseja realmente deletar este imóvel?')) {
                          deletarImovelMutation.mutate(imovel);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum imóvel encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {imovelEditando ? 'Editar Imóvel' : 'Novo Imóvel'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fecharModal}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload de Imagens */}
                <ImageUploader
                  images={formData.images}
                  onImagesChange={(images) => setFormData({...formData, images})}
                  maxImages={10}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* INFORMAÇÕES BÁSICAS */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2">
                      Informações Básicas
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Título *</label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      required
                      placeholder="Ex: Casa com 3 quartos em condomínio fechado"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      rows={4}
                      placeholder="Descreva as características do imóvel..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo *</label>
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
                      <option value="Rural">Rural</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Finalidade (Uso) *</label>
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
                      <option value="Venda/Aluguel">Venda/Aluguel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Disponibilidade *</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={formData.disponibilidade}
                      onChange={(e) => setFormData({...formData, disponibilidade: e.target.value})}
                      required
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Indisponível">Indisponível</option>
                    </select>
                  </div>

                  {/* VALORES */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2">
                      Valores
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Preço (R$) *</label>
                    <Input
                      type="number"
                      value={formData.preco}
                      onChange={(e) => setFormData({...formData, preco: e.target.value})}
                      required
                      placeholder="450000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valor do Condomínio (R$)</label>
                    <Input
                      type="number"
                      value={formData.valorCondominio}
                      onChange={(e) => setFormData({...formData, valorCondominio: e.target.value})}
                      placeholder="350"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Valor do IPTU (R$)</label>
                    <Input
                      type="number"
                      value={formData.valorIptu}
                      onChange={(e) => setFormData({...formData, valorIptu: e.target.value})}
                      placeholder="1200"
                    />
                  </div>

                  {/* CARACTERÍSTICAS */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2">
                      Características
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Área (m²)</label>
                    <Input
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      placeholder="150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Ano de Construção</label>
                    <Input
                      type="number"
                      value={formData.anoConstrucao}
                      onChange={(e) => setFormData({...formData, anoConstrucao: e.target.value})}
                      placeholder="2020"
                      min="1900"
                      max="2100"
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
                      max="20"
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
                      max="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Vagas de Garagem</label>
                    <Input
                      type="number"
                      value={formData.vagas}
                      onChange={(e) => setFormData({...formData, vagas: e.target.value})}
                      placeholder="2"
                      min="0"
                      max="20"
                    />
                  </div>

                  {/* LOCALIZAÇÃO */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2">
                      Localização
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Endereço *</label>
                    <Input
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      placeholder="Rua das Flores, 123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro</label>
                    <Input
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      placeholder="Jardim Primavera"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade *</label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      placeholder="São Paulo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado *</label>
                    <Input
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      maxLength={2}
                      placeholder="SP"
                      required
                    />
                  </div>

                  {/* OPÇÕES */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2">
                      Opções e Destaques
                    </h3>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.destaque}
                        onChange={(e) => setFormData({...formData, destaque: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">⭐ Destaque</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.promocao}
                        onChange={(e) => setFormData({...formData, promocao: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">🏷️ Promoção</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.condominio}
                        onChange={(e) => setFormData({...formData, condominio: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Em Condomínio</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.garagemDisponivel}
                        onChange={(e) => setFormData({...formData, garagemDisponivel: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Garagem Disponível</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.documentacaoRegular}
                        onChange={(e) => setFormData({...formData, documentacaoRegular: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Documentação Regular</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.acessibilidade}
                        onChange={(e) => setFormData({...formData, acessibilidade: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">♿ Acessibilidade</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fecharModal}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-900 hover:bg-blue-800"
                    disabled={criarImovelMutation.isPending || atualizarImovelMutation.isPending}
                  >
                    {(criarImovelMutation.isPending || atualizarImovelMutation.isPending) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Imóvel
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}