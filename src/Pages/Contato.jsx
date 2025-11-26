import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, MessageCircle, Send, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Client, Functions } from 'appwrite'; // ✅ ADICIONAR IMPORT

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
  });
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      console.log('✅ Contato salvo:', contato);

      // 2. Enviar email via Appwrite Function
      try {
        // ✅ CORRIGIDO: Criar cliente do Appwrite
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

        console.log('📤 Enviando para função via SDK');
        console.log('📤 Dados:', bodyData);

        // ✅ Usar createExecution do SDK
        const execution = await functions.createExecution(
          import.meta.env.VITE_APPWRITE_FUNCTION_EMAIL,
          JSON.stringify(bodyData), // Body como string JSON
          false, // async = false (síncrono)
          '/', // path
          'POST', // method
          {} // headers (opcional)
        );

        console.log('📥 Resposta da função:', execution);

        if (execution.status === 'failed') {
          console.error('❌ Erro ao enviar email:', execution);
          throw new Error(execution.responseBody || 'Falha ao enviar email');
        }

        console.log('✅ Email enviado com sucesso!');
      } catch (emailError) {
        console.error('❌ Erro ao executar função de email:', emailError);
        // Não bloquear o fluxo se o email falhar
      }

      toast.success('Mensagem enviada com sucesso! 🎉', {
        description: 'Entraremos em contato em breve. Verifique seu email.',
      });
      
      setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
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
                        <a href="mailto:bosco.mr@hotmail.com" className="text-blue-100 hover:text-white transition-colors">
                          bosco.mr@hotmail.com
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
    </div>
  );
}