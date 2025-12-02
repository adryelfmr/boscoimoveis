import { useEffect } from 'react';

export default function SEO({ 
  title = 'Bosco Imóveis - Encontre seu imóvel dos sonhos',
  description = 'Encontre as melhores casas, apartamentos e terrenos em Goiânia. Mais de 10 anos realizando sonhos.',
  keywords = 'imóveis, casas, apartamentos, terrenos, Goiânia, venda, aluguel',
  image = 'https://boscoimoveis.app/web-app-manifest-512x512.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  price = null,
  availability = null,
}) {
  useEffect(() => {
    // Atualizar título
    document.title = title;

    // ✅ CORRIGIDO: Normalizar URL canônica (sempre sem www, sempre https)
    const canonicalUrl = url
      .replace('https://www.boscoimoveis.app', 'https://boscoimoveis.app')
      .replace('http://www.boscoimoveis.app', 'https://boscoimoveis.app')
      .replace('http://boscoimoveis.app', 'https://boscoimoveis.app');

    // Meta tags básicas
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: 'Bosco Imóveis' }, // ✅ ADICIONAR
      
      // Open Graph / Facebook
      { property: 'og:type', content: type },
      { property: 'og:url', content: canonicalUrl }, // ✅ USAR URL NORMALIZADA
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:secure_url', content: image }, // ✅ ADICIONAR
      { property: 'og:image:width', content: '512' },
      { property: 'og:image:height', content: '512' },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:alt', content: title }, // ✅ ADICIONAR
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:site_name', content: 'Bosco Imóveis' },
      
      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: canonicalUrl }, // ✅ USAR URL NORMALIZADA
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: image },
    ];

    // Open Graph para imóveis
    if (price) {
      metaTags.push({ property: 'og:type', content: 'product' });
      metaTags.push({ property: 'product:price:amount', content: price.toString() });
      metaTags.push({ property: 'product:price:currency', content: 'BRL' });
    }

    if (availability) {
      metaTags.push({ property: 'product:availability', content: availability });
    }

    // Atualizar/criar meta tags
    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let tag = document.querySelector(selector);
      
      if (!tag) {
        tag = document.createElement('meta');
        if (name) tag.setAttribute('name', name);
        if (property) tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    });

    // ✅ Canonical URL (sempre normalizada)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl); // ✅ USAR URL NORMALIZADA

  }, [title, description, keywords, image, url, type, price, availability]);

  return null;
}