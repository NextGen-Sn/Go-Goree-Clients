import { View, TextInput, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

interface TextFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  variant?: "light" | "onBlue";
}

export function TextField({
  icon,
  variant = "light",
  style,
  ...props
}: TextFieldProps) {
  const onBlue = variant === "onBlue";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        backgroundColor: onBlue ? colors.inputBgOnBlue : colors.inputBg,
        borderWidth: onBlue ? 1 : 0,
        borderColor: onBlue ? "rgba(255,255,255,0.3)" : "transparent",
      }}
    >
      <Ionicons
        name={icon}
        size={18}
        color={onBlue ? colors.white : colors.textGray}
      />
      <TextInput
        placeholderTextColor={onBlue ? "rgba(255,255,255,0.7)" : colors.textGray}
        style={[
          {
            flex: 1,
            fontSize: 15,
            color: onBlue ? colors.white : colors.textDark,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}
