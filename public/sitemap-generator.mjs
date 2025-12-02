import { Client, Databases, Query } from 'appwrite';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env'), override: false });

// Configurar Appwrite
const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_IMOVEIS = process.env.VITE_APPWRITE_COLLECTION_IMOVEIS;

async function gerarSitemap() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const baseUrl = 'https://boscoimoveis.app';
    
    // Páginas estáticas
    const paginasEstaticas = [
      { url: '/', prioridade: '1.0', frequencia: 'daily' },
      { url: '/catalogo', prioridade: '0.9', frequencia: 'daily' },
      { url: '/promocoes', prioridade: '0.8', frequencia: 'daily' },
      { url: '/sobre', prioridade: '0.7', frequencia: 'monthly' },
      { url: '/contato', prioridade: '0.8', frequencia: 'monthly' },
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
    
    // ✅ Iniciar XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
    
    // Adicionar páginas estáticas
    paginasEstaticas.forEach(pagina => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(baseUrl + pagina.url)}</loc>\n`; // ✅ ESCAPAR URL
      xml += `    <lastmod>${hoje}</lastmod>\n`;
      xml += `    <changefreq>${pagina.frequencia}</changefreq>\n`;
      xml += `    <priority>${pagina.prioridade}</priority>\n`;
      xml += '  </url>\n';
    });
    
    // Adicionar imóveis
    imoveis.forEach(imovel => {
      const lastmod = imovel.$updatedAt ? imovel.$updatedAt.split('T')[0] : hoje;
      
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(baseUrl + '/detalhes?id=' + imovel.$id)}</loc>\n`; // ✅ ESCAPAR URL
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      
      // Adicionar imagens
      if (imovel.imagens && imovel.imagens.trim()) {
        const todasImagens = imovel.imagens.split(',').map(url => url.trim()).filter(url => url);
        
        todasImagens.forEach((imagemUrl) => {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${escapeXml(imagemUrl)}</image:loc>\n`; // ✅ JÁ ESCAPADO
          xml += `      <image:title>${escapeXml(imovel.titulo || '')}</image:title>\n`; // ✅ JÁ ESCAPADO
          xml += '    </image:image>\n';
        });
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    // Salvar arquivo
    fs.writeFileSync(resolve(__dirname, 'sitemap.xml'), xml, 'utf8');
  
    
  } catch (error) {
    process.exit(1);
  }
}

// ✅ Função de escape XML (já existente, mas melhorada)
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

gerarSitemap();