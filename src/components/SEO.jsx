import { useEffect } from 'react';

export default function SEO({ 
  title = 'Bosco Imóveis - Encontre seu imóvel dos sonhos',
  description = 'Encontre as melhores casas, apartamentos e terrenos em Goiânia. Mais de 10 anos realizando sonhos.',
  keywords = 'imóveis, casas, apartamentos, terrenos, Goiânia, venda, aluguel',
  image = 'https://boscoimoveis.app/web-app-manifest-512x512.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website', // ✅ NOVO
  price = null, // ✅ NOVO (para imóveis)
  availability = null, // ✅ NOVO (para imóveis)
}) {
  useEffect(() => {
    // Atualizar título
    document.title = title;

    // Meta tags básicas
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      
      // Open Graph / Facebook
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '512' },
      { property: 'og:image:height', content: '512' },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:site_name', content: 'Bosco Imóveis' },
      
      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: url },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: image },
    ];

    // ✅ NOVO: Open Graph para imóveis
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

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, keywords, image, url, type, price, availability]);

  return null;
}