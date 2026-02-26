import { useWindowDimensions } from "react-native";

export type LayoutSize = "compact" | "medium" | "expanded";

interface ResponsiveLayout {
  width: number;
  size: LayoutSize;
  isDesktop: boolean;
  contentMaxWidth: number;
  heroItemWidth: number;
  courseItemWidth: number;
  dealItemWidth: number;
  gridColumns: number;
  bodyPadding: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();

  const size: LayoutSize =
    width >= 1024 ? "expanded" : width >= 600 ? "medium" : "compact";
  const isDesktop = size === "expanded" || size === "medium";

  const contentMaxWidth = size === "expanded" ? 1200 : 10000;
  const bodyPadding = size === "expanded" ? 48 : size === "medium" ? 24 : 16;

  const usableWidth = width - bodyPadding * 2;

  const heroItemWidth =
    size === "expanded" ? Math.min(usableWidth * 0.32, 380)
    : size === "medium" ? usableWidth * 0.46
    : width * 0.78;

  const courseItemWidth =
    size === "expanded" ? Math.min(usableWidth * 0.24, 280)
    : size === "medium" ? usableWidth * 0.38
    : width * 0.6;

  const dealItemWidth =
    size === "expanded" ? Math.min(usableWidth * 0.32, 380)
    : size === "medium" ? usableWidth * 0.46
    : width * 0.78;

  const gridColumns = size === "expanded" ? 3 : size === "medium" ? 2 : 1;

  return {
    width,
    size,
    isDesktop,
    contentMaxWidth,
    heroItemWidth,
    courseItemWidth,
    dealItemWidth,
    gridColumns,
    bodyPadding,
  };
}
