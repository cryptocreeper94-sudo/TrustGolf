import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";

export default function BomberDashboardRedirect() {
  useEffect(() => {
    router.replace("/");
  }, []);

  return <View style={{ flex: 1 }} />;
}
