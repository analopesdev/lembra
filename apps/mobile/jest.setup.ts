import "@/shared/i18n";

jest.mock("react-native-reanimated", () => {
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const chain: Record<string, unknown> = {};
  for (const k of ["duration", "easing", "delay", "springify"]) chain[k] = () => chain;
  return {
    __esModule: true,
    default: { View },
    Easing: { out: (f: unknown) => f, cubic: () => 0 },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (value: unknown) => value,
    FadeInDown: chain,
    FadeOut: chain,
    SlideInRight: chain,
    SlideOutLeft: chain,
  };
});
