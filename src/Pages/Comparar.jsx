import React, { useState, useEffect } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, X, MapPin, Maximize, Bed, Bath, Car, TrendingUp, ExternalLink, Award, DollarSign, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import LazyImage from '@/components/LazyImage'; // ✅ ADICIONAR
import { Building2 } from 'lucide-react';
import SEO from '@/components/SEO';

export default function Comparar() {
  const [comparandoIds, setComparandoIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('comparacao');
    if (saved) {
      setComparandoIds(JSON.parse(saved));
    }
  }, []);

  const { data: imoveis = [], isLoading } = useQuery({
    queryKey: ['imoveis-comparacao', comparandoIds],
    queryFn: async () => {
      if (comparandoIds.length === 0) return [];
      const promises = comparandoIds.map(id => 
        appwrite.entities.Imovel.get(id)
      );
      return (await Promise.all(promises)).filter(Boolean);
    },
    enabled: comparandoIds.length > 0,
  });

  const removerDaComparacao = (id) => {
    const novosIds = comparandoIds.filter(i => i !== id);
    setComparandoIds(novosIds);
    localStorage.setItem('comparacao', JSON.stringify(novosIds));
    window.dispatchEvent(new Event('storage'));
  };

  const limparComparacao = () => {
    setComparandoIds([]);
    localStorage.removeItem('comparacao');
    window.dispatchEvent(new Event('storage'));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calcularPrecoPorM2 = (imovel) => {
    if (!imovel.area || imovel.area === 0) return null;
    return imovel.preco / imovel.area;
  };

  // Encontrar melhores valores
  const maisBarato = imoveis.length > 0 ? Math.min(...imoveis.map(i => i.preco)) : null;
  const maiorArea = imoveis.length > 0 ? Math.max(...imoveis.filter(i => i.area).map(i => i.area)) : null;
  const melhorCustoM2 = imoveis.length > 0 && imoveis.some(i => i.area > 0) 
    ? Math.min(...imoveis.filter(i => i.area && i.area > 0).map(i => calcularPrecoPorM2(i))) 
    : null;

  const isMelhorPreco = (imovel) => imovel.preco === maisBarato;
  const isMelhorArea = (imovel) => imovel.area === maiorArea;
  const isMelhorCustoM2 = (imovel) => calcularPrecoPorM2(imovel) === melhorCustoM2;

  // Encontrar imóveis que são destaques
  const imovelMaisBarato = imoveis.find(i => i.preco === maisBarato);
  const imovelMaisCaro = imoveis.find(i => i.preco === Math.max(...imoveis.map(i => i.preco)));
  const imovelMaiorArea = imoveis.find(i => i.area === maiorArea);
  const imovelMelhorCusto = melhorCustoM2 ? imoveis.find(i => calcularPrecoPorM2(i) === melhorCustoM2) : null;

  const getImovelPreview = (imovel) => {
    if (!imovel) return null;
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded-lg border border-slate-200">
        <LazyImage
          src={imovel.imagemPrincipal || imovel.imagens?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'}
          alt={imovel.titulo}
          className="w-12 h-12 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{imovel.titulo}</p>
          <p className="text-xs text-slate-600 truncate">{imovel.bairro}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('Catalogo')}>
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Catálogo
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Comparar Imóveis</h1>
              <p className="text-xl text-blue-100">
                Compare até 4 imóveis lado a lado
              </p>
            </div>
            {imoveis.length > 0 && (
              <Button
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={limparComparacao}
              >
                Limpar Tudo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {imoveis.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Nenhum imóvel para comparar
                </h3>
                <p className="text-slate-600 mb-6">
                  Adicione imóveis à comparação clicando no ícone de balança nos cards do catálogo
                </p>
                <Link to={createPageUrl('Catalogo')}>
                  <Button className="bg-blue-900 hover:bg-blue-800">
                    Explorar Catálogo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Resumo da Comparação - MELHORADO */}
            {imoveis.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Award className="w-6 h-6 text-blue-900" />
                      <h3 className="text-xl font-bold text-blue-900">🏆 Análise Comparativa</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mais Barato */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-700">MELHOR PREÇO</p>
                            <p className="text-2xl font-bold text-green-600">
                              {formatPrice(maisBarato)}
                            </p>
                          </div>
                        </div>
                        {getImovelPreview(imovelMaisBarato)}
                      </div>

                      {/* Mais Caro */}
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-orange-700">MAIS CARO</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {formatPrice(Math.max(...imoveis.map(i => i.preco)))}
                            </p>
                          </div>
                        </div>
                        {getImovelPreview(imovelMaisCaro)}
                      </div>

                      {/* Maior Área */}
                      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border-2 border-blue-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Maximize className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700">MAIOR ÁREA</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {maiorArea}m²
                            </p>
                          </div>
                        </div>
                        {getImovelPreview(imovelMaiorArea)}
                      </div>

                      {/* Melhor Custo/m² */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border-2 border-purple-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-purple-700">MELHOR CUSTO/m²</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {melhorCustoM2 ? formatPrice(melhorCustoM2) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {getImovelPreview(imovelMelhorCusto)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Grid de Comparação */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Adicionado padding-top para dar espaço para as badges */}
                <div className={`grid gap-6 pt-6 ${imoveis.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : `grid-cols-${Math.min(imoveis.length, 4)}`}`}>
                  {imoveis.map((imovel, idx) => {
                    const melhorPreco = isMelhorPreco(imovel);
                    const melhorArea = isMelhorArea(imovel);
                    const melhorCusto = isMelhorCustoM2(imovel);
                    const temDestaque = melhorPreco || melhorArea || melhorCusto;

                    return (
                      <motion.div
                        key={imovel.$id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex relative"
                      >
                        {/* Badge de Destaque - FORA DO CARD */}
                        {temDestaque && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-blue-900 border-0 shadow-lg px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
                              <Award className="w-4 h-4" />
                              <span className="font-bold text-sm">
                                {melhorPreco && '💰 Melhor Preço'}
                                {melhorArea && !melhorPreco && '🏆 Maior Área'}
                                {melhorCusto && !melhorPreco && !melhorArea && '⭐ Melhor Custo'}
                              </span>
                            </Badge>
                          </div>
                        )}

                        <Card className={`border-0 shadow-xl relative flex flex-col flex-1 ${
                          temDestaque ? 'ring-2 ring-amber-400' : ''
                        }`}>
                          {/* Botão Remover */}
                          <button
                            onClick={() => removerDaComparacao(imovel.$id)}
                            className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          {/* Imagem */}
                          <div className="relative h-48 bg-slate-200 overflow-hidden rounded-t-xl">
                            <LazyImage
                              src={imovel.imagemPrincipal}
                              alt={imovel.titulo}
                              className="w-full h-48 object-cover"
                            />
                            {imovel.promocao && (
                              <Badge className="absolute top-4 left-4 bg-red-500 text-white border-0">
                                Promoção
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-6 space-y-4 flex flex-col flex-1">
                            {/* Título e Tipo */}
                            <div>
                              <Badge variant="outline" className="mb-2">{imovel.tipoImovel}</Badge>
                              <h3 className="font-bold text-lg text-slate-900 line-clamp-2 min-h-[3.5rem]">
                                {imovel.titulo}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-slate-600 mt-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="line-clamp-1">
                                  {imovel.bairro && imovel.cidade ? `${imovel.bairro}, ${imovel.cidade}` : imovel.endereco}
                                </span>
                              </div>
                            </div>

                            {/* Preço */}
                            <div className={`rounded-lg p-4 ${melhorPreco ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' : 'bg-blue-50'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {melhorPreco && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                                <p className={`text-sm font-medium ${melhorPreco ? 'text-green-700' : 'text-slate-600'}`}>
                                  {melhorPreco ? '💰 Melhor Preço' : 'Preço'}
                                </p>
                              </div>
                              <p className={`text-2xl font-bold ${melhorPreco ? 'text-green-600' : 'text-blue-900'}`}>
                                {formatPrice(imovel.preco)}
                              </p>
                              {calcularPrecoPorM2(imovel) && (
                                <p className={`text-sm mt-1 ${melhorCusto ? 'text-purple-600 font-semibold' : 'text-slate-600'}`}>
                                  {melhorCusto && '⭐ '}
                                  {formatPrice(calcularPrecoPorM2(imovel))}/m²
                                </p>
                              )}
                            </div>

                            {/* Características */}
                            <div className="space-y-3 flex-1">
                              {imovel.area && (
                                <div className={`flex items-center justify-between p-2 rounded ${melhorArea ? 'bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200' : ''}`}>
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Maximize className="w-4 h-4" />
                                    <span className="text-sm">{melhorArea ? '🏆 Maior Área' : 'Área'}</span>
                                  </div>
                                  <span className={`font-semibold ${melhorArea ? 'text-blue-600' : ''}`}>
                                    {imovel.area}m²
                                  </span>
                                </div>
                              )}
                              {imovel.numeroQuartos > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Bed className="w-4 h-4" />
                                    <span className="text-sm">Quartos</span>
                                  </div>
                                  <span className="font-semibold">{imovel.numeroQuartos}</span>
                                </div>
                              )}
                              {imovel.numeroBanheiros > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Bath className="w-4 h-4" />
                                    <span className="text-sm">Banheiros</span>
                                  </div>
                                  <span className="font-semibold">{imovel.numeroBanheiros}</span>
                                </div>
                              )}
                              {imovel.vagas > 0 && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-600">
                                    <Car className="w-4 h-4" />
                                    <span className="text-sm">Vagas</span>
                                  </div>
                                  <span className="font-semibold">{imovel.vagas}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <span className="text-sm">Finalidade</span>
                                </div>
                                <Badge variant="outline">{imovel.finalidade}</Badge>
                              </div>
                            </div>

                            {/* Botão Ver Detalhes */}
                            <Link to={createPageUrl(`Detalhes?id=${imovel.$id}`)}>
                              <Button className="w-full bg-blue-900 hover:bg-blue-800">
                                Ver Detalhes
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensagem quando não há imóveis para comparar */}
      {!isLoading && imoveisFiltrados.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-slate-600 mb-4">Tente ajustar os filtros para ver mais resultados</p>
          <button
            onClick={handleLimparFiltros}
            className="text-blue-700 hover:underline font-medium"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}

      <SEO
        title="Catálogo de Imóveis - Bosco Imóveis | Casas e Apartamentos em Goiânia"
        description={`Confira ${imoveisFiltrados.length} imóveis disponíveis em Goiânia. Casas, apartamentos, terrenos e muito mais.`}
        keywords="catálogo imóveis, imóveis goiânia, comprar casa, alugar apartamento"
        url="https://boscoimoveis.app/catalogo"
      />
    </div>
  );
}