import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Home, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { account } from '@/lib/appwrite';

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
      const resetUrl = `${window.location.origin}/nova-senha`;

      // 1️⃣ Criar token de recuperação do Appwrite
      await account.createRecovery(email, resetUrl);

      // 2️⃣ Enviar email customizado via função
      const payload = {
        email: email,
        resetUrl: `${resetUrl}?email=${encodeURIComponent(email)}`,
      };

      console.log('📤 Enviando para função reset-password');
      console.log('📤 Payload:', payload);

      // ✅ CORRIGIDO: Usar a URL completa da API
      const functionUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/${import.meta.env.VITE_APPWRITE_FUNCTION_RESET_PASSWORD}/executions`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
        },
        body: JSON.stringify({
          data: JSON.stringify(payload), // ✅ Enviar como "data"
          async: false
        }),
      });

      const result = await response.json();
      console.log('📥 Resposta da função:', result);

      if (!response.ok || result.status === 'failed') {
        console.error('❌ Erro ao enviar email:', result);
        throw new Error('Falha ao enviar email');
      }

      setEmailEnviado(true);
      toast.success("Email enviado com sucesso!", {
        description: "Verifique sua caixa de entrada.",
      });

    } catch (err) {
      console.error("ERRO AO REDEFINIR SENHA:", err);
      toast.error("Erro ao processar solicitação");
      setError("Não foi possível enviar o email.");
    }

    setLoading(false);
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
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Redefinir Senha</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="seu@email.com"
                    className="pl-10 h-12"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
              </div>

              <Button disabled={loading} className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white mt-6">
          <Link to="/" className="hover:underline">
            <ArrowLeft className="inline w-4 h-4 mr-1" />
            Voltar para o site
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
