import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp } from 'lucide-react';

export default function CalculadoraFinanciamento({ precoImovel }) {

  const entradaMin = Math.round(precoImovel * 0.1);
  const entradaMax = Math.round(precoImovel * 0.5);
  const stepCalculado = 50;
  
  const [entrada, setEntrada] = useState(Math.round(precoImovel * 0.2));
  const [prazoMeses, setPrazoMeses] = useState(360);
  const [taxaAnual, setTaxaAnual] = useState(9.5);
  useEffect(() => {
    const entradaInicial = Math.round(precoImovel * 0.2);
    setEntrada(entradaInicial);
  }, [precoImovel]);

  const calcularParcela = () => {
    const valorFinanciado = precoImovel - entrada;
    const taxaMensal = taxaAnual / 12 / 100;
    const parcela = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, prazoMeses)) / (Math.pow(1 + taxaMensal, prazoMeses) - 1);
    return parcela;
  };

  const parcela = calcularParcela();
  const valorFinanciado = precoImovel - entrada;
  const totalPago = parcela * prazoMeses;
  const jurosTotal = totalPago - valorFinanciado;
  const rendaRecomendada = parcela / 0.3;
  
  const entradaParaCalculo = Math.max(entradaMin, Math.min(entradaMax, entrada));
  const percEntrada = (entradaParaCalculo / precoImovel) * 100;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleEntradaInputChange = (e) => {
    const value = e.target.value;
    
    // Permite digitar livremente (inclusive valores vazios)
    if (value === '') {
      setEntrada(0);
      return;
    }
    
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEntrada(numValue);
    }
  };

  const handleEntradaBlur = () => {
    // Limita ao sair do campo
    let novaEntrada = entrada;
    
    if (entrada < entradaMin || entrada === 0) {
      novaEntrada = entradaMin;
    } else if (entrada > entradaMax) {
      novaEntrada = entradaMax;
    }
    
    setEntrada(novaEntrada);
  };

  const handleEntradaSliderChange = (values) => {
    setEntrada(values[0]);
  };

  // Garante que o slider sempre tenha um valor válido
  const valorSlider = Math.max(entradaMin, Math.min(entradaMax, entrada));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Calculator className="w-5 h-5" />
          Simulador de Financiamento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Valor do Imóvel */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Valor do Imóvel
          </Label>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(precoImovel)}
          </div>
        </div>

        {/* Entrada */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Entrada ({percEntrada.toFixed(1)}%)
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={entrada}
              onChange={handleEntradaInputChange}
              onBlur={handleEntradaBlur}
              className="mb-3"
              step={stepCalculado}
              placeholder={`Entre ${formatCurrency(entradaMin)} e ${formatCurrency(entradaMax)}`}
            />
            {(entrada < entradaMin || entrada > entradaMax) && entrada !== 0 && (
              <p className="text-xs text-red-600 -mt-2 mb-2">
                Valor deve estar entre {formatCurrency(entradaMin)} e {formatCurrency(entradaMax)}
              </p>
            )}
          </div>
          <Slider
            value={[valorSlider]}
            onValueChange={handleEntradaSliderChange}
            min={entradaMin}
            max={entradaMax}
            step={stepCalculado}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatCurrency(entradaMin)}</span>
            <span>{formatCurrency(entradaMax)}</span>
          </div>
        </div>

        {/* Prazo */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Prazo: {prazoMeses} meses ({(prazoMeses / 12).toFixed(0)} anos)
          </Label>
          <Slider
            value={[prazoMeses]}
            onValueChange={(values) => setPrazoMeses(values[0])}
            min={120}
            max={420}
            step={12}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10 anos</span>
            <span>35 anos</span>
          </div>
        </div>

        {/* Taxa de Juros */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Taxa de Juros Anual: {taxaAnual.toFixed(1)}%
          </Label>
          <Slider
            value={[taxaAnual]}
            onValueChange={(values) => setTaxaAnual(values[0])}
            min={6}
            max={14}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>6%</span>
            <span>14%</span>
          </div>
        </div>

        {/* Resultados */}
        <div className="border-t pt-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Parcela Mensal</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(parcela)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Valor Financiado</p>
              <p className="font-semibold text-slate-900">{formatCurrency(valorFinanciado)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total a Pagar</p>
              <p className="font-semibold text-slate-900">{formatCurrency(totalPago)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Juros Total</p>
              <p className="font-semibold text-orange-600">{formatCurrency(jurosTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Renda Recomendada</p>
              <p className="font-semibold text-green-600">{formatCurrency(rendaRecomendada)}</p>
            </div>
          </div>
        </div>

        {/* Dica */}
        <Alert className="bg-amber-50 border-amber-200">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>Dica:</strong> Recomendamos que a parcela não ultrapasse 30% da sua renda mensal.
            {(parcela / rendaRecomendada) > 0.3 && (
              <span className="block mt-1">
                Para este imóvel, você precisaria de renda mínima de {formatCurrency(rendaRecomendada)}.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}