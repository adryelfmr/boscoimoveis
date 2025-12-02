/**
 * Configurações centralizadas para imóveis
 * Tipos, categorias, mapeamentos e opções
 */

// ========================================
// TIPOS E CATEGORIAS POR FINALIDADE
// ========================================

export const TIPOS_RESIDENCIAL = [
  { value: 'apartamento', label: 'Apartamento', categorias: ['Padrão', 'Duplex', 'Triplex', 'Cobertura'] },
  { value: 'casa', label: 'Casa', categorias: ['Padrão', 'Sobrado'] },
  { value: 'casa_condominio', label: 'Casa de Condomínio', categorias: ['Padrão', 'Sobrado'] },
  { value: 'lote_terreno', label: 'Lote/Terreno', categorias: [] },
  { value: 'fazenda_sitio_chacara', label: 'Fazenda/Sítio/Chácara', categorias: [] },
  { value: 'kitnet', label: 'Kitnet', categorias: [] },
  { value: 'loft', label: 'Loft', categorias: ['Padrão', 'Duplex', 'Triplex', 'Cobertura'] },
];

export const TIPOS_COMERCIAL = [
  { value: 'casa', label: 'Casa', categorias: ['Padrão', 'Sobrado'] },
  { value: 'escritorio', label: 'Escritório', categorias: ['Padrão', 'Escritório', 'Consultório', 'Andar'] },
  { value: 'galpao', label: 'Galpão', categorias: [] },
  { value: 'lote_terreno', label: 'Lote/Terreno', categorias: [] },
  { value: 'ponto_comercial_loja', label: 'Ponto Comercial/Loja', categorias: ['Padrão', 'Shopping', 'Galeria'] },
];

// ========================================
// MAPEAMENTO DE TIPOS (para banco de dados)
// ========================================

// Para AnunciarImovel (cliente)
export const TIPO_IMOVEL_CLIENT_MAP = {
  'apartamento': 'apartamento',
  'casa': 'casa',
  'casa_condominio': 'casa_condominio',
  'lote_terreno': 'lote_terreno',
  'fazenda_sitio_chacara': 'fazenda_sitio_chacara',
  'kitnet': 'kitnet',
  'loft': 'loft',
  'escritorio': 'escritorio',
  'galpao': 'galpao',
  'ponto_comercial_loja': 'ponto_comercial_loja',
};

// Para GerenciadorImoveis (admin - legado)
export const TIPO_IMOVEL_ADMIN_MAP = {
  'Casa': 'casa',
  'Apartamento': 'apartamento',
  'Terreno': 'lote_terreno',
  'Comercial': 'ponto_comercial_loja',
  'Rural': 'fazenda_sitio_chacara',
};

export const TIPO_IMOVEL_ADMIN_REVERSE_MAP = {
  'casa': 'Casa',
  'apartamento': 'Apartamento',
  'lote_terreno': 'Terreno',
  'ponto_comercial_loja': 'Comercial',
  'fazenda_sitio_chacara': 'Rural',
  // ✅ Adicionar novos tipos
  'casa_condominio': 'Casa',
  'kitnet': 'Apartamento',
  'loft': 'Apartamento',
  'escritorio': 'Comercial',
  'galpao': 'Comercial',
};

// ========================================
// MAPEAMENTO DE DISPONIBILIDADE
// ========================================

export const DISPONIBILIDADE_MAP = {
  'Disponível': 'disponivel',
  'Indisponível': 'indisponivel',
  'Reservado': 'reservado',
  'Vendido': 'indisponivel',
  'Alugado': 'indisponivel',
};

export const DISPONIBILIDADE_REVERSE_MAP = {
  'disponivel': 'Disponível',
  'indisponivel': 'Indisponível',
  'reservado': 'Reservado',
};

// ========================================
// LABELS PARA EXIBIÇÃO
// ========================================

export const TIPO_IMOVEL_LABELS = {
  'apartamento': 'Apartamento',
  'casa': 'Casa',
  'casa_condominio': 'Casa de Condomínio',
  'lote_terreno': 'Lote/Terreno',
  'fazenda_sitio_chacara': 'Fazenda/Sítio/Chácara',
  'kitnet': 'Kitnet',
  'loft': 'Loft',
  'escritorio': 'Escritório',
  'galpao': 'Galpão',
  'ponto_comercial_loja': 'Ponto Comercial/Loja',
};

// ========================================
// CARACTERÍSTICAS DO IMÓVEL
// ========================================

export const DIFERENCIAIS_IMOVEL = [
  'Aceita animais',
  'Ar-condicionado',
  'Closet',
  'Cozinha americana',
  'Lareira',
  'Mobiliado',
  'Varanda gourmet',
  'Armários embutidos',
  'Box despejeiro',
  'Sala de jantar',
  'Lavabo',
];

export const LAZER_CONDOMINIO = [
  'Academia',
  'Churrasqueira',
  'Cinema',
  'Espaço gourmet',
  'Jardim',
  'Piscina',
  'Playground',
  'Quadra de squash',
  'Quadra de tênis',
  'Quadra poliesportiva',
  'Salão de festas',
  'Salão de jogos',
];

export const COMODIDADES_CONDOMINIO = [
  'Acesso para deficientes',
  'Bicicletário',
  'Coworking',
  'Elevador',
  'Estacionamento',
  'Lavanderia',
  'Sauna',
  'Spa',
];

export const SEGURANCA_CONDOMINIO = [
  'Condomínio fechado',
  'Portão eletrônico',
  'Portaria 24h',
  'Sistema de alarme',
  'Câmeras de segurança',
];

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Obter label de tipo de imóvel
 * @param {string} tipo - Tipo do imóvel (ex: 'apartamento')
 * @returns {string} Label formatado
 */
export function getTipoImovelLabel(tipo) {
  return TIPO_IMOVEL_LABELS[tipo] || tipo;
}

/**
 * Obter tipos disponíveis por finalidade
 * @param {string} finalidade - 'Residencial' ou 'Comercial'
 * @returns {Array} Lista de tipos
 */
export function getTiposPorFinalidade(finalidade) {
  return finalidade === 'Residencial' ? TIPOS_RESIDENCIAL : TIPOS_COMERCIAL;
}

/**
 * Obter categorias de um tipo específico
 * @param {string} finalidade - 'Residencial' ou 'Comercial'
 * @param {string} tipoValue - Valor do tipo (ex: 'apartamento')
 * @returns {Array} Lista de categorias
 */
export function getCategoriasPorTipo(finalidade, tipoValue) {
  const tipos = getTiposPorFinalidade(finalidade);
  const tipoSelecionado = tipos.find(t => t.value === tipoValue);
  return tipoSelecionado?.categorias || [];
}