import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Breadcrumbs({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://boscoimoveis.app${item.url}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6">
        <Link to="/" className="flex items-center gap-1 hover:text-blue-900">
          <Home className="w-4 h-4" />
          Início
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            {index === items.length - 1 ? (
              <span className="text-slate-900 font-medium">{item.name}</span>
            ) : (
              <Link to={item.url} className="hover:text-blue-900">
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
}