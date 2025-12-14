import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Button, Dimensions, StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { Gesture, GestureDetector, GestureHandlerRootView, } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const IMAGE_W = width * 0.8;
const IMAGE_H = height * 0.5;

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

const clampValue = (value, min, max) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export default function App() {
  const [imageUri, setImageUri] = useState(null);

  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const getTranslateBounds = (s) => {
    'worklet';

    const scaledW = IMAGE_W * s;
    const scaledH = IMAGE_H * s;

    return {
      x: Math.abs(scaledW - width) / 2,
      y: Math.abs(scaledH - height) / 2,
    };
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      lastScale.value = scale.value;
    })
    .onUpdate((e) => {
      const nextScale = clampValue(
        lastScale.value * e.scale,
        MIN_SCALE,
        MAX_SCALE
      );

      const centerX = width / 2;
      const centerY = height / 2;

      const dx = e.focalX - centerX;
      const dy = e.focalY - centerY;

      const ratio = nextScale / scale.value;

      const nextX = offsetX.value + dx - dx * ratio;
      const nextY = offsetY.value + dy - dy * ratio;

      const bounds = getTranslateBounds(nextScale);

      offsetX.value = clampValue(nextX, -bounds.x, bounds.x);
      offsetY.value = clampValue(nextY, -bounds.y, bounds.y);
      scale.value = nextScale;
    })
    .onEnd(() => {
      lastScale.value = scale.value;
      lastX.value = offsetX.value;
      lastY.value = offsetY.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const bounds = getTranslateBounds(scale.value);

      offsetX.value = clampValue(
        lastX.value + e.translationX,
        -bounds.x,
        bounds.x
      );

      offsetY.value = clampValue(
        lastY.value + e.translationY,
        -bounds.y,
        bounds.y
      );
    })
    .onEnd(() => {
      lastX.value = offsetX.value;
      lastY.value = offsetY.value;
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const resetImage = () => {
    scale.value = withTiming(1);
    offsetX.value = withTiming(0);
    offsetY.value = withTiming(0);
    lastScale.value = 1;
    lastX.value = 0;
    lastY.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.root}>
        <Button title="Pick Image" onPress={pickImage} />
        <Button title="Reset" onPress={resetImage} />

        <View style={styles.viewer}>
          {imageUri && (
            <GestureDetector gesture={gesture}>
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.image, animatedStyle]}
                resizeMode="contain"
              />
            </GestureDetector>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 60,
  },
  viewer: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: IMAGE_W,
    height: IMAGE_H,
  },
});
