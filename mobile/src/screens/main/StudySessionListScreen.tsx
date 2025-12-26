import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../services/api';

interface StudySession {
  id: number;
  exam_id: number;
  exam_name?: string;
  mode?: string;
  score?: number;
  create_time: string;
  total_count?: number;
  wrong_count?: number;
  favorite_count?: number;
  completed_count?: number; // 已完成题目数量（仅对"全部"模式有效）
}

interface StudySessionListScreenProps {
  navigation: any;
  onStartPractice: (sessionId: number, mode: 'all' | 'wrong' | 'favorite') => void;
}

const StudySessionListScreen: React.FC<StudySessionListScreenProps> = ({
  navigation,
  onStartPractice,
}) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [StudySessionList] 页面获得焦点，刷新学习记录');
      fetchSessions();
    }, [])
  );

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<{code: number; data: StudySession[]; message?: string}>(
        '/api/c/study/sessions',
      );

      if (response.code === 0) {
        setSessions(response.data || []);
        setError('');
      } else {
        throw new Error(response.message || '获取学习记录失败');
      }
    } catch (err: any) {
      console.error('获取学习记录失败:', err);
      setError('加载失败: ' + String(err.message || err));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async (sessionId: number, mode: 'all' | 'wrong' | 'favorite') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // 检查题目数量
    if (mode === 'all' && (!session.total_count || session.total_count === 0)) {
      Alert.alert('提示', '该学习记录中没有题目');
      return;
    }
    if (mode === 'wrong' && (!session.wrong_count || session.wrong_count === 0)) {
      Alert.alert('提示', '该学习记录中没有错题');
      return;
    }
    if (mode === 'favorite' && (!session.favorite_count || session.favorite_count === 0)) {
      Alert.alert('提示', '该学习记录中没有收藏题目');
      return;
    }

    // 在选择题库时就建立会话，确保会话在内存中
    try {
      setLoading(true);
      console.log(`🔄 [StudySessionList] 开始初始化练习会话: sessionId=${sessionId}, mode=${mode}`);
      
      const response = await api.post<{
        code: number;
        data: {totalCount: number};
        message?: string;
      }>(`/api/c/study/sessions/${sessionId}/start`, {
        mode: mode,
      });

      if (response.code !== 0) {
        if (mode === 'wrong' && response.message?.includes('没有错题')) {
          Alert.alert('提示', '该学习记录中没有错题');
          return;
        }
        if (mode === 'favorite' && response.message?.includes('没有收藏题目')) {
          Alert.alert('提示', '该学习记录中没有收藏题目');
          return;
        }
        throw new Error(response.message || '初始化练习会话失败');
      }

      console.log(`✅ [StudySessionList] 练习会话已建立: sessionId=${sessionId}, mode=${mode}, totalCount=${response.data.totalCount}`);
      
      // 会话已建立，导航到练习页面
      onStartPractice(sessionId, mode);
    } catch (err: any) {
      console.error('❌ [StudySessionList] 初始化练习会话失败:', err);
      Alert.alert('错误', '初始化练习会话失败: ' + String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>错误: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>学习记录</Text>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无学习记录</Text>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          {sessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                {session.exam_name || `Exam #${session.exam_id}`}
              </Text>
              
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionInfoText}>
                  <Text style={styles.infoLabel}>模式:</Text> {session.mode || '-'}
                </Text>
                {session.score !== null && session.score !== undefined && (
                  <Text style={styles.sessionInfoText}>
                    <Text style={styles.infoLabel}>分数:</Text> {session.score}
                  </Text>
                )}
                <Text style={styles.sessionInfoText}>
                  <Text style={styles.infoLabel}>创建时间:</Text>{' '}
                  {new Date(session.create_time).toLocaleString()}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.practiceButton, styles.allButton]}
                  onPress={() => handleStartPractice(session.id, 'all')}
                  activeOpacity={0.7}>
                  <Text style={styles.buttonText}>
                    全部 {session.total_count !== undefined && session.total_count > 0 ? (
                      session.completed_count !== undefined && session.completed_count !== null
                        ? `${session.completed_count}/${session.total_count}`
                        : `0/${session.total_count}`
                    ) : (
                      session.total_count !== undefined ? `(${session.total_count})` : ''
                    )}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.practiceButton, styles.wrongButton]}
                  onPress={() => handleStartPractice(session.id, 'wrong')}
                  activeOpacity={0.7}>
                  <Text style={styles.buttonText}>
                    错题 {session.wrong_count !== undefined && `(${session.wrong_count})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.practiceButton, styles.favoriteButton]}
                  onPress={() => handleStartPractice(session.id, 'favorite')}
                  activeOpacity={0.7}>
                  <Text style={styles.buttonText}>
                    收藏 {session.favorite_count !== undefined && `(${session.favorite_count})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderColor: '#fcc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  sessionsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  practiceButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allButton: {
    backgroundColor: '#ff6b35',
  },
  wrongButton: {
    backgroundColor: '#52c41a',
  },
  favoriteButton: {
    backgroundColor: '#faad14',
    flexBasis: '100%',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudySessionListScreen;

