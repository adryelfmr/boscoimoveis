import React, { useState, useMemo } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import ImovelCard from '@/components/imoveis/ImovelCard'; // ✅ CORRIGIDO: usar @ alias
import FiltrosImoveis from '@/components/imoveis/FiltrosImoveis'; // ✅ CORRIGIDO: usar @ alias
import { Building2 } from 'lucide-react';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: 'todos',
    finalidade: 'todas',
    quartos: 'todos',
  });

  const { data: imoveis = [], isLoading } = useQuery({
    queryKey: ['imoveis-todos'],
    queryFn: async () => {
      return await appwrite.entities.Imovel.filter({ 
        disponibilidade: 'disponivel' 
      }, '-$createdAt');
    },
  });

  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter((imovel) => {
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const textoParaBuscar = `${imovel.titulo} ${imovel.bairro} ${imovel.cidade} ${imovel.endereco}`.toLowerCase();
        if (!textoParaBuscar.includes(busca)) return false;
      }

      if (filtros.tipo !== 'todos' && imovel.tipoImovel !== filtros.tipo) return false;
      
      if (filtros.finalidade !== 'todas' && imovel.tipoNegocio !== filtros.finalidade) return false;
      
      if (filtros.quartos !== 'todos') {
        const minQuartos = parseInt(filtros.quartos);
        if (!imovel.numeroQuartos || imovel.numeroQuartos < minQuartos) return false;
      }

      return true;
    });
  }, [imoveis, filtros]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleLimparFiltros = () => {
    setFiltros({
      busca: '',
      tipo: 'todos',
      finalidade: 'todas',
      quartos: 'todos',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Catálogo de Imóveis</h1>
          <p className="text-xl text-blue-100">Encontre seu imóvel ideal entre as melhores opções</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FiltrosImoveis
          filtros={filtros}
          onFiltroChange={handleFiltroChange}
          onLimparFiltros={handleLimparFiltros}
        />

        <div className="mb-6">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">{imoveisFiltrados.length}</span>{' '}
            {imoveisFiltrados.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96" />
            ))}
          </div>
        ) : imoveisFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveisFiltrados.map((imovel, index) => (
              <ImovelCard key={imovel.$id} imovel={imovel} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-2xl">
            <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhum imóvel encontrado</h3>
            <p className="text-slate-600">Tente ajustar os filtros para ver mais resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}