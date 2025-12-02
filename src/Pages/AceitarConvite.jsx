import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { teams } from '@/lib/appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AceitarConvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState(null);

  const teamId = searchParams.get('teamId');
  const membershipId = searchParams.get('membershipId');
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    if (!teamId || !membershipId || !userId || !secret) {
      setErro('Link de convite inválido ou incompleto.');
      return;
    }

    if (!isAuthenticated) {
      // Salvar URL para retornar após login
      localStorage.setItem('invite_return_url', window.location.href);
      toast.info('Faça login para aceitar o convite', {
        description: 'Você será redirecionado de volta após fazer login.',
      });
      navigate('/login');
      return;
    }

    // Verificar se é o usuário correto
    if (user.$id !== userId) {
      setErro('Este convite foi enviado para outro usuário. Faça login com a conta correta.');
      return;
    }

    aceitarConvite();
  }, [teamId, membershipId, userId, secret, isAuthenticated, user]);

  const aceitarConvite = async () => {
    setProcessando(true);
    
    try {
      // Aceitar membership
      await teams.updateMembershipStatus(
        teamId,
        membershipId,
        userId,
        secret
      );

      setSucesso(true);
      toast.success('✅ Convite aceito com sucesso!', {
        description: 'Você agora é um administrador do sistema.',
      });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/gerenciador');
      }, 2000);

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      
      if (error.message?.includes('expired')) {
        setErro('Este convite expirou. Peça ao administrador para enviar um novo.');
      } else if (error.message?.includes('Invalid')) {
        setErro('Link de convite inválido ou já foi usado.');
      } else {
        setErro(error.message || 'Erro ao aceitar convite. Tente novamente.');
      }
      
      toast.error('Erro ao aceitar convite', {
        description: 'Entre em contato com o administrador.',
      });
    } finally {
      setProcessando(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Será redirecionado para login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {sucesso ? 'Convite Aceito!' : 'Convite de Administrador'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {processando ? (
              <div className="text-center py-8">
                <Loader2 className="w-16 h-16 text-blue-900 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">Processando convite...</p>
              </div>
            ) : sucesso ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Bem-vindo à equipe!
                </h3>
                <p className="text-slate-600 mb-4">
                  Você agora tem acesso às ferramentas administrativas.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Redirecionando para o painel de administração...
                  </p>
                </div>
              </div>
            ) : erro ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Erro ao aceitar convite
                </h3>
                <p className="text-slate-600 mb-4">{erro}</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    Ir para Página Inicial
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}