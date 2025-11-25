import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, LogOut, Heart, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Perfil() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao fazer logout');
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <p className="text-blue-200">{user.email}</p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white border-0">Ativo</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações da Conta */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-semibold">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Nome</p>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Membro desde</p>
                    <p className="font-semibold">
                      {new Date(user.$createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/favoritos')}
                >
                  <Heart className="w-5 h-5 mr-3 text-red-500" />
                  Meus Favoritos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => navigate('/alertas')}
                >
                  <Bell className="w-5 h-5 mr-3 text-amber-500" />
                  Alertas Personalizados
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-red-600 hover:bg-red-50"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {loggingOut ? 'Saindo...' : 'Sair da Conta'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}