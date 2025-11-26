import React, { useState } from 'react';
import { appwrite } from '@/api/appwriteClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ID } from 'appwrite';

export default function ImageUploader({ images = [], onImagesChange, maxImages = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }

    setUploading(true);
    const newImages = [...images];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máx 5MB)`);
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        // ✅ Upload correto para Appwrite Storage
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
        console.error('Erro ao fazer upload:', error);
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
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
      console.error('Erro ao remover imagem:', error);
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
            accept="image/*"
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

      {/* Grid de Imagens */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square bg-slate-100">
                <img
                  src={image.url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400?text=Erro';
                  }}
                />
              </div>

              {/* Badge de Principal */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-900 text-white px-2 py-1 rounded text-xs font-semibold">
                  Principal
                </div>
              )}

              {/* Ações */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setAsPrincipal(index)}
                    className="text-xs"
                  >
                    Definir como Principal
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-300">
          <div className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">Nenhuma imagem adicionada</p>
            <p className="text-sm text-slate-500">
              Clique em "Adicionar Imagens" para fazer upload
            </p>
          </div>
        </Card>
      )}

      <p className="text-xs text-slate-500">
        Formatos aceitos: JPG, PNG, WebP (máx 5MB por imagem). A primeira imagem será usada como principal.
      </p>
    </div>
  );
}