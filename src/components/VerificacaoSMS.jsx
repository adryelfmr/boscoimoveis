import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { converterParaE164 } from '@/utils/telefone';

export default function VerificacaoSMS({ telefone, onVerificado, onCancelar }) {
  const [etapa, setEtapa] = useState('enviar');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.warn('Erro ao limpar reCAPTCHA:', error);
        }
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (error) {
        console.warn('Erro ao limpar reCAPTCHA anterior');
      }
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('✅ reCAPTCHA resolvido automaticamente');
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA expirado');
        toast.error('Verificação expirou. Tente novamente.');
      },
      'error-callback': (error) => {
        console.error('❌ Erro no reCAPTCHA:', error);
        toast.error('Erro na verificação de segurança');
      }
    });
  };

  const enviarCodigo = async () => {
    setEnviando(true);

    try {
      console.log('📱 Iniciando envio SMS para:', telefone);
      
      setupRecaptcha();
      const telefoneE164 = converterParaE164(telefone);
      
      console.log('📞 Telefone E.164:', telefoneE164);

      await window.recaptchaVerifier.render();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, telefoneE164, appVerifier);
      
      console.log('✅ SMS enviado com sucesso!');
      setConfirmationResult(confirmation);
      setEtapa('verificar');
      
      toast.success('📱 Código SMS enviado!', {
        description: 'Verifique suas mensagens de texto.',
      });
    } catch (error) {
      console.error('❌ Erro completo:', error);
      
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (clearError) {
          console.warn('Erro ao limpar reCAPTCHA:', clearError);
        }
      }
      
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('❌ Número inválido', {
          description: 'Formato: (62) 99999-9999',
        });
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('⚠️ Muitas tentativas', {
          description: 'Aguarde alguns minutos.',
        });
      } else if (error.code === 'auth/invalid-app-credential') {
        toast.error('🔧 Erro de configuração', {
          description: 'Verifique se os domínios estão autorizados no Firebase.',
        });
      } else {
        toast.error('❌ Erro ao enviar SMS', {
          description: error.message || 'Tente novamente.',
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  const verificarCodigo = async () => {
    if (codigo.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setVerificando(true);

    try {
      await confirmationResult.confirm(codigo);
      
      setEtapa('sucesso');
      toast.success('✅ Telefone verificado com sucesso!');
      
      const telefoneE164 = converterParaE164(telefone);
      onVerificado(telefoneE164);
      
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        toast.error('❌ Código inválido');
      } else if (error.code === 'auth/code-expired') {
        toast.error('⏰ Código expirado');
        setEtapa('enviar');
      } else {
        toast.error('Erro ao verificar código');
      }
    } finally {
      setVerificando(false);
    }
  };

  // ✅ CORRIGIDO: Reenviar código
  const reenviarCodigo = async () => {
    try {
      setCodigo('');
      setEnviando(true);

      // Limpar reCAPTCHA anterior
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.warn('Erro ao limpar reCAPTCHA');
        }
      }

      // Reconfigurar e reenviar
      setupRecaptcha();
      const telefoneE164 = converterParaE164(telefone);

      await window.recaptchaVerifier.render();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, telefoneE164, appVerifier);

      setConfirmationResult(confirmation);
      
      toast.success('📱 Novo código enviado!', {
        description: 'Verifique suas mensagens de texto.',
      });
    } catch (error) {
      console.error('❌ Erro ao reenviar código:', error);

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (clearError) {
          console.warn('Erro ao limpar reCAPTCHA');
        }
      }

      if (error.code === 'auth/too-many-requests') {
        toast.error('⚠️ Muitas tentativas', {
          description: 'Aguarde alguns minutos antes de tentar novamente.',
        });
      } else {
        toast.error('❌ Erro ao reenviar código', {
          description: 'Tente novamente.',
        });
      }

      // Voltar para tela inicial se falhar
      setEtapa('enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Verificação por SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {etapa === 'enviar' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                📱 Vamos enviar um código de verificação via SMS para:
              </p>
              <p className="font-bold text-blue-900 mt-2">{telefone}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-xs text-green-800">
                  🔒 Verificação de segurança automática. Clique em "Enviar Código" para continuar.
                </p>
              </div>
            </div>

            <div id="recaptcha-container"></div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancelar}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={enviarCodigo}
                disabled={enviando}
                className="flex-1 bg-blue-900 hover:bg-blue-800"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Enviar Código
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {etapa === 'verificar' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Código de Verificação
              </label>
              <Input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Digite o código de 6 dígitos enviado para {telefone}
              </p>
            </div>

            {/* ✅ Container invisível para reenvio */}
            <div id="recaptcha-container"></div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={reenviarCodigo}
                disabled={enviando}
                className="flex-1"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  'Reenviar Código'
                )}
              </Button>
              <Button
                onClick={verificarCodigo}
                disabled={verificando || codigo.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {verificando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
          </>
        )}

        {etapa === 'sucesso' && (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              ✅ Telefone Verificado!
            </h3>
            <p className="text-slate-600">
              Seu telefone foi verificado com sucesso.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}