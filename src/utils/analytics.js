/**
 * Google Analytics 4 - Tracking Utils
 * Rastreia eventos e conversões do site
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Inicializar Google Analytics
 */
export function initGA() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  // Carregar script do GA4
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Inicializar dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });

}

/**
 * Rastrear visualização de página
 */
export function trackPageView(url) {
  if (!window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

/**
 * Rastrear eventos customizados
 */
export function trackEvent(eventName, params = {}) {
  if (!window.gtag) return;
  
  window.gtag('event', eventName, params);
  
}

/**
 * Eventos específicos do site
 */
export const analytics = {
  // Visualização de imóvel
  viewImovel: (imovelId, titulo, preco) => {
    trackEvent('view_imovel', {
      imovel_id: imovelId,
      imovel_titulo: titulo,
      imovel_preco: preco,
      currency: 'BRL',
    });
  },

  // Contato via WhatsApp
  clickWhatsApp: (origem = 'geral') => {
    trackEvent('contact_whatsapp', {
      contact_method: 'whatsapp',
      origem: origem,
    });
  },

  // Envio de formulário de contato
  submitContact: (nome, email) => {
    trackEvent('contact_form_submit', {
      contact_method: 'form',
      user_name: nome,
      user_email: email,
    });
  },

  // Adicionar aos favoritos
  addFavorito: (imovelId) => {
    trackEvent('add_to_favorites', {
      imovel_id: imovelId,
    });
  },

  // Remover dos favoritos
  removeFavorito: (imovelId) => {
    trackEvent('remove_from_favorites', {
      imovel_id: imovelId,
    });
  },

  // Compartilhamento
  shareImovel: (imovelId, method) => {
    trackEvent('share', {
      content_type: 'imovel',
      item_id: imovelId,
      method: method, // 'whatsapp', 'facebook', 'copy_link'
    });
  },

  // Filtro usado no catálogo
  filterCatalogo: (filters) => {
    trackEvent('filter_catalog', {
      tipo_imovel: filters.tipoImovel || 'todos',
      cidade: filters.cidade || 'todas',
      preco_min: filters.precoMin || 0,
      preco_max: filters.precoMax || 0,
    });
  },

  // Busca
  search: (query) => {
    trackEvent('search', {
      search_term: query,
    });
  },

  // Visualização de calculadora de financiamento
  useCalculadora: (valorImovel) => {
    trackEvent('use_calculator', {
      property_value: valorImovel,
      tool: 'financing_calculator',
    });
  },

  // Comparação de imóveis
  compareImoveis: (imovelIds) => {
    trackEvent('compare_properties', {
      item_count: imovelIds.length,
      items: imovelIds,
    });
  },

  // Download de PDF
  downloadPDF: (imovelId) => {
    trackEvent('download_pdf', {
      content_type: 'property_details',
      imovel_id: imovelId,
    });
  },

  // Login/Cadastro
  signup: (method) => {
    trackEvent('sign_up', {
      method: method, // 'email', 'google'
    });
  },

  login: (method) => {
    trackEvent('login', {
      method: method,
    });
  },

  // Conversão (Lead qualificado)
  conversion: (type, value = 0) => {
    trackEvent('conversion', {
      transaction_id: Date.now().toString(),
      value: value,
      currency: 'BRL',
      conversion_type: type, // 'contact', 'visit_schedule', 'proposal'
    });
  },

  // ✅ NOVO: Rastrear conversões importantes
  trackConversion(type, value) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL', // ⚠️ Adicionar seu ID do Google Ads
        'value': value,
        'currency': 'BRL',
        'transaction_id': `${Date.now()}_${Math.random()}`
      });
    }
  },

  // ✅ Rastrear leads (quando alguém clicar em WhatsApp)
  trackLead(imovelId, tipo) {
    this.trackConversion('lead', 0);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        'currency': 'BRL',
        'value': 0,
        'event_category': 'engagement',
        'event_label': `${tipo}_${imovelId}`
      });
    }
  }
};