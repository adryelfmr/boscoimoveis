import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export default function FiltrosImoveis({ filtros, onFiltroChange, onLimparFiltros }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cidade, bairro..."
              value={filtros.busca}
              onChange={(e) => onFiltroChange('busca', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Imóvel
          </label>
          <Select
            value={filtros.tipo}
            onChange={(e) => onFiltroChange('tipo', e.target.value)}
          >
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="house">Casa</SelectItem>
            <SelectItem value="apartment">Apartamento</SelectItem>
            <SelectItem value="land">Terreno</SelectItem>
            <SelectItem value="commercial">Comercial</SelectItem>
          </Select>
        </div>

        {/* Finalidade - MUDOU AQUI */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tipo de Negócio
          </label>
          <Select
            value={filtros.finalidade}
            onChange={(e) => onFiltroChange('finalidade', e.target.value)}
          >
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="Venda">Venda</SelectItem>
            <SelectItem value="Aluguel">Aluguel</SelectItem>
            <SelectItem value="Venda/Aluguel">Venda/Aluguel</SelectItem>
          </Select>
        </div>

        {/* Quartos */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quartos
          </label>
          <Select
            value={filtros.quartos}
            onChange={(e) => onFiltroChange('quartos', e.target.value)}
          >
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="1">1+ quarto</SelectItem>
            <SelectItem value="2">2+ quartos</SelectItem>
            <SelectItem value="3">3+ quartos</SelectItem>
            <SelectItem value="4">4+ quartos</SelectItem>
          </Select>
        </div>
      </div>

      {/* Botão Limpar */}
      {(filtros.busca || filtros.tipo !== 'todos' || filtros.finalidade !== 'todas' || filtros.quartos !== 'todos') && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onLimparFiltros}
            className="text-slate-600"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}