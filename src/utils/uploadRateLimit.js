/**
 * Rate Limiting para uploads de imagens
 */

class UploadRateLimiter {
  constructor() {
    this.uploads = new Map(); // userId → array de timestamps
  }

  /**
   * Verifica se usuário pode fazer upload
   * @param {string} userId - ID do usuário
   * @param {number} maxUploadsPerHour - Máximo de uploads por hora
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: Date }
   */
  checkLimit(userId, maxUploadsPerHour = 50) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000; // 1 hora em ms

    // Obter uploads do usuário
    let userUploads = this.uploads.get(userId) || [];

    // Filtrar apenas uploads da última hora
    userUploads = userUploads.filter(timestamp => now - timestamp < oneHour);

    // Verificar limite
    if (userUploads.length >= maxUploadsPerHour) {
      const oldestUpload = Math.min(...userUploads);
      const resetTime = new Date(oldestUpload + oneHour);

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        message: `Você atingiu o limite de ${maxUploadsPerHour} uploads por hora. Aguarde até ${resetTime.toLocaleTimeString('pt-BR')}.`
      };
    }

    // Registrar upload
    userUploads.push(now);
    this.uploads.set(userId, userUploads);

    return {
      allowed: true,
      remaining: maxUploadsPerHour - userUploads.length,
      resetTime: new Date(now + oneHour),
    };
  }

  /**
   * Limpa uploads antigos
   */
  cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [userId, uploads] of this.uploads.entries()) {
      const recentUploads = uploads.filter(timestamp => now - timestamp < oneHour);
      
      if (recentUploads.length === 0) {
        this.uploads.delete(userId);
      } else {
        this.uploads.set(userId, recentUploads);
      }
    }
  }
}

const uploadRateLimiter = new UploadRateLimiter();

// Limpeza automática a cada 10 minutos
setInterval(() => {
  uploadRateLimiter.cleanup();
}, 10 * 60 * 1000);

export default uploadRateLimiter;