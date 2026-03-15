import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    resultado: '⊞', tracker: '↗', vagas: '💼', negociacao: '🎯', perfil: '👤',
  };
  return (
    <View style={[ti.wrap, focused && ti.wrapActive]}>
      <Text style={[ti.icon]}>{icons[name]}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap:       { width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center' },
  wrapActive: { backgroundColor:'rgba(29,158,117,0.18)' },
  icon:       { fontSize:16 },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161616',
          borderTopColor:  'rgba(255,255,255,0.08)',
          borderTopWidth:  1,
          height:          72,
          paddingBottom:   12,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: { fontSize:10, fontWeight:'600' },
      }}
    >
      <Tabs.Screen
        name="resultado"
        options={{ title:'Início', tabBarIcon:({ focused }) => <TabIcon name="resultado" focused={focused} /> }}
      />
      <Tabs.Screen
        name="tracker"
        options={{ title:'Tracker', tabBarIcon:({ focused }) => <TabIcon name="tracker" focused={focused} /> }}
      />
      <Tabs.Screen
        name="vagas"
        options={{ title:'Vagas', tabBarIcon:({ focused }) => <TabIcon name="vagas" focused={focused} /> }}
      />
      <Tabs.Screen
        name="negociacao"
        options={{ title:'Negociação', tabBarIcon:({ focused }) => <TabIcon name="negociacao" focused={focused} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title:'Perfil', tabBarIcon:({ focused }) => <TabIcon name="perfil" focused={focused} /> }}
      />
    </Tabs>
  );
}
