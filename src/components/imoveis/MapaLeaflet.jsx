import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buscarEnderecoPorCEP } from '@/services/cep';

// Fix para ícone padrão do Leaflet no Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapaLeaflet({ cep, titulo, endereco, cidade, estado }) {
  const [coordenadas, setCoordenadas] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    async function buscarCoordenadas() {
      if (!cep) {
        setErro(true);
        return;
      }

      setCarregando(true);
      
      try {
        const dadosCEP = await buscarEnderecoPorCEP(cep);
        
        if (dadosCEP && dadosCEP.latitude && dadosCEP.longitude) {
          setCoordenadas({
            latitude: dadosCEP.latitude,
            longitude: dadosCEP.longitude,
          });
        } else {
          setErro(true);
        }
      } catch (error) {
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }

    buscarCoordenadas();
  }, [cep]);

  if (carregando) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600">🗺️ Carregando localização...</p>
        </CardContent>
      </Card>
    );
  }

  if (!coordenadas || erro) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-center">
          <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="text-sm text-amber-800 font-semibold">
            Localização não disponível
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {endereco || `${cidade} - ${estado}`}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            CEP: {cep || 'não informado'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const posicao = [coordenadas.latitude, coordenadas.longitude];

  return (
    <div className="space-y-3">
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

        <CardContent className="p-3 bg-slate-50 border-t">
          <p className="text-xs text-slate-600 text-center">
            🗺️ Por questões de segurança, o endereço exato é informado apenas após agendamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}