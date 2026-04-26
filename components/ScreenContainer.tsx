import { Platform, StyleSheet, View } from 'react-native';
import LogoSimbolo from './LogoSimbolo';
import { useTheme } from '../lib/useTheme';

interface Props {
  children: React.ReactNode;
  isFluid?: boolean;
}

export default function ScreenContainer({ children }: Props) {
  const c = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: c.fondo }]}>
      <LogoSimbolo
        size={700}
        color={c.colorMarca}
        style={[styles.watermark, { opacity: c.marcaAguaOpacity }]}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -350 }, { translateY: -350 }],
  },
  content: {
    flex: 1,
    width: '100%',
  },
});
