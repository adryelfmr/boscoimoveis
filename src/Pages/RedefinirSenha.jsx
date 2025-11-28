import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Home, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Client, Functions } from 'appwrite'; // ✅ ADICIONAR Functions

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      // ✅ NOVO: Usar sua function customizada
      const client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
      
      const functions = new Functions(client);

      const resetUrl = import.meta.env.VITE_APP_URL
        ? `${import.meta.env.VITE_APP_URL}/nova-senha`
        : `${window.location.origin}/nova-senha`;

      const execution = await functions.createExecution(
        import.meta.env.VITE_APPWRITE_FUNCTION_RESET_PASSWORD,
        JSON.stringify({ email, resetUrl }),
        false,
        '/',
        'POST',
        {}
      );

      console.log('📧 Execution:', execution);

      if (execution.status === 'failed') {
        throw new Error('Falha ao enviar email');
      }

      setEmailEnviado(true);
      toast.success("Email enviado com sucesso!", {
        description: "Verifique sua caixa de entrada.",
      });

    } catch (err) {
      console.error("ERRO:", err);
      
      if (err.message?.includes('user') || err.message?.includes('não encontrado')) {
        toast.error("Email não encontrado");
        setError("Email não cadastrado");
      } else {
        toast.error("Erro ao processar solicitação");
        setError("Tente novamente mais tarde.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-3">Email Enviado!</h2>
              <p className="text-slate-600 mb-6">Enviamos instruções para redefinir sua senha para:</p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-900 font-semibold">{email}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-amber-800">
                  <strong>📧 Verifique:</strong>
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Caixa de entrada</li>
                  <li>• Spam/Lixo eletrônico</li>
                  <li>• Promoções</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link to="/login">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Login
                  </Button>
                </Link>

                <Link to="/">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Ir para Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors mb-6">
            <Home className="w-5 h-5" />
            Voltar para o site
          </Link>
          <img 
            src="/boscoimoveis.svg" 
            alt="Bosco Imóveis" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-white mb-2">Bosco Imóveis</h1>
          <p className="text-blue-200">Redefinir senha</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Esqueceu sua senha?</CardTitle>
            <p className="text-center text-slate-600 text-sm mt-2">
              Digite seu email e enviaremos instruções para criar uma nova senha
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${error ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="seu@email.com"
                    className={`pl-10 h-12 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <Button 
                type="submit"
                disabled={loading} 
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Email"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-900 hover:text-blue-800 font-semibold">
                Lembrou sua senha? Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
