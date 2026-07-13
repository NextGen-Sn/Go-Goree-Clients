import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-slate-900">
        Go Goree
      </Text>
      <Text className="mt-2 text-slate-500">
        Let's cook!
      </Text>
    </View>
  );
}
