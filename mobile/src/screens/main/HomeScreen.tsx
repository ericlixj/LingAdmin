import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>功能</Text>
        
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Flyers' as never)}>
          <Text style={styles.cardTitle}>传单详情</Text>
          <Text style={styles.cardDescription}>
            搜索和浏览传单详情信息
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Gas' as never)}>
          <Text style={styles.cardTitle}>加油站查询</Text>
          <Text style={styles.cardDescription}>
            根据邮编查找附近的加油站
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Postcodes' as never)}>
          <Text style={styles.cardTitle}>邮编管理</Text>
          <Text style={styles.cardDescription}>
            管理您的常用邮编
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>登出</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;


