import { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "@/constants/theme";
import { PillButton } from "@/components/ui/PillButton";

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  bg: "white" | "blue";
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const slides: Slide[] = [
  {
    key: "onboarding-1",
    bg: "white",
    icon: "boat",
    title: "Réservez votre billet",
    subtitle: "Achetez votre billet où que vous soyez, sans faire la queue.",
  },
  {
    key: "onboarding-2",
    bg: "blue",
    icon: "qr-code",
    title: "Embarquez rapidement",
    subtitle: "Présentez simplement votre QR Code à l'entrée et gagnez du temps.",
  },
  {
    key: "onboarding-3",
    bg: "white",
    icon: "wallet",
    title: "Rechargez votre portefeuille",
    subtitle: "Payez vos billets instantanément via votre wallet sécurisé.",
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const isLast = index === slides.length - 1;
  const isBlue = slides[index].bg === "blue";

  function goNext() {
    if (isLast) {
      router.replace("/(auth)/login");
      return;
    }
    const nextIndex = index + 1;
    listRef.current?.scrollToOffset({ offset: width * nextIndex, animated: true });
    setIndex(nextIndex);
  }

  function skip() {
    router.replace("/(auth)/login");
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isBlue ? colors.primary : colors.white }}
      edges={["top", "bottom"]}
    >
      <View style={{ alignItems: "flex-end", paddingHorizontal: 24, paddingTop: 8 }}>
        {!isLast && (
          <Pressable onPress={skip}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isBlue ? colors.white : colors.textGray,
              }}
            >
              Passer
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: "center", paddingHorizontal: 32 }}>
            <View
              style={{
                width: width - 96,
                height: width - 96,
                borderRadius: 24,
                backgroundColor:
                  item.bg === "blue" ? "rgba(255,255,255,0.15)" : "#EAF1FE",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
              }}
            >
              <Ionicons
                name={item.icon}
                size={96}
                color={item.bg === "blue" ? colors.white : colors.primary}
              />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                textAlign: "center",
                color: item.bg === "blue" ? colors.white : colors.textDark,
                marginBottom: 12,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 14,
                textAlign: "center",
                lineHeight: 20,
                color: item.bg === "blue" ? "rgba(255,255,255,0.85)" : colors.textGray,
              }}
            >
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View style={{ paddingHorizontal: 32, paddingBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {slides.map((slide, i) => (
            <View
              key={slide.key}
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === index
                    ? isBlue
                      ? colors.white
                      : colors.primary
                    : isBlue
                    ? "rgba(255,255,255,0.4)"
                    : colors.border,
              }}
            />
          ))}
        </View>

        <PillButton
          label={isLast ? "Commencer" : "Suivant"}
          variant={isBlue ? "white" : "gradient"}
          onPress={goNext}
        />
      </View>
    </SafeAreaView>
  );
}
