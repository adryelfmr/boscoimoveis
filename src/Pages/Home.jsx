import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { appwrite } from '@/api/appwriteClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Search, Tag, Award } from 'lucide-react';
import ImovelCard from '../components/imoveis/ImovelCard';
import { motion } from 'framer-motion';

export default function Home() {
  const { data: destaques = [], isLoading: loadingDestaques } = useQuery({
    queryKey: ['imoveis-destaques'],
    queryFn: async () => {
      const imoveis = await appwrite.entities.Imovel.filter({ 
        destaque: true, 
        disponibilidade: 'disponivel'
      }, '-$createdAt', 6);
      return imoveis;
    },
  });

  const { data: promocoes = [], isLoading: loadingPromocoes } = useQuery({
    queryKey: ['imoveis-promocoes'],
    queryFn: async () => {
      const imoveis = await appwrite.entities.Imovel.filter({ 
        promocao: true, 
        disponibilidade: 'disponivel' 
      }, '-$createdAt', 3);
      return imoveis;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-4 py-2 mb-6">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Mais de 10 anos de experiência</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Encontre o <span className="text-amber-400">imóvel perfeito</span> para você
            </h1>
            <p className="text-xl text-slate-200 mb-8 leading-relaxed">
              Na Bosco Imóveis, oferecemos as melhores opções de casas, apartamentos e terrenos com atendimento personalizado.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={createPageUrl('Catalogo')}>
                <Button size="lg" className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Search className="w-5 h-5 mr-2" />
                  Ver Todos os Imóveis
                </Button>
              </Link>
              <Link to={createPageUrl('Contato')}>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  Fale Conosco
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path fill="#f8fafc" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Destaques Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Imóveis em Destaque</h2>
              <p className="text-slate-600">Os imóveis mais procurados do momento</p>
            </div>
            <Link to={createPageUrl('Catalogo')}>
              <Button variant="outline" className="hidden md:flex items-center gap-2">
                Ver Todos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingDestaques ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-200 animate-pulse rounded-2xl h-96" />
              ))}
            </div>
          ) : destaques.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destaques.map((imovel, index) => (
                <ImovelCard key={imovel.$id} imovel={imovel} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum imóvel em destaque no momento</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Promoções Section */}
      {promocoes.length > 0 && (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-8 h-8 text-red-500" />
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Promoções</h2>
                  </div>
                  <p className="text-slate-600">Oportunidades imperdíveis com descontos especiais</p>
                </div>
                <Link to={createPageUrl('Promocoes')}>
                  <Button variant="outline" className="hidden md:flex items-center gap-2 border-red-500 text-red-500 hover:bg-red-50">
                    Ver Todas
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promocoes.map((imovel, index) => (
                  <ImovelCard key={imovel.$id} imovel={imovel} index={index} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full opacity-10 transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400 rounded-full opacity-10 transform -translate-x-24 translate-y-24" />
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Não encontrou o que procura?</h2>
            <p className="text-xl text-blue-100 mb-6">
              Entre em contato conosco! Nossa equipe especializada está pronta para ajudar você a encontrar o imóvel ideal.
            </p>
            <Link to={createPageUrl('Contato')}>
              <Button size="lg" className="bg-amber-400 hover:bg-amber-500 text-blue-900 font-semibold shadow-xl">
                Falar com Especialista
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}