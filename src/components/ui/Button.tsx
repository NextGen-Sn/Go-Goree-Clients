import { Pressable, Text, PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
  label: string;
}

export function Button({ label, className, ...props }: ButtonProps) {
  return (
    <Pressable
      className="items-center rounded-lg bg-slate-900 py-3 active:opacity-80"
      {...props}
    >
      <Text className="font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
