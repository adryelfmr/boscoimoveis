import React from 'react';
import { appwrite } from '@/api/appwriteClient';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function FavoritoButton({ imovelId, size = "default", variant = "ghost", className = "" }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: favoritos = [] } = useQuery({
    queryKey: ['favoritos', user?.$id],
    queryFn: async () => {
      if (!user?.$id) return [];
      return await appwrite.entities.Favorito.filter({ userId: user.$id });
    },
    enabled: !!user?.$id,
  });

  const isFavorito = favoritos.some(f => f.imovelId === imovelId);

  const toggleFavoritoMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        toast.error('Faça login para favoritar imóveis');
        navigate('/login');
        return;
      }

      if (isFavorito) {
        const favorito = favoritos.find(f => f.imovelId === imovelId);
        await appwrite.entities.Favorito.delete(favorito.$id);
        toast.success('Removido dos favoritos');
      } else {
        
        // Certifique-se de que imovelId não está undefined/null
        if (!imovelId) {
          throw new Error('imovelId é obrigatório');
        }

        await appwrite.entities.Favorito.create({
          imovelId: imovelId,
          userId: user.$id,
          alertaPreco: true
        });
        toast.success('Adicionado aos favoritos! ❤️');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favoritos']);
    },
    onError: (error) => {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar imóvel');
    }
  });

  return (
    <Button
      size={size}
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavoritoMutation.mutate();
      }}
      className={`${isFavorito ? 'text-red-500 hover:text-red-600' : ''} ${className}`}
      disabled={toggleFavoritoMutation.isPending}
    >
      <Heart 
        className={`w-5 h-5 ${isFavorito ? 'fill-current' : ''} transition-transform duration-200 hover:scale-110`}
      />
      {/* ✅ NOVO: Mostrar texto no botão quando está no card de detalhes */}
      {size === "default" && (
        <span className="ml-2 font-semibold">
          {isFavorito ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </Button>
  );
}