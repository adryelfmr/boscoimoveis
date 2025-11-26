import React, { useState, useEffect } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import ImovelCard from '@/components/imoveis/ImovelCard'; // ✅ CORRIGIDO

export default function Favoritos() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appwrite.auth.me()
      .then(setUser)
      .catch(() => {
        appwrite.auth.redirectToLogin(window.location.href);
      })
      .finally(() => setLoading(false));
  }, []);

  const { data: favoritos = [], isLoading: loadingFavoritos } = useQuery({
    queryKey: ['favoritos', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      return await appwrite.entities.Favorito.filter({ userId: user.$id }); 
    },
    enabled: !!user?.$id,
  });

  const { data: imoveis = [], isLoading: loadingImoveis } = useQuery({
    queryKey: ['imoveis-favoritos', favoritos],
    queryFn: async () => {
      if (favoritos.length === 0) return [];
      const promises = favoritos.map(fav =>
        appwrite.entities.Imovel.get(fav.imovelId) // ✅ CORRIGIDO: camelCase
      );
      return (await Promise.all(promises)).filter(Boolean);
    },
    enabled: favoritos.length > 0,
  });

  if (loading || loadingFavoritos) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-10 h-10 fill-current" />
            <h1 className="text-4xl md:text-5xl font-bold">Meus Favoritos</h1>
          </div>
          <p className="text-xl text-blue-100">
            {imoveis.length} {imoveis.length === 1 ? 'imóvel salvo' : 'imóveis salvos'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loadingImoveis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96" />
            ))}
          </div>
        ) : imoveis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.map((imovel, index) => (
              <ImovelCard key={imovel.$id} imovel={imovel} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl">
            <Heart className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum favorito ainda</h3>
            <p className="text-slate-600">Comece a favoritar imóveis para vê-los aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}