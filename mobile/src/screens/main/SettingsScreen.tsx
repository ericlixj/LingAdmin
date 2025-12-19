import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useEnvironment} from '../../hooks/useEnvironment';
import {Environment, ENVIRONMENTS, getAllEnvironments} from '../../config/environments';
import api from '../../services/api';

const SettingsScreen: React.FC = () => {
  const {currentEnvironment, setEnvironment, getCurrentConfig, loading} = useEnvironment();
  const [switching, setSwitching] = useState(false);

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
        `已切换到 ${ENVIRONMENTS[env].name}\n\nAPI 地址: ${ENVIRONMENTS[env].apiBaseUrl}\n\n请重新登录以使用新环境。`,
        [
          {
            text: '确定',
            onPress: () => {
              // 可以在这里触发登出，让用户重新登录
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('错误', `切换环境失败: ${error.message}`);
    } finally {
      setSwitching(false);
    }
  };

  const currentConfig = getCurrentConfig();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>环境配置</Text>
          <Text style={styles.sectionDescription}>
            切换不同的 API 环境配置
          </Text>

          <View style={styles.currentEnvironment}>
            <Text style={styles.currentLabel}>当前环境</Text>
            <Text style={styles.currentName}>{currentConfig.name}</Text>
            <Text style={styles.currentUrl}>{currentConfig.apiBaseUrl}</Text>
            <Text style={styles.currentDescription}>{currentConfig.description}</Text>
          </View>

          <View style={styles.environmentList}>
            {getAllEnvironments().map(env => {
              const config = ENVIRONMENTS[env];
              const isSelected = env === currentEnvironment;

              return (
                <TouchableOpacity
                  key={env}
                  style={[
                    styles.environmentItem,
                    isSelected && styles.environmentItemSelected,
                  ]}
                  onPress={() => handleSwitchEnvironment(env)}
                  disabled={switching || isSelected}>
                  <View style={styles.environmentItemContent}>
                    <View style={styles.environmentItemHeader}>
                      <Text
                        style={[
                          styles.environmentItemName,
                          isSelected && styles.environmentItemNameSelected,
                        ]}>
                        {config.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>当前</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.environmentItemUrl}>
                      {config.apiBaseUrl}
                    </Text>
                    <Text style={styles.environmentItemDescription}>
                      {config.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {switching && (
            <View style={styles.switchingIndicator}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.switchingText}>切换环境中...</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提示</Text>
          <Text style={styles.tipText}>
            • 切换环境后，建议重新登录以确保使用正确的 API{'\n'}
            • 开发环境适用于本地开发测试{'\n'}
            • 预览和生产环境使用相同的生产 API{'\n'}
            • 环境配置会保存，下次启动应用时自动使用
          </Text>
        </View>
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
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  currentEnvironment: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  currentLabel: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  currentUrl: {
    fontSize: 14,
    color: '#0066cc',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  currentDescription: {
    fontSize: 12,
    color: '#666',
  },
  environmentList: {
    gap: 12,
  },
  environmentItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  environmentItemSelected: {
    borderColor: '#007bff',
    borderWidth: 2,
    backgroundColor: '#f0f7ff',
  },
  environmentItemContent: {
    padding: 16,
  },
  environmentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  environmentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  environmentItemNameSelected: {
    color: '#007bff',
  },
  selectedBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  environmentItemUrl: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  environmentItemDescription: {
    fontSize: 12,
    color: '#999',
  },
  switchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  switchingText: {
    fontSize: 14,
    color: '#666',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SettingsScreen;
