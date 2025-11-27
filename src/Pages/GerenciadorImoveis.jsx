import React, { useState, useEffect } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/ImageUploader';
import { geocodeEndereco } from '@/services/geocoding';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '@/services/cep';
import { 
  gerarCodigoAutomatico, 
  validarCodigoPersonalizado, 
  formatarCodigo 
} from '@/utils/gerarCodigo';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2,
  X,
  Save,
  MapPin,
  AlertCircle,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState(null);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  
  const [formData, setFormData] = useState({
    codigo: '',
    codigoPersonalizado: false,
    titulo: '',
    descricao: '',
    tipoImovel: 'Casa',
    finalidade: 'Residencial',
    tipoNegocio: 'Venda',
    preco: '',
    cep: '',
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
    latitude: '',
    longitude: '',
  });

  // ✅ MOVIDO PARA CIMA: useQuery ANTES do useEffect
  const { data: imoveis = [], isLoading } = useQuery({
    queryKey: ['admin-imoveis'],
    queryFn: async () => {
      return await appwrite.entities.Imovel.filter({}, '-$createdAt');
    },
    enabled: isAdmin,
  });

  // ✅ AGORA useEffect pode usar 'imoveis' porque já foi declarado
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    
    if (editId && imoveis.length > 0) {
      const imovelParaEditar = imoveis.find(i => i.$id === editId);
      if (imovelParaEditar) {
        abrirModalEditar(imovelParaEditar);
      }
    }
  }, [location.search, imoveis]);

  const imoveisFiltrados = imoveis.filter(imovel => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      imovel.titulo?.toLowerCase().includes(termo) ||
      imovel.bairro?.toLowerCase().includes(termo) ||
      imovel.cidade?.toLowerCase().includes(termo)
    );
  });

  // Função para gerar código automático
  const handleGerarCodigoAutomatico = async () => {
    if (!formData.tipoImovel || !formData.cidade) {
      toast.error('Preencha o tipo de imóvel e a cidade primeiro');
      return;
    }

    setGerandoCodigo(true);
    
    try {
      const todosImoveis = await appwrite.entities.Imovel.filter({}, '-$createdAt', 1000);
      
      const imoveisComCodigo = todosImoveis.filter(i => 
        i.codigo && i.codigo.match(/^[A-Z]{3}-[A-Z]{3}-\d{4}$/)
      );
      
      let maiorNumero = 0;
      imoveisComCodigo.forEach(imovel => {
        const match = imovel.codigo.match(/-(\d{4})$/);
        if (match) {
          const numero = parseInt(match[1]);
          if (numero > maiorNumero) {
            maiorNumero = numero;
          }
        }
      });
      
      const proximoNumero = maiorNumero + 1;
      const codigoGerado = gerarCodigoAutomatico(formData.tipoImovel, formData.cidade, proximoNumero);
      
      setFormData(prev => ({
        ...prev,
        codigo: codigoGerado,
        codigoPersonalizado: false,
      }));
      
      toast.success(`Código gerado: ${codigoGerado}`);
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      toast.error('Erro ao gerar código automático');
    } finally {
      setGerandoCodigo(false);
    }
  };

  // Mutation de criar imóvel
  const criarImovelMutation = useMutation({
    mutationFn: async (data) => {
      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls.length > 0 ? imagensUrls[0] : '';

      if (data.codigoPersonalizado) {
        if (!validarCodigoPersonalizado(data.codigo)) {
          throw new Error('Código inválido. Use apenas letras, números e hífens (ex: CAS-001)');
        }
        
        const imoveisExistentes = await appwrite.entities.Imovel.filter({}, '-$createdAt', 1000);
        const codigoExiste = imoveisExistentes.some(i => 
          i.codigo && i.codigo.toLowerCase() === data.codigo.toLowerCase()
        );
        
        if (codigoExiste) {
          throw new Error('Este código já está em uso. Escolha outro.');
        }
      }

      const imovelData = {
        codigo: data.codigo ? formatarCodigo(data.codigo) : null,
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipoImovel: TIPO_IMOVEL_MAP[data.tipoImovel] || 'house',
        finalidade: data.finalidade,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        cep: data.cep || null,
        endereco: data.endereco,
        numero: data.numero || null,
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
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };

      return await appwrite.entities.Imovel.create(imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel criado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
      console.error('Erro ao criar imóvel:', error);
      toast.error(error.message || 'Erro ao criar imóvel');
    },
  });

  // Mutation de atualizar imóvel
  const atualizarImovelMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls.length > 0 ? imagensUrls[0] : '';

      if (data.codigoPersonalizado) {
        if (!validarCodigoPersonalizado(data.codigo)) {
          throw new Error('Código inválido. Use apenas letras, números e hífens (ex: CAS-001)');
        }
        
        const imoveisExistentes = await appwrite.entities.Imovel.filter({}, '-$createdAt', 1000);
        const codigoExiste = imoveisExistentes.some(i => 
          i.$id !== id && 
          i.codigo && 
          i.codigo.toLowerCase() === data.codigo.toLowerCase()
        );
        
        if (codigoExiste) {
          throw new Error('Este código já está em uso. Escolha outro.');
        }
      }

      const imovelData = {
        codigo: data.codigo ? formatarCodigo(data.codigo) : null,
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipoImovel: TIPO_IMOVEL_MAP[data.tipoImovel] || 'house',
        finalidade: data.finalidade,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        cep: data.cep || null,
        endereco: data.endereco,
        numero: data.numero || null,
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
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      };

      return await appwrite.entities.Imovel.update(id, imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel atualizado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
      console.error('Erro ao atualizar imóvel:', error);
      toast.error(error.message || 'Erro ao atualizar imóvel');
    },
  });

  // Mutation de deletar imóvel
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
      codigo: '',
      codigoPersonalizado: false,
      titulo: '',
      descricao: '',
      tipoImovel: 'Casa',
      finalidade: 'Residencial',
      tipoNegocio: 'Venda',
      preco: '',
      cep: '',
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
      latitude: '',
      longitude: '',
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
      codigo: imovel.codigo || '',
      codigoPersonalizado: !!imovel.codigo,
      titulo: imovel.titulo || '',
      descricao: imovel.descricao || '',
      tipoImovel: TIPO_IMOVEL_REVERSE_MAP[imovel.tipoImovel] || 'Casa',
      finalidade: imovel.finalidade || 'Residencial',
      tipoNegocio: imovel.tipoNegocio || 'Venda',
      preco: imovel.preco?.toString() || '',
      cep: imovel.cep || '',
      endereco: imovel.endereco || '',
      numero: imovel.numero || '',
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
      latitude: imovel.latitude || '',
      longitude: imovel.longitude || '',
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setImovelEditando(null);
  };

  const handleBuscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCEP(true);
    toast.loading('🔍 Buscando endereço...', { id: 'buscar-cep' });

    try {
      const dadosEndereco = await buscarEnderecoPorCEP(cepLimpo);

      if (dadosEndereco) {
        setFormData(prev => ({
          ...prev,
          cep: formatarCEP(dadosEndereco.cep),
          endereco: dadosEndereco.endereco,
          bairro: dadosEndereco.bairro,
          cidade: dadosEndereco.cidade,
          estado: dadosEndereco.estado,
        }));

        toast.success('✅ Endereço encontrado!', { id: 'buscar-cep' });
      } else {
        toast.error('❌ CEP não encontrado', { id: 'buscar-cep' });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('❌ Erro ao buscar CEP', { id: 'buscar-cep' });
    } finally {
      setBuscandoCEP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma imagem do imóvel');
      return;
    }

    let coordenadas = null;
    
    if (formData.cidade && formData.estado) {
      toast.loading('🗺️ Buscando localização no mapa...', { id: 'geocoding' });
      
      try {
        coordenadas = await geocodeEndereco({
          cep: formData.cep,
          endereco: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
        });

        if (coordenadas) {
          toast.success('✅ Localização encontrada!', { 
            id: 'geocoding',
            description: '⚠️ Localização aproximada baseada no endereço fornecido'
          });
          
          formData.latitude = coordenadas.latitude;
          formData.longitude = coordenadas.longitude;
          
          if (coordenadas.displayName) {
            console.log('📍 Local encontrado:', coordenadas.displayName);
          }
        } else {
          toast.warning('⚠️ Não foi possível localizar no mapa. O imóvel será cadastrado sem localização.', { id: 'geocoding' });
        }
      } catch (error) {
        console.error('Erro ao buscar coordenadas:', error);
        toast.dismiss('geocoding');
      }
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

  const previewCodigoAutomatico = formData.tipoImovel && formData.cidade 
    ? gerarCodigoAutomatico(formData.tipoImovel, formData.cidade, 9999)
    : null;

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
                    {/* ✅ NOVO: Badge com código */}
                    {imovel.codigo && (
                      <Badge className="bg-white/90 text-blue-900 border-0 shadow-md font-mono text-xs">
                        #{imovel.codigo}
                      </Badge>
                    )}
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

                  {/* ✅ NOVO: Campo de Código */}
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-blue-900 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">Código do Imóvel</h4>
                        
                        <div className="space-y-3">
                          {/* Toggle: Automático vs Personalizado */}
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={!formData.codigoPersonalizado}
                                onChange={() => setFormData({...formData, codigoPersonalizado: false, codigo: ''})}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium text-slate-700">Gerar Automaticamente</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={formData.codigoPersonalizado}
                                onChange={() => setFormData({...formData, codigoPersonalizado: true})}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium text-slate-700">Código Personalizado</span>
                            </label>
                          </div>

                          {/* Campo de Código */}
                          {formData.codigoPersonalizado ? (
                            <div>
                              <label className="block text-sm font-medium mb-2">Digite o código personalizado</label>
                              <Input
                                value={formData.codigo}
                                onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                                placeholder="Ex: CAS-001, APT-GOI-234"
                                maxLength={20}
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                Use apenas letras, números e hífens. Ex: CAS-001, APT-GOI-234, TER-123
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex gap-2">
                                <Input
                                  value={formData.codigo}
                                  readOnly
                                  placeholder="Será gerado automaticamente"
                                  className="bg-slate-50"
                                />
                                <Button
                                  type="button"
                                  onClick={handleGerarCodigoAutomatico}
                                  disabled={gerandoCodigo || !formData.tipoImovel || !formData.cidade}
                                  className="bg-blue-900 hover:bg-blue-800 whitespace-nowrap"
                                >
                                  {gerandoCodigo ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Gerando...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Gerar Código
                                    </>
                                  )}
                                </Button>
                              </div>
                              
                              {/* ✅ NOVO: Preview do código */}
                              {previewCodigoAutomatico && !formData.codigo && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs text-blue-700">
                                    💡 <strong>Preview:</strong> Será gerado algo como{' '}
                                    <code className="font-mono font-semibold">
                                      {previewCodigoAutomatico.replace('9999', 'XXXX')}
                                    </code>
                                  </p>
                                </div>
                              )}
                              
                              <p className="text-xs text-slate-500 mt-1">
                                💡 O código será gerado no formato: TIPO-CIDADE-NUMERO (ex: CAS-GOI-0001)
                              </p>
                              {(!formData.tipoImovel || !formData.cidade) && (
                                <p className="text-xs text-amber-600 mt-1">
                                  ⚠️ Preencha o tipo de imóvel e a cidade primeiro
                                </p>
                              )}
                            </div>
                          )}

                          {/* Preview do código */}
                          {formData.codigo && (
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <p className="text-xs text-green-700 font-semibold">
                                ✓ Código: <span className="font-mono">{formData.codigo}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
                      📍 Localização
                    </h3>
                  </div>

                  {/* ✅ NOVO: Campo de CEP */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CEP *
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.cep}
                        onChange={(e) => {
                          const cep = e.target.value;
                          setFormData({...formData, cep: cep});
                          
                          // Buscar automaticamente quando digitar 8 dígitos
                          const cepLimpo = cep.replace(/\D/g, '');
                          if (cepLimpo.length === 8) {
                            handleBuscarCEP(cepLimpo);
                          }
                        }}
                        onBlur={(e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          if (cep.length === 8) {
                            setFormData({...formData, cep: formatarCEP(cep)});
                          }
                        }}
                        required
                        placeholder="99999-999"
                        maxLength={9}
                        disabled={buscandoCEP}
                      />
                      {buscandoCEP && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-900 animate-spin" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Digite o CEP e o endereço será preenchido automaticamente
                    </p>
                  </div>

                  {/* Número da casa/apto (complemento do CEP) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Número *
                    </label>
                    <Input
                      value={formData.numero || ''}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      required
                      placeholder="123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Endereço *
                    </label>
                    <Input
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      required
                      placeholder="Ex: Rua das Flores"
                      disabled={buscandoCEP}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro *</label>
                    <Input
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                      required
                      placeholder="Ex: Setor Bueno"
                      disabled={buscandoCEP}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade *</label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      required
                      placeholder="Ex: Goiânia"
                      disabled={buscandoCEP}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado (UF) *</label>
                    <Input
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                      maxLength={2}
                      required
                      placeholder="GO"
                      disabled={buscandoCEP}
                    />
                  </div>

                  {/* Coordenadas (readonly) */}
                  {(formData.latitude && formData.longitude) && (
                    <div className="md:col-span-2 space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <MapPin className="w-5 h-5" />
                          <span className="font-semibold">Localização no mapa configurada</span>
                        </div>
                        <p className="text-xs text-green-700">
                          📍 Coordenadas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                        </p>
                      </div>

                      {/* ✅ NOVO: Aviso sobre precisão */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-amber-800 font-semibold mb-1">
                              ⚠️ Importante sobre a Localização:
                            </p>
                            <ul className="text-xs text-amber-700 space-y-1">
                              <li>• A localização é aproximada, baseada no CEP e endereço</li>
                              <li>• Pode haver variação de 50-200 metros</li>
                              <li>• O marcador será exibido na página de detalhes</li>
                              <li>• Endereço exato é informado apenas após agendamento</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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