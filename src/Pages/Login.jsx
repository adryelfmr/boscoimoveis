import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Loader2, Home, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar senha
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpar erros anteriores
    setErrors({});

    // Validar formulário
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso! 🎉', {
        description: 'Bem-vindo de volta!',
      });
      
      const returnUrl = localStorage.getItem('return_url');
      if (returnUrl) {
        localStorage.removeItem('return_url');
        navigate(returnUrl);
      } else {
        navigate('/');
      }
    } catch (error) {
      
      // Mensagens de erro específicas baseadas no tipo de erro
      if (error.message?.includes('Invalid credentials') || error.message?.includes('invalid-email-password')) {
        toast.error('Credenciais inválidas', {
          description: 'Email ou senha incorretos. Verifique seus dados e tente novamente.',
        });
        setErrors({
          email: ' ',
          password: 'Email ou senha incorretos',
        });
      } else if (error.message?.includes('user-not-found') || error.message?.includes('User (role: guests) missing scope')) {
        toast.error('Usuário não encontrado', {
          description: 'Não encontramos uma conta com este email. Deseja criar uma conta?',
        });
        setErrors({
          email: 'Usuário não encontrado',
        });
      } else if (error.message?.includes('too-many-requests')) {
        toast.error('Muitas tentativas', {
          description: 'Você fez muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
        });
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar ao servidor. Verifique sua internet.',
        });
      } else {
        toast.error('Erro ao fazer login', {
          description: 'Ocorreu um erro inesperado. Tente novamente.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors mb-6">
            <Home className="w-5 h-5" />
            Voltar para o site
          </Link>
          {/* Logo - ATUALIZADO */}
          <img 
            src="/boscoimoveis.svg" 
            alt="Bosco Imóveis" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-white mb-2">Bosco Imóveis</h1>
          <p className="text-blue-200">Faça login para continuar</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({ ...errors, email: undefined });
                      }
                    }}
                    placeholder="seu@email.com"
                    className={`pl-10 h-12 ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Senha
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    placeholder="••••••••"
                    className={`pl-10 h-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* ✅ ADICIONAR LINK DE ESQUECI A SENHA */}
            <div className="mt-4 text-center">
              <Link to="/redefinir-senha" className="text-sm text-blue-900 hover:text-blue-800 font-semibold">
                Esqueceu sua senha?
              </Link>
            </div>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-slate-600">
                Não tem uma conta?{' '}
                <Link to="/registro" className="text-blue-900 hover:text-blue-800 font-semibold">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}