# 📋 Checklist de Deploy - Bosco Imóveis

## ✅ **Antes de Fazer Deploy (SEMPRE)**

### **1. SEO e Meta Tags**

Quando alterar:
- ❏ Título de páginas
- ❏ Descrições de produtos/serviços
- ❏ Imagens principais

**Arquivos a atualizar:**
```
src/Pages/[NomeDaPagina].jsx
  └── <SEO title="..." description="..." />

src/components/SEO.jsx (se mudou lógica)
```

---

### **2. Schema.org (Rich Snippets)**

Quando alterar:
- ❏ Estrutura de imóveis (novos campos)
- ❏ Informações da empresa
- ❏ Endereço/telefone

**Arquivos a atualizar:**
```
src/Pages/Detalhes.jsx
  └── const schemaData = { ... }

src/components/SchemaOrg.jsx
```

**Validar em:** https://validator.schema.org/

---

### **3. Sitemap**

Quando alterar:
- ❏ Adicionou novas páginas estáticas
- ❏ Mudou URLs
- ❏ Novos imóveis (automático, mas verificar)

**Arquivos a atualizar:**
```
public/sitemap-generator.mjs
  └── paginasEstaticas array

Depois rodar:
  node public/sitemap-generator.mjs
```

---

### **4. Robots.txt**

Quando alterar:
- ❏ Criar nova área privada
- ❏ Adicionar página pública

**Arquivo a atualizar:**
```
public/robots.txt
```

---

### **6. Open Graph (Redes Sociais)**

Quando alterar:
- ❏ Logo principal
- ❏ Imagem de compartilhamento
- ❏ Descrição do site

**Arquivos a atualizar:**
```
index.html
  └── <meta property="og:..." />

src/components/SEO.jsx
  └── Open Graph tags
```

**Testar em:** 
- https://www.opengraph.xyz/
- https://developers.facebook.com/tools/debug/

---

### **7. Analytics e Tracking**

Quando alterar:
- ❏ Eventos de conversão
- ❏ Novos botões importantes
- ❏ Páginas de destino

**Arquivos a atualizar:**
```
src/utils/analytics.js
  └── Adicionar tracking events

src/Pages/[Pagina].jsx
  └── Chamar analytics.track...()
```

---

### **8. Cache e Versão**

Quando alterar:
- ❏ Layout importante
- ❏ Funcionalidades críticas
- ❏ Forçar atualização de usuários

**Arquivo a atualizar:**
```
public/clear-cache.js
  └── const APP_VERSION = '2.X.0'; // Incrementar
```

---

### **9. Ícones e Favicons**

Quando alterar:
- ❏ Logo da empresa
- ❏ Cores principais

**Arquivos necessários em `public/`:**
```
public/
  ├── favicon.ico (16x16, 32x32)
  ├── favicon-96x96.png
  ├── apple-touch-icon.png (180x180)
  ├── web-app-manifest-192x192.png
  ├── web-app-manifest-512x512.png
  └── boscoimoveis.svg
```

**⚠️ IMPORTANTE:** Todos esses arquivos são obrigatórios para SEO e PWA.

**Ferramenta para gerar:** https://realfavicongenerator.net/

---

### **10. Breadcrumbs**

Quando alterar:
- ❏ Hierarquia de páginas
- ❏ URLs de navegação

**Arquivo a atualizar:**
```
src/Pages/[Pagina].jsx
  └── <Breadcrumbs items={[...]} />
```

---

## 🚀 **Processo de Deploy Completo**

### **Passo 1: Verificações Locais**

```bash
# 1. Testar localmente
npm run dev

# 2. Verificar erros no console (F12)
# 3. Testar em modo incógnito (Ctrl+Shift+N)
# 4. Testar responsividade mobile (F12 → Toggle Device)
```

---

### **Passo 2: Validações Externas**

❏ **SEO:** https://pagespeed.web.dev/
❏ **Schema.org:** https://validator.schema.org/
❏ **Open Graph:** https://www.opengraph.xyz/
❏ **Manifest PWA:** https://www.pwabuilder.com/
❏ **Acessibilidade:** https://wave.webaim.org/
❏ **Mobile Friendly:** https://search.google.com/test/mobile-friendly

---

### **Passo 3: Deploy**

```bash
# 1. Verificar se está na branch correta
git branch

# 2. Adicionar mudanças
git add .

# 3. Commit com mensagem clara
git commit -m "feat: adiciona novas funcionalidades de SEO"

# 4. Push para produção
git push origin main

# 5. Aguardar notificação do Vercel
# Você receberá um email quando o deploy for concluído
```

---

### **Passo 4: Pós-Deploy**

❏ Testar site em produção: https://boscoimoveis.app
❏ Verificar Google Search Console (indexação)
❏ Solicitar reindexação no Google (se mudou SEO crítico)
❏ Testar compartilhamento em WhatsApp/Facebook
❏ Verificar se ícones aparecem corretamente
❏ Testar PWA em mobile (Add to Home Screen)

---

## 🔄 **Frequência de Atualizações**

| Item | Frequência | Obrigatório? |
|------|------------|-------------|
| SEO meta tags | A cada nova página | ✅ Sim |
| Schema.org | A cada mudança de estrutura | ✅ Sim |
| Sitemap | Automático no build | ✅ Sim |
| Analytics | A cada novo evento | ⚠️ Recomendado |
| Versão (cache) | Apenas mudanças críticas | ⚠️ Se necessário |
| Ícones | Apenas rebrand | ✅ Sim |
| Open Graph | Mudança de imagens principais | ✅ Sim |
| Screenshots PWA | Opcional (Play Store) | ❌ Não |

---

## ⚠️ **Erros Comuns a Evitar**

1. ❌ Esquecer de atualizar SEO em páginas novas
2. ❌ Não validar Schema.org após mudanças
3. ❌ Deixar robots.txt bloqueando páginas públicas
4. ❌ Não testar Open Graph antes de compartilhar
5. ❌ Não incrementar versão após mudanças críticas
6. ❌ Esquecer de adicionar analytics em novos CTAs
7. ❌ Não regenerar sitemap após adicionar páginas
8. ❌ **NOVO:** Não verificar se todos os ícones existem em `public/`
9. ❌ **NOVO:** Fazer push sem testar localmente

---

## 📞 **Contatos para Reindexação**

**Google Search Console:**
https://search.google.com/search-console

**Facebook Debugger:**
https://developers.facebook.com/tools/debug/

**LinkedIn Inspector:**
https://www.linkedin.com/post-inspector/

**Twitter Card Validator:**
https://cards-dev.twitter.com/validator

---

## 🎯 **Checklist Rápido (Copy-Paste)**

```
□ Testei localmente com `npm run dev`
□ Verifiquei erros no console (F12)
□ Testei em mobile (DevTools)
□ Validei Schema.org
□ Testei Open Graph
□ Regenerei sitemap (se necessário)
□ Incrementei versão do cache (se necessário)
□ Fiz commit com mensagem descritiva
□ Fiz push para main
□ Aguardei deploy do Vercel
□ Testei em produção
□ Solicitei reindexação (se mudou SEO)
```

---

**Última atualização:** 28/01/2025  
**Versão:** 2.1.0  
**Autor:** Equipe Bosco Imóveis