import React, { useState, useEffect } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  Maximize,
  Bed,
  Bath,
  Car,
  Tag,
  ArrowLeft,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  FileText,
  CheckCircle,
  Edit,
  Home as HomeIcon,
  Building2,
  Waves,
  Shield,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  TreePine,
  DollarSign,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import FavoritoButton from '@/components/imoveis/FavoritoButton';
import { toast } from 'sonner';
import MapaLeaflet from '@/components/imoveis/MapaLeaflet';
import SEO from '@/components/SEO';
import { analytics } from '@/utils/analytics';
import SchemaOrg from '@/components/SchemaOrg';
import Breadcrumbs from '@/components/Breadcrumbs';
import LazyImage from '@/components/LazyImage';
import { getTipoImovelLabel } from '@/config/imovelConfig';

export default function Detalhes() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const imovelId = urlParams.get('id');
  const [imagemAtual, setImagemAtual] = useState(0);
  const [user, setUser] = useState(null);
  const [tempoInicio] = useState(Date.now());

  useEffect(() => {
    appwrite.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: imovel, isLoading } = useQuery({
    queryKey: ['imovel', imovelId],
    queryFn: async () => {
      if (!imovelId) return null;
      return await appwrite.entities.Imovel.get(imovelId);
    },
    enabled: !!imovelId,
  });

  const { data: visualizacoes = [] } = useQuery({
    queryKey: ['visualizacoes-count', imovelId],
    queryFn: async () => {
      if (!imovelId) return [];
      return await appwrite.entities.Visualizacao.filter({ imovelId }, '-$createdAt', 1000);
    },
    enabled: !!imovelId,
  });

  const hoje = new Date().toISOString().split('T')[0];
  const visualizacoesHoje = visualizacoes.filter(v => 
    v.$createdAt.split('T')[0] === hoje
  ).length;

  const registrarVisualizacaoMutation = useMutation({
    mutationFn: async ({ imovelId, tempoVisualizacao, sessionId }) => {
      return await appwrite.entities.Visualizacao.create({
        imovelId,
        userId: user?.$id || null,
        tempoVisualizacao,
        sessionId,
        origem: document.referrer.includes('catalogo') ? 'catalogo' : 'direto',
      });
    },
  });

  useEffect(() => {
    if (imovelId && user) {
      const sessionId = `session_${Date.now()}_${Math.random()}`;

      return () => {
        const tempoVisualizacao = Math.floor((Date.now() - tempoInicio) / 1000);
        if (tempoVisualizacao > 5) {
          registrarVisualizacaoMutation.mutate({
            imovelId: imovelId,
            tempoVisualizacao: tempoVisualizacao,
            sessionId: sessionId,
          });
        }
      };
    }
  }, [imovelId]);

  useEffect(() => {
    if (imovel) {
      analytics.viewImovel(imovel.$id, imovel.titulo, imovel.preco);
    }
  }, [imovel]);

  const handleWhatsAppClick = (tipo = 'geral') => {
    analytics.clickWhatsApp(tipo);
  };

  const compartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: imovel.titulo,
          text: `Confira este imóvel: ${imovel.titulo} - ${formatPrice(imovel.preco)}`,
          url: window.location.href,
        });
        analytics.shareImovel(imovel.$id, 'native');
        toast.success('Compartilhado com sucesso!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copiarLink();
        }
      }
    } else {
      copiarLink();
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href);
    analytics.shareImovel(imovel.$id, 'copy_link');
    toast.success('Link copiado para a área de transferência!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  if (!imovel) {
    // ✅ ADICIONAR: Meta tag noindex para 404
    useEffect(() => {
      const metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      metaRobots.content = 'noindex, nofollow';
      document.head.appendChild(metaRobots);

      return () => {
        document.head.removeChild(metaRobots);
      };
    }, []);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Imóvel não encontrado</h2>
          <p className="text-slate-600 mb-6">Este imóvel não existe ou foi removido.</p>
          <Link to={createPageUrl('Catalogo')}>
            <Button>Voltar ao Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const imagensArray = imovel.imagens ? imovel.imagens.split(',').map(url => url.trim()) : [];
  const imagens = imagensArray.length > 0 ? imagensArray : [
    imovel.imagemPrincipal || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80'
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const whatsappNumber = '5562994045111';
  
  const whatsappMessage = encodeURIComponent(
    `🏡 *Olá! Tenho interesse neste imóvel:*\n\n` +
    `📌 *${imovel.titulo}*\n` +
    `💰 *Valor:* ${formatPrice(imovel.preco)}\n` +
    `📍 *Localização:* ${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}\n` +
    `🔑 *Código:* ${imovel.$id}\n\n` +
    `${imovel.areaTotal ? `📐 *Área Total:* ${imovel.areaTotal}m²\n` : ''}` +
    `${imovel.numeroQuartos ? `🛏️ *Quartos:* ${imovel.numeroQuartos}\n` : ''}` +
    `${imovel.numeroBanheiros ? `🚿 *Banheiros:* ${imovel.numeroBanheiros}\n` : ''}` +
    `${imovel.vagas ? `🚗 *Vagas:* ${imovel.vagas}\n` : ''}` +
    `\n🔗 *Link do anúncio:*\n${window.location.href}\n\n` +
    `Gostaria de mais informações e agendar uma visita! 😊`
  );

  const whatsappMessageFinanciamento = encodeURIComponent(
    `💳 *Olá! Gostaria de informações sobre financiamento:*\n\n` +
    `🏡 *Imóvel:* ${imovel.titulo}\n` +
    `💰 *Valor:* ${formatPrice(imovel.preco)}\n` +
    `📍 *Localização:* ${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}\n` +
    `🔑 *Código:* ${imovel.$id}\n\n` +
    `🔗 *Link:* ${window.location.href}\n\n` +
    `Gostaria de saber:\n` +
    `✓ Opções de financiamento disponíveis\n` +
    `✓ Taxas de juros atuais\n` +
    `✓ Simulação de parcelas\n` +
    `✓ Documentação necessária\n\n` +
    `Aguardo retorno! 😊`
  );

  const proximaImagem = () => {
    setImagemAtual((prev) => (prev + 1) % imagens.length);
  };

  const imagemAnterior = () => {
    setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent", // ✅ MUDEI: de Product para RealEstateAgent
    "name": imovel.titulo,
    "description": imovel.descricao,
    "image": imovel.imagemPrincipal || imovel.imagens?.split(',')[0],
    
    // ✅ NOVO: Informações do imóvel
    "numberOfRooms": imovel.numeroQuartos || 0,
    "numberOfBathroomsTotal": imovel.numeroBanheiros || 0,
    "floorSize": {
      "@type": "QuantitativeValue",
      "value": imovel.areaTotal || imovel.areaUtil,
      "unitCode": "MTK" // metros quadrados
    },
    
    // ✅ Ofertas
    "offers": {
      "@type": "Offer",
      "price": imovel.preco,
      "priceCurrency": "BRL",
      "availability": imovel.disponibilidade === 'disponivel' 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "url": window.location.href,
      "priceValidUntil": new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0], // ✅ NOVO: 3 meses
    },
    
    // ✅ Endereço completo
    "address": {
      "@type": "PostalAddress",
      "streetAddress": imovel.endereco ? `${imovel.endereco}, ${imovel.numero || 'S/N'}` : imovel.bairro,
      "addressLocality": imovel.cidade,
      "addressRegion": imovel.estado,
      "postalCode": imovel.cep,
      "addressCountry": "BR"
    },
    
    // ✅ Geolocalização (NOVO)
    ...(imovel.latitude && imovel.longitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": imovel.latitude,
        "longitude": imovel.longitude
      }
    }),
    
    // ✅ Características extras (NOVO)
    "amenityFeature": [
      ...(imovel.diferenciais || []).map(item => ({
        "@type": "LocationFeatureSpecification",
        "name": item,
        "value": true
      })),
      ...(imovel.lazerCondominio || []).map(item => ({
        "@type": "LocationFeatureSpecification",
        "name": item,
        "value": true
      }))
    ],
    
    // ✅ Agente imobiliário
    "broker": {
      "@type": "RealEstateAgent",
      "name": "Bosco Imóveis",
      "url": "https://boscoimoveis.app",
      "telephone": "+55-62-99404-5111",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Goiânia",
        "addressRegion": "GO",
        "addressCountry": "BR"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Catalogo')}>
              <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Catálogo
              </Button>
            </Link>

            {isAdmin && (
              <Button
                onClick={() => navigate(`/anunciar?edit=${imovelId}`)} // ✅ CORRIGIDO: /anunciar ao invés de /gerenciador
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg"
              >
                <Edit className="w-5 h-5 mr-2" />
                Editar Imóvel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { name: 'Catálogo', url: createPageUrl('Catalogo') },
          { name: imovel.titulo, url: window.location.pathname }
        ]} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria de Imagens */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="relative h-[500px] bg-slate-900">
                <LazyImage
                  src={imagens[imagemAtual]}
                  alt={imovel.titulo}
                  className="w-full h-full object-cover"
                />
                
                {imagens.length > 1 && (
                  <>
                    <button
                      onClick={imagemAnterior}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-900" />
                    </button>
                    <button
                      onClick={proximaImagem}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-slate-900" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {imagens.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setImagemAtual(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === imagemAtual ? 'bg-white w-8' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {imovel.destaque && (
                    <Badge className="bg-amber-400 text-blue-900 border-0 shadow-lg">
                      ⭐ Destaque
                    </Badge>
                  )}
                  {imovel.promocao && (
                    <Badge className="bg-red-500 text-white border-0 shadow-lg">
                      <Tag className="w-3 h-3 mr-1" />
                      Promoção
                    </Badge>
                  )}
                  {imovel.categoria && (
                    <Badge className="bg-blue-500 text-white border-0 shadow-lg">
                      {imovel.categoria}
                    </Badge>
                  )}
                </div>
              </div>

              {imagens.length > 1 && (
                <div className="p-4 bg-white">
                  <div className="flex gap-2 overflow-x-auto">
                    {imagens.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setImagemAtual(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === imagemAtual ? 'border-blue-900' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <LazyImage
                          src={img}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Informações Principais */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-900">
                        {getTipoImovelLabel(imovel.tipoImovel)} {/* ✅ CORRIGIDO */}
                      </Badge>
                      <Badge variant="outline">
                        {imovel.tipoNegocio}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{imovel.titulo}</h1>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-5 h-5" />
                      <span>{imovel.endereco || `${imovel.bairro}, ${imovel.cidade} - ${imovel.estado}`}</span>
                    </div>
                  </div>
                </div>

                {/* Características Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-200 my-6">
                  {imovel.areaTotal && (
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Maximize className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Área Total</p>
                        <p className="font-semibold text-slate-900">{imovel.areaTotal}m²</p>
                      </div>
                    </div>
                  )}
                  {imovel.areaUtil && (
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Maximize className="w-5 h-5 text-green-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Área Útil</p>
                        <p className="font-semibold text-slate-900">{imovel.areaUtil}m²</p>
                      </div>
                    </div>
                  )}
                  {imovel.numeroQuartos > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Bed className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Quartos</p>
                        <p className="font-semibold text-slate-900">{imovel.numeroQuartos}</p>
                      </div>
                    </div>
                  )}
                  {imovel.numeroSuites > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Bed className="w-5 h-5 text-purple-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Suítes</p>
                        <p className="font-semibold text-slate-900">{imovel.numeroSuites}</p>
                      </div>
                    </div>
                  )}
                  {imovel.numeroBanheiros > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Bath className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Banheiros</p>
                        <p className="font-semibold text-slate-900">{imovel.numeroBanheiros}</p>
                      </div>
                    </div>
                  )}
                  {imovel.vagas > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Car className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Vagas</p>
                        <p className="font-semibold text-slate-900">{imovel.vagas}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-3">Descrição</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {imovel.descricao || 'Imóvel de excelente qualidade em ótima localização.'}
                  </p>
                </div>

                {/* Visualizações */}
                {visualizacoesHoje > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm">
                        {visualizacoesHoje} {visualizacoesHoje === 1 ? 'pessoa visualizou' : 'pessoas visualizaram'} este imóvel hoje
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ NOVO: Diferenciais do Imóvel */}
            {imovel.diferenciais && imovel.diferenciais.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Sparkles className="w-5 h-5" />
                    Diferenciais do Imóvel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imovel.diferenciais.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ NOVO: Características do Condomínio */}
            {imovel.condominio && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <Building2 className="w-5 h-5" />
                    Condomínio
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Valor do Condomínio */}
                  {imovel.valorCondominio && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-slate-700 font-medium">Valor do Condomínio</span>
                      <span className="text-lg font-bold text-blue-900">
                        {formatPrice(imovel.valorCondominio)}/mês
                      </span>
                    </div>
                  )}

                  {/* Lazer */}
                  {imovel.lazerCondominio && imovel.lazerCondominio.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                        <Waves className="w-5 h-5 text-blue-600" />
                        Lazer e Esporte
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {imovel.lazerCondominio.map((item, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comodidades */}
                  {imovel.comodidadesCondominio && imovel.comodidadesCondominio.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                        <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                        Comodidades e Serviços
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {imovel.comodidadesCondominio.map((item, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Segurança */}
                  {imovel.segurancaCondominio && imovel.segurancaCondominio.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                        <Shield className="w-5 h-5 text-red-600" />
                        Segurança
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {imovel.segurancaCondominio.map((item, index) => (
                          <Badge key={index} variant="outline" className="justify-start">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ✅ NOVO: Custos Adicionais */}
            {(imovel.valorCondominio || imovel.valorIptu) && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <DollarSign className="w-5 h-5" />
                    Custos Mensais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {imovel.valorCondominio && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">Condomínio</span>
                        <span className="font-semibold text-slate-900">
                          {formatPrice(imovel.valorCondominio)}/mês
                        </span>
                      </div>
                    )}
                    {imovel.valorIptu && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">IPTU</span>
                        <span className="font-semibold text-slate-900">
                          {formatPrice(imovel.valorIptu)}/{imovel.tipoIptu || 'anual'}
                        </span>
                      </div>
                    )}
                    {imovel.valorCondominio && imovel.valorIptu && (
                      <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border-2 border-blue-300">
                        <span className="font-semibold text-blue-900">Total Mensal</span>
                        <span className="font-bold text-blue-900">
                          {formatPrice(
                            imovel.valorCondominio + 
                            (imovel.tipoIptu === 'mensal' ? imovel.valorIptu : imovel.valorIptu / 12)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mapa */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Localização</h2>
              <MapaLeaflet 
                imovel={imovel} // ✅ PASSAR O OBJETO COMPLETO
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-900 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-blue-200 text-sm mb-1">Finalidade</p>
                  <p className="text-xl font-bold">{imovel.finalidade}</p>
                </div>

                <div className="mb-6 pb-4 border-b border-blue-600">
                  <p className="text-blue-200 text-sm mb-1">Valor</p>
                  <p className="text-3xl font-bold">{formatPrice(imovel.preco)}</p>
                </div>

                <div className="space-y-3">
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => handleWhatsAppClick('detalhes')}
                  >
                    <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 text-base shadow-lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Falar no WhatsApp
                    </Button>
                  </a>

                  <Link to={createPageUrl('Contato')}>
                    <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 py-3">
                      Enviar Mensagem
                    </Button>
                  </Link>

                  <div className="flex gap-2">
                    {/* ❌ COMENTAR: */}
                    {/*
                    <div className="flex-1">
                      <FavoritoButton 
                        imovelId={imovel.$id} 
                        variant="outline" 
                        className="w-full"
                      />
                    </div>
                    */}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-600">
                  <p className="text-xs text-blue-200 mb-1">Código do Imóvel</p>
                  <p className="font-mono text-sm font-semibold">
                    {imovel.codigo || imovel.$id}
                  </p>
                  {!imovel.codigo && (
                    <p className="text-xs text-blue-300 mt-1">ID do sistema</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardHeader className="border-b bg-white/50">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Financiamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-amber-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Quer saber se você consegue financiar este imóvel?
                    </p>
                    <p className="font-semibold text-slate-900">
                      Fale com nossos especialistas! 🏦
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Simulação com bancos parceiros</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Taxas atualizadas e competitivas</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Análise de crédito personalizada</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Suporte completo na documentação</span>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMessageFinanciamento}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => handleWhatsAppClick('financiamento')}
                  >
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg">
                      <Phone className="w-5 h-5 mr-2" />
                      Consultar Financiamento
                    </Button>
                  </a>

                  <p className="text-xs text-slate-600 text-center">
                    Atendimento personalizado com especialistas em crédito imobiliário
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SEO
        title={`${imovel.titulo} - Bosco Imóveis`}
        description={imovel.descricao}
        keywords={`${imovel.tipoImovel}, ${imovel.cidade}, ${imovel.bairro}`}
        image={imovel.imagemPrincipal}
      />
      <SchemaOrg data={schemaData} />
    </div>
  );
}
