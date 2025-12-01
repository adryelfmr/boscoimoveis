import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, Loader2, Home, AlertCircle, CheckCircle2 } from 'lucide-react'; // ✅ REMOVIDO: Phone
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Registro() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    // ✅ REMOVIDO: telefone
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

    // ✅ REMOVIDO: Validação de telefone

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    }

    // Validar confirmação de senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ✅ REMOVIDO: conversão de telefone
      
      await register(
        formData.email, 
        formData.password, 
        formData.name,
        null // ✅ Telefone null
      );
      
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
          password: 'Senha muito fraca ou inválida',
        });
      } else {
        toast.error('Erro ao criar conta', {
          description: error.message || 'Tente novamente mais tarde.',
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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 rounded-full mb-4"
          >
            <Home className="w-8 h-8 text-blue-900" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-blue-200">Junte-se ao Bosco Imóveis</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome Completo */}
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

              {/* ✅ REMOVIDO: Campo de Telefone */}

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
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setPasswordStrength(calculatePasswordStrength(e.target.value));
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    placeholder="Mínimo 8 caracteres"
                    className={`pl-10 h-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Força da senha:</span>
                      <span className={`font-medium ${
                        passwordStrength <= 1 ? 'text-red-600' : 
                        passwordStrength <= 3 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
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
                    placeholder="Repita sua senha"
                    className={`pl-10 h-12 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
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

        <p className="text-center text-blue-200 text-sm mt-6">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link to="/termos" className="underline hover:text-white">
            Termos de Uso
          </Link>
        </p>
      </motion.div>
    </div>
  );
}