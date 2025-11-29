import { useEffect } from 'react';

export default function SchemaOrg({ data }) {
  useEffect(() => {
    // Remover schema anterior
    const oldScript = document.querySelector('script[type="application/ld+json"][data-schema="dynamic"]');
    if (oldScript) {
      oldScript.remove();
    }

    // Adicionar novo schema
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'dynamic');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const s = document.querySelector('script[type="application/ld+json"][data-schema="dynamic"]');
      if (s) s.remove();
    };
  }, [data]);

  return null;
}