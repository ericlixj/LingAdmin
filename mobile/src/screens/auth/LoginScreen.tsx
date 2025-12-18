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

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {login} = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

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
          
          {/* 开发模式下显示 API 配置 */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>🔧 调试信息</Text>
              <Text style={styles.debugText}>API: {API_CONFIG.BASE_URL}</Text>
              <Text style={styles.debugText}>超时: {API_CONFIG.TIMEOUT}ms</Text>
            </View>
          )}

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
  debugInfo: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default LoginScreen;


