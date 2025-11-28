import { useEffect } from 'react';

export default function SEO({ 
  title = 'Bosco Imóveis - Encontre seu imóvel dos sonhos',
  description = 'Encontre as melhores casas, apartamentos e terrenos em Goiânia. Mais de 10 anos realizando sonhos.',
  keywords = 'imóveis, casas, apartamentos, terrenos, Goiânia, venda, aluguel',
  image = 'https://boscoimoveis.app/og-image.png', // ✅ MUDOU: URL absoluta com PNG
  url = typeof window !== 'undefined' ? window.location.href : ''
}) {
  useEffect(() => {
    // Atualizar título
    document.title = title;

    // Atualizar meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      
      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' }, // ✅ NOVO
      { property: 'og:image:height', content: '630' }, // ✅ NOVO
      { property: 'og:image:type', content: 'image/png' }, // ✅ NOVO
      
      // Twitter
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:url', content: url },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: image },
    ];

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

    // Atualizar canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, keywords, image, url]);

  return null;
}