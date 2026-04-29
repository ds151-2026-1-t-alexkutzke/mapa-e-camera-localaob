import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@geovault_segredos';

export default function NovoSegredoScreen() {
  const [texto, setTexto] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleAbrirCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Erro', 'Dê Permissão da câmera!');
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const handleTirarFoto = async () => {
    if (cameraRef.current) {
      try {
        const foto = await cameraRef.current.takePictureAsync();
        if (foto) {
          setFotoUri(foto.uri);
        }
      } catch (error) {
        Alert.alert('Erro', 'Falha ao capturar foto.');
      }
    }
    setIsCameraOpen(false);
  };

  const handleSalvarSegredo = async () => {
    if (!texto) {
      Alert.alert('Erro', 'Digite um segredo primeiro.');
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Permissão de localização negada.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const novoSegredo = {
        id: Date.now().toString(),
        texto,
        fotoUri,
        latitude,
        longitude,
      };

      const jsonAtual = await AsyncStorage.getItem(STORAGE_KEY);
      const listaAtual = jsonAtual ? JSON.parse(jsonAtual) : [];

      listaAtual.push(novoSegredo);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listaAtual));

      Alert.alert('Sucesso', 'Segredo salvo.');
      setTexto('');
      setFotoUri(null);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar.');
    }
  };

  if (isCameraOpen) {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
        />

        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.btnCapturar} onPress={handleTirarFoto}>
            <Text style={styles.btnText}>Capturar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => setIsCameraOpen(false)}>
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Qual o seu segredo neste local?</Text>

      <TextInput
        style={styles.input}
        placeholder="Escreva algo marcante..."
        placeholderTextColor="#666"
        value={texto}
        onChangeText={setTexto}
        multiline
      />

      <View style={styles.fotoContainer}>
        {fotoUri ? (
          <TouchableOpacity onPress={handleAbrirCamera}>
            <Image source={{ uri: fotoUri }} style={styles.previewFoto} />
            <Text style={styles.trocarFotoText}>Toque para trocar a foto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnFotoOutline} onPress={handleAbrirCamera}>
            <Text style={styles.btnFotoText}>Adicionar Foto ao Segredo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.btnSalvar} onPress={handleSalvarSegredo}>
        <Text style={styles.btnSalvarText}>Salvar no Cofre</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e', padding: 20 },
  label: { color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  input: { backgroundColor: '#333', color: '#fff', padding: 15, borderRadius: 8, minHeight: 100, textAlignVertical: 'top' },
  fotoContainer: { marginVertical: 20, alignItems: 'center' },
  previewFoto: { width: '100%', height: 200, borderRadius: 8 },
  trocarFotoText: { color: '#888', textAlign: 'center', marginTop: 5, fontSize: 12 },
  btnFotoOutline: { borderWidth: 1, borderColor: '#007bff', borderStyle: 'dashed', padding: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  btnFotoText: { color: '#007bff', fontSize: 16 },
  btnSalvar: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnSalvarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cameraOverlay: { flex: 1, justifyContent: 'space-evenly', paddingBottom: 40, flexDirection: 'row', alignItems: 'flex-end' },
  btnCapturar: { backgroundColor: '#28a745', padding: 15, borderRadius: 30 },
  btnCancelar: { backgroundColor: '#dc3545', padding: 15, borderRadius: 30 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
