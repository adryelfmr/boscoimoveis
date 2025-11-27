/**
 * Sistema de Rate Limiting para prevenir spam
 * Controla quantas vezes um usuário pode fazer uma ação em determinado período
 */

/**
 * Classe para gerenciar rate limiting por IP/usuário
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map(); // Armazena tentativas
    this.blockedUntil = new Map(); // Armazena bloqueios temporários
  }

  /**
   * Verifica se a ação pode ser executada
   * @param {string} key - Identificador único (email, IP, userId)
   * @param {number} maxAttempts - Máximo de tentativas permitidas
   * @param {number} windowMs - Janela de tempo em milissegundos
   * @returns {Object} { allowed: boolean, remainingAttempts: number, resetTime: Date }
   */
  checkLimit(key, maxAttempts = 3, windowMs = 60000) {
    const now = Date.now();
    
    // 1. Verificar se está bloqueado temporariamente
    const blockedTime = this.blockedUntil.get(key);
    if (blockedTime && now < blockedTime) {
      const waitTime = Math.ceil((blockedTime - now) / 1000);
      return {
        allowed: false,
        reason: 'blocked',
        remainingAttempts: 0,
        resetTime: new Date(blockedTime),
        waitSeconds: waitTime,
      };
    }

    // 2. Limpar bloqueio expirado
    if (blockedTime && now >= blockedTime) {
      this.blockedUntil.delete(key);
      this.attempts.delete(key);
    }

    // 3. Obter tentativas anteriores
    let userAttempts = this.attempts.get(key) || [];
    
    // 4. Filtrar apenas tentativas dentro da janela de tempo
    userAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    
    // 5. Verificar se excedeu o limite
    if (userAttempts.length >= maxAttempts) {
      // Bloquear por 5 minutos
      const blockTime = now + (5 * 60 * 1000);
      this.blockedUntil.set(key, blockTime);
      
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        remainingAttempts: 0,
        resetTime: new Date(blockTime),
        waitSeconds: 300, // 5 minutos
      };
    }

    // 6. Permitir ação e registrar tentativa
    userAttempts.push(now);
    this.attempts.set(key, userAttempts);
    
    const resetTime = new Date(now + windowMs);
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - userAttempts.length,
      resetTime,
      waitSeconds: 0,
    };
  }

  /**
   * Limpa o rate limit de uma chave específica
   */
  reset(key) {
    this.attempts.delete(key);
    this.blockedUntil.delete(key);
  }

  /**
   * Limpa rate limits expirados (limpeza automática)
   */
  cleanup() {
    const now = Date.now();
    
    // Limpar bloqueios expirados
    for (const [key, blockedTime] of this.blockedUntil.entries()) {
      if (now >= blockedTime) {
        this.blockedUntil.delete(key);
        this.attempts.delete(key);
      }
    }
  }
}

// Singleton global
const globalRateLimiter = new RateLimiter();

// Limpeza automática a cada 5 minutos
setInterval(() => {
  globalRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Hook para usar rate limiter em componentes React
 */
export function useRateLimit() {
  return {
    checkLimit: (key, maxAttempts, windowMs) => 
      globalRateLimiter.checkLimit(key, maxAttempts, windowMs),
    reset: (key) => globalRateLimiter.reset(key),
  };
}

/**
 * Funções auxiliares para casos específicos
 */
export const rateLimits = {
  // Formulário de contato: 3 envios por minuto
  contact: (email) => globalRateLimiter.checkLimit(
    `contact:${email}`,
    3,    // Máximo 3 tentativas
    60000 // Por 1 minuto
  ),

  // Login: 5 tentativas por 5 minutos
  login: (email) => globalRateLimiter.checkLimit(
    `login:${email}`,
    5,      // Máximo 5 tentativas
    300000  // Por 5 minutos
  ),

  // Registro: 3 registros por 10 minutos (mesmo IP)
  register: (ip) => globalRateLimiter.checkLimit(
    `register:${ip}`,
    3,      // Máximo 3 tentativas
    600000  // Por 10 minutos
  ),

  // Redefinir senha: 3 tentativas por hora
  resetPassword: (email) => globalRateLimiter.checkLimit(
    `reset:${email}`,
    3,       // Máximo 3 tentativas
    3600000  // Por 1 hora
  ),
};

export default globalRateLimiter;