import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../navigation/AuthNavigator';
import {API_CONFIG} from '../../config/api';
import {useEnvironment} from '../../hooks/useEnvironment';
import {Environment, ENVIRONMENTS, getAllEnvironments} from '../../config/environments';
import api from '../../services/api';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const {login} = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const {currentEnvironment, setEnvironment, getCurrentConfig, loading: envLoading} = useEnvironment();
  
  const currentConfig = getCurrentConfig();

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // 登录成功后，AuthContext 会自动更新，RootNavigator 会切换到 MainNavigator
    } catch (error: any) {
      // 显示详细的错误信息
      let errorMessage = error.message || '登录失败，请检查您的邮箱和密码';
      
      // 如果是网络错误，提供更详细的提示
      if (error.originalError) {
        const originalError = error.originalError;
        if (originalError.code === 'ECONNREFUSED' || originalError.code === 'ENOTFOUND') {
          errorMessage = `无法连接到服务器\n\n请检查：\n1. API 地址是否正确\n2. 后端服务是否运行\n3. 网络连接是否正常\n\n当前 API 地址：${error.baseURL || '未知'}`;
        } else if (originalError.code === 'ECONNABORTED') {
          errorMessage = '请求超时，请检查网络连接';
        }
      }
      
      // 在开发环境下，显示完整的错误信息
      if (__DEV__) {
        console.error('登录错误详情:', {
          message: error.message,
          originalError: error.originalError,
          method: error.method,
          url: error.url,
          baseURL: error.baseURL,
        });
      }
      
      Alert.alert('登录失败', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>LingAdmin</Text>
          <Text style={styles.subtitle}>登录您的账户</Text>
          
          {/* 环境切换区域 */}
          <View style={styles.environmentSection}>
            <Text style={styles.environmentLabel}>当前环境: {currentConfig.name}</Text>
            <Text style={styles.environmentUrl} numberOfLines={1}>
              {currentConfig.apiBaseUrl}
            </Text>
            
            <View style={styles.environmentButtons}>
              {getAllEnvironments().map(env => {
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
                    disabled={switching || isSelected || loading}>
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

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="邮箱"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>登录</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}>
              <Text style={styles.linkText}>
                还没有账户？立即注册
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
  environmentSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  environmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  environmentUrl: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
});

export default LoginScreen;


