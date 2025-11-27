import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { phoneVerification } from '@/services/phoneVerification';
import { 
  formatarTelefoneAoDigitar, 
  validarTelefone, 
  converterParaE164 
} from '@/utils/telefone';

export default function VerificarTelefone({ onVerified, onCancel }) {
  const [etapa, setEtapa] = useState('input'); // input, verify, success
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [tentativasRestantes, setTentativasRestantes] = useState(3);

  useEffect(() => {
    phoneVerification.setupRecaptcha('recaptcha-container');

    return () => {
      phoneVerification.cleanup();
    };
  }, []);

  const handleEnviarCodigo = async () => {
    if (!validarTelefone(telefone)) {
      toast.error('Telefone inválido', {
        description: 'Digite um celular válido com DDD',
      });
      return;
    }

    setEnviando(true);

    try {
      const telefoneE164 = converterParaE164(telefone);
      await phoneVerification.sendVerificationCode(telefoneE164);
      
      toast.success('📱 Código SMS enviado!', {
        description: 'Verifique suas mensagens',
      });
      
      setEtapa('verify');
      setTentativasRestantes(3);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar SMS', {
        description: error.message,
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (!codigo || codigo.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setVerificando(true);

    try {
      await phoneVerification.verifyCode(codigo);
      
      toast.success('✅ Telefone verificado!');
      
      setEtapa('success');
      
      setTimeout(() => {
        const telefoneE164 = converterParaE164(telefone);
        onVerified(telefoneE164);
      }, 1500);
      
    } catch (error) {
      const novasTentativas = tentativasRestantes - 1;
      setTentativasRestantes(novasTentativas);
      
      if (novasTentativas > 0) {
        toast.error('Código incorreto', {
          description: `${novasTentativas} tentativa(s) restante(s)`,
        });
      } else {
        toast.error('Muitas tentativas', {
          description: 'Solicite um novo código',
        });
        setEtapa('input');
        setCodigo('');
      }
    } finally {
      setVerificando(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-900" />
          Verificar Telefone via SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {etapa === 'input' && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Por que verificar?</p>
                  <ul className="space-y-1 text-xs">
                    <li>✓ Garante que o telefone é real</li>
                    <li>✓ Protege contra spam</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Digite seu celular
              </label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefoneAoDigitar(e.target.value))}
                placeholder="(62) 99999-9999"
                maxLength={15}
                disabled={enviando}
              />
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={enviando}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleEnviarCodigo}
                disabled={enviando || !telefone}
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
                    Enviar Código SMS
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {etapa === 'verify' && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 mb-1">
                📱 Código enviado para:
              </p>
              <p className="font-bold text-blue-900 text-lg">{telefone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Código de 6 dígitos
              </label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={verificando}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                {tentativasRestantes} tentativa(s) restante(s)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEtapa('input');
                  setCodigo('');
                }}
                disabled={verificando}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleVerificarCodigo}
                disabled={verificando || codigo.length !== 6}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {verificando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verificar
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="link"
              onClick={handleEnviarCodigo}
              disabled={enviando}
              className="w-full text-sm"
            >
              Não recebeu? Reenviar código
            </Button>
          </>
        )}

        {etapa === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Telefone Verificado! ✅
            </h3>
            <p className="text-slate-600">
              Seu número foi confirmado com sucesso
            </p>
          </div>
        )}

        {/* Container invisível para reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </CardContent>
    </Card>
  );
}