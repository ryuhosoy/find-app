// デザインテーマ:「コンビニの棚をパッと照らすマーカー」がコンセプト。
// 背景はクリーンな余白多めの生成りホワイト、アクセントは目を引くコーラルオレンジ。
// 「自社DBで裏付け済み」を示すセーフグリーンと、AI推定を示すニュートラルグレーを併用する。

export const colors = {
  bg: '#FAF7F2',
  bgAlt: '#F1ECE3',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F1EA',
  border: '#E9E2D6',
  borderStrong: '#DCD2C0',

  ink: '#211A14',
  inkSoft: '#5B5248',
  inkFaint: '#9C927F',

  accent: '#FF6B3D',
  accentSoft: '#FFE3D3',
  accentDeep: '#E14E1F',

  highlight: '#FFC93C',
  highlightSoft: '#FFF3D2',

  good: '#2FA66A',
  goodSoft: '#DFF3E6',

  info: '#3E7CB1',
  infoSoft: '#E1EEF7',

  danger: '#D64545',
  dangerSoft: '#FBE3E3',

  overlaySearch: '#FF3B30',
  overlayRecommend: '#FF6B3D',
  overlayCandidate: '#9C927F',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const font = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const },
};

export const shadow = {
  card: {
    shadowColor: '#3A2E1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  button: {
    shadowColor: '#E14E1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
};
