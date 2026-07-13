import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    try {
      setError(null);
      await login({ email, password });
    } catch (err) {
      setError((err as { message: string }).message);
    }
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-white px-6">
      <Text className="mb-4 text-2xl font-bold text-slate-900">
        Connexion
      </Text>
      <TextInput
        className="rounded-lg border border-slate-300 px-4 py-3"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="rounded-lg border border-slate-300 px-4 py-3"
        placeholder="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text className="text-red-500">{error}</Text> : null}
      <Pressable
        className="items-center rounded-lg bg-slate-900 py-3"
        onPress={handleSubmit}
      >
        <Text className="font-semibold text-white">Se connecter</Text>
      </Pressable>
    </View>
  );
}
