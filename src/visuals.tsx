// @ts-nocheck
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { fonts, getTheme, type SparkTheme } from './theme';

export type SparkIconName =
  | 'circle'
  | 'inbox'
  | 'network'
  | 'folder'
  | 'settings'
  | 'sparkles'
  | 'search'
  | 'timer'
  | 'check'
  | 'plus'
  | 'expand';

export function IconGlyph({
  color = '#171512',
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  color?: string;
  name: SparkIconName;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth,
  };

  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      {name === 'settings' ? (
        <Path
          {...common}
          d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Zm0-5 .9 2.4 2.5.6 2-1.4 1.7 1.7-1.3 2.1.7 2.4 2.2 1v2.4l-2.2.9-.7 2.4 1.3 2.1-1.7 1.7-2-1.4-2.5.6-.9 2.4h-2.4l-.9-2.4-2.5-.6-2 1.4-1.7-1.7 1.3-2.1-.7-2.4-2.2-.9v-2.4l2.2-1 .7-2.4-1.3-2.1 1.7-1.7 2 1.4 2.5-.6.9-2.4H12Z"
        />
      ) : null}
      {name === 'sparkles' ? (
        <>
          <Path {...common} d="M9.5 3.5 11 8l4.5 1.5L11 11l-1.5 4.5L8 11 3.5 9.5 8 8l1.5-4.5Z" />
          <Path {...common} d="M17 13.5 18 16l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle {...common} cx="10.5" cy="10.5" r="6.2" />
          <Path {...common} d="m15.2 15.2 4.3 4.3" />
        </>
      ) : null}
      {name === 'circle' ? (
        <>
          <Circle {...common} cx="12" cy="12" r="8.2" />
          <Circle fill={color} cx="12" cy="12" r="2.2" />
        </>
      ) : null}
      {name === 'inbox' ? (
        <>
          <Path {...common} d="M4.5 6.5h15l-2.1 11h-11L4.5 6.5Z" />
          <Path {...common} d="M8 13h2.4l1.6 2 1.6-2H16" />
        </>
      ) : null}
      {name === 'network' ? (
        <>
          <Rect {...common} height="4.5" rx="1" width="4.5" x="9.75" y="3.5" />
          <Rect {...common} height="4.5" rx="1" width="4.5" x="3.5" y="16" />
          <Rect {...common} height="4.5" rx="1" width="4.5" x="16" y="16" />
          <Path {...common} d="M12 8v4.5M6 16l6-3.5 6 3.5" />
        </>
      ) : null}
      {name === 'folder' ? (
        <>
          <Path {...common} d="M4 7.5h5l1.6 2H20v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z" />
          <Path {...common} d="M8 14h8" />
        </>
      ) : null}
      {name === 'timer' ? (
        <>
          <Circle {...common} cx="12" cy="13" r="7" />
          <Path {...common} d="M10 3h4M12 13l3-3" />
        </>
      ) : null}
      {name === 'check' ? (
        <>
          <Circle {...common} cx="12" cy="12" r="8" />
          <Path {...common} d="m8.5 12 2.4 2.4 4.8-5" />
        </>
      ) : null}
      {name === 'plus' ? <Path {...common} d="M12 5v14M5 12h14" /> : null}
      {name === 'expand' ? (
        <>
          <Path {...common} d="M8 4.5H4.5V8M16 4.5h3.5V8M8 19.5H4.5V16M16 19.5h3.5V16" />
          <Path {...common} d="M9 9 4.5 4.5M15 9l4.5-4.5M9 15l-4.5 4.5M15 15l4.5 4.5" />
        </>
      ) : null}
    </Svg>
  );
}

export function WeaveConstellation({
  clusters,
  compact,
  theme,
}: {
  clusters: any[];
  compact?: boolean;
  theme: SparkTheme;
}) {
  const height = compact ? 96 : 260;
  const items = clusters.length
    ? clusters
    : [
        { id: 'ghost-1', title: '产品层级', captureIds: ['1'], strength: 0.8 },
        { id: 'ghost-2', title: '视觉语言', captureIds: ['2'], strength: 0.7 },
        { id: 'ghost-3', title: '编织引擎', captureIds: ['3'], strength: 0.9 },
        { id: 'ghost-4', title: '数据底座', captureIds: ['4'], strength: 0.65 },
      ];
  const positions = compact
    ? [
        { x: 54, y: 28 },
        { x: 142, y: 62 },
        { x: 232, y: 26 },
        { x: 306, y: 64 },
      ]
    : [
        { x: 58, y: 58 },
        { x: 184, y: 104 },
        { x: 310, y: 50 },
        { x: 102, y: 188 },
        { x: 278, y: 196 },
      ];
  const tones = [theme.colors.sage, theme.colors.cobalt, theme.colors.coral, theme.colors.violet, theme.colors.gold];

  return (
    <View style={{ borderCurve: 'continuous', borderRadius: 8, height, overflow: 'hidden', backgroundColor: theme.isDark ? '#1c1a17' : '#fffaf2' }}>
      <Svg height="100%" viewBox={`0 0 360 ${height}`} width="100%">
        <Defs>
          <SvgLinearGradient id="thread" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.sage} stopOpacity="0.28" />
            <Stop offset="0.55" stopColor={theme.colors.coral} stopOpacity="0.22" />
            <Stop offset="1" stopColor={theme.colors.cobalt} stopOpacity="0.24" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={
            compact
              ? 'M54 28 C106 12, 111 76, 142 62 S217 6, 232 26 S274 94, 306 64'
              : 'M58 58 C112 20, 132 132, 184 104 S252 18, 310 50 C274 128, 320 186, 278 196 S144 224, 102 188 C82 138, 124 82, 58 58'
          }
          fill="none"
          stroke="url(#thread)"
          strokeLinecap="round"
          strokeWidth={compact ? 2 : 2.4}
        />
        <Path
          d={compact ? 'M44 72 C126 42, 214 78, 322 28' : 'M42 158 C118 86, 238 152, 326 116'}
          fill="none"
          stroke={theme.colors.line}
          strokeLinecap="round"
          strokeOpacity="0.9"
          strokeWidth={1.4}
        />
        {items.slice(0, compact ? 4 : 5).map((cluster, index) => {
          const point = positions[index];
          const tone = tones[index % tones.length];
          const radius = compact ? 11 + index * 0.8 : 17 + Math.min(8, cluster.captureIds.length * 2);
          return (
            <G key={cluster.id}>
              <Circle cx={point.x} cy={point.y} fill={theme.colors.surface} r={radius + 7} stroke={theme.colors.hairline} strokeWidth="1" />
              <Circle cx={point.x} cy={point.y} fill={theme.isDark ? '#24211d' : '#fffdf8'} r={radius} stroke={tone} strokeWidth={compact ? 2.4 : 3} />
              {!compact ? (
                <>
                  <SvgText fill={theme.colors.ink} fontFamily={fonts.bodyMedium} fontSize="12" x={Math.min(point.x + 20, 270)} y={point.y - 2}>
                    {cluster.title}
                  </SvgText>
                  <SvgText fill={theme.colors.muted} fontFamily={fonts.body} fontSize="10" x={Math.min(point.x + 20, 270)} y={point.y + 14}>
                    {cluster.captureIds.length} 条灵感
                  </SvgText>
                </>
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export function darkPreviewTheme() {
  return getTheme('dark');
}
