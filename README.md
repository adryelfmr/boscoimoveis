# 🏠 Bosco Imóveis - Documentação Técnica

> Site de corretagem de imóveis em Goiânia/GO

---

## 📋 **Índice**

- [Visão Geral](#visão-geral)
- [Serviços e Acessos](#serviços-e-acessos)
- [Configurações](#configurações)
- [Deploys](#deploys)
- [Contatos Importantes](#contatos-importantes)

---

## 🌐 **Visão Geral**

| Informação | Detalhes |
|------------|----------|
| **Domínio Principal** | https://boscoimoveis.app |
| **Email Contato** | contato@boscoimoveis.app |
| **WhatsApp** | (62) 99404-5111 |
| **Tecnologias** | React + Vite + Appwrite + Vercel |
| **Versão Atual** | 2.0.0 |

---

## 🔑 **Serviços e Acessos**

### **1. Domínio e DNS**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **Name.com** | https://www.name.com/account/domain | `seu-email@gmail.com` | Gerenciar domínio `boscoimoveis.app` |

**O que gerenciar:**
- ✅ Renovação anual
- ✅ Nameservers (apontam para Vercel)
- ✅ Configurações DNS
- ✅ Auto-renovação (ativar!)

**Nameservers Configurados:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

---

### **2. Hospedagem e Deploy**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **Vercel** | https://vercel.com/dashboard | `seu-email@gmail.com` | Hospedar site (frontend) |

**O que gerenciar:**
- ✅ Deploys automáticos (GitHub)
- ✅ Variáveis de ambiente
- ✅ Domínio customizado
- ✅ Analytics
- ✅ Logs de erro

**Projeto Vercel:**
```
Nome: boscoimoveis
URL: https://boscoimoveis.vercel.app
Domínio: boscoimoveis.app
GitHub: https://github.com/seu-usuario/boscoimoveis
```

---

### **3. Backend e Banco de Dados**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **Appwrite Cloud** | https://cloud.appwrite.io | `seu-email@gmail.com` | Backend, DB, Auth, Storage |

**O que gerenciar:**
- ✅ Banco de dados (imóveis, usuários, etc)
- ✅ Autenticação de usuários
- ✅ Storage (upload de fotos)
- ✅ Functions (email, etc)
- ✅ Platforms (domínios autorizados)

**Detalhes do Projeto:**
```
Project ID: 6924b9be000964eea8f5
Project Name: Bosco Imóveis
Database ID: 67821f5e0036f8f0f08d
```

**Collections (Tabelas):**
```
- imoveis (67821f920014e79ac8dc)
- favoritos (6782227200136e53b5de)
- visualizacoes (678223e4000e577dfdc6)
- comparacoes (67851d5b00305e91784c)
- alertas (6785225b0006f2f4efaf)
- contatos (678a0a4c00270a03e2e9)
```

**Bucket (Storage):**
```
imoveis-images: 67821fae003004ffc88c
```

---

### **4. Email e Comunicação**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **Brevo (Sendinblue)** | https://app.brevo.com | `seu-email@gmail.com` | Envio de emails (contato, etc) |

**O que gerenciar:**
- ✅ Templates de email
- ✅ API Key
- ✅ Domínio verificado
- ✅ Logs de envios
- ✅ Limites de envio (300/dia gratuito)

**API Key:**
```
Está em: Appwrite Functions > send-contact-email > Environment Variables
```

---

### **5. Controle de Versão**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **GitHub** | https://github.com/seu-usuario/boscoimoveis | `seu-email@gmail.com` | Código-fonte, versionamento |

**O que gerenciar:**
- ✅ Código do site
- ✅ Commits e histórico
- ✅ Branches (main, dev)
- ✅ Issues e bugs
- ✅ Deploy automático (conectado ao Vercel)

**Repositório:**
```
https://github.com/seu-usuario/boscoimoveis
Branch principal: main
```

---

### **6. Analytics e SEO**

| Serviço | Link de Acesso | Login | Função |
|---------|---------------|-------|--------|
| **Google Analytics** | https://analytics.google.com | `seu-email@gmail.com` | Análise de tráfego |
| **Google Search Console** | https://search.google.com/search-console | `seu-email@gmail.com` | SEO, indexação Google |

**Google Analytics:**
```
ID: G-KG33G5T12D
Propriedade: Bosco Imóveis
```

**Google Search Console:**
```
Propriedade: boscoimoveis.app
Sitemap: https://boscoimoveis.app/sitemap.xml
```

---

### **7. WhatsApp Business (Opcional)**

| Serviço | Link de Acesso | Função |
|---------|---------------|--------|
| **WhatsApp Business** | https://business.whatsapp.com | Gestão de mensagens |

**Número:**
```
(62) 99404-5111
+5562994045111
```

---

## ⚙️ **Configurações Importantes**

### **Variáveis de Ambiente (Vercel)**

Acesse: https://vercel.com/seu-usuario/boscoimoveis/settings/environment-variables

```env
# Appwrite
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=6924b9be000964eea8f5
VITE_APPWRITE_DATABASE_ID=67821f5e0036f8f0f08d
VITE_APPWRITE_BUCKET_ID=67821fae003004ffc88c

# Collections
VITE_APPWRITE_COLLECTION_IMOVEIS=67821f920014e79ac8dc
VITE_APPWRITE_COLLECTION_FAVORITOS=6782227200136e53b5de
VITE_APPWRITE_COLLECTION_VISUALIZACOES=678223e4000e577dfdc6
VITE_APPWRITE_COLLECTION_COMPARACOES=67851d5b00305e91784c
VITE_APPWRITE_COLLECTION_ALERTAS=6785225b0006f2f4efaf
VITE_APPWRITE_COLLECTION_CONTATOS=678a0a4c00270a03e2e9

# Functions
VITE_APPWRITE_FUNCTION_SEND_CONTACT=692500b500176be3c6ff
VITE_APPWRITE_FUNCTION_RESET_PASSWORD=692502c8003051a1e38c

# Admin
VITE_APPWRITE_ADMIN_TEAM_ID=678a1cdf001f5c5a59ca

# App
VITE_APP_URL=https://boscoimoveis.app
```

---

### **Plataformas Autorizadas (Appwrite)**

Acesse: https://cloud.appwrite.io/console/project-6924b9be000964eea8f5/settings/platforms

```
✅ Web App: boscoimoveis.app
✅ Web App: www.boscoimoveis.app
✅ Web App: localhost:5173 (dev)
```

---

## 🚀 **Processo de Deploy**

### **1. Deploy Local → Produção**

```bash
# 1. Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"

# 2. Enviar para GitHub
git push origin main

# 3. Aguardar (2-5 min)
# Vercel faz deploy automático

# 4. Verificar
# https://boscoimoveis.app
```

---

### **2. Atualizar Versão (Apenas quando necessário)**

```bash
# Editar: public/clear-cache.js
const APP_VERSION = '2.1.0'; # Incrementar

# Commit
git add public/clear-cache.js
git commit -m "chore: bump version to 2.1.0"
git push origin main
```

---

## 📞 **Contatos Importantes**

| Serviço | Suporte |
|---------|---------|
| **Name.com** | https://www.name.com/support |
| **Vercel** | https://vercel.com/support |
| **Appwrite** | https://discord.com/invite/appwrite |
| **Brevo** | support@brevo.com |
| **GitHub** | https://support.github.com |

---

## 🔧 **Comandos Úteis**

### **Desenvolvimento Local**

```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

### **Git**

```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver diferenças
git diff

# Desfazer mudanças
git checkout .

# Criar branch
git checkout -b feature/nova-funcionalidade
```

---

## 📊 **Métricas e Monitoramento**

### **Links Rápidos**

| Métrica | Link |
|---------|------|
| **Analytics** | https://analytics.google.com/analytics/web/#/p123456789/reports/intelligenthome |
| **Search Console** | https://search.google.com/search-console?resource_id=sc-domain:boscoimoveis.app |
| **Vercel Analytics** | https://vercel.com/seu-usuario/boscoimoveis/analytics |
| **Uptime Monitor** | https://uptimerobot.com (configurar) |

---

## 🐛 **Troubleshooting**

### **Site Fora do Ar**

1. Verificar: https://vercel.com/seu-usuario/boscoimoveis
2. Ver logs de erro
3. Verificar último deploy

---

### **Emails Não Chegando**

1. Verificar: https://app.brevo.com/sending-history
2. Ver logs da function: https://cloud.appwrite.io/console/project-6924b9be000964eea8f5/functions/function-692500b500176be3c6ff/executions
3. Verificar limite diário (300 emails)

---

### **Domínio Não Funciona**

1. Verificar DNS: https://dnschecker.org
2. Verificar Vercel: https://vercel.com/seu-usuario/boscoimoveis/settings/domains
3. Verificar Name.com: https://www.name.com/account/domain

---

## 📅 **Tarefas Recorrentes**

| Tarefa | Frequência | Link |
|--------|-----------|------|
| **Renovar domínio** | Anual | https://www.name.com/account/domain |
| **Backup banco de dados** | Mensal | https://cloud.appwrite.io/console/project-6924b9be000964eea8f5/databases/database-67821f5e0036f8f0f08d |
| **Verificar SEO** | Mensal | https://search.google.com/search-console |
| **Analisar métricas** | Semanal | https://analytics.google.com |
| **Atualizar dependências** | Trimestral | `npm outdated` |

---

## 🔒 **Segurança**

### **Senhas e Credenciais**

⚠️ **NUNCA commitar:**
- Senhas
- API Keys
- Tokens
- .env files

✅ **Usar:**
- Gerenciador de senhas (1Password, Bitwarden)
- 2FA em todos os serviços
- Senhas únicas e fortes

---

### **Backup**

✅ **Fazer backup de:**
- Código (GitHub já faz)
- Banco de dados (Appwrite Cloud)
- Variáveis de ambiente (anotar fora do código)
- Documentação importante

---

## 📝 **Changelog**

### **v2.0.0 (2025-01-28)**
- Sistema de cache desabilitado
- PWA removido
- Headers HTTP otimizados
- Sistema de versões implementado

### **v1.0.0 (2024-XX-XX)**
- Lançamento inicial

---

## 📚 **Documentação Adicional**

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Appwrite Docs](https://appwrite.io/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🆘 **Suporte**

Em caso de dúvidas:
1. Ver documentação acima
2. Verificar logs (Vercel + Appwrite)
3. GitHub Issues
4. Discord do Appwrite

---

**Última atualização:** 28/01/2025  
**Responsável:** [Seu Nome]  
**Email:** seu-email@gmail.com
