import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal, MapPin, Home, DollarSign, Bed, Bath } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  TIPOS_RESIDENCIAL, 
  TIPOS_COMERCIAL,
  getTiposPorFinalidade,
  getCategoriasPorTipo 
} from '@/config/imovelConfig';

export default function FiltrosImoveis({ filtros, onFiltroChange, onLimparFiltros }) {
  const [expandido, setExpandido] = useState(false);

  // ✅ Obter tipos disponíveis baseado na finalidade
  const tiposDisponiveis = filtros.finalidade === 'todas' 
    ? [...TIPOS_RESIDENCIAL, ...TIPOS_COMERCIAL]
    : getTiposPorFinalidade(filtros.finalidade);

  // ✅ Obter categorias disponíveis baseado no tipo selecionado
  const categoriasDisponiveis = filtros.tipo !== 'todos' && filtros.finalidade !== 'todas'
    ? getCategoriasPorTipo(filtros.finalidade, filtros.tipo)
    : [];

  return (
    <Card className="p-6 mb-8 shadow-lg">
      {/* Filtros Principais (sempre visíveis) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Busca */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Search className="inline w-4 h-4 mr-1" />
            Buscar
          </label>
          <Input
            type="text"
            placeholder="Cidade, bairro, código..."
            value={filtros.busca}
            onChange={(e) => onFiltroChange('busca', e.target.value)}
          />
        </div>

        {/* Finalidade */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Home className="inline w-4 h-4 mr-1" />
            Finalidade
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 bg-white"
            value={filtros.finalidade}
            onChange={(e) => {
              onFiltroChange('finalidade', e.target.value);
              // Reset tipo e categoria ao mudar finalidade
              onFiltroChange('tipo', 'todos');
              onFiltroChange('categoria', 'todas');
            }}
          >
            <option value="todas">Todas</option>
            <option value="Residencial">Residencial</option>
            <option value="Comercial">Comercial</option>
          </select>
        </div>

        {/* Tipo de Imóvel */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🏠 Tipo de Imóvel
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 bg-white"
            value={filtros.tipo}
            onChange={(e) => {
              onFiltroChange('tipo', e.target.value);
              // Reset categoria ao mudar tipo
              onFiltroChange('categoria', 'todas');
            }}
          >
            <option value="todos">Todos os tipos</option>
            {tiposDisponiveis.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Negócio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <DollarSign className="inline w-4 h-4 mr-1" />
            Negócio
          </label>
          <select
            className="w-full border rounded-lg px-3 py-2 bg-white"
            value={filtros.tipoNegocio}
            onChange={(e) => onFiltroChange('tipoNegocio', e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="Venda">Venda</option>
            <option value="Aluguel">Aluguel</option>
          </select>
        </div>

        {/* Categoria (apenas se houver categorias disponíveis) */}
        {categoriasDisponiveis.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📋 Categoria
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={filtros.categoria || 'todas'}
              onChange={(e) => onFiltroChange('categoria', e.target.value)}
            >
              <option value="todas">Todas</option>
              {categoriasDisponiveis.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Cidade
          </label>
          <Input
            type="text"
            placeholder="Ex: Goiânia"
            value={filtros.cidade || ''}
            onChange={(e) => onFiltroChange('cidade', e.target.value)}
          />
        </div>
      </div>

      {/* Botão Expandir Filtros */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setExpandido(!expandido)}
        className="w-full mb-4"
      >
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        {expandido ? 'Menos Filtros' : 'Mais Filtros'}
      </Button>

      {/* Filtros Expandidos */}
      {expandido && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Quartos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Bed className="inline w-4 h-4 mr-1" />
              Quartos
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={filtros.quartos}
              onChange={(e) => onFiltroChange('quartos', e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="1">1+ quarto</option>
              <option value="2">2+ quartos</option>
              <option value="3">3+ quartos</option>
              <option value="4">4+ quartos</option>
            </select>
          </div>

          {/* Banheiros */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Bath className="inline w-4 h-4 mr-1" />
              Banheiros
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={filtros.banheiros || 'todos'}
              onChange={(e) => onFiltroChange('banheiros', e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="1">1+ banheiro</option>
              <option value="2">2+ banheiros</option>
              <option value="3">3+ banheiros</option>
            </select>
          </div>

          {/* Vagas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🚗 Vagas de Garagem
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={filtros.vagas || 'todos'}
              onChange={(e) => onFiltroChange('vagas', e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="1">1+ vaga</option>
              <option value="2">2+ vagas</option>
              <option value="3">3+ vagas</option>
            </select>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📍 Bairro
            </label>
            <Input
              type="text"
              placeholder="Ex: Setor Bueno"
              value={filtros.bairro || ''}
              onChange={(e) => onFiltroChange('bairro', e.target.value)}
            />
          </div>

          {/* Preço Mínimo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              💰 Preço Mínimo
            </label>
            <Input
              type="number"
              placeholder="R$ 0"
              value={filtros.precoMin || ''}
              onChange={(e) => onFiltroChange('precoMin', e.target.value)}
              min="0"
            />
          </div>

          {/* Preço Máximo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              💰 Preço Máximo
            </label>
            <Input
              type="number"
              placeholder="R$ 1.000.000"
              value={filtros.precoMax || ''}
              onChange={(e) => onFiltroChange('precoMax', e.target.value)}
              min="0"
            />
          </div>

          {/* Área Mínima */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📐 Área Mínima (m²)
            </label>
            <Input
              type="number"
              placeholder="Ex: 50"
              value={filtros.areaMin || ''}
              onChange={(e) => onFiltroChange('areaMin', e.target.value)}
              min="0"
            />
          </div>

          {/* Condomínio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🏢 Condomínio
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 bg-white"
              value={filtros.condominio || 'todos'}
              onChange={(e) => onFiltroChange('condominio', e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="sim">Apenas em condomínio</option>
              <option value="nao">Apenas sem condomínio</option>
            </select>
          </div>
        </div>
      )}

      {/* Botão Limpar (se houver filtros ativos) */}
      {Object.values(filtros).some(v => v && v !== 'todos' && v !== 'todas') && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onLimparFiltros}
            className="text-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar Todos os Filtros
          </Button>
        </div>
      )}
    </Card>
  );
}