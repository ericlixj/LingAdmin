import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import {ActivityIndicator, View, StyleSheet} from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;







