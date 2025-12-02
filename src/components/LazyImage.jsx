import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export default function LazyImage({ 
  src, 
  alt, 
  className = ''
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    let observer;
    
    if (imgRef.current && src) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = new Image();
              img.src = src;
              
              img.onload = () => {
                setImageSrc(src);
                setImageLoaded(true);
                setImageError(false);
              };
              
              img.onerror = () => {
                setImageError(true);
                setImageLoaded(false);
                setImageSrc('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80');
              };
              
              observer.unobserve(imgRef.current);
            }
          });
        },
        { threshold: 0.01 }
      );
      
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {/* Loading State */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      )}
      
      {/* Error State */}
      {imageError && !imageSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center p-4">
            <svg className="w-12 h-12 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-slate-500">Imagem não disponível</p>
          </div>
        </div>
      )}
      
      {/* Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading="lazy"
        />
      )}
    </div>
  );
}