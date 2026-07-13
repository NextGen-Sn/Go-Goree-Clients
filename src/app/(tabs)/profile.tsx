import { View, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-xl font-semibold text-slate-900">
        {user ? user.name : "Non connecté"}
      </Text>
    </View>
  );
}
