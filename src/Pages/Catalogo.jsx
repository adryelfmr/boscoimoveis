import React, { useState, useMemo } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import ImovelCard from '@/components/imoveis/ImovelCard';
import FiltrosImoveis from '@/components/imoveis/FiltrosImoveis';
import { Building2 } from 'lucide-react';
import SEO from '@/components/SEO';
import SchemaOrg from '@/components/SchemaOrg';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function Catalogo() {
  const [filtros, setFiltros] = useState({
    busca: '',
    finalidade: 'todas',
    tipo: 'todos',
    categoria: 'todas',
    tipoNegocio: 'todos',
    cidade: '',
    bairro: '',
    quartos: 'todos',
    banheiros: 'todos',
    vagas: 'todos',
    precoMin: '',
    precoMax: '',
    areaMin: '',
    condominio: 'todos',
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
      // Busca geral
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const textoParaBuscar = `${imovel.titulo} ${imovel.bairro} ${imovel.cidade} ${imovel.endereco} ${imovel.codigo || ''}`.toLowerCase();
        if (!textoParaBuscar.includes(busca)) return false;
      }

      // ✅ Finalidade
      if (filtros.finalidade !== 'todas' && imovel.finalidade !== filtros.finalidade) return false;

      // ✅ Tipo de imóvel
      if (filtros.tipo !== 'todos' && imovel.tipoImovel !== filtros.tipo) return false;
      
      // ✅ Categoria
      if (filtros.categoria && filtros.categoria !== 'todas') {
        if (imovel.categoria !== filtros.categoria) return false;
      }

      // ✅ Tipo de negócio
      if (filtros.tipoNegocio !== 'todos' && imovel.tipoNegocio !== filtros.tipoNegocio) return false;
      
      // Cidade
      if (filtros.cidade && !imovel.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase())) return false;
      
      // Bairro
      if (filtros.bairro && !imovel.bairro?.toLowerCase().includes(filtros.bairro.toLowerCase())) return false;
      
      // Quartos
      if (filtros.quartos !== 'todos') {
        const minQuartos = parseInt(filtros.quartos);
        if (!imovel.numeroQuartos || imovel.numeroQuartos < minQuartos) return false;
      }

      // Banheiros
      if (filtros.banheiros !== 'todos') {
        const minBanheiros = parseInt(filtros.banheiros);
        if (!imovel.numeroBanheiros || imovel.numeroBanheiros < minBanheiros) return false;
      }

      // Vagas
      if (filtros.vagas !== 'todos') {
        const minVagas = parseInt(filtros.vagas);
        if (!imovel.vagas || imovel.vagas < minVagas) return false;
      }

      // Preço mínimo
      if (filtros.precoMin && imovel.preco < parseFloat(filtros.precoMin)) return false;

      // Preço máximo
      if (filtros.precoMax && imovel.preco > parseFloat(filtros.precoMax)) return false;

      // Área mínima
      if (filtros.areaMin) {
        const area = imovel.areaTotal || imovel.areaUtil || imovel.area;
        if (!area || area < parseFloat(filtros.areaMin)) return false;
      }

      // Condomínio
      if (filtros.condominio !== 'todos') {
        const emCondominio = imovel.condominio === true;
        if (filtros.condominio === 'sim' && !emCondominio) return false;
        if (filtros.condominio === 'nao' && emCondominio) return false;
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
      finalidade: 'todas',
      tipo: 'todos',
      categoria: 'todas',
      tipoNegocio: 'todos',
      cidade: '',
      bairro: '',
      quartos: 'todos',
      banheiros: 'todos',
      vagas: 'todos',
      precoMin: '',
      precoMax: '',
      areaMin: '',
      condominio: 'todos',
    });
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Catálogo de Imóveis - Bosco Imóveis",
    "description": "Confira todos os imóveis disponíveis em Goiânia e região",
    "numberOfItems": imoveisFiltrados.length,
    "itemListElement": imoveisFiltrados.slice(0, 10).map((imovel, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateAgent",
        "name": imovel.titulo,
        "url": `https://boscoimoveis.app/detalhes?id=${imovel.$id}`,
        "image": imovel.imagemPrincipal,
        "offers": {
          "@type": "Offer",
          "price": imovel.preco,
          "priceCurrency": "BRL"
        }
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[
          { name: 'Catálogo', url: '/catalogo' }
        ]} />
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
            <p className="text-slate-600 mb-4">Tente ajustar os filtros para ver mais resultados</p>
            <button
              onClick={handleLimparFiltros}
              className="text-blue-700 hover:underline font-medium"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      <SEO
        title="Catálogo de Imóveis - Bosco Imóveis | Casas e Apartamentos em Goiânia"
        description={`Confira ${imoveisFiltrados.length} imóveis disponíveis em Goiânia. Casas, apartamentos, terrenos e muito mais.`}
        keywords="catálogo imóveis, imóveis goiânia, comprar casa, alugar apartamento"
      />
      <SchemaOrg data={schemaData} />
    </div>
  );
}