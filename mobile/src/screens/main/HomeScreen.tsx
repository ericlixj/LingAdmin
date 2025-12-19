import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {useEnvironment} from '../../hooks/useEnvironment';
import {Environment, ENVIRONMENTS} from '../../config/environments';
import api from '../../services/api';

const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const navigation = useNavigation();
  const {currentEnvironment, setEnvironment, getCurrentConfig, loading: envLoading} = useEnvironment();
  const [switching, setSwitching] = useState(false);

  const currentConfig = getCurrentConfig();

  const handleLogout = async () => {
    await logout();
  };

  // 切换环境
  const handleSwitchEnvironment = async (env: Environment) => {
    if (env === currentEnvironment) {
      return;
    }

    try {
      setSwitching(true);
      await setEnvironment(env);
      
      // 更新 API 服务的 baseURL
      await api.updateEnvironment();
      
      Alert.alert(
        '环境已切换',
        `已切换到 ${ENVIRONMENTS[env].name}\n\nAPI 地址: ${ENVIRONMENTS[env].apiBaseUrl}`,
        [{text: '确定'}],
      );
    } catch (error: any) {
      Alert.alert('错误', `切换环境失败: ${error.message}`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {/* 环境信息 */}
        {!envLoading && (
          <View style={styles.environmentBadge}>
            <Text style={styles.environmentBadgeText}>
              {currentConfig.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* 环境切换区域 */}
        <View style={styles.environmentSection}>
          <Text style={styles.sectionTitle}>环境配置</Text>
          <Text style={styles.environmentCurrentUrl}>{currentConfig.apiBaseUrl}</Text>
          
          <View style={styles.environmentButtons}>
            {(Object.keys(ENVIRONMENTS) as Environment[]).map(env => {
              const config = ENVIRONMENTS[env];
              const isSelected = env === currentEnvironment;
              
              return (
                <TouchableOpacity
                  key={env}
                  style={[
                    styles.environmentButton,
                    isSelected && styles.environmentButtonActive,
                  ]}
                  onPress={() => handleSwitchEnvironment(env)}
                  disabled={switching || isSelected}>
                  <Text
                    style={[
                      styles.environmentButtonText,
                      isSelected && styles.environmentButtonTextActive,
                    ]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {switching && (
            <View style={styles.switchingIndicator}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.switchingText}>切换中...</Text>
            </View>
          )}
        </View>

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

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Settings' as never)}>
          <Text style={styles.cardTitle}>设置</Text>
          <Text style={styles.cardDescription}>
            更多应用设置
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>登出</Text>
      </TouchableOpacity>
    </ScrollView>
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
    position: 'relative',
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
    marginBottom: 8,
  },
  environmentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  environmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
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
  environmentSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  environmentCurrentUrl: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  environmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  environmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  environmentButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  environmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  environmentButtonTextActive: {
    color: '#fff',
  },
  switchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  switchingText: {
    fontSize: 12,
    color: '#666',
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


