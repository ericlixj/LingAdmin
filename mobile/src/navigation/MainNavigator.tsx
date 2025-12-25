import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/main/HomeScreen';
import LifeInfoScreen from '../screens/main/LifeInfoScreen';
import FlyerDetailsScreen from '../screens/main/FlyerDetailsScreen';
import GasStationsScreen from '../screens/main/GasStationsScreen';
import PostcodeManagerScreen from '../screens/main/PostcodeManagerScreen';
import StudySystemScreen from '../screens/main/StudySystemScreen';
import AccountScreen from '../screens/main/AccountScreen';
import PracticeScreen from '../screens/main/PracticeScreen';

export type MainTabParamList = {
  Home: undefined;
  LifeInfo: undefined;
  Study: undefined;
  Account: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Flyers: undefined;
  Gas: undefined;
  Postcodes: undefined;
  Practice: {
    sessionId: number;
    practiceMode: 'all' | 'wrong' | 'favorite';
  };
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
        name="LifeInfo"
        component={LifeInfoScreen}
        options={{title: '生活资讯', tabBarLabel: '生活资讯'}}
      />
      <Tab.Screen
        name="Study"
        component={StudySystemScreen}
        options={{title: '学习系统', tabBarLabel: '学习系统'}}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{title: '账户信息', tabBarLabel: '账户'}}
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
      <Stack.Screen
        name="Flyers"
        component={FlyerDetailsScreen}
        options={{title: '传单详情'}}
      />
      <Stack.Screen
        name="Gas"
        component={GasStationsScreen}
        options={{title: '加油站'}}
      />
      <Stack.Screen
        name="Postcodes"
        component={PostcodeManagerScreen}
        options={{title: '邮编管理'}}
      />
      <Stack.Screen
        name="Practice"
        component={PracticeScreen}
        options={{title: '练习'}}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;


