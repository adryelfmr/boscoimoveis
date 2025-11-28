import { auth } from '@/lib/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from 'firebase/auth';

class PhoneVerificationService {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  /**
   * Inicializar reCAPTCHA invisível
   */
  setupRecaptcha(containerId = 'recaptcha-container') {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }

    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        
      },
      'expired-callback': () => {
        console.warn('⚠️ reCAPTCHA expirado');
      }
    });
  }

  /**
   * Enviar código SMS
   * @param {string} phoneNumber - Formato E.164 (+5562999999999)
   */
  async sendVerificationCode(phoneNumber) {
    try {
      if (!this.recaptchaVerifier) {
        throw new Error('reCAPTCHA não inicializado');
      }

      

      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        this.recaptchaVerifier
      );

      

      return { 
        success: true,
        message: 'Código SMS enviado!' 
      };
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      
      let errorMessage = 'Erro ao enviar SMS';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Número de telefone inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'Limite de SMS atingido hoje.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Verificar código SMS
   * @param {string} code - Código de 6 dígitos
   */
  async verifyCode(code) {
    try {
      if (!this.confirmationResult) {
        throw new Error('Nenhuma verificação pendente');
      }

      

      const result = await this.confirmationResult.confirm(code);
      
      

      return { 
        success: true, 
        phoneNumber: result.user.phoneNumber,
        uid: result.user.uid
      };
    } catch (error) {
      console.error('❌ Erro ao verificar código:', error);
      
      let errorMessage = 'Código inválido';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Código incorreto. Tente novamente.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Código expirado. Solicite um novo.';
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Limpar reCAPTCHA
   */
  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

export const phoneVerification = new PhoneVerificationService();