import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, MessageCircle, Send, Clock, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Client, Functions } from 'appwrite';
import { rateLimits } from '@/utils/rateLimit';
import { analytics } from '@/utils/analytics';
import SEO from '@/components/SEO';
import Breadcrumbs from '@/components/Breadcrumbs'; // ✅ ADICIONAR

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [tentativasRestantes, setTentativasRestantes] = useState(3); // ✅ NOVO

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ NOVO: Verificar rate limit ANTES de enviar
    const limitCheck = rateLimits.contact(formData.email);
    
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'blocked') {
        toast.error('🚫 Você está temporariamente bloqueado', {
          description: `Aguarde ${limitCheck.waitSeconds} segundos antes de tentar novamente.`,
          duration: 5000,
        });
      } else if (limitCheck.reason === 'rate_limit_exceeded') {
        toast.error('⚠️ Muitas tentativas!', {
          description: `Você excedeu o limite de envios. Tente novamente em ${Math.ceil(limitCheck.waitSeconds / 60)} minutos.`,
          duration: 5000,
        });
      }
      return;
    }

    // ✅ NOVO: Atualizar contador visual
    setTentativasRestantes(limitCheck.remainingAttempts);

    setEnviando(true);

    try {
      // 1. Salvar no banco de dados
      const contato = await appwrite.entities.Contatos.create({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || null,
        mensagem: formData.mensagem,
        origem: 'formulario',
      });

      

      // 2. Enviar email via Appwrite Function
      try {
        const client = new Client()
          .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
          .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
        
        const functions = new Functions(client);
        
        const bodyData = {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || '',
          mensagem: formData.mensagem,
        };

        
        const execution = await functions.createExecution(
          import.meta.env.VITE_APPWRITE_FUNCTION_EMAIL,
          JSON.stringify(bodyData),
          false,
          '/',
          'POST',
          {}
        );

        

        if (execution.status === 'failed') {
          throw new Error(execution.responseBody || 'Falha ao enviar email');
        }

        
      } catch (emailError) {
      }

      // ✅ NOVO: Rastrear envio do formulário
      analytics.submitContact(formData.nome, formData.email);
      analytics.conversion('contact', 0); // Lead qualificado

      toast.success('Mensagem enviada com sucesso! 🎉', {
        description: `Entraremos em contato em breve. Você tem ${limitCheck.remainingAttempts - 1} envios restantes nesta hora.`,
      });
      
      setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
      setTentativasRestantes(limitCheck.remainingAttempts - 1);
    } catch (error) {
      toast.error('Erro ao enviar mensagem', {
        description: 'Por favor, tente novamente ou entre em contato via WhatsApp.',
      });
    } finally {
      setEnviando(false);
    }
  };

  const whatsappNumber = '5562994045111';
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de mais informações sobre os imóveis.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Entre em Contato</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Estamos prontos para ajudar você a encontrar o imóvel perfeito. Fale conosco!
            </p>
          </motion.div>
        </div>
      </div>

      {/* ✅ ADICIONAR: Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={[
          { name: 'Contato', url: '/contato' }
        ]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações de Contato */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-900 to-blue-700 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400 rounded-full opacity-10 transform translate-x-20 -translate-y-20" />
                <CardContent className="p-6 relative z-10">
                  <h2 className="text-2xl font-bold mb-6">Informações</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-400 p-3 rounded-lg">
                        <Phone className="w-6 h-6 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Telefone</h3>
                        <a href="tel:+5562994045111" className="text-blue-100 hover:text-white transition-colors">
                          (62) 99404-5111
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-amber-400 p-3 rounded-lg">
                        <Mail className="w-6 h-6 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <a href="mailto:contato@boscoimoveis.app" className="text-blue-100 hover:text-white transition-colors">
                          contato@boscoimoveis.app
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-amber-400 p-3 rounded-lg">
                        <MapPin className="w-6 h-6 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Endereço</h3>
                        <p className="text-blue-100">Goiânia, GO</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-amber-400 p-3 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Horário</h3>
                        <p className="text-blue-100">Seg - Sex: 8h às 18h</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-blue-600">
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-6">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Falar no WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Envie sua Mensagem</h2>

                  {/* ✅ NOVO: Aviso de Rate Limit */}
                  {tentativasRestantes <= 1 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Atenção!</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Você tem apenas {tentativasRestantes} envio{tentativasRestantes === 1 ? '' : 's'} restante{tentativasRestantes === 1 ? '' : 's'} nesta hora.
                          Após o limite, será necessário aguardar para enviar novamente.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ✅ NOVO: Indicador de Segurança */}
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      🔒 Formulário protegido contra spam. Seus dados estão seguros.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Nome Completo *
                        </label>
                        <Input
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Seu nome"
                          required
                          className="h-12"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="seu@email.com"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Telefone
                      </label>
                      <Input
                        type="tel"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(62) 99999-9999"
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Mensagem *
                      </label>
                      <Textarea
                        value={formData.mensagem}
                        onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                        placeholder="Como podemos ajudar você?"
                        required
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={enviando}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-6 text-lg"
                    >
                      {enviando ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <SEO
        title="Entre em Contato - Bosco Imóveis"
        description="Fale conosco! Nossa equipe especializada está pronta para ajudar você a encontrar o imóvel ideal."
        keywords="contato, falar com corretor, atendimento imóveis goiânia"
        url="https://boscoimoveis.app/contato" // ✅ ADICIONAR URL
      />
    </div>
  );
}