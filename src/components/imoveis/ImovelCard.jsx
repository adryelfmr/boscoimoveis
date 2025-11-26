import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Maximize, Bed, Bath, Car, Tag as TagIcon, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import FavoritoButton from './FavoritoButton';
import { appwrite } from '@/api/appwriteClient'; // ✅ MUDOU: usar appwrite ao invés de base44
import { useQuery } from '@tanstack/react-query';

export default function ImovelCard({ imovel, index = 0 }) {
  const imagemPrincipal = imovel.imagemPrincipal || imovel.imagens?.[0] || 
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';

  const { data: visualizacoes = [] } = useQuery({
    queryKey: ['visualizacoes-count', imovel.$id],
    queryFn: async () => {
      return await appwrite.entities.Visualizacao.filter({ 
        imovelId: imovel.$id, // ✅ CORRIGIDO: camelCase
      });
    },
  });

  const visualizacoesHoje = visualizacoes.filter(v => {
    const hoje = new Date().toDateString();
    const dataVisualizacao = new Date(v.$createdAt).toDateString(); // ✅ MUDOU: usar $createdAt
    return hoje === dataVisualizacao;
  }).length;

  const diasPublicado = Math.floor((new Date() - new Date(imovel.$createdAt)) / (1000 * 60 * 60 * 24)); // ✅ MUDOU: usar $createdAt

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link 
        to={createPageUrl(`Detalhes?id=${imovel.$id}`)} // ✅ MUDOU: usar $id
        className="block"
      >
        <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white">
          <div className="relative overflow-hidden aspect-[4/3]">
            <img
              src={imagemPrincipal}
              alt={imovel.titulo}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {diasPublicado <= 3 && (
                <Badge className="bg-green-500 text-white border-0 shadow-lg font-semibold animate-pulse">
                  ✨ Novo
                </Badge>
              )}
              {imovel.destaque && (
                <Badge className="bg-amber-400 text-blue-900 border-0 shadow-lg font-semibold">
                  ⭐ Destaque
                </Badge>
              )}
              {imovel.promocao && (
                <Badge className="bg-red-500 text-white border-0 shadow-lg font-semibold">
                  <TagIcon className="w-3 h-3 mr-1" />
                  Promoção
                </Badge>
              )}
              <Badge className="bg-white/90 text-blue-900 border-0 shadow-lg font-semibold">
                {imovel.finalidade}
              </Badge>
            </div>

            {/* Botões de Ação */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FavoritoButton imovelId={imovel.$id} size="sm" variant="secondary" />
            </div>

            {/* Badge de Visualizações */}
            {visualizacoesHoje > 0 && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {visualizacoesHoje} {visualizacoesHoje === 1 ? 'pessoa visualizou' : 'pessoas visualizaram'} hoje
              </div>
            )}

            {/* Price on hover */}
            <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">{formatPrice(imovel.preco)}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3">
              <Badge variant="outline" className="text-blue-900 border-blue-900 mb-2">
                {imovel.tipoImovel}
              </Badge>
              <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-blue-900 transition-colors">
                {imovel.titulo}
              </h3>
            </div>

            <div className="flex items-start gap-1 text-sm text-slate-600 mb-4">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">
                {imovel.bairro && imovel.cidade ? `${imovel.bairro}, ${imovel.cidade}` : imovel.endereco}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4">
              {imovel.area && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Maximize className="w-4 h-4" />
                  <span className="font-medium">{imovel.area}m²</span>
                </div>
              )}
              {imovel.numeroQuartos > 0 && ( // ✅ MUDOU: usar numeroQuartos
                <div className="flex items-center gap-1 text-slate-600">
                  <Bed className="w-4 h-4" />
                  <span className="font-medium">{imovel.numeroQuartos}</span>
                </div>
              )}
              {imovel.numeroBanheiros > 0 && ( // ✅ MUDOU: usar numeroBanheiros
                <div className="flex items-center gap-1 text-slate-600">
                  <Bath className="w-4 h-4" />
                  <span className="font-medium">{imovel.numeroBanheiros}</span>
                </div>
              )}
              {imovel.vagas > 0 && (
                <div className="flex items-center gap-1 text-slate-600">
                  <Car className="w-4 h-4" />
                  <span className="font-medium">{imovel.vagas}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}