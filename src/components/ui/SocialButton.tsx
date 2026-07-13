import { Pressable, Text, PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

interface SocialButtonProps extends PressableProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function SocialButton({ label, icon, ...props }: SocialButtonProps) {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 54,
        borderRadius: 27,
        paddingHorizontal: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
      }}
      {...props}
    >
      <Ionicons name={icon} size={20} color={colors.white} />
      <Text
        style={{
          flex: 1,
          textAlign: "center",
          marginRight: 20,
          fontSize: 16,
          fontWeight: "700",
          color: colors.white,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
