import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/main/HomeScreen';
import FlyerDetailsScreen from '../screens/main/FlyerDetailsScreen';
import GasStationsScreen from '../screens/main/GasStationsScreen';
import PostcodeManagerScreen from '../screens/main/PostcodeManagerScreen';

export type MainTabParamList = {
  Home: undefined;
  Flyers: undefined;
  Gas: undefined;
  Postcodes: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  FlyerDetails: undefined;
  GasStations: undefined;
  PostcodeManager: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: '#666',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: '首页', tabBarLabel: '首页'}}
      />
      <Tab.Screen
        name="Flyers"
        component={FlyerDetailsScreen}
        options={{title: '传单详情', tabBarLabel: '传单'}}
      />
      <Tab.Screen
        name="Gas"
        component={GasStationsScreen}
        options={{title: '加油站', tabBarLabel: '加油站'}}
      />
      <Tab.Screen
        name="Postcodes"
        component={PostcodeManagerScreen}
        options={{title: '邮编管理', tabBarLabel: '邮编'}}
      />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;


