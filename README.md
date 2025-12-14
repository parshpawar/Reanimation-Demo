# Reanimation-Demo

Dynamic Zoom Origin (Pinch Focal Point)

The pinch gesture provides focalX and focalY, which represent the position of the user’s fingers on the screen. These values are used to update the image translation while scaling so that zooming occurs from the pinch location instead of the image center.

During each pinch update:

The offset of the focal point from the container center is calculated.

Translation is adjusted using the scale ratio so the focal point remains fixed.

Translation values are clamped to keep the image within container bounds.

Core logic:

dx = focalX - centerX
dy = focalY - centerY

nextTranslateX = currentTranslateX + dx - dx * scaleRatio
nextTranslateY = currentTranslateY + dy - dy * scaleRatio


This keeps the pinch location visually stationary during zoom and avoids center-based scaling.
