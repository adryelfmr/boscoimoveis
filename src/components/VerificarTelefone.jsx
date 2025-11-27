import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { phoneVerification } from '@/services/phoneVerification';
import { 
  formatarTelefoneAoDigitar, 
  validarTelefone, 
  converterParaE164 
} from '@/utils/telefone';

export default function VerificarTelefone({ onVerified }) {
  const [etapa, setEtapa] = useState('input'); // input, waiting, verify
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    // Inicializar reCAPTCHA
    phoneVerification.setupRecaptcha('recaptcha-container');
  }, []);

  const handleEnviarCodigo = async () => {
    if (!validarTelefone(telefone)) {
      toast.error('Telefone inválido');
      return;
    }

    setEnviando(true);

    try {
      const telefoneE164 = converterParaE164(telefone);
      await phoneVerification.sendVerificationCode(telefoneE164);
      
      toast.success('Código SMS enviado!');
      setEtapa('verify');
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast.error('Erro ao enviar SMS. Tente novamente.');
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
      const result = await phoneVerification.verifyCode(codigo);
      
      toast.success('Telefone verificado com sucesso! ✅');
      onVerified(result.phoneNumber);
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      toast.error('Código inválido. Tente novamente.');
    } finally {
      setVerificando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Verificar Telefone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {etapa === 'input' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Digite seu telefone
              </label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefoneAoDigitar(e.target.value))}
                placeholder="(62) 99999-9999"
                maxLength={15}
              />
            </div>

            <Button
              onClick={handleEnviarCodigo}
              disabled={enviando || !telefone}
              className="w-full"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando SMS...
                </>
              ) : (
                'Enviar Código via SMS'
              )}
            </Button>
          </>
        )}

        {etapa === 'verify' && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                📱 Enviamos um código de 6 dígitos para:
              </p>
              <p className="font-bold text-blue-900">{telefone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Digite o código recebido
              </label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerificarCodigo}
              disabled={verificando || codigo.length !== 6}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {verificando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verificar Código
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setEtapa('input')}
              className="w-full"
            >
              Alterar Número
            </Button>
          </>
        )}

        {/* Container invisível para reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </CardContent>
    </Card>
  );
}