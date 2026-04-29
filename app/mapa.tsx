import { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = '@geovault_segredos';

interface Segredo {
  id: string;
  texto: string;
  fotoUri: string | null;
  latitude: number;
  longitude: number;
}

export default function MapaScreen() {
  const [segredos, setSegredos] = useState<Segredo[]>([]);

  useFocusEffect(
    useCallback(() => {
      carregarSegredos();
    }, [])
  );

  const carregarSegredos = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const lista: Segredo[] = JSON.parse(json);
        setSegredos(lista);
      }
    } catch (error) {
      console.error('Erro ao carregar segredos:', error);
    }
  };

  // cwb como região padrão
  const getInitialRegion = () => {
    if (segredos.length > 0) {
      const latitudes = segredos.map(s => s.latitude);
      const longitudes = segredos.map(s => s.longitude);
      const centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
      const centerLng = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
      const latDelta = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.01) * 1.5;
      const lngDelta = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.01) * 1.5;
      return {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
    }
    // cwb como região padrão
    return {
      latitude: -25.42778,
      longitude: -49.27306,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={getInitialRegion()}
      >
        {segredos.map((segredo) => (
          <Marker
            key={segredo.id}
            coordinate={{ latitude: segredo.latitude, longitude: segredo.longitude }}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>{segredo.texto}</Text>
                {segredo.fotoUri && (
                  <Image
                    source={{ uri: segredo.fotoUri }}
                    style={styles.calloutImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {segredos.length === 0 && (
        <View style={styles.avisoContainer}>
          <Text style={styles.avisoText}>Nenhum segredo salvo ainda. Vá na outra aba!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  calloutContainer: { width: 150, padding: 5 },
  calloutText: { fontWeight: 'bold', textAlign: 'center' },
  calloutImage: { width: 140, height: 100, borderRadius: 4 },
  avisoContainer: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 20 },
  avisoText: { color: '#fff' }
});
