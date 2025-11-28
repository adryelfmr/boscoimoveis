import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Lock, Loader2, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { account } from '@/lib/appwrite';
import { 
  formatarTelefoneAoDigitar, 
  validarTelefone, 
  converterParaE164,
  converterParaBrasileiro 
} from '@/utils/telefone';
import { Badge } from '@/components/ui/badge';
import VerificarTelefone from '@/components/VerificarTelefone';

export default function Perfil() {
  const { user, checkUser, isAdmin } = useAuth();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [verificandoTelefone, setVerificandoTelefone] = useState(false);
  const [aguardandoVerificacaoEmail, setAguardandoVerificacaoEmail] = useState(false); // ✅ NOVO
  const [emailParaVerificar, setEmailParaVerificar] = useState(''); // ✅ NOVO
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: user?.phone ? converterParaBrasileiro(user.phone) : '',
    senhaAtual: '',
    novaSenha: '',
  });

  const handleSalvar = async () => {
    setSalvando(true);
    
    try {
      // Atualizar nome
      if (formData.name !== user?.name) {
        await account.updateName(formData.name);
      }

      // Atualizar telefone
      if (formData.telefone) {
        if (!validarTelefone(formData.telefone)) {
          toast.error('Telefone inválido');
          setSalvando(false);
          return;
        }

        const telefoneE164 = converterParaE164(formData.telefone);
        
        if (telefoneE164 !== user?.phone) {
          if (!formData.senhaAtual) {
            toast.error('Digite sua senha para atualizar o telefone');
            setSalvando(false);
            return;
          }
          
          await account.updatePhone(telefoneE164, formData.senhaAtual);
        }
      }

      // Atualizar senha
      if (formData.novaSenha) {
        if (!formData.senhaAtual) {
          toast.error('Digite sua senha atual');
          setSalvando(false);
          return;
        }
        
        await account.updatePassword(formData.novaSenha, formData.senhaAtual);
      }

      toast.success('Perfil atualizado com sucesso!');
      await checkUser();
      setEditando(false);
      setFormData({
        ...formData,
        senhaAtual: '',
        novaSenha: '',
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setSalvando(false);
    }
  };

  const handleTelefoneVerificado = async (telefoneE164) => {
    try {
      await account.updatePhone(telefoneE164, formData.senhaAtual || 'senha-temporaria');
      
      toast.success('✅ Telefone verificado e salvo!');
      
      await checkUser();
      setVerificandoTelefone(false);
      setEditando(false);
      
    } catch (error) {
      console.error('Erro ao salvar telefone:', error);
      toast.error('Erro ao salvar telefone verificado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Meu Perfil</h1>
          <p className="text-slate-600">Gerencie suas informações pessoais</p>
        </div>

        {/* Modal de Verificação de Telefone */}
        {verificandoTelefone && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <VerificarTelefone 
                onVerified={handleTelefoneVerificado}
                onCancel={() => setVerificandoTelefone(false)}
              />
            </div>
          </div>
        )}

        {/* ❌ REMOVER: Sistema antigo de verificação de email */}
        
        {/* Card de Informações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informações Pessoais</CardTitle>
            {!editando && (
              <Button onClick={() => setEditando(true)} variant="outline">
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </label>
              {editando ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user?.name}</p>
              )}
            </div>

            {/* ❌ Email NÃO EDITÁVEL (simplificado) */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
                {user?.emailVerification && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </label>
              
              <div className="space-y-2">
                <p className="text-slate-900 font-medium">{user?.email}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">🔒 Email não pode ser alterado</p>
                      <p>O email é o identificador único da sua conta e não pode ser modificado por segurança.</p>
                      <p className="mt-2">💡 <strong>Precisa trocar?</strong> Entre em contato com o suporte: contato@boscoimoveis.app</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </label>
              {!verificandoTelefone ? (
                <div className="flex items-center gap-2">
                  {user?.phone ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-slate-900 font-medium">
                        {converterParaBrasileiro(user.phone)}
                      </p>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Verificado
                      </Badge>
                    </>
                  ) : (
                    <>
                      <p className="text-amber-600">Telefone não cadastrado</p>
                      <Button
                        size="sm"
                        onClick={() => setVerificandoTelefone(true)}
                        className="ml-2"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Verificar Telefone
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Senha (apenas ao editar) */}
            {editando && (
              <>
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Alterar Senha (Opcional)
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Senha Atual *
                      </label>
                      <Input
                        type="password"
                        value={formData.senhaAtual}
                        onChange={(e) => setFormData({...formData, senhaAtual: e.target.value})}
                        placeholder="Digite sua senha atual"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Obrigatório para atualizar telefone ou senha
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nova Senha
                      </label>
                      <Input
                        type="password"
                        value={formData.novaSenha}
                        onChange={(e) => setFormData({...formData, novaSenha: e.target.value})}
                        placeholder="Deixe em branco para manter a atual"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Botões */}
            {editando && (
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditando(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      telefone: user?.phone ? converterParaBrasileiro(user.phone) : '',
                      senhaAtual: '',
                      novaSenha: '',
                    });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex-1 bg-blue-900 hover:bg-blue-800"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            )}

            {/* Badge Admin */}
            {isAdmin && (
              <div className="border-t pt-6">
                <Badge className="bg-amber-100 text-amber-900 border-amber-300">
                  <Shield className="w-4 h-4 mr-1" />
                  Administrador
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}