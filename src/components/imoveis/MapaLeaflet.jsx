import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ✅ NOVO: Receber o objeto imóvel completo
export default function MapaLeaflet({ imovel }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    // ✅ Verificar se tem coordenadas salvas no banco
    if (imovel?.latitude && imovel?.longitude) {
      setCarregando(false);
      setErro(false);
    } else {
      // Sem coordenadas disponíveis
      setErro(true);
      setCarregando(false);
    }
  }, [imovel]);

  // Loading
  if (carregando) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-slate-600">Carregando mapa...</p>
        </CardContent>
      </Card>
    );
  }

  // Erro - sem coordenadas
  if (erro || !imovel?.latitude || !imovel?.longitude) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-center">
          <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm text-amber-800 font-semibold">
            Localização não disponível
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {imovel?.endereco || `${imovel?.cidade} - ${imovel?.estado}`}
          </p>
          {imovel?.cep && (
            <p className="text-xs text-slate-500 mt-2">
              CEP: {imovel.cep}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const posicao = [imovel.latitude, imovel.longitude];

  // ✅ Texto de precisão baseado no que foi salvo
  const precisaoTexto = {
    'street': 'Localização aproximada da rua',
    'neighborhood': 'Localização aproximada do bairro',
    'city': 'Localização aproximada da cidade',
  };

  return (
    <div className="space-y-3">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800">
          <strong>⚠️ {precisaoTexto[imovel.precisaoLocalizacao] || 'Localização Aproximada'}:</strong> O marcador mostra a região do imóvel. 
          A localização exata será fornecida durante a visita agendada.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-lg overflow-hidden">
        <MapContainer 
          center={posicao} 
          zoom={imovel.precisaoLocalizacao === 'street' ? 16 : 14} 
          style={{ height: '400px', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={posicao}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">{imovel.titulo}</h3>
                <p className="text-xs text-slate-600">{imovel.endereco || imovel.bairro}</p>
                <p className="text-xs text-amber-600 mt-1 font-semibold">
                  📍 {precisaoTexto[imovel.precisaoLocalizacao] || 'Localização aproximada'}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        <CardContent className="p-3 bg-slate-50 border-t">
          <p className="text-xs text-slate-600 text-center">
            🗺️ Por questões de segurança, o endereço exato é informado apenas após agendamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}