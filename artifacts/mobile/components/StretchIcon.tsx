import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet } from "react-native";

interface StretchIconProps {
  mciIcon: string;
  size?: number;
  color: string;
  bgColor: string;
  boxSize?: number;
  borderRadius?: number;
}

export function StretchIcon({
  mciIcon,
  size = 24,
  color,
  bgColor,
  boxSize = 48,
  borderRadius = 14,
}: StretchIconProps) {
  return (
    <View
      style={[
        styles.box,
        { width: boxSize, height: boxSize, borderRadius, backgroundColor: bgColor },
      ]}
    >
      <MaterialCommunityIcons name={mciIcon as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center" },
});
