import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // ✅ CORRIGIDO: adicionar useNavigate
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/ImageUploader';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '@/services/cep';
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
  MapPin,
  Settings,
  PlusCircle,
  Maximize
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal, PromptModal } from '@/components/ConfirmModal';
// ✅ REMOVIDO: import { navigate } from 'react-router-dom';

export default function GerenciadorImoveis() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate(); // ✅ CORRIGIDO: usar hook
  const [modalAberto, setModalAberto] = useState(false);
  const [imovelEditando, setImovelEditando] = useState(null);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
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
      // ✅ CORRIGIDO: Incluir inativos no gerenciador
      return await appwrite.entities.Imovel.filterAll({ incluirInativos: true }, '-$createdAt');
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

  // ✅ ATUALIZADO: Estados para filtros (SEM disponibilidade)
  const [filtros, setFiltros] = useState({
    busca: '',
    // ❌ REMOVIDO: disponibilidade: 'todos',
    finalidade: 'todas',
    tipoImovel: 'todos',
    cidade: '',
    destaque: false,
    promocao: false,
    ativo: 'todos', // ✅ MANTIDO: Filtro de ativo/inativo
  });
  
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // ✅ NOVO: Aplicar filtros avançados (SEM disponibilidade)
  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter(imovel => {
      // Busca por texto
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const match = 
          imovel.titulo?.toLowerCase().includes(busca) ||
          imovel.codigo?.toLowerCase().includes(busca) ||
          imovel.bairro?.toLowerCase().includes(busca) ||
          imovel.cidade?.toLowerCase().includes(busca);
        if (!match) return false;
      }

      // ✅ Filtrar por ativo/inativo
      if (filtros.ativo !== 'todos') {
        const isAtivo = imovel.ativo !== false;
        if (filtros.ativo === 'ativo' && !isAtivo) return false;
        if (filtros.ativo === 'inativo' && isAtivo) return false;
      }

      // ❌ REMOVIDO: Filtro por disponibilidade
      // if (filtros.disponibilidade !== 'todos') {
      //   if (imovel.disponibilidade !== filtros.disponibilidade) return false;
      // }

      // Finalidade
      if (filtros.finalidade !== 'todas') {
        if (imovel.finalidade !== filtros.finalidade) return false;
      }

      // Tipo de imóvel
      if (filtros.tipoImovel !== 'todos') {
        if (getTipoImovelLabel(imovel.tipoImovel) !== filtros.tipoImovel) return false;
      }

      // Cidade
      if (filtros.cidade) {
        if (!imovel.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase())) return false;
      }

      // Destaque/Promoção
      if (filtros.destaque && !imovel.destaque) return false;
      if (filtros.promocao && !imovel.promocao) return false;

      return true;
    });
  }, [imoveis, filtros]);

  // ✅ NOVO: Paginação
  const totalPaginas = Math.ceil(imoveisFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const imoveisPaginados = imoveisFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  // Reset página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtros]);

  // Função para gerar código automático
  const handleGerarCodigoAutomatico = async () => {
    if (!formData.tipoImovel || !formData.cidade) {
      toast.error('Preencha o tipo de imóvel e a cidade primeiro');
      return;
    }

    setGerandoCodigo(true);
    
    try {
      const todosImoveis = await appwrite.entities.Imovel.filterAll({ incluirInativos: true }, '-$createdAt');
      
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
        documentacaoRegular: data.documentacaoRegular !== false,
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
        
        const imoveisExistentes = await appwrite.entities.Imovel.filterAll({ incluirInativos: true }, '-$createdAt');
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
        documentacaoRegular: data.documentacaoRegular !== false,
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
      // ✅ CORRIGIDO: Usar TIPO_IMOVEL_ADMIN_REVERSE_MAP (está importado)
      tipoImovel: TIPO_IMOVEL_ADMIN_REVERSE_MAP[imovel.tipoImovel] || 'Casa',
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
        const todosImoveis = await appwrite.entities.Imovel.filterAll({ incluirInativos: true }, '-$createdAt');
        
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-900" />
                Gerenciador de Imóveis
              </h1>
              <p className="text-slate-600 mt-2">
                {imoveis.length} {imoveis.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}
              </p>
            </div>
            
            {/* ✅ NOVO: Botão para criar anúncio */}
            <Button
              className="bg-blue-900 hover:bg-blue-800"
              onClick={() => navigate('/anunciar')}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Criar Novo Anúncio
            </Button>
          </div>
        </div>
        
        {/* ✅ SIMPLIFICAR: Filtros (SEM Disponibilidade) */}
        <Card className="mb-6 p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Busca */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">Buscar</label>
              <Input
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                placeholder="Título, código, bairro, cidade..."
              />
            </div>

            {/* ✅ Status (Ativo/Inativo) */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.ativo}
                onChange={(e) => setFiltros({...filtros, ativo: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>

            {/* Finalidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Finalidade</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.finalidade}
                onChange={(e) => setFiltros({...filtros, finalidade: e.target.value})}
              >
                <option value="todas">Todas</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>

            {/* Tipo de Imóvel */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filtros.tipoImovel}
                onChange={(e) => setFiltros({...filtros, tipoImovel: e.target.value})}
              >
                <option value="todos">Todos</option>
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                value={filtros.cidade}
                onChange={(e) => setFiltros({...filtros, cidade: e.target.value})}
                placeholder="Goiânia, Aparecida..."
              />
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.destaque}
                  onChange={(e) => setFiltros({...filtros, destaque: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Destaque</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.promocao}
                  onChange={(e) => setFiltros({...filtros, promocao: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Promoção</span>
              </label>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-slate-600">
            Mostrando {imoveisFiltrados.length} de {imoveis.length} imóveis
          </div>
        </Card>

        {/* Lista de Imóveis */}
        <div className="grid gap-6">
          {imoveisFiltrados.map(imovel => (
            <Card key={imovel.$id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-4 p-4">
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
                      <div className="flex items-center gap-2 mb-2">
                        {/* ✅ NOVO: Badge Ativo/Inativo */}
                        {imovel.ativo === false ? (
                          <Badge className="bg-slate-500 text-white">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        ) : (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}

                        {imovel.codigo && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {imovel.codigo}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {imovel.titulo}
                      </h3>
                      <p className="text-sm text-slate-600">
                        📍 {imovel.bairro}, {imovel.cidade} - {imovel.estado}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span>
                          Criado em {new Date(imovel.$createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getDisponibilidadeBadge(imovel.disponibilidade)}
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
                    {imovel.areaTotal && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        {imovel.areaTotal}m²
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-blue-900">
                      {formatPrice(imovel.preco)}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/anunciar?edit=${imovel.$id}`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>

                  {/* ✅ NOVO: Toggle Ativo/Inativo */}
                  <Button
                    size="sm"
                    variant={imovel.ativo !== false ? "default" : "outline"}
                    className={imovel.ativo !== false ? "bg-green-600 hover:bg-green-700" : "bg-slate-200 text-slate-700"}
                    onClick={async () => {
                      try {
                        await appwrite.entities.Imovel.update(imovel.$id, {
                          ativo: imovel.ativo === false ? true : false
                        });
                        toast.success(imovel.ativo === false ? '✓ Anúncio ativado!' : '✕ Anúncio desativado!');
                        queryClient.invalidateQueries(['admin-imoveis']);
                      } catch (error) {
                        toast.error('Erro ao atualizar');
                      }
                    }}
                  >
                    {imovel.ativo !== false ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Inativo
                      </>
                    )}
                  </Button>

                  {/* ✅ NOVO: Toggle Destaque (só se estiver ativo) */}
                  <Button
                    size="sm"
                    variant={imovel.destaque ? "default" : "outline"}
                    className={imovel.destaque ? "bg-amber-500 hover:bg-amber-600" : ""}
                    disabled={imovel.ativo === false}
                    onClick={async () => {
                      try {
                        await appwrite.entities.Imovel.update(imovel.$id, {
                          destaque: !imovel.destaque
                        });
                        toast.success(imovel.destaque ? 'Removido dos destaques' : '⭐ Marcado como destaque!');
                        queryClient.invalidateQueries(['admin-imoveis']);
                      } catch (error) {
                        toast.error('Erro ao atualizar');
                      }
                    }}
                  >
                    <span className="mr-1">{imovel.destaque ? '⭐' : '☆'}</span>
                    {imovel.destaque ? 'Em Destaque' : 'Marcar Destaque'}
                  </Button>

                  {/* ✅ NOVO: Toggle Promoção (só se estiver ativo) */}
                  <Button
                    size="sm"
                    variant={imovel.promocao ? "default" : "outline"}
                    className={imovel.promocao ? "bg-red-500 hover:bg-red-600" : ""}
                    disabled={imovel.ativo === false}
                    onClick={async () => {
                      try {
                        await appwrite.entities.Imovel.update(imovel.$id, {
                          promocao: !imovel.promocao
                        });
                        toast.success(imovel.promocao ? 'Removido das promoções' : '🏷️ Marcado como promoção!');
                        queryClient.invalidateQueries(['admin-imoveis']);
                      } catch (error) {
                        toast.error('Erro ao atualizar');
                      }
                    }}
                  >
                    <span className="mr-1">{imovel.promocao ? '🏷️' : '🔖'}</span>
                    {imovel.promocao ? 'Em Promoção' : 'Marcar Promoção'}
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletar(imovel)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mensagem de lista vazia */}
        {imoveisFiltrados.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Nenhum imóvel encontrado
              </h3>
              <p className="text-slate-600 mb-6">
                {imoveis.length === 0 
                  ? 'Comece criando seu primeiro anúncio!'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
              {imoveis.length === 0 && (
                <Button onClick={() => navigate('/anunciar')} className="bg-blue-900">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Criar Primeiro Anúncio
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ✅ REMOVER: Modais de confirmação de aprovar/reprovar */}
        
        {/* Modal de Deletar */}
        <ConfirmModal
          isOpen={modalDeletar.isOpen}
          onClose={() => setModalDeletar({ isOpen: false, imovel: null })}
          onConfirm={confirmarDelecao}
          title="Excluir Imóvel"
          message="Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita."
          confirmText="Excluir"
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
