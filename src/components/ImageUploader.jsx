import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, Star, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ID } from 'appwrite';
import uploadRateLimiter from '@/utils/uploadRateLimit'; // ✅ ADICIONAR
import { useAuth } from '@/contexts/AuthContext'; // ✅ ADICIONAR

// ✅ MUDANÇA: maxImages padrão 10 → 20
export default function ImageUploader({ images = [], onImagesChange, maxImages = 20 }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const { user } = useAuth(); // ✅ ADICIONAR

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // ✅ NOVO: Verificar rate limit
    if (user) {
      const limitCheck = uploadRateLimiter.checkLimit(user.$id, 50); // 50 uploads/hora
      
      if (!limitCheck.allowed) {
        toast.error('Limite de uploads atingido', {
          description: limitCheck.message,
          duration: 10000,
        });
        return;
      }

      if (limitCheck.remaining <= 5) {
        toast.warning(`Atenção: Você tem apenas ${limitCheck.remaining} uploads restantes nesta hora.`);
      }
    }
    
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    setUploading(true);
    const newImages = [...images];

    for (const file of files) {
      // ✅ VALIDAÇÃO 1: Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }

      // ✅ VALIDAÇÃO 2: Verificar extensão (segurança extra)
      const extensoesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const extensao = file.name.split('.').pop().toLowerCase();
      
      if (!extensoesPermitidas.includes(extensao)) {
        toast.error(`${file.name} tem extensão não permitida. Use: JPG, PNG, WebP, GIF`);
        continue;
      }

      // ✅ VALIDAÇÃO 3: Tamanho máximo 10MB (aumentado de 5MB)
      const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
      if (file.size > tamanhoMaximo) {
        toast.error(`${file.name} é muito grande (máx 10MB)`);
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // Upload para Appwrite Storage
        const result = await appwrite.storage.createFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          ID.unique(),
          file
        );
        
        const url = appwrite.storage.getFileView(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          result.$id
        );
        
        newImages.push({
          url: url.href || url.toString(),
          fileId: result.$id,
          name: file.name
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        toast.success(`${file.name} enviado com sucesso!`);
      } catch (error) {
        if (error.code === 413) {
          toast.error(`${file.name} excede o tamanho máximo (10MB)`);
        } else if (error.code === 400) {
          toast.error(`${file.name} tem formato inválido`);
        } else if (error.message?.includes('storage')) {
          toast.error('Storage cheio. Contate o administrador.');
        } else {
          toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        }
      }
    }

    onImagesChange(newImages);
    setUploading(false);
    setUploadProgress({});
  };

  const removeImage = async (index) => {
    const imageToRemove = images[index];
    
    try {
      if (imageToRemove.fileId) {
        await appwrite.storage.deleteFile(
          import.meta.env.VITE_APPWRITE_BUCKET_ID,
          imageToRemove.fileId
        );
      }
      
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      toast.success('Imagem removida');
    } catch (error) {
      toast.error('Erro ao remover imagem');
    }
  };

  const setAsPrincipal = (index) => {
    const newImages = [...images];
    const [principal] = newImages.splice(index, 1);
    newImages.unshift(principal);
    onImagesChange(newImages);
    toast.success('Imagem principal atualizada');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Imagens ({images.length}/{maxImages})
        </label>
        <div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" // ✅ ESPECÍFICO
            onChange={handleFileSelect}
            disabled={uploading || images.length >= maxImages}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading || images.length >= maxImages}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('image-upload').click();
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Imagens
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {/* ✅ NOVO: Aviso de Limite */}
      {images.length >= maxImages && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Limite atingido</p>
            <p className="text-xs text-amber-700 mt-1">
              Você atingiu o limite de {maxImages} imagens. Remova algumas para adicionar novas.
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 truncate">{fileName}</span>
                <span className="text-slate-500">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <Card key={index} className="group relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {index === 0 ? (
                    <div className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Principal
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetPrincipal(index)}
                      className="text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Tornar Principal
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remover
                  </Button>
                </div>

                {/* Badge de posição */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-300">
          <div className="p-8 text-center">
            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-1 font-medium">Nenhuma imagem adicionada</p>
            <p className="text-sm text-slate-500">
              Clique em "Adicionar Imagens" para fazer upload
            </p>
          </div>
        </Card>
      )}

      <p className="text-xs text-slate-500">
        📸 Formatos: JPG, PNG, WebP, GIF | 📏 Máx: 10MB por imagem | ⭐ A primeira imagem será a principal
      </p>
    </div>
  );
}