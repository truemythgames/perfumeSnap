import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturing, setCapturing] = useState(false);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          PerfumeSnap needs camera access to identify perfumes from photos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.base64) {
        router.replace({
          pathname: '/result',
          params: {
            imageUri: photo.uri,
            imageBase64: photo.base64,
          },
        });
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Scan Perfume</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.frameContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>
              Position the perfume bottle within the frame
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={[styles.captureButton, capturing && styles.captureButtonActive]}
                onPress={takePicture}
                disabled={capturing}
                activeOpacity={0.7}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const FRAME_SIZE = SCREEN_WIDTH * 0.75;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  topTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    alignItems: 'center',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE * 1.2,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: Colors.primary,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: Colors.primary,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: Colors.primary,
    borderBottomRightRadius: 12,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonActive: {
    borderColor: Colors.primary,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  permissionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
  },
});
