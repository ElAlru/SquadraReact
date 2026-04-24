import { Platform, StyleSheet, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  isFluid?: boolean;
}

export default function ScreenContainer({ children, isFluid = false }: Props) {
  if (Platform.OS === 'web' && !isFluid) {
    return (
      <View style={styles.flex}>
        <View style={styles.webContainer}>
          {children}
        </View>
      </View>
    );
  }
  return <View style={styles.flex}>{children}</View>;
}

const styles = StyleSheet.create({
  flex:         { flex: 1 },
  webContainer: { width: '100%', flex: 1 },
});
