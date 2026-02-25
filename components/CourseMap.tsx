import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";

type Pin = { id: number; lat: number; lng: number; label: string };

type Props = {
  center: { lat: number; lng: number };
  simulatedLocation: { lat: number; lng: number } | null;
  simMode: boolean;
  targetPins: Pin[];
  selectedTarget: Pin | null;
  currentPos: { lat: number; lng: number } | null;
  showsUserLocation: boolean;
  onMapPress: (lat: number, lng: number) => void;
  onSimDrag: (lat: number, lng: number) => void;
  onTargetSelect: (pin: Pin) => void;
  onMapReady: () => void;
  mapRef?: React.MutableRefObject<any>;
};

export default function CourseMap(props: Props) {
  const {
    center, simulatedLocation, simMode, targetPins, selectedTarget,
    currentPos, showsUserLocation, onMapPress, onSimDrag, onTargetSelect,
    onMapReady, mapRef,
  } = props;
  const internalRef = useRef<MapView>(null);
  const ref = mapRef || internalRef;

  useEffect(() => {
    if (ref.current && mapRef) {
      mapRef.current = ref.current;
    }
  }, []);

  return (
    <MapView
      ref={ref as any}
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      mapType="satellite"
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }}
      onPress={(e: any) => {
        const coord = e.nativeEvent?.coordinate;
        if (coord) onMapPress(coord.latitude, coord.longitude);
      }}
      onMapReady={onMapReady}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      rotateEnabled={false}
    >
      {simMode && simulatedLocation && (
        <Marker
          coordinate={{ latitude: simulatedLocation.lat, longitude: simulatedLocation.lng }}
          draggable
          onDragEnd={(e: any) => {
            const coord = e.nativeEvent?.coordinate;
            if (coord) onSimDrag(coord.latitude, coord.longitude);
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.simMarker}>
            <View style={[styles.simDot, { backgroundColor: "#2196F3" }]} />
            <View style={[styles.simRing, { borderColor: "#2196F380" }]} />
          </View>
        </Marker>
      )}

      {targetPins.map((pin, i) => (
        <Marker
          key={i}
          coordinate={{ latitude: pin.lat, longitude: pin.lng }}
          onPress={() => onTargetSelect(pin)}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.targetMarker}>
            <View style={[
              styles.targetDot,
              { backgroundColor: selectedTarget?.id === pin.id ? "#FF5722" : "#FFC107" }
            ]} />
            <View style={[styles.targetStem, { backgroundColor: selectedTarget?.id === pin.id ? "#FF5722" : "#FFC107" }]} />
          </View>
        </Marker>
      ))}

      {currentPos && selectedTarget && (
        <Polyline
          coordinates={[
            { latitude: currentPos.lat, longitude: currentPos.lng },
            { latitude: selectedTarget.lat, longitude: selectedTarget.lng },
          ]}
          strokeColor="#FF5722"
          strokeWidth={2}
          lineDashPattern={[8, 6]}
        />
      )}

      {targetPins.length >= 2 && (
        <Polyline
          coordinates={targetPins.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
          strokeColor="#FFC10780"
          strokeWidth={1.5}
          lineDashPattern={[4, 4]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  simMarker: {
    width: 28, height: 28, alignItems: "center", justifyContent: "center",
  },
  simDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2.5, borderColor: "#fff", position: "absolute", zIndex: 2,
  },
  simRing: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, position: "absolute",
  },
  targetMarker: { alignItems: "center", width: 24 },
  targetDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff", zIndex: 2,
  },
  targetStem: { width: 2, height: 8, marginTop: -1 },
});
