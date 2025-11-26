import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ComparadorButton({ imovelId, size = "default" }) {
  const [comparando, setComparando] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('comparacao');
    if (saved) {
      setComparando(JSON.parse(saved));
    }
  }, []);

  const toggleComparacao = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let novosIds = [...comparando];
    
    if (novosIds.includes(imovelId)) {
      novosIds = novosIds.filter(id => id !== imovelId);
      toast.success('Removido da comparação');
    } else {
      if (novosIds.length >= 4) {
        toast.error('Você pode comparar até 4 imóveis');
        return;
      }
      novosIds.push(imovelId);
      toast.success(`Adicionado à comparação (${novosIds.length}/4)`);
    }

    setComparando(novosIds);
    localStorage.setItem('comparacao', JSON.stringify(novosIds));
  };

  const isComparando = comparando.includes(imovelId);

  return (
    <Button
      size={size}
      variant={isComparando ? "default" : "ghost"}
      onClick={toggleComparacao}
      className={`${isComparando ? 'bg-blue-900 hover:bg-blue-800' : ''} w-full`}
    >
      <Scale className="w-5 h-5" />
    </Button>
  );
}