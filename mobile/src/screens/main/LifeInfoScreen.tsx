import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const LifeInfoScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>生活资讯</Text>
        
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
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

export default LifeInfoScreen;
