import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="mb-8">
          <img 
            src="/boscoimoveis.svg" 
            alt="Bosco Imóveis" 
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-9xl font-bold text-blue-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Página não encontrada</h2>
          <p className="text-slate-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/">
            <Button className="w-full bg-blue-900 hover:bg-blue-800">
              <Home className="w-5 h-5 mr-2" />
              Voltar para o Início
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para a Página Anterior
          </Button>
        </div>
      </motion.div>
    </div>
  );
}