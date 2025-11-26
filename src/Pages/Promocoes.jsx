import React from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import ImovelCard from '@/components/imoveis/ImovelCard'; // ✅ CORRIGIDO
import { Tag, Building2 } from 'lucide-react';

export default function Promocoes() {
  const { data: promocoes = [], isLoading } = useQuery({
    queryKey: ['imoveis-promocoes'],
    queryFn: async () => {
      return await appwrite.entities.Imovel.filter({ 
        promocao: true, 
        disponibilidade: 'disponivel' 
      }, '-$createdAt');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-bold">Promoções</h1>
          </div>
          <p className="text-xl text-red-100">Aproveite nossas ofertas exclusivas com descontos imperdíveis</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96" />
            ))}
          </div>
        ) : promocoes.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">{promocoes.length}</span>{' '}
                {promocoes.length === 1 ? 'promoção ativa' : 'promoções ativas'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promocoes.map((imovel, index) => (
                <ImovelCard key={imovel.$id} imovel={imovel} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhuma promoção ativa</h3>
            <p className="text-slate-600">No momento não temos imóveis em promoção</p>
          </div>
        )}
      </div>
    </div>
  );
}