import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, StyleSheet, Pressable, Platform, Dimensions, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { GlassCard } from "@/components/GlassCard";
import { PremiumText } from "@/components/PremiumText";
import { getQueryFn } from "@/lib/query-client";
import CourseMap from "@/components/CourseMap";

const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  "Augusta National Golf Club": { lat: 33.503, lng: -82.022 },
  "Pebble Beach Golf Links": { lat: 36.567, lng: -121.948 },
  "TPC Sawgrass - Stadium Course": { lat: 30.198, lng: -81.394 },
  "Pinehurst No. 2": { lat: 35.193, lng: -79.469 },
  "Bethpage Black": { lat: 40.745, lng: -73.456 },
  "Torrey Pines South Course": { lat: 32.900, lng: -117.252 },
  "Whistling Straits - Straits Course": { lat: 43.844, lng: -87.732 },
  "Kiawah Island - Ocean Course": { lat: 32.608, lng: -80.040 },
  "Bandon Dunes": { lat: 43.188, lng: -124.382 },
  "Pacific Dunes": { lat: 43.185, lng: -124.384 },
  "Oakmont Country Club": { lat: 40.527, lng: -79.828 },
  "Cypress Point Club": { lat: 36.581, lng: -121.965 },
  "Shinnecock Hills Golf Club": { lat: 40.891, lng: -72.442 },
  "Merion Golf Club - East Course": { lat: 40.005, lng: -75.312 },
  "Streamsong Resort - Red Course": { lat: 27.628, lng: -81.553 },
  "Cabot Cliffs": { lat: 46.214, lng: -61.449 },
  "Sand Valley Golf Resort": { lat: 44.091, lng: -89.871 },
  "Winged Foot Golf Club - West": { lat: 41.058, lng: -73.788 },
  "Chambers Bay": { lat: 47.200, lng: -122.570 },
  "The Old Course at St Andrews": { lat: 56.344, lng: -2.804 },
  "Gaylord Springs Golf Links": { lat: 36.186, lng: -86.625 },
  "Hermitage Golf Course - President's Reserve": { lat: 36.296, lng: -86.601 },
  "Hermitage Golf Course - General's Retreat": { lat: 36.294, lng: -86.605 },
  "Nashville Golf & Athletic Club": { lat: 36.097, lng: -86.660 },
  "Harpeth Hills Golf Course": { lat: 36.070, lng: -86.868 },
  "McCabe Golf Course": { lat: 36.157, lng: -86.832 },
  "Greystone Golf Club": { lat: 36.254, lng: -86.534 },
  "Old Fort Golf Club": { lat: 35.843, lng: -86.362 },
  "Indian Hills Golf Club": { lat: 35.858, lng: -86.418 },
  "Twelve Stones Crossing Golf Club": { lat: 35.836, lng: -86.410 },
  "Windtree Golf Course": { lat: 36.195, lng: -86.515 },
  "Pine Creek Golf Course": { lat: 36.180, lng: -86.510 },
  "Eagles Landing Golf Course": { lat: 36.202, lng: -86.342 },
  "Long Hollow Golf Course": { lat: 36.380, lng: -86.455 },
  "Ted Rhodes Golf Course": { lat: 36.190, lng: -86.805 },
  "Stones River Country Club": { lat: 35.848, lng: -86.430 },
  "Shepherds Crook Golf Course": { lat: 36.310, lng: -86.622 },
  "The Walker Course at Clemson University": { lat: 34.678, lng: -82.832 },
  "Furman University Golf Course": { lat: 34.927, lng: -82.443 },
  "Cherokee Valley Golf Club": { lat: 35.088, lng: -82.350 },
  "The Preserve at Verdae": { lat: 34.832, lng: -82.327 },
  "Cobb's Glen Country Club": { lat: 34.597, lng: -82.294 },
  "Boscobel Golf Club": { lat: 34.785, lng: -82.682 },
  "Southern Oaks Golf Club": { lat: 34.830, lng: -82.250 },
  "Smithfields Country Club": { lat: 34.600, lng: -82.440 },
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function metersToYards(m: number): number {
  return m * 1.09361;
}

type TargetPin = {
  id: number;
  lat: number;
  lng: number;
  label: string;
};

export default function GPSNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const mapRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [simulatedLocation, setSimulatedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [targetPins, setTargetPins] = useState<TargetPin[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [useYards, setUseYards] = useState(true);
  const [simMode, setSimMode] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const pinCounter = useRef(0);

  const { data: courses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    if (courses && courseId) {
      const c = courses.find((c: any) => c.id === parseInt(courseId as string));
      if (c) setSelectedCourse(c);
    }
  }, [courses, courseId]);

  const courseCenter = selectedCourse
    ? KNOWN_COORDS[selectedCourse.name] || { lat: 36.16, lng: -86.78 }
    : { lat: 36.16, lng: -86.78 };

  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
              setLocationPermission(true);
            },
            () => {
              setLocationPermission(false);
              setSimMode(true);
              setSimulatedLocation({ lat: courseCenter.lat + 0.001, lng: courseCenter.lng + 0.001 });
            }
          );
        } else {
          setLocationPermission(false);
          setSimMode(true);
          setSimulatedLocation({ lat: courseCenter.lat + 0.001, lng: courseCenter.lng + 0.001 });
        }
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationPermission(false);
        setSimMode(true);
        setSimulatedLocation({ lat: courseCenter.lat + 0.001, lng: courseCenter.lng + 0.001 });
        return;
      }
      setLocationPermission(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, [courseCenter.lat, courseCenter.lng]);

  const currentPos = simMode && simulatedLocation ? simulatedLocation : userLocation;

  const handleMapPress = useCallback((lat: number, lng: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (simMode && !simulatedLocation) {
      setSimulatedLocation({ lat, lng });
      return;
    }

    const id = ++pinCounter.current;
    const newPin: TargetPin = { id, lat, lng, label: `Target ${id}` };
    setTargetPins((prev) => [...prev, newPin]);
    setSelectedTargetId(id);
  }, [simMode, simulatedLocation]);

  const handleSimDrag = useCallback((lat: number, lng: number) => {
    setSimulatedLocation({ lat, lng });
  }, []);

  const handleTargetSelect = useCallback((pin: TargetPin) => {
    setSelectedTargetId(pin.id);
    Haptics.selectionAsync();
  }, []);

  const selectedTarget = targetPins.find((p) => p.id === selectedTargetId) || null;

  const distance = currentPos && selectedTarget
    ? haversineDistance(currentPos.lat, currentPos.lng, selectedTarget.lat, selectedTarget.lng)
    : null;

  const distanceBetweenLastTwo = targetPins.length >= 2
    ? haversineDistance(
        targetPins[targetPins.length - 2].lat, targetPins[targetPins.length - 2].lng,
        targetPins[targetPins.length - 1].lat, targetPins[targetPins.length - 1].lng
      )
    : null;

  const formatDist = (m: number) => {
    if (useYards) return `${Math.round(metersToYards(m))} yds`;
    return `${Math.round(m)} m`;
  };

  const clearTargets = () => {
    setTargetPins([]);
    setSelectedTargetId(null);
    pinCounter.current = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const selectCourse = (course: any) => {
    setSelectedCourse(course);
    setTargetPins([]);
    setSelectedTargetId(null);
    pinCounter.current = 0;
    setShowCoursePicker(false);
    const coords = KNOWN_COORDS[course.name] || { lat: 36.16, lng: -86.78 };
    if (simMode) {
      setSimulatedLocation({ lat: coords.lat + 0.001, lng: coords.lng + 0.001 });
    }
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 800);
    }
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <CourseMap
        center={courseCenter}
        simulatedLocation={simulatedLocation}
        simMode={simMode}
        targetPins={targetPins}
        selectedTarget={selectedTarget}
        currentPos={currentPos}
        showsUserLocation={!simMode && locationPermission === true}
        onMapPress={handleMapPress}
        onSimDrag={handleSimDrag}
        onTargetSelect={handleTargetSelect}
        onMapReady={() => {}}
        mapRef={mapRef}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.background + "E0" }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => setShowCoursePicker(!showCoursePicker)}
          style={[styles.courseSelector, { backgroundColor: colors.background + "E0" }]}
        >
          <Ionicons name="golf" size={16} color={colors.primary} />
          <PremiumText variant="body" style={{ fontSize: 13, fontWeight: "700", flex: 1 }} numberOfLines={1}>
            {selectedCourse?.name || "Select Course"}
          </PremiumText>
          <Ionicons name={showCoursePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => {
            setSimMode(!simMode);
            Haptics.selectionAsync();
            if (!simMode) {
              setSimulatedLocation({ lat: courseCenter.lat + 0.001, lng: courseCenter.lng + 0.001 });
            }
          }}
          style={[styles.iconBtn, { backgroundColor: simMode ? "#2196F330" : colors.background + "E0" }]}
        >
          <Ionicons name={simMode ? "locate" : "navigate-outline"} size={20} color={simMode ? "#2196F3" : colors.text} />
        </Pressable>
      </View>

      {showCoursePicker && (
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.coursePicker, { backgroundColor: colors.background + "F5", top: insets.top + webTopInset + 56 }]}>
          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {(courses || []).map((c: any) => (
              <Pressable key={c.id} onPress={() => selectCourse(c)} style={[styles.coursePickerItem, { borderBottomColor: colors.border }]}>
                <PremiumText variant="body" style={{ fontSize: 13 }} numberOfLines={1}>{c.name}</PremiumText>
                <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>{c.city}, {c.state}</PremiumText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <View style={[styles.toolBar, { bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16 }]}>
        <Animated.View entering={SlideInDown.delay(200).duration(400)} style={{ gap: 8, width: "100%" }}>
          {distance !== null && (
            <GlassCard style={[styles.distCard, { backgroundColor: colors.background + "E8" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={[styles.distIcon, { backgroundColor: "#FF572220" }]}>
                  <Ionicons name="flag" size={18} color="#FF5722" />
                </View>
                <View style={{ flex: 1 }}>
                  <PremiumText variant="caption" color={colors.textMuted} style={{ fontSize: 10 }}>
                    DISTANCE TO TARGET {targetPins.findIndex((p) => p.id === selectedTargetId) + 1}
                  </PremiumText>
                  <PremiumText variant="hero" style={{ fontSize: 32, lineHeight: 36 }}>
                    {formatDist(distance)}
                  </PremiumText>
                </View>
                <Pressable onPress={() => { setUseYards(!useYards); Haptics.selectionAsync(); }} style={[styles.unitToggle, { backgroundColor: colors.surfaceElevated }]}>
                  <PremiumText variant="caption" color={colors.primary} style={{ fontSize: 11, fontWeight: "700" }}>
                    {useYards ? "YDS" : "M"}
                  </PremiumText>
                </Pressable>
              </View>
              {distanceBetweenLastTwo !== null && targetPins.length >= 2 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <Ionicons name="swap-horizontal" size={12} color={colors.textMuted} />
                  <PremiumText variant="caption" color={colors.textSecondary} style={{ fontSize: 11 }}>
                    Last two pins: {formatDist(distanceBetweenLastTwo)}
                  </PremiumText>
                </View>
              )}
            </GlassCard>
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={clearTargets}
              style={[styles.actionBtn, { backgroundColor: colors.background + "E0", flex: 1 }]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
              <PremiumText variant="caption" color={colors.error} style={{ fontWeight: "700", fontSize: 11 }}>Clear</PremiumText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (currentPos && mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: currentPos.lat,
                    longitude: currentPos.lng,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                  }, 600);
                }
                Haptics.selectionAsync();
              }}
              style={[styles.actionBtn, { backgroundColor: colors.background + "E0", flex: 1 }]}
            >
              <Ionicons name="locate" size={16} color="#2196F3" />
              <PremiumText variant="caption" color="#2196F3" style={{ fontWeight: "700", fontSize: 11 }}>My Pos</PremiumText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: courseCenter.lat,
                    longitude: courseCenter.lng,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }, 600);
                }
                Haptics.selectionAsync();
              }}
              style={[styles.actionBtn, { backgroundColor: colors.background + "E0", flex: 1 }]}
            >
              <Ionicons name="golf" size={16} color={colors.primary} />
              <PremiumText variant="caption" color={colors.primary} style={{ fontWeight: "700", fontSize: 11 }}>Course</PremiumText>
            </Pressable>
          </View>

          {simMode && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={[styles.simBanner, { backgroundColor: "#2196F315" }]}>
                <Ionicons name="information-circle" size={14} color="#2196F3" />
                <PremiumText variant="caption" color="#2196F3" style={{ fontSize: 10, flex: 1 }}>
                  Simulation mode — drag the blue dot to set your position, tap to drop target pins
                </PremiumText>
              </View>
            </Animated.View>
          )}

          {!simMode && !currentPos && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={[styles.simBanner, { backgroundColor: "#FF980015" }]}>
                <Ionicons name="location-outline" size={14} color="#FF9800" />
                <PremiumText variant="caption" color="#FF9800" style={{ fontSize: 10, flex: 1 }}>
                  Acquiring GPS signal...
                </PremiumText>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  courseSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  coursePicker: {
    position: "absolute",
    left: 12,
    right: 12,
    maxHeight: 300,
    borderRadius: 16,
    padding: 8,
    zIndex: 20,
    overflow: "hidden",
  },
  coursePickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  toolBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 10,
  },
  distCard: {
    padding: 16,
  },
  distIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unitToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 20,
  },
  simBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 12,
  },
});
