import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type Props = {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const FLIP_MS = 520;
const PERSPECTIVE = 1400;

export function FlipCard({ flipped, front, back, style }: Props) {
  const angle = useSharedValue(flipped ? 180 : 0);
  useEffect(() => {
    angle.value = withTiming(flipped ? 180 : 0, { duration: FLIP_MS, easing: Easing.out(Easing.cubic) });
  }, [flipped, angle]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: angle.value < 90 ? 1 : 0,
    transform: [
      { perspective: PERSPECTIVE },
      { rotateY: `${angle.value}deg` },
      { scale: 1 - Math.sin((angle.value * Math.PI) / 180) * 0.04 },
    ],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: angle.value >= 90 ? 1 : 0,
    transform: [
      { perspective: PERSPECTIVE },
      { rotateY: `${angle.value + 180}deg` },
      { scale: 1 - Math.sin((angle.value * Math.PI) / 180) * 0.04 },
    ],
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        style={[styles.face, frontStyle]}
        pointerEvents={flipped ? "none" : "auto"}
        accessibilityElementsHidden={flipped}
        importantForAccessibility={flipped ? "no-hide-descendants" : "auto"}
      >
        {front}
      </Animated.View>
      <Animated.View
        style={[styles.face, backStyle]}
        pointerEvents={flipped ? "auto" : "none"}
        accessibilityElementsHidden={!flipped}
        importantForAccessibility={flipped ? "auto" : "no-hide-descendants"}
      >
        {flipped ? back : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  face: { ...StyleSheet.absoluteFill },
});
