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


export default function AnunciarImovel() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
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
  });

  const [buscandoCep, setBuscandoCep] = useState(false);
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

  // Mutation para criar/editar anúncio
  const criarAnuncioMutation = useMutation({
    mutationFn: async (data) => {
      if (!telefone) {
        throw new Error('Você precisa cadastrar um telefone para anunciar');
      }

      const imagensUrls = data.images.map(img => img.url);
      const imagemPrincipal = imagensUrls[0] || '';

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

      const imovelData = {
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
        // ✅ SALVAR COORDENADAS AUTOMATICAMENTE
        latitude: latitude,
        longitude: longitude,
        precisaoLocalizacao: precision, // 'street', 'neighborhood', 'city'
        criadoPor: user.$id,
        criadoPorNome: user.name,
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
        description: 'Para anunciar mais imóveis, remova alguns anúncios antigos.',
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
        action:
        {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {telefoneFormatado ? (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-4 h-4 mr-1" />
              Telefone: {telefoneFormatado}
            </Badge>
          ) : (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Telefone não cadastrado</p>
                  <p className="text-sm text-amber-700">Você precisa adicionar um telefone no seu perfil.</p>
                  <Button size="sm" className="mt-2" onClick={() => navigate('/perfil')}>
                    <Phone className="w-4 h-4 mr-1" />
                    Cadastrar Telefone
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                {/* Categoria (se houver) */}
                {categoriasDisponiveis.length > 0 && (
                  <div>
                    <Label>Categoria *</Label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      required
                    >
                      {categoriasDisponiveis.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
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
                    placeholder="450000"
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
                    placeholder="123"
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
                    placeholder="150"
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
                    placeholder="120"
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
                    placeholder="3"
                    min="0"
                  />
                </div>

                <div>
                  <Label>Suítes</Label>
                  <Input
                    type="number"
                    value={formData.numeroSuites}
                    onChange={(e) => setFormData({...formData, numeroSuites: e.target.value})}
                    placeholder="1"
                    min="0"
                  />
                </div>

                <div>
                  <Label>Banheiros</Label>
                  <Input
                    type="number"
                    value={formData.numeroBanheiros}
                    onChange={(e) => setFormData({...formData, numeroBanheiros: e.target.value})}
                    placeholder="2"
                    min="0"
                  />
                </div>

                <div>
                  <Label>Vagas</Label>
                  <Input
                    type="number"
                    value={formData.vagas}
                    onChange={(e) => setFormData({...formData, vagas: e.target.value})}
                    placeholder="2"
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
                      placeholder="350"
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
                    placeholder="1200"
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

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/meus_anuncios')}
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

        {/* Aviso de limite */}
        {meusAnuncios.length >= 10 && !editId && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Limite de anúncios atingido</p>
                <p className="text-xs text-amber-700 mt-1">
                  Você atingiu o limite de 10 anúncios ativos. Para anunciar novos imóveis, remova alguns anúncios antigos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}