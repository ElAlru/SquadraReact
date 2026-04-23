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
  webContainer: { maxWidth: 560, width: '100%', alignSelf: 'center', flex: 1 },
});
