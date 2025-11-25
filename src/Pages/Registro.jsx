import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Loader2, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Registro() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(formData.name)) {
      newErrors.name = 'Nome deve conter apenas letras';
    }

    // Validar email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (calculatePasswordStrength(formData.password) < 2) {
      newErrors.password = 'Senha muito fraca. Use letras maiúsculas, minúsculas e números';
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (password) => {
    setFormData({ ...formData, password });
    setPasswordStrength(calculatePasswordStrength(password));
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Fraca';
    if (passwordStrength <= 3) return 'Média';
    return 'Forte';
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
      await register(formData.email, formData.password, formData.name);
      toast.success('Conta criada com sucesso! 🎉', {
        description: 'Bem-vindo ao Bosco Imóveis!',
      });
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      
      // Mensagens de erro específicas
      if (error.message?.includes('already exists') || error.message?.includes('user_already_exists')) {
        toast.error('Email já cadastrado', {
          description: 'Já existe uma conta com este email. Faça login ou use outro email.',
        });
        setErrors({
          email: 'Este email já está cadastrado',
        });
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Email inválido', {
          description: 'Por favor, insira um endereço de email válido.',
        });
        setErrors({
          email: 'Email inválido',
        });
      } else if (error.message?.includes('Password')) {
        toast.error('Senha inválida', {
          description: 'A senha não atende aos requisitos mínimos de segurança.',
        });
        setErrors({
          password: 'Senha não atende aos requisitos de segurança',
        });
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar ao servidor. Verifique sua internet.',
        });
      } else {
        toast.error('Erro ao criar conta', {
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
          <h1 className="text-4xl font-bold text-white mb-2">Bosco Imóveis</h1>
          <p className="text-blue-200">Crie sua conta gratuitamente</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.name ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined });
                      }
                    }}
                    placeholder="Seu nome completo"
                    className={`pl-10 h-12 ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.name && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Email *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
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

              {/* Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Senha *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className={`pl-10 h-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                
                {/* Barra de força da senha */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password ? (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    Mínimo 8 caracteres, inclua letras maiúsculas, minúsculas e números
                  </p>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined });
                      }
                    }}
                    placeholder="••••••••"
                    className={`pl-10 h-12 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword}</span>
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
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-900 hover:text-blue-800 font-semibold">
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}