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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ImageUploader from '@/components/ImageUploader';
import { buscarEnderecoPorCEP, formatarCEP, validarCEP } from '@/services/cep';
import { Home, Loader2, CheckCircle, AlertCircle, Phone, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { converterParaBrasileiro } from '@/utils/telefone';
import { rateLimits } from '@/utils/rateLimit';
import {TIPOS_RESIDENCIAL,TIPOS_COMERCIAL,DIFERENCIAIS_IMOVEL,LAZER_CONDOMINIO,COMODIDADES_CONDOMINIO,SEGURANCA_CONDOMINIO,} from '@/config/imovelConfig';
import { gerarCodigoAutomatico } from '@/utils/gerarCodigo';

export default function AnunciarImovel() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    codigo: '', // ✅ ADICIONAR
    codigoPersonalizado: false, // ✅ ADICIONAR
    titulo: '',
    descricao: '',
    finalidade: 'Residencial',
    tipoImovel: 'apartamento',
    categoria: '',
    tipoNegocio: 'Venda',
    preco: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: 'GO',
    areaTotal: '',
    areaUtil: '',
    numeroQuartos: '',
    numeroSuites: '',
    numeroBanheiros: '',
    vagas: '',
    condominio: false,
    valorCondominio: '',
    valorIptu: '',
    tipoIptu: 'mensal',
    diferenciais: [],
    lazerCondominio: [],
    comodidadesCondominio: [],
    segurancaCondominio: [],
    images: [],
    destaque: false,
    promocao: false,
    ativo: true,
  });

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [gerandoCodigo, setGerandoCodigo] = useState(false); // ✅ ADICIONAR
  const telefone = user?.phone;
  const telefoneFormatado = telefone ? converterParaBrasileiro(telefone) : null;

  // ✅ Obter tipos disponíveis baseado na finalidade
  const tiposDisponiveis = formData.finalidade === 'Residencial' ? TIPOS_RESIDENCIAL : TIPOS_COMERCIAL;
  const tipoSelecionado = tiposDisponiveis.find(t => t.value === formData.tipoImovel);
  const categoriasDisponiveis = tipoSelecionado?.categorias || [];

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
        codigo: anuncioParaEditar.codigo || '', // ✅ ADICIONAR
        codigoPersonalizado: !!anuncioParaEditar.codigo, // ✅ ADICIONAR
        titulo: anuncioParaEditar.titulo || '',
        descricao: anuncioParaEditar.descricao || '',
        finalidade: anuncioParaEditar.finalidade || 'Residencial',
        tipoImovel: anuncioParaEditar.tipoImovel || 'apartamento',
        categoria: anuncioParaEditar.categoria || '',
        tipoNegocio: anuncioParaEditar.tipoNegocio || 'Venda',
        preco: anuncioParaEditar.preco?.toString() || '',
        cep: anuncioParaEditar.cep || '',
        endereco: anuncioParaEditar.endereco || '',
        numero: anuncioParaEditar.numero || '',
        bairro: anuncioParaEditar.bairro || '',
        cidade: anuncioParaEditar.cidade || '',
        estado: anuncioParaEditar.estado || 'GO',
        areaTotal: anuncioParaEditar.areaTotal?.toString() || '',
        areaUtil: anuncioParaEditar.areaUtil?.toString() || '',
        numeroQuartos: anuncioParaEditar.numeroQuartos?.toString() || '',
        numeroSuites: anuncioParaEditar.numeroSuites?.toString() || '',
        numeroBanheiros: anuncioParaEditar.numeroBanheiros?.toString() || '',
        vagas: anuncioParaEditar.vagas?.toString() || '',
        condominio: anuncioParaEditar.condominio || false,
        valorCondominio: anuncioParaEditar.valorCondominio?.toString() || '',
        valorIptu: anuncioParaEditar.valorIptu?.toString() || '',
        tipoIptu: anuncioParaEditar.tipoIptu || 'mensal',
        diferenciais: anuncioParaEditar.diferenciais || [],
        lazerCondominio: anuncioParaEditar.lazerCondominio || [],
        comodidadesCondominio: anuncioParaEditar.comodidadesCondominio || [],
        segurancaCondominio: anuncioParaEditar.segurancaCondominio || [],
        images: imagensArray,
        destaque: anuncioParaEditar.destaque || false,
        promocao: anuncioParaEditar.promocao || false,
        ativo: anuncioParaEditar.ativo !== false, // ✅ NOVO: Default true
      });
    }
  }, [anuncioParaEditar]);

  // ✅ Ao mudar finalidade, resetar tipo e categoria
  useEffect(() => {
    if (formData.finalidade) {
      const primeiroTipo = tiposDisponiveis[0];
      setFormData(prev => ({
        ...prev,
        tipoImovel: primeiroTipo.value,
        categoria: primeiroTipo.categorias.length > 0 ? primeiroTipo.categorias[0] : '',
      }));
    }
  }, [formData.finalidade]);

  // ✅ Ao mudar tipo, resetar categoria
  useEffect(() => {
    if (categoriasDisponiveis.length > 0 && !categoriasDisponiveis.includes(formData.categoria)) {
      setFormData(prev => ({
        ...prev,
        categoria: categoriasDisponiveis[0],
      }));
    } else if (categoriasDisponiveis.length === 0) {
      setFormData(prev => ({ ...prev, categoria: '' }));
    }
  }, [formData.tipoImovel]);

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
          endereco: endereco.endereco || '', // ✅ CORRIGIDO: usar 'endereco' em vez de 'logradouro'
          bairro: endereco.bairro || '',
          cidade: endereco.cidade || '', // ✅ CORRIGIDO: usar 'cidade' em vez de 'localidade'
          estado: endereco.estado || 'GO', // ✅ CORRIGIDO: usar 'estado' em vez de 'uf'
        });
        
        if (endereco.latitude && endereco.longitude) {
          toast.success('Endereço e localização encontrados!');
        } else {
          toast.success('Endereço encontrado!', {
            description: 'Localização aproximada será usada'
          });
        }
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  // ✅ ADICIONAR: Função para gerar código automático
  const handleGerarCodigoAutomatico = async () => {
    if (!formData.tipoImovel || !formData.cidade) {
      toast.error('Preencha o tipo de imóvel e a cidade primeiro');
      return;
    }

    setGerandoCodigo(true);
    
    try {
      const todosImoveis = await appwrite.entities.Imovel.filter({ incluirInativos: true }, '-$createdAt', 1000);
      
      // Filtrar apenas códigos automáticos (formato: XXX-XXX-0000)
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
      
      // Importar função de geração de código
      const { gerarCodigoAutomatico } = await import('@/utils/gerarCodigo');
      const codigoGerado = gerarCodigoAutomatico(
        formData.tipoImovel, 
        formData.cidade, 
        proximoNumero
      );
      
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

  // Mutation para criar/editar anúncio
  const criarAnuncioMutation = useMutation({
    mutationFn: async (data) => {
      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls[0] || '';

      // ✅ VALIDAR CÓDIGO PERSONALIZADO (se existir)
      if (data.codigo && data.codigoPersonalizado) {
        const { validarCodigoPersonalizado, formatarCodigo } = await import('@/utils/gerarCodigo');
        
        if (!validarCodigoPersonalizado(data.codigo)) {
          throw new Error('Código inválido. Use apenas letras, números e hífens (3-20 caracteres)');
        }
        
        // Verificar se o código já existe (exceto no próprio imóvel sendo editado)
        const imoveisExistentes = await appwrite.entities.Imovel.filter({ incluirInativos: true }, '-$createdAt', 1000);
        const codigoExiste = imoveisExistentes.some(i => 
          i.$id !== editId && 
          i.codigo && 
          i.codigo.toLowerCase() === formatarCodigo(data.codigo).toLowerCase()
        );
        
        if (codigoExiste) {
          throw new Error('Este código já está em uso. Escolha outro.');
        }
      }

      // ✅ BUSCAR COORDENADAS AUTOMATICAMENTE (se tiver CEP)
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
          // Silenciar erro - coordenadas são opcionais
        }
      }

      const { formatarCodigo } = await import('@/utils/gerarCodigo');

      const imovelData = {
        codigo: data.codigo ? formatarCodigo(data.codigo) : null, // ✅ ADICIONAR
        titulo: data.titulo,
        descricao: data.descricao,
        finalidade: data.finalidade,
        tipoImovel: data.tipoImovel,
        categoria: data.categoria || null,
        tipoNegocio: data.tipoNegocio,
        preco: parseFloat(data.preco),
        cep: data.cep || null,
        endereco: data.endereco,
        numero: data.numero || null,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        areaTotal: parseFloat(data.areaTotal) || null,
        areaUtil: parseFloat(data.areaUtil) || null,
        numeroQuartos: parseInt(data.numeroQuartos) || null,
        numeroSuites: parseInt(data.numeroSuites) || null,
        numeroBanheiros: parseInt(data.numeroBanheiros) || null,
        vagas: parseInt(data.vagas) || null,
        condominio: data.condominio,
        valorCondominio: parseFloat(data.valorCondominio) || null,
        valorIptu: parseFloat(data.valorIptu) || null,
        tipoIptu: data.tipoIptu,
        diferenciais: data.diferenciais,
        lazerCondominio: data.condominio ? data.lazerCondominio : [],
        comodidadesCondominio: data.condominio ? data.comodidadesCondominio : [],
        segurancaCondominio: data.condominio ? data.segurancaCondominio : [],
        imagens: imagensUrls.join(','),
        imagemPrincipal: imagemPrincipal,
        latitude: latitude,
        longitude: longitude,
        precisaoLocalizacao: precision,
        criadoPor: user.$id,
        criadoPorNome: user.name,
        tipoAnuncio: 'admin',
        statusAprovacao: 'aprovado',
        disponibilidade: 'disponivel',
        destaque: data.destaque || false,
        promocao: data.promocao || false,
        ativo: data.ativo !== false, // ✅ NOVO
        documentacaoRegular: true,
      };

      if (editId) {
        return await appwrite.entities.Imovel.update(editId, imovelData);
      } else {
        return await appwrite.entities.Imovel.create(imovelData);
      }
    },
    onSuccess: () => {
      toast.success(editId ? '✅ Anúncio atualizado!' : '🎉 Anúncio criado com sucesso!', {
        description: editId 
          ? 'Suas alterações foram salvas.'
          : 'O imóvel já está visível no catálogo.',
      });
      queryClient.invalidateQueries(['admin-imoveis']);
      navigate('/gerenciador'); // ✅ Sempre redireciona para gerenciador
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao salvar anúncio');
    },
  });

  // ✅ REMOVER: Verificação de limite de anúncios (não faz sentido para admin)
  // ✅ REMOVER: Rate limit de criação

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      toast.error('Adicione pelo menos uma foto do imóvel');
      return;
    }

    if (!formData.titulo || !formData.descricao || !formData.preco) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // ✅ VALIDAÇÕES EM PORTUGUÊS (ANTES DE ENVIAR)
    
    // Validar quartos
    const quartos = parseInt(formData.numeroQuartos) || 0;
    if (quartos < 0 || quartos > 20) {
      toast.error('Número de quartos inválido', {
        description: 'Deve estar entre 0 e 20',
      });
      return;
    }

    // Validar suítes
    const suites = parseInt(formData.numeroSuites) || 0;
    if (suites < 0 || suites > 10) {
      toast.error('Número de suítes inválido', {
        description: 'Deve estar entre 0 e 10',
      });
      return;
    }

    // Validar banheiros
    const banheiros = parseInt(formData.numeroBanheiros) || 0;
    if (banheiros < 0 || banheiros > 10) {
      toast.error('Número de banheiros inválido', {
        description: 'Deve estar entre 0 e 10',
      });
      return;
    }

    // Validar vagas
    const vagas = parseInt(formData.vagas) || 0;
    if (vagas < 0 || vagas > 20) {
      toast.error('Número de vagas inválido', {
        description: 'Deve estar entre 0 e 20',
      });
      return;
    }

    // Validar área total
    if (formData.areaTotal && parseFloat(formData.areaTotal) <= 0) {
      toast.error('Área total deve ser maior que 0');
      return;
    }

    // Validar área útil
    if (formData.areaUtil && parseFloat(formData.areaUtil) <= 0) {
      toast.error('Área útil deve ser maior que 0');
      return;
    }

    // Validar preço
    if (parseFloat(formData.preco) <= 0) {
      toast.error('Preço deve ser maior que 0');
      return;
    }

    // ✅ Se passou em todas as validações, enviar
    await criarAnuncioMutation.mutateAsync(formData);
  };

  const toggleDiferencial = (item) => {
    setFormData(prev => ({
      ...prev,
      diferenciais: prev.diferenciais.includes(item)
        ? prev.diferenciais.filter(d => d !== item)
        : [...prev.diferenciais, item]
    }));
  };

  const toggleLazer = (item) => {
    setFormData(prev => ({
      ...prev,
      lazerCondominio: prev.lazerCondominio.includes(item)
        ? prev.lazerCondominio.filter(l => l !== item)
        : [...prev.lazerCondominio, item]
    }));
  };

  const toggleComodidade = (item) => {
    setFormData(prev => ({
      ...prev,
      comodidadesCondominio: prev.comodidadesCondominio.includes(item)
        ? prev.comodidadesCondominio.filter(c => c !== item)
        : [...prev.comodidadesCondominio, item]
    }));
  };

  const toggleSeguranca = (item) => {
    setFormData(prev => ({
      ...prev,
      segurancaCondominio: prev.segurancaCondominio.includes(item)
        ? prev.segurancaCondominio.filter(s => s !== item)
        : [...prev.segurancaCondominio, item]
    }));
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

  // ✅ Bloquear não-admins
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-slate-600 mb-6">
              Apenas administradores podem criar anúncios diretamente.
            </p>
            <Link to="/">
              <Button>Voltar para Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/gerenciador" className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Gerenciador
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Home className="w-8 h-8 text-blue-900" />
            <h1 className="text-3xl font-bold text-slate-900">
              {editId ? 'Editar Imóvel' : 'Criar Novo Anúncio'}
            </h1>
          </div>

          {/* ✅ REMOVER: Badge de telefone (não é mais necessário) */}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Imagens */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Imóvel</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                images={formData.images}
                onImagesChange={(images) => setFormData({...formData, images})}
                maxImages={20}
              />
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ NOVO: Código do Imóvel */}
              <div>
                <Label>Código do Imóvel</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="codigoPersonalizado"
                      checked={formData.codigoPersonalizado}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData, 
                          codigoPersonalizado: checked,
                          codigo: checked ? formData.codigo : ''
                        });
                      }}
                    />
                    <label htmlFor="codigoPersonalizado" className="text-sm cursor-pointer">
                      Usar código personalizado
                    </label>
                  </div>

                  {formData.codigoPersonalizado ? (
                    <div className="flex gap-2">
                      <Input
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                        placeholder="Ex: CAS-001, APT-BUENO-123"
                        maxLength={20}
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={formData.codigo}
                        placeholder="Código será gerado automaticamente"
                        disabled
                        className="flex-1 bg-slate-50"
                      />
                      <Button
                        type="button"
                        onClick={handleGerarCodigoAutomatico}
                        disabled={gerandoCodigo || !formData.tipoImovel || !formData.cidade}
                        variant="outline"
                      >
                        {gerandoCodigo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gerar'}
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-slate-500">
                    {formData.codigoPersonalizado 
                      ? 'Use apenas letras, números e hífens (ex: CAS-001, APT-BUENO-123)'
                      : 'O código será gerado automaticamente no formato TIPO-CIDADE-0000'
                    }
                  </p>
                </div>
              </div>

              {/* Título */}
              <div>
                <Label>Título do Anúncio *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Ex: Apartamento 3 quartos com suíte no Setor Bueno"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">{formData.titulo.length}/100 caracteres</p>
              </div>

              {/* Finalidade e Tipo de Imóvel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Finalidade */}
                <div>
                  <Label>Finalidade *</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.finalidade}
                    onChange={(e) => setFormData({...formData, finalidade: e.target.value})}
                    required
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>

                {/* Tipo de Imóvel */}
                <div>
                  <Label>Tipo de Imóvel *</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.tipoImovel}
                    onChange={(e) => setFormData({...formData, tipoImovel: e.target.value})}
                    required
                  >
                    {tiposDisponiveis.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoria (se existir) */}
                {categoriasDisponiveis.length > 0 && (
                  <div>
                    <Label>Categoria</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {categoriasDisponiveis.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Negócio */}
                <div>
                  <Label>Tipo de Negócio *</Label>
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
                  <Label>
                    Preço (R$) * <span className="text-slate-500 text-xs">sem centavos</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: e.target.value})}
                    placeholder=""
                    required
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
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
                      {buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Estado *</Label>
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

                <div>
                  <Label>Cidade *</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    placeholder="Goiânia"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <Label>Endereço *</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    placeholder="Rua, Avenida..."
                    required
                  />
                </div>

                <div>
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                  />
                </div>
              </div>

              <div>
                <Label>Bairro *</Label>
                <Input
                  value={formData.bairro}
                  onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                  placeholder="Setor Bueno"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Área Total (m²)</Label>
                  <Input
                    type="number"
                    value={formData.areaTotal}
                    onChange={(e) => setFormData({...formData, areaTotal: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Área Útil (m²)</Label>
                  <Input
                    type="number"
                    value={formData.areaUtil}
                    onChange={(e) => setFormData({...formData, areaUtil: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label>Quartos</Label>
                  <Input
                    type="number"
                    value={formData.numeroQuartos}
                    onChange={(e) => setFormData({...formData, numeroQuartos: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                  />
                </div>

                <div>
                  <Label>Suítes</Label>
                  <Input
                    type="number"
                    value={formData.numeroSuites}
                    onChange={(e) => setFormData({...formData, numeroSuites: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                  />
                </div>

                <div>
                  <Label>Banheiros</Label>
                  <Input
                    type="number"
                    value={formData.numeroBanheiros}
                    onChange={(e) => setFormData({...formData, numeroBanheiros: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                  />
                </div>

                <div>
                  <Label>Vagas</Label>
                  <Input
                    type="number"
                    value={formData.vagas}
                    onChange={(e) => setFormData({...formData, vagas: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                  />
                </div>
              </div>

              {/* Diferenciais */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Diferenciais do Imóvel</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DIFERENCIAIS_IMOVEL.map(item => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dif-${item}`}
                        checked={formData.diferenciais.includes(item)}
                        onCheckedChange={() => toggleDiferencial(item)}
                      />
                      <label htmlFor={`dif-${item}`} className="text-sm cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Valores Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="condominio"
                  checked={formData.condominio}
                  onCheckedChange={(checked) => setFormData({...formData, condominio: checked})}
                />
                <label htmlFor="condominio" className="text-sm font-medium cursor-pointer">
                  Imóvel em condomínio
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.condominio && (
                  <div>
                    <Label>Valor do Condomínio (R$/mês)</Label>
                    <Input
                      type="number"
                      value={formData.valorCondominio}
                      onChange={(e) => setFormData({...formData, valorCondominio: e.target.value})}
                      placeholder="" // ✅ REMOVIDO
                      min="0"
                      step="1"
                    />
                  </div>
                )}

                <div>
                  <Label>Valor do IPTU (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valorIptu}
                    onChange={(e) => setFormData({...formData, valorIptu: e.target.value})}
                    placeholder="" // ✅ REMOVIDO
                    min="0"
                    step="1"
                  />
                </div>

                <div>
                  <Label>IPTU</Label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={formData.tipoIptu}
                    onChange={(e) => setFormData({...formData, tipoIptu: e.target.value})}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características do Condomínio */}
          {formData.condominio && (
            <Card>
              <CardHeader>
                <CardTitle>Características do Condomínio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lazer */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Lazer e Esporte</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LAZER_CONDOMINIO.map(item => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lazer-${item}`}
                          checked={formData.lazerCondominio.includes(item)}
                          onCheckedChange={() => toggleLazer(item)}
                        />
                        <label htmlFor={`lazer-${item}`} className="text-sm cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comodidades */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Comodidades e Serviços</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COMODIDADES_CONDOMINIO.map(item => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`comod-${item}`}
                          checked={formData.comodidadesCondominio.includes(item)}
                          onCheckedChange={() => toggleComodidade(item)}
                        />
                        <label htmlFor={`comod-${item}`} className="text-sm cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Segurança */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Segurança</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SEGURANCA_CONDOMINIO.map(item => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`seg-${item}`}
                          checked={formData.segurancaCondominio.includes(item)}
                          onCheckedChange={() => toggleSeguranca(item)}
                        />
                        <label htmlFor={`seg-${item}`} className="text-sm cursor-pointer">
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                rows={6}
                placeholder="Descreva as características, vantagens, localização privilegiada..."
                required
                maxLength={2000}
              />
              <p className="text-xs text-slate-500 mt-1">{formData.descricao.length}/2000 caracteres</p>
            </CardContent>
          </Card>

          {/* ✅ ATUALIZADO: Opções de Exibição */}
          <Card>
            <CardHeader>
              <CardTitle>Opções de Exibição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ NOVO: Checkbox Ativo/Inativo */}
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                <Checkbox
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                />
                <label htmlFor="ativo" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  {formData.ativo ? (
                    <>
                      <span className="text-green-600">✓</span>
                      Anúncio Ativo
                      <span className="text-xs text-slate-500">(visível no site)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-600">✕</span>
                      Anúncio Inativo
                      <span className="text-xs text-slate-500">(oculto do site)</span>
                    </>
                  )}
                </label>
              </div>

              {formData.ativo && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="destaque"
                      checked={formData.destaque}
                      onCheckedChange={(checked) => setFormData({...formData, destaque: checked})}
                    />
                    <label htmlFor="destaque" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <span className="text-amber-600">⭐</span>
                      Marcar como Destaque
                      <span className="text-xs text-slate-500">(aparecerá na Home)</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="promocao"
                      checked={formData.promocao}
                      onCheckedChange={(checked) => setFormData({...formData, promocao: checked})}
                    />
                    <label htmlFor="promocao" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <span className="text-red-600">🏷️</span>
                      Marcar como Promoção
                      <span className="text-xs text-slate-500">(aparecerá em Promoções)</span>
                    </label>
                  </div>
                </>
              )}

              {!formData.ativo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ Este anúncio não aparecerá no catálogo, destaques ou promoções enquanto estiver inativo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/gerenciador')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criarAnuncioMutation.isPending}
              className="flex-1 bg-blue-900 hover:bg-blue-800"
            >
              {criarAnuncioMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editId ? 'Salvando...' : 'Criando...'}
                </>
              ) : editId ? (
                'Salvar Alterações'
              ) : (
                'Criar Anúncio'
              )}
            </Button>
          </div>
        </form>

        {/* ✅ REMOVER: Aviso de limite */}
      </div>
    </div>
  );
}