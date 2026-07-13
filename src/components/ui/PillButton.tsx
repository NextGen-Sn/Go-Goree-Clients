import { Pressable, Text, PressableProps, ActivityIndicator, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients } from "@/constants/theme";

interface PillButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "gradient" | "white" | "outline";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PillButton({
  label,
  variant = "gradient",
  loading = false,
  disabled,
  style,
  ...props
}: PillButtonProps) {
  const content = loading ? (
    <ActivityIndicator color={variant === "white" ? colors.primary : colors.white} />
  ) : (
    <Text
      style={{
        fontSize: 16,
        fontWeight: "700",
        color:
          variant === "white"
            ? colors.primary
            : variant === "outline"
            ? colors.textDark
            : colors.white,
      }}
    >
      {label}
    </Text>
  );

  if (variant === "gradient") {
    return (
      <Pressable disabled={disabled || loading} {...props}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 54,
            borderRadius: 27,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        {
          height: 54,
          borderRadius: 27,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: variant === "white" ? colors.white : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      {...props}
    >
      {content}
    </Pressable>
  );
}
