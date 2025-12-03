import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom'; // ✅ ADICIONAR
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/ImageUploader';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '@/services/cep'; // ✅ REMOVER geocodeEndereco
import { 
  gerarCodigoAutomatico, 
  validarCodigoPersonalizado, 
  formatarCodigo 
} from '@/utils/gerarCodigo';
import { 
  TIPO_IMOVEL_ADMIN_MAP, 
  TIPO_IMOVEL_ADMIN_REVERSE_MAP, 
  DISPONIBILIDADE_MAP, 
  DISPONIBILIDADE_REVERSE_MAP,
  TIPOS_RESIDENCIAL,
  TIPOS_COMERCIAL,
  getTipoImovelLabel,
} from '@/config/imovelConfig';
import { 
  Building2, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Loader2, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Save,
  Hash,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal, PromptModal } from '@/components/ConfirmModal';

export default function GerenciadorImoveis() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState(null);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [modalAprovar, setModalAprovar] = useState({ isOpen: false, id: null });
  const [modalReprovar, setModalReprovar] = useState({ isOpen: false, id: null });
  const [modalDeletar, setModalDeletar] = useState({ isOpen: false, imovel: null });
  
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

  // ✅ ATUALIZADO: Estados para filtros
  const [filtros, setFiltros] = useState({
    tipoAnuncio: 'todos',
    statusAprovacao: 'todos',
    disponibilidade: 'todos',
    finalidade: 'todas', // ✅ NOVO
    tipoImovel: 'todos',
    cidade: '',
  });
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // ✅ NOVO: Aplicar filtros avançados
  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter(imovel => {
      // Busca por texto
      if (busca) {
        const termo = busca.toLowerCase();
        const match = (
          imovel.titulo?.toLowerCase().includes(termo) ||
          imovel.codigo?.toLowerCase().includes(termo) ||
          imovel.bairro?.toLowerCase().includes(termo) ||
          imovel.cidade?.toLowerCase().includes(termo)
        );
        if (!match) return false;
      }

      // Tipo de anúncio
      if (filtros.tipoAnuncio !== 'todos') {
        if (filtros.tipoAnuncio === 'admin' && imovel.tipoAnuncio === 'cliente') return false;
        if (filtros.tipoAnuncio === 'cliente' && imovel.tipoAnuncio !== 'cliente') return false;
      }

      // Status de aprovação
      if (filtros.statusAprovacao !== 'todos') {
        if (imovel.statusAprovacao !== filtros.statusAprovacao) return false;
      }

      // Disponibilidade
      if (filtros.disponibilidade !== 'todos') {
        if (imovel.disponibilidade !== filtros.disponibilidade) return false;
      }

      // ✅ NOVO: Finalidade
      if (filtros.finalidade !== 'todas') {
        if (imovel.finalidade !== filtros.finalidade) return false;
      }

      // Tipo de imóvel
      if (filtros.tipoImovel !== 'todos') {
        if (imovel.tipoImovel !== filtros.tipoImovel) return false;
      }

      // Cidade
      if (filtros.cidade) {
        if (!imovel.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase())) return false;
      }

      return true;
    });
  }, [imoveis, busca, filtros]);

  // ✅ NOVO: Paginação
  const totalPaginas = Math.ceil(imoveisFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const imoveisPaginados = imoveisFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  // Reset página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtros]);

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

      // ✅ BUSCAR COORDENADAS AUTOMATICAMENTE
      let latitude = null;
      let longitude = null;
      let precision = null;

      if (data.cep) {
        try {
          const dadosCEP = await buscarEnderecoPorCEP(data.cep);
          if (dadosCEP?.latitude && dadosCEP?.longitude) {
            latitude = dadosCEP.latitude;
            longitude = dadosCEP.longitude;
            precision = dadosCEP.precision;
          }
        } catch (error) {
          // Coordenadas opcionais
        }
      }

      const imovelData = {
        codigo: data.codigo ? formatarCodigo(data.codigo) : null,
        titulo: data.titulo,
        descricao: data.descricao || '',
        tipoImovel: TIPO_IMOVEL_ADMIN_MAP[data.tipoImovel] || 'house',
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
        // ✅ SALVAR COORDENADAS
        latitude: latitude,
        longitude: longitude,
        precisaoLocalizacao: precision,
      };

      return await appwrite.entities.Imovel.create(imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel criado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
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
        tipoImovel: TIPO_IMOVEL_ADMIN_MAP[data.tipoImovel] || 'house',
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
        // ❌ REMOVIDO: latitude e longitude
      };

      return await appwrite.entities.Imovel.update(id, imovelData);
    },
    onSuccess: () => {
      toast.success('Imóvel atualizado com sucesso!');
      queryClient.invalidateQueries(['admin-imoveis']);
      fecharModal();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar imóvel');
    },
  });

  // ✅ MUTATION: Aprovar imóvel (ATUALIZADO)
  const aprovarImovelMutation = useMutation({
    mutationFn: async (id) => {
      return await appwrite.entities.Imovel.update(id, {
        statusAprovacao: 'aprovado',
        disponibilidade: 'disponivel',
        dataAprovacao: new Date().toISOString(),
        aprovadoPor: user.$id, // ✅ Salvar quem aprovou
        aprovadoPorNome: user.name, // ✅ Salvar nome de quem aprovou
      });
    },
    onSuccess: () => {
      toast.success('✅ Imóvel aprovado!');
      queryClient.invalidateQueries(['admin-imoveis']);
    },
    onError: (error) => {
      toast.error('❌ Erro ao aprovar imóvel', {
        description: error.message || 'Verifique suas permissões',
      });
    },
  });

  // ✅ MUTATION: Reprovar imóvel (ATUALIZADO)
  const reprovarImovelMutation = useMutation({
    mutationFn: async ({ id, motivo }) => {
      return await appwrite.entities.Imovel.update(id, {
        statusAprovacao: 'rejeitado',
        disponibilidade: 'indisponivel',
        motivoRejeicao: motivo,
        dataRejeicao: new Date().toISOString(), // ✅ Data da rejeição
        rejeitadoPor: user.$id, // ✅ Quem rejeitou
        rejeitadoPorNome: user.name, // ✅ Nome de quem rejeitou
      });
    },
    onSuccess: () => {
      toast.success('❌ Imóvel rejeitado');
      queryClient.invalidateQueries(['admin-imoveis']);
    },
    onError: (error) => {
      toast.error('❌ Erro ao reprovar imóvel', {
        description: error.message,
      });
    },
  });

  // ✅ MUTATION: Deletar imóvel
  const deletarImovelMutation = useMutation({
    mutationFn: async (imovel) => {
      // Deletar imagens primeiro
      if (imovel.images && imovel.images.length > 0) {
        for (const image of imovel.images) {
          if (image.fileId) {
            try {
              await appwrite.storage.deleteFile(image.fileId);
            } catch (error) {
            }
          }
        }
      }
      
      return await appwrite.entities.Imovel.delete(imovel.$id);
    },
    onSuccess: () => {
      toast.success('🗑️ Imóvel deletado!');
      queryClient.invalidateQueries(['admin-imoveis']);
    },
    onError: (error) => {
      toast.error('❌ Erro ao deletar', {
        description: error.message,
      });
    },
  });

  // ✅ ADICIONAR: Handlers para as ações
  const handleAprovar = (id) => {
    setModalAprovar({ isOpen: true, id });
  };

  const confirmarAprovacao = () => {
    if (modalAprovar.id) {
      aprovarImovelMutation.mutate(modalAprovar.id);
    }
  };

  const handleReprovar = (id) => {
    setModalReprovar({ isOpen: true, id });
  };

  const confirmarRejeicao = (motivo) => {
    if (modalReprovar.id && motivo.trim()) {
      reprovarImovelMutation.mutate({ id: modalReprovar.id, motivo });
    }
  };

  const handleDeletar = (imovel) => {
    setModalDeletar({ isOpen: true, imovel });
  };

  const confirmarDelecao = () => {
    if (modalDeletar.imovel) {
      deletarImovelMutation.mutate(modalDeletar.imovel);
    }
  };

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
          // ❌ REMOVIDO: latitude e longitude
        }));

        toast.success('✅ Endereço encontrado!', { id: 'buscar-cep' });
      } else {
        toast.error('❌ CEP não encontrado', { id: 'buscar-cep' });
      }
    } catch (error) {
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

    // ✅ Gerar código automaticamente se necessário
    if (!formData.codigoPersonalizado && !formData.codigo && formData.tipoImovel && formData.cidade) {
      toast.loading('🔢 Gerando código...', { id: 'gerar-codigo' });
      
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
        
        formData.codigo = codigoGerado;
        
        toast.success(`✅ Código gerado: ${codigoGerado}`, { id: 'gerar-codigo' });
      } catch (error) {
        toast.dismiss('gerar-codigo');
      }
    }

    // ✅ REMOVIDO: Toda a lógica de geocoding
    // As coordenadas já vêm do CEP
    
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

  // ✅ CORRIGIR: Usar a função importada
  // Remover essas linhas (783-785):
  // const getTipoImovelLabel = (tipo) => {
  //   return TIPO_IMOVEL_REVERSE_MAP[tipo] || tipo;
  // };

  const getDisponibilidadeLabel = (disponibilidade) => {
    return DISPONIBILIDADE_REVERSE_MAP[disponibilidade] || disponibilidade;
  };

  const previewCodigoAutomatico = formData.tipoImovel && formData.cidade 
    ? gerarCodigoAutomatico(formData.tipoImovel, formData.cidade, 9999)
    : null;

  // ✅ NOVO: Query para buscar dados dos usuários
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-anunciantes'],
    queryFn: async () => {
      try {
        // Buscar todos os imóveis de clientes
        const imoveisClientes = imoveis.filter(i => i.tipoAnuncio === 'cliente');
        const idsUnicos = [...new Set(imoveisClientes.map(i => i.criadoPor))];
        
        // Buscar dados dos usuários no Appwrite
        const users = await Promise.all(
          idsUnicos.map(async (userId) => {
            try {
              const user = await account.get(); // Implementar busca por ID
              return { id: userId, ...user };
            } catch {
              return { id: userId, name: 'Usuário desconhecido', email: null, phone: null };
            }
          })
        );
        
        return users;
      } catch (error) {
        return [];
      }
    },
    enabled: imoveis.some(i => i.tipoAnuncio === 'cliente'),
  });

  // ✅ FUNÇÃO: Buscar dados do usuário
  const getDadosUsuario = (userId) => {
    return usuarios.find(u => u.id === userId) || { name: 'Carregando...', email: null, phone: null };
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-900" />
              Gerenciar Imóveis
            </h1>
            <p className="text-slate-600 mt-1">{imoveis.length} imóveis cadastrados</p>
          </div>
        </div>

        {/* ✅ ATUALIZADO: Filtros Avançados */}
        <Card className="mb-6 p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-4">
            {/* Busca */}
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Título, código, cidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tipo de Anúncio */}
            <div>
              <label className="block text-sm font-medium mb-2">Origem</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.tipoAnuncio}
                onChange={(e) => setFiltros({...filtros, tipoAnuncio: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="admin">Admin</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>

            {/* Status Aprovação */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.statusAprovacao}
                onChange={(e) => setFiltros({...filtros, statusAprovacao: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
            </div>

            {/* Disponibilidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Disponibilidade</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.disponibilidade}
                onChange={(e) => setFiltros({...filtros, disponibilidade: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="disponivel">Disponível</option>
                <option value="reservado">Reservado</option>
                <option value="indisponivel">Indisponível</option>
              </select>
            </div>

            {/* ✅ NOVO: Finalidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Finalidade</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.finalidade}
                onChange={(e) => {
                  setFiltros({...filtros, finalidade: e.target.value, tipoImovel: 'todos'});
                }}
              >
                <option value="todas">Todas</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>

            {/* ✅ ATUALIZADO: Tipo de Imóvel */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.tipoImovel}
                onChange={(e) => setFiltros({...filtros, tipoImovel: e.target.value})}
              >
                <option value="todos">Todos</option>
                
                {filtros.finalidade === 'todas' && (
                  <>
                    <optgroup label="Residencial">
                      {TIPOS_RESIDENCIAL.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Comercial">
                      {TIPOS_COMERCIAL.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
                
                {filtros.finalidade === 'Residencial' && TIPOS_RESIDENCIAL.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
                
                {filtros.finalidade === 'Comercial' && TIPOS_COMERCIAL.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                type="text"
                placeholder="Ex: Goiânia"
                value={filtros.cidade || ''}
                onChange={(e) => setFiltros({...filtros, cidade: e.target.value})}
              />
            </div>
          </div>

          {/* Estatísticas e Limpar Filtros */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{imoveisFiltrados.length}</span> imóveis encontrados
              {imoveisFiltrados.length !== imoveis.length && (
                <span className="ml-2">de {imoveis.length} no total</span>
              )}
            </div>
            
            {(busca || Object.values(filtros).some(v => v !== 'todos' && v !== 'todas' && v !== '')) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBusca('');
                  setFiltros({
                    tipoAnuncio: 'todos',
                    statusAprovacao: 'todos',
                    disponibilidade: 'todos',
                    finalidade: 'todas',
                    tipoImovel: 'todos',
                    cidade: '',
                  });
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </Card>

        {/* ✅ ATUALIZADO: Cards dos Imóveis */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
          </div>
        ) : imoveisPaginados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum imóvel encontrado</h3>
              <p className="text-slate-600">Tente ajustar os filtros</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6">
              {imoveisPaginados.map((imovel) => {
                return (
                  <Card key={imovel.$id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-[200px_1fr] gap-4 p-4">
                      {/* Imagem */}
                      <div className="relative h-40 md:h-full bg-slate-200 rounded-lg overflow-hidden">
                        {imovel.imagemPrincipal ? (
                          <img
                            src={imovel.imagemPrincipal}
                            alt={imovel.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Building2 className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        {imovel.destaque && (
                          <Badge className="absolute top-2 left-2 bg-amber-500">Destaque</Badge>
                        )}
                        {imovel.promocao && (
                          <Badge className="absolute top-2 right-2 bg-red-500">Promoção</Badge>
                        )}
                      </div>

                      {/* Informações */}
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                              {imovel.titulo}
                            </h3>
                            <p className="text-sm text-slate-600">
                              📍 {imovel.bairro}, {imovel.cidade} - {imovel.estado}
                            </p>
                            
                            {/* ✅ NOVO: Informações do Cliente (se for anúncio de cliente) */}
                            {imovel.tipoAnuncio === 'cliente' && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="w-4 h-4 text-blue-900" />
                                  <p className="text-sm font-semibold text-blue-900">
                                    Anunciante: {imovel.criadoPorNome}
                                  </p>
                                </div>
                                
                                <div className="space-y-1 text-xs text-slate-700">
                                  {imovel.criadoPorEmail && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3 text-slate-500" />
                                      <a 
                                        href={`mailto:${imovel.criadoPorEmail}`}
                                        className="text-blue-700 hover:underline"
                                      >
                                        {imovel.criadoPorEmail}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {imovel.criadoPorTelefone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3 h-3 text-slate-500" />
                                      <a 
                                        href={`https://wa.me/${imovel.criadoPorTelefone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-700 hover:underline flex items-center gap-1"
                                      >
                                        {imovel.criadoPorTelefone}
                                        <MessageCircle className="w-3 h-3" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Data de criação */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <span>
                                Criado em {new Date(imovel.$createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              {imovel.tipoAnuncio === 'cliente' && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    📱 Anúncio de Cliente
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          {/* ✅ ATUALIZADO: Status com badges de aprovação */}
                          <div className="flex flex-col items-end gap-2">
                            {getDisponibilidadeBadge(imovel.disponibilidade)}
                            
                            {/* ✅ NOVO: Badge de status de aprovação */}
                            {imovel.tipoAnuncio === 'cliente' && (
                              <>
                                {imovel.statusAprovacao === 'pendente' && (
                                  <Badge className="bg-amber-500 text-white flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Pendente
                                  </Badge>
                                )}
                                {imovel.statusAprovacao === 'aprovado' && (
                                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Aprovado
                                  </Badge>
                                )}
                                {imovel.statusAprovacao === 'rejeitado' && (
                                  <Badge className="bg-red-500 text-white flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    Rejeitado
                                  </Badge>
                                )}
                              </>
                            )}
                            
                            {imovel.codigo && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {imovel.codigo}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Características */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {getTipoImovelLabel(imovel.tipoImovel)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {imovel.cidade}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatPrice(imovel.preco)}
                          </span>
                          {imovel.numeroQuartos > 0 && (
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              {imovel.numeroQuartos} quartos
                            </span>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/detalhes?id=${imovel.$id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirModalEditar(imovel)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>

                          {/* ✅ NOVO: Botões de Aprovar/Reprovar (apenas para anúncios de clientes pendentes) */}
                          {imovel.tipoAnuncio === 'cliente' && imovel.statusAprovacao === 'pendente' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAprovar(imovel.$id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReprovar(imovel.$id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reprovar
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletar(imovel)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                          
                          {/* WhatsApp (se for anúncio de cliente) */}
                          {imovel.tipoAnuncio === 'cliente' && imovel.criadoPorTelefone && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                const telefone = imovel.criadoPorTelefone.replace(/\D/g, '');
                                const mensagem = encodeURIComponent(
                                  `Olá ${imovel.criadoPorNome}! Vi seu anúncio "${imovel.titulo}" no Bosco Imóveis. Gostaria de conversar sobre ele.`
                                );
                                window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPaginas)].map((_, index) => {
                    const numeroPagina = index + 1;
                    
                    // Mostrar apenas páginas próximas
                    if (
                      numeroPagina === 1 ||
                      numeroPagina === totalPaginas ||
                      (numeroPagina >= paginaAtual - 1 && numeroPagina <= paginaAtual + 1)
                    ) {
                      return (
                        <Button
                          key={numeroPagina}
                          variant={paginaAtual === numeroPagina ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPaginaAtual(numeroPagina)}
                          className="w-10"
                        >
                          {numeroPagina}
                        </Button>
                      );
                    } else if (
                      numeroPagina === paginaAtual - 2 ||
                      numeroPagina === paginaAtual + 2
                    ) {
                      return <span key={numeroPagina} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

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
                    maxImages={20} // ✅ MUDANÇA: 10 → 20
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
                                    placeholder="Será gerado automaticamente ao salvar"
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
                                        Pré-visualizar
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                {/* ✅ ATUALIZADO: Preview do código */}
                                {previewCodigoAutomatico && !formData.codigo && (
                                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-xs text-blue-700">
                                      💡 <strong>Será gerado algo como:</strong>{' '}
                                      <code className="font-mono font-semibold">
                                        {previewCodigoAutomatico.replace('9999', 'XXXX')}
                                      </code>
                                    </p>
                                  </div>
                                )}
                                
                                <p className="text-xs text-slate-500 mt-1">
                                  ✨ O código será gerado <strong>automaticamente ao salvar</strong> no formato: TIPO-CIDADE-NUMERO
                                </p>
                                {(!formData.tipoImovel || !formData.cidade) && (
                                  <p className="text-xs text-amber-600 mt-1">
                                    ⚠️ Preencha o tipo de imóvel e a cidade primeiro
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Preview do código gerado/personalizado */}
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
                        placeholder="Descreva os detalhes do imóvel..."
                      />
                    </div>

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
                        <option value="Chácara">Chácara</option>
                        <option value="Galpão">Galpão</option>
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
                        <option value="Rural">Rural</option>
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
                        <option value="Venda/Aluguel">Venda e Aluguel</option>
                      </select>
                    </div>

                    {/* Preço */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Preço (R$) *</label>
                      <Input
                        type="number"
                        value={formData.preco}
                        onChange={(e) => setFormData({...formData, preco: e.target.value})}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* LOCALIZAÇÃO */}
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2 mt-6">
                        Localização
                      </h3>
                    </div>

                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium mb-2">CEP</label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.cep}
                          onChange={(e) => {
                            const cep = formatarCEP(e.target.value);
                            setFormData({...formData, cep});
                            if (validarCEP(cep)) {
                              handleBuscarCEP(cep);
                            }
                          }}
                          placeholder="00000-000"
                          maxLength={9}
                        />
                        {buscandoCEP && <Loader2 className="w-5 h-5 animate-spin text-blue-900" />}
                      </div>
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Estado *</label>
                      <Input
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        required
                        placeholder="Ex: GO"
                        maxLength={2}
                      />
                    </div>

                    {/* Cidade */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Cidade *</label>
                      <Input
                        value={formData.cidade}
                        onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                        required
                        placeholder="Ex: Goiânia"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Bairro</label>
                      <Input
                        value={formData.bairro}
                        onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                        placeholder="Ex: Setor Bueno"
                      />
                    </div>

                    {/* Endereço */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Endereço *</label>
                      <Input
                        value={formData.endereco}
                        onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                        required
                        placeholder="Ex: Rua 10"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Número</label>
                      <Input
                        value={formData.numero}
                        onChange={(e) => setFormData({...formData, numero: e.target.value})}
                        placeholder="Ex: 123"
                      />
                    </div>

                    {/* CARACTERÍSTICAS */}
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2 mt-6">
                        Características
                      </h3>
                    </div>

                    {/* Área */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Área (m²)</label>
                      <Input
                        type="number"
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Quartos */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Quartos</label>
                      <Input
                        type="number"
                        value={formData.numeroQuartos}
                        onChange={(e) => setFormData({...formData, numeroQuartos: e.target.value})}
                        min="0"
                      />
                    </div>

                    {/* Banheiros */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Banheiros</label>
                      <Input
                        type="number"
                        value={formData.numeroBanheiros}
                        onChange={(e) => setFormData({...formData, numeroBanheiros: e.target.value})}
                        min="0"
                      />
                    </div>

                    {/* Vagas */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Vagas de Garagem</label>
                      <Input
                        type="number"
                        value={formData.vagas}
                        onChange={(e) => setFormData({...formData, vagas: e.target.value})}
                        min="0"
                      />
                    </div>

                    {/* Ano de Construção */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Ano de Construção</label>
                      <Input
                        type="number"
                        value={formData.anoConstrucao}
                        onChange={(e) => setFormData({...formData, anoConstrucao: e.target.value})}
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    {/* VALORES ADICIONAIS */}
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2 mt-6">
                        Valores Adicionais
                      </h3>
                    </div>

                    {/* Condomínio */}
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.condominio}
                          onChange={(e) => setFormData({...formData, condominio: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">Imóvel em Condomínio</span>
                      </label>
                    </div>

                    {formData.condominio && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Valor do Condomínio (R$)</label>
                        <Input
                          type="number"
                          value={formData.valorCondominio}
                          onChange={(e) => setFormData({...formData, valorCondominio: e.target.value})}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}

                    {/* IPTU */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Valor do IPTU (R$)</label>
                      <Input
                        type="number"
                        value={formData.valorIptu}
                        onChange={(e) => setFormData({...formData, valorIptu: e.target.value})}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* STATUS */}
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-4 text-blue-900 border-b pb-2 mt-6">
                        Status e Destaques
                      </h3>
                    </div>

                    {/* Disponibilidade */}
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
                        <option value="Vendido">Vendido</option>
                        <option value="Indisponível">Indisponível</option>
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.destaque}
                          onChange={(e) => setFormData({...formData, destaque: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span>Imóvel em Destaque</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.promocao}
                          onChange={(e) => setFormData({...formData, promocao: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span>Imóvel em Promoção</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.garagemDisponivel}
                          onChange={(e) => setFormData({...formData, garagemDisponivel: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span>Garagem Disponível</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.documentacaoRegular}
                          onChange={(e) => setFormData({...formData, documentacaoRegular: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span>Documentação Regular</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.acessibilidade}
                          onChange={(e) => setFormData({...formData, acessibilidade: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span>Acessibilidade</span>
                      </label>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={fecharModal}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={criarImovelMutation.isPending || atualizarImovelMutation.isPending}
                      className="bg-blue-900 hover:bg-blue-800"
                    >
                      {(criarImovelMutation.isPending || atualizarImovelMutation.isPending) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {imovelEditando ? 'Atualizar' : 'Criar'} Imóvel
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ✅ Modais de Confirmação */}
        <ConfirmModal
          isOpen={modalAprovar.isOpen}
          onClose={() => setModalAprovar({ isOpen: false, id: null })}
          onConfirm={confirmarAprovacao}
          title="Aprovar Imóvel"
          message="Tem certeza que deseja aprovar este imóvel? Ele ficará visível no catálogo."
          confirmText="Aprovar"
          confirmVariant="default"
        />

        <PromptModal
          isOpen={modalReprovar.isOpen}
          onClose={() => setModalReprovar({ isOpen: false, id: null })}
          onConfirm={confirmarRejeicao}
          title="Reprovar Imóvel"
          message="Por favor, informe o motivo da rejeição:"
          placeholder="Ex: Fotos de baixa qualidade, informações incompletas..."
          confirmText="Reprovar"
          confirmVariant="destructive"
        />

        <ConfirmModal
          isOpen={modalDeletar.isOpen}
          onClose={() => setModalDeletar({ isOpen: false, imovel: null })}
          onConfirm={confirmarDelecao}
          title="Deletar Imóvel"
          message={`Tem certeza que deseja deletar "${modalDeletar.imovel?.titulo}"? Esta ação não pode ser desfeita.`}
          confirmText="Deletar"
          confirmVariant="destructive"
        />
      </div>
    </div>
  );
}

// ✅ HELPER: Badge de disponibilidade
function getDisponibilidadeBadge(disponibilidade) {
  const variants = {
    'disponivel': { color: 'bg-green-500', icon: CheckCircle, text: 'Disponível' },
    'reservado': { color: 'bg-amber-500', icon: Clock, text: 'Reservado' },
    'vendido': { color: 'bg-slate-500', icon: XCircle, text: 'Vendido' },
    'indisponivel': { color: 'bg-red-500', icon: XCircle, text: 'Indisponível' },
  };

  const variant = variants[disponibilidade] || variants['indisponivel'];
  const Icon = variant.icon;

  return (
    <Badge className={`${variant.color} text-white flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {variant.text}
    </Badge>
  );
}
