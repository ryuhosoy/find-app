import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYSIS_COUNT_KEY = 'analysis_count';

export async function getAnalysisCount(): Promise<number> {
  const value = await AsyncStorage.getItem(ANALYSIS_COUNT_KEY);
  return value ? Number.parseInt(value, 10) : 0;
}

export async function incrementAnalysisCount(): Promise<number> {
  const next = (await getAnalysisCount()) + 1;
  await AsyncStorage.setItem(ANALYSIS_COUNT_KEY, String(next));
  return next;
}
