import { Href, Link } from 'expo-router';
import { Pressable, PressableProps } from 'react-native';

type NavPressableProps = PressableProps & {
  href: Href;
};

export function NavPressable({ href, children, ...props }: NavPressableProps) {
  return (
    <Link href={href} asChild>
      <Pressable {...props}>{children}</Pressable>
    </Link>
  );
}
