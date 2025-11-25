import { appwrite } from '@/api/appwriteClient';

export async function testImageUpload() {
  try {
    // Cria um arquivo de teste
    const blob = await fetch('https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800').then(r => r.blob());
    const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
    
    console.log('Uploading test image...');
    const result = await appwrite.storage.uploadFile(file);
    console.log('Upload successful!', result);
    
    const url = appwrite.storage.getFileUrl(result.$id);
    console.log('Image URL:', url);
    
    return { success: true, fileId: result.$id, url };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: error.message };
  }
}