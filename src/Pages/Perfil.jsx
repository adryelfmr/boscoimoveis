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
import VerificacaoSMS from '@/components/VerificacaoSMS';

export default function Perfil() {
  const { user, checkUser, isAdmin } = useAuth();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [verificandoTelefone, setVerificandoTelefone] = useState(false);
  const [senhaParaTelefone, setSenhaParaTelefone] = useState('');
  
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
      if (formData.name !== user?.name) {
        await account.updateName(formData.name);
      }

      if (formData.novaSenha) {
        if (!formData.senhaAtual) {
          toast.error('Digite sua senha atual para alterar a senha');
          setSalvando(false);
          return;
        }
        
        await account.updatePassword(formData.novaSenha, formData.senhaAtual);
        toast.success('Senha alterada com sucesso!');
      }

      if (formData.name !== user?.name) {
        toast.success('Nome atualizado com sucesso!');
      }

      await checkUser();
      setEditando(false);
      setFormData({
        ...formData,
        senhaAtual: '',
        novaSenha: '',
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error.message?.includes('Invalid `password`')) {
        toast.error('Senha atual incorreta');
      } else {
        toast.error(error.message || 'Erro ao atualizar perfil');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleAbrirVerificacaoSMS = async () => {
    if (!senhaParaTelefone) {
      toast.error('Digite sua senha para verificar o telefone');
      return;
    }

    // ✅ Apenas abrir o modal de verificação
    setVerificandoTelefone(true);
  };

  const handleTelefoneVerificado = async (telefoneE164) => {
    try {
      console.log('🔄 Salvando telefone no Appwrite:', telefoneE164);
      
      // ✅ O Appwrite valida automaticamente se o telefone já existe
      await account.updatePhone(telefoneE164, senhaParaTelefone);
      
      console.log('✅ Telefone salvo com sucesso no Appwrite');
      
      toast.success('✅ Telefone verificado e salvo!', {
        description: 'Seu número foi cadastrado com sucesso.',
      });
      
      await checkUser();
      setVerificandoTelefone(false);
      setEditando(false);
      setSenhaParaTelefone('');
      
      setFormData({
        ...formData,
        telefone: converterParaBrasileiro(telefoneE164),
        senhaAtual: '',
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar telefone:', error);
      
      // ✅ Tratar erro 409 (telefone duplicado)
      if (error.code === 409 || error.message?.includes('already exists')) {
        toast.error('📱 Este telefone já está cadastrado', {
          description: 'Este número já está vinculado a outra conta.',
          duration: 5000,
        });
      } else if (error.message?.includes('password') || error.message?.includes('Invalid')) {
        toast.error('❌ Senha incorreta', {
          description: 'Verifique sua senha e tente novamente.',
        });
      } else if (error.message?.includes('same ID')) {
        // ✅ NOVO: Tratar "target with the same ID already exists"
        toast.error('📱 Telefone já está cadastrado na sua conta', {
          description: 'Este número já está associado ao seu perfil.',
        });
        
        // ✅ Atualizar o estado para refletir o telefone atual
        await checkUser();
        setFormData({
          ...formData,
          telefone: user?.phone ? converterParaBrasileiro(user.phone) : '',
        });
      } else {
        toast.error('Erro ao salvar telefone', {
          description: 'Tente novamente mais tarde.',
        });
      }
      
      // ✅ Fechar modal em caso de erro
      setVerificandoTelefone(false);
      setSenhaParaTelefone('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-blue-900" />
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informações Pessoais</span>
              {!editando && (
                <Button 
                  variant="outline" 
                  onClick={() => setEditando(true)}
                >
                  Editar Perfil
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome
              </label>
              {editando ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Seu nome completo"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user?.name}</p>
              )}
            </div>

            {/* Email */}
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
                      <p className="mt-2">💡 <strong>Precisa trocar?</strong> Entre em contato: contato@boscoimoveis.app</p>
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
              {editando ? (
                <div className="space-y-3">
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    name="user-phone"
                    value={formData.telefone}
                    onChange={(e) => {
                      const telefoneFormatado = formatarTelefoneAoDigitar(e.target.value);
                      setFormData({...formData, telefone: telefoneFormatado});
                    }}
                    placeholder="(62) 99999-9999"
                    maxLength={15}
                  />
                  <p className="text-xs text-slate-500">
                    📱 Formato: (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
                  </p>
                  {!validarTelefone(formData.telefone) && formData.telefone.length > 0 && (
                    <p className="text-xs text-red-600">
                      ⚠️ Telefone inválido
                    </p>
                  )}
                  
                  {validarTelefone(formData.telefone) && formData.telefone !== (user?.phone ? converterParaBrasileiro(user.phone) : '') && (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-800">
                            <p className="font-semibold mb-1">🔒 Confirmação de Segurança</p>
                            <p>Para adicionar/alterar seu telefone, confirme sua senha antes de receber o SMS.</p>
                          </div>
                        </div>
                        
                        <Input
                          type="password"
                          autoComplete="current-password"
                          name="verify-password"
                          value={senhaParaTelefone}
                          onChange={(e) => setSenhaParaTelefone(e.target.value)}
                          placeholder="Digite sua senha"
                          className="bg-white"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleAbrirVerificacaoSMS}
                        disabled={!senhaParaTelefone}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Verificar via SMS
                      </Button>
                      
                      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                        📱 <strong>Passo 1:</strong> Digite sua senha acima<br/>
                        📱 <strong>Passo 2:</strong> Clique em "Verificar via SMS"<br/>
                        📱 <strong>Passo 3:</strong> Digite o código recebido por SMS
                      </p>
                    </>
                  )}
                </div>
              ) : (
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
                    <p className="text-amber-600">Telefone não cadastrado</p>
                  )}
                </div>
              )}
            </div>

            {/* Senha */}
            {editando && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Alterar Senha (Opcional)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Senha Atual</label>
                      <Input
                        type="password"
                        value={formData.senhaAtual}
                        onChange={(e) => setFormData({...formData, senhaAtual: e.target.value})}
                        placeholder="Digite sua senha atual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nova Senha</label>
                      <Input
                        type="password"
                        value={formData.novaSenha}
                        onChange={(e) => setFormData({...formData, novaSenha: e.target.value})}
                        placeholder="Deixe em branco para manter a atual"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Mínimo 8 caracteres
                      </p>
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
                    setSenhaParaTelefone('');
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

        {/* Modal de Verificação SMS */}
        {verificandoTelefone && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-md w-full">
              <VerificacaoSMS
                telefone={formData.telefone}
                onVerificado={handleTelefoneVerificado}
                onCancelar={() => {
                  setVerificandoTelefone(false);
                  setSenhaParaTelefone('');
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}