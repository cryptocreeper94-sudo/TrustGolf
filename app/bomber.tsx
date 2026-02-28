import { useEffect } from "react";
import { router } from "expo-router";
import { View } from "react-native";

export default function BomberRedirect() {
  useEffect(() => {
    router.replace("/");
  }, []);

  return <View style={{ flex: 1 }} />;
}
