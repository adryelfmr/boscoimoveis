import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analytics } from '@/utils/analytics'; // ✅ NOVO IMPORT

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se já foi dismissado
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);
      
      // Mostrar novamente após 7 dias
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Capturar evento de instalação
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt após 10 segundos
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar quando foi instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt nativo
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      analytics.installPWA(); // ✅ RASTREAR INSTALAÇÃO
      console.log('✅ PWA instalado');
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Não mostrar se já está instalado
  if (isInstalled || !showInstallPrompt) return null;

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 z-50"
        >
          <Card className="border-2 border-blue-900 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-blue-900" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-1">
                    Instalar Bosco Imóveis
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Instale nosso app e tenha acesso rápido aos imóveis, mesmo offline!
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleInstall}
                      className="flex-1 bg-blue-900 hover:bg-blue-800"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Instalar
                    </Button>
                    <Button 
                      onClick={handleDismiss}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}