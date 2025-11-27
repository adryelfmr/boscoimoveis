import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Clock, Shield, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SEO from '@/components/SEO';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <SEO
        title="Sobre Nós - Bosco Imóveis | Corretores Especializados em Goiânia"
        description="Conheça a história da Bosco Imóveis. Há mais de 10 anos ajudando famílias a realizarem o sonho da casa própria em Goiânia e região. Corretores autônomos com atendimento personalizado."
        keywords="sobre bosco imóveis, corretores goiânia, história, experiência, atendimento personalizado"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Sobre a Bosco Imóveis</h1>
            <p className="text-xl text-blue-100">Mais de 10 anos realizando sonhos em Goiânia</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* História */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Nossa História</h2>
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="text-lg leading-relaxed">
              A <strong>Bosco Imóveis</strong> nasceu da paixão de pai e filho por transformar vidas através do mercado imobiliário. 
              Com mais de <strong>10 anos de experiência</strong>, atuamos como <strong>corretores autônomos especializados</strong> em Goiânia e região metropolitana.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Nossa missão é simples: <strong>encontrar o imóvel perfeito para cada cliente</strong>, oferecendo 
              atendimento personalizado, consultoria gratuita e suporte completo do início ao fim.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Trabalhamos com <strong>casas, apartamentos, terrenos e imóveis comerciais</strong>, sempre buscando 
              as melhores oportunidades e condições para nossos clientes.
            </p>
          </div>
        </motion.div>

        {/* Diferenciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="font-bold text-lg mb-2">+10 Anos</h3>
              <p className="text-slate-600">de experiência no mercado imobiliário</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Atendimento Personalizado</h3>
              <p className="text-slate-600">Cuidado individual em cada negociação</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Agilidade</h3>
              <p className="text-slate-600">Respostas rápidas e processos otimizados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Confiança</h3>
              <p className="text-slate-600">Transparência em todas as etapas</p>
            </CardContent>
          </Card>
        </div>

        {/* Área de Atuação */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">📍 Área de Atuação</h2>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-bold text-xl text-blue-900 mb-3">Goiânia</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>✓ Toda a cidade</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-blue-900 mb-3">Região Metropolitana</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>✓ Aparecida de Goiânia</li>
                    <li>✓ Senador Canedo</li>
                    <li>✓ Trindade</li>
                    <li>✓ Goianira</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-blue-900 mb-3">Tipos de Imóveis</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li>✓ Casas</li>
                    <li>✓ Apartamentos</li>
                    <li>✓ Terrenos</li>
                    <li>✓ Imóveis Comerciais</li>
                    <li>✓ Chácaras</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-8 md:p-12 text-white text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Vamos encontrar seu imóvel ideal?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Entre em contato e agende uma conversa sem compromisso
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/5562994045111" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                <Phone className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </a>
            <Link to={createPageUrl('Contato')}>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <Mail className="w-5 h-5 mr-2" />
                Enviar Email
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}