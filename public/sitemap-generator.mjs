import { Client, Databases, Query } from 'appwrite';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

// Configurar Appwrite
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_IMOVEIS = process.env.VITE_APPWRITE_COLLECTION_IMOVEIS;

async function gerarSitemap() {
  try {
    const baseUrl = 'https://boscoimoveis.app';
    const hoje = new Date().toISOString().split('T')[0];
    
    
    // Páginas estáticas
    const paginasEstaticas = [
      { url: '/', prioridade: '1.0', frequencia: 'daily' }, // ✅ MUDEI: weekly → daily
      { url: '/catalogo', prioridade: '0.9', frequencia: 'daily' }, // ✅ MUDEI
      { url: '/promocoes', prioridade: '0.8', frequencia: 'daily' }, // ✅ MUDEI
      { url: '/sobre', prioridade: '0.7', frequencia: 'monthly' },
      { url: '/contato', prioridade: '0.7', frequencia: 'monthly' },
      { url: '/favoritos', prioridade: '0.6', frequencia: 'monthly' },
      { url: '/comparar', prioridade: '0.6', frequencia: 'monthly' },
      { url: '/login', prioridade: '0.5', frequencia: 'yearly' },
      { url: '/registro', prioridade: '0.5', frequencia: 'yearly' },
    ];
    
    // Buscar todos os imóveis disponíveis
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IMOVEIS,
      [
        Query.equal('disponibilidade', 'disponivel'),
        Query.orderDesc('$createdAt'),
        Query.limit(1000)
      ]
    );
    
    const imoveis = response.documents;
    
    
    // Gerar XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;
    
    // Adicionar páginas estáticas
    paginasEstaticas.forEach(pagina => {
      xml += `
  <url>
    <loc>${baseUrl}${pagina.url}</loc>
    <lastmod>${hoje}</lastmod>
    <changefreq>${pagina.frequencia}</changefreq>
    <priority>${pagina.prioridade}</priority>
  </url>`;
    });
    
    // Adicionar imóveis
    imoveis.forEach(imovel => {
      const lastmod = imovel.$updatedAt ? imovel.$updatedAt.split('T')[0] : hoje;
      
      xml += `
  <url>
    <loc>${baseUrl}/detalhes?id=${imovel.$id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq> 
    <priority>0.8</priority>`;
      
      // ✅ ADICIONAR: Imagens TODAS (não só principal)
      if (imovel.imagens) {
        const todasImagens = imovel.imagens.split(',').map(url => url.trim());
        todasImagens.forEach((imagemUrl, index) => {
          xml += `
    <image:image>
      <image:loc>${imagemUrl}</image:loc>
      <image:title>${escapeXml(imovel.titulo)} - Foto ${index + 1}</image:title>
      <image:caption>${escapeXml(imovel.descricao || imovel.titulo)}</image:caption>
    </image:image>`;
        });
      }
      
      xml += `
  </url>`;
    });
    
    xml += `
</urlset>`;
    
    
    
    
  } catch (error) {
    process.exit(1);
  }
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

gerarSitemap();