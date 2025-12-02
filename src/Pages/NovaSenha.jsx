import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { account } from '@/lib/appwrite';

export default function NovaSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (!userId || !secret) {
      toast.error('Link inválido', {
        description: 'Este link de redefinição é inválido ou expirou.',
      });
      navigate('/redefinir-senha');
    }
  }, [userId, secret, navigate]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (calculatePasswordStrength(formData.password) < 2) {
      newErrors.password = 'Senha muito fraca';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Confirmar redefinição de senha
      await account.updateRecovery(
        userId,
        secret,
        formData.password,
        formData.confirmPassword
      );

      toast.success('Senha redefinida com sucesso! 🎉', {
        description: 'Faça login com sua nova senha.',
      });

      navigate('/login');
    } catch (error) {

      if (error.message?.includes('expired')) {
        toast.error('Link expirado', {
          description: 'Este link de redefinição expirou. Solicite um novo.',
        });
        navigate('/redefinir-senha');
      } else if (error.message?.includes('Invalid')) {
        toast.error('Link inválido', {
          description: 'Este link é inválido ou já foi usado.',
        });
        navigate('/redefinir-senha');
      } else {
        toast.error('Erro ao redefinir senha', {
          description: 'Tente novamente mais tarde.',
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
          <h1 className="text-4xl font-bold text-white mb-2">Bosco Imóveis</h1>
          <p className="text-blue-200">Criar nova senha</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Nova Senha</CardTitle>
            <p className="text-center text-slate-600 text-sm">
              Escolha uma senha forte e segura
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Nova Senha *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Barra de força */}
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
                
                {errors.password && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined });
                      }
                    }}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 h-12 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                <p className="font-semibold mb-2">Requisitos da senha:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Mínimo de 8 caracteres</li>
                  <li>✓ Letras maiúsculas e minúsculas</li>
                  <li>✓ Pelo menos um número</li>
                  <li>✓ Caracteres especiais (recomendado)</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-900 hover:text-blue-800 font-semibold">
                Voltar para Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}