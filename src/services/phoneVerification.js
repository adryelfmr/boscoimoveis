

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export class PhoneVerification {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  // Inicializar reCAPTCHA
  setupRecaptcha(elementId) {
    this.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA resolvido');
      }
    });
  }

  // Enviar código SMS
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

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      throw error;
    }
  }

  // Verificar código
  async verifyCode(code) {
    try {
      if (!this.confirmationResult) {
        throw new Error('Nenhuma verificação pendente');
      }

      const result = await this.confirmationResult.confirm(code);
      return { 
        success: true, 
        phoneNumber: result.user.phoneNumber 
      };
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      throw error;
    }
  }
}

export const phoneVerification = new PhoneVerification();