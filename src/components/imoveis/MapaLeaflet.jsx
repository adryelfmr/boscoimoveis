import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react'; // ✅ NOVO: AlertCircle
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Alert, AlertDescription } from '@/components/ui/alert'; // ✅ NOVO IMPORT

// Fix para ícone padrão do Leaflet no Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapaLeaflet({ latitude, longitude, titulo, endereco }) {
  // Se não tem coordenadas, não mostra o mapa
  if (!latitude || !longitude) {
    return null;
  }

  const posicao = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div className="space-y-3">
      {/* ✅ NOVO: Aviso de localização aproximada */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800">
          <strong>⚠️ Localização Aproximada:</strong> O marcador mostra a região do imóvel. 
          A localização exata será fornecida durante a visita agendada.
        </AlertDescription>
      </Alert>

      <Card className="border-0 shadow-lg overflow-hidden">
        <MapContainer 
          center={posicao} 
          zoom={15} 
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
                <h3 className="font-bold text-sm mb-1">{titulo}</h3>
                <p className="text-xs text-slate-600">{endereco}</p>
                <p className="text-xs text-amber-600 mt-1 font-semibold">
                  📍 Localização aproximada
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* ✅ NOVO: Aviso no rodapé do mapa */}
        <CardContent className="p-3 bg-slate-50 border-t">
          <p className="text-xs text-slate-600 text-center">
            🗺️ Por questões de segurança, o endereço exato é informado apenas após agendamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}