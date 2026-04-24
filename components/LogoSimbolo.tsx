import { View } from 'react-native'
import Svg, { Circle, Line } from 'react-native-svg'

interface Props {
  color?: string
  size?: number
  style?: any
}

const LogoSimbolo = ({ color = '#ffc06d', size = 120, style }: Props) => (
  <View style={style}>
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Circle cx="60" cy="60" r="45" stroke={color} strokeWidth="10" />
      <Line x1="5" y1="60" x2="115" y2="60" stroke={color} strokeWidth="10" strokeLinecap="round" />
    </Svg>
  </View>
)

export default LogoSimbolo
