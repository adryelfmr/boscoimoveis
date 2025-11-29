// Script para limpar cache do navegador
(function() {
  const APP_VERSION = '2.0.0';
  const STORED_VERSION = localStorage.getItem('app_version');
  
  if (STORED_VERSION !== APP_VERSION) {
    
    
    // Limpar localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith('cache_'))
      .forEach(key => localStorage.removeItem(key));
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Limpar cache do browser
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Salvar nova versão
    localStorage.setItem('app_version', APP_VERSION);
  
  }
})();