import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import api from '../../services/api';

interface KnowledgeNode {
  id: number;
  code: string;
  title: string;
  description?: string;
  importance: 'high' | 'medium' | 'low';
  weight?: number;
  sources?: Array<{
    section_id: number;
    chapter: string;
    section?: string;
    page_start?: number;
    page_end?: number;
    anchor_text?: string;
    source?: {
      id: number;
      type: string;
      title: string;
      version?: string;
    };
  }>;
}

interface Question {
  id: number;
  stem: string;
  image_url?: string;
  options: string;
  answer: string;
  explanation?: string;
  explanation_raw?: string;
  explanation_human?: string;
  is_favorited?: boolean;
  note?: string;
  knowledge_nodes?: KnowledgeNode[];
}

interface PracticeScreenProps {
  route: {
    params: {
      sessionId: number;
      practiceMode: 'all' | 'wrong' | 'favorite';
    };
  };
  navigation: any;
}

const PracticeScreen: React.FC<PracticeScreenProps> = ({route, navigation}) => {
  const {sessionId, practiceMode} = route.params;

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [learningItemId, setLearningItemId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [note, setNote] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNote, setEditingNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [finishedHandled, setFinishedHandled] = useState(false); // 完成状态是否已被处理（无论用户选择是或否）
  const finishedHandledRef = useRef(false); // 使用 ref 来同步检查，防止竞态条件
  const fetchingRef = useRef(false); // 防止 fetchNextQuestion 被并发调用

  // 解析选项
  const parseOptions = (optionsStr: string): Array<{label: string; value: string}> => {
    if (!optionsStr) return [];
    try {
      const parsed = JSON.parse(optionsStr);
      if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
        return Object.entries(parsed).map(([key, value]) => ({
          label: key,
          value: String(value),
        }));
      }
      if (Array.isArray(parsed)) {
        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return parsed.map((item, index) => ({
          label: labels[index] || String(index + 1),
          value: typeof item === 'string' ? item : String(item),
        }));
      }
      return [];
    } catch {
      return optionsStr.split('\n').filter(Boolean).map((text, index) => ({
        label: String.fromCharCode(65 + index), // A, B, C...
        value: text,
      }));
    }
  };

  // 解析答案
  const parseAnswer = (answerStr: string): string[] => {
    if (!answerStr) return [];
    try {
      const parsed = JSON.parse(answerStr);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }
      return [String(parsed)];
    } catch {
      return [answerStr];
    }
  };

  // 开始练习（会话已在 StudySessionListScreen 中建立，这里只需要获取第一题）
  useEffect(() => {
    // 重置完成状态处理标志和获取标志
    setFinishedHandled(false);
    finishedHandledRef.current = false; // 重置 ref
    fetchingRef.current = false; // 重置获取标志
    // 会话已经在选择题库时建立，这里直接获取第一题
    // 后端逻辑：
    // - 全部模式：读取进度，从上次完成的位置继续（返回下一题），首次调用不推进索引
    // - 错题模式：从第一题开始，首次调用不推进索引
    // - 收藏模式：从第一题开始，首次调用不推进索引
    // 如果会话不存在，fetchNextQuestion 会自动触发恢复
    fetchNextQuestion();
  }, [sessionId, practiceMode]);

  // 保留 startPractice 函数以备需要时使用（比如手动刷新）
  // 注意：这个函数会重新初始化会话，清除之前的进度
  // 后端逻辑：
  // - 全部模式：读取进度，从上次完成的位置继续（如果有进度）
  // - 错题模式：从第一题开始
  // - 收藏模式：从第一题开始
  const startPractice = async () => {
    try {
      setLoading(true);
      setError('');

      console.log(`🔄 [PracticeScreen] 重新初始化练习会话: sessionId=${sessionId}, mode=${practiceMode}`);

      const response = await api.post<{
        code: number;
        data: {totalCount: number};
        message?: string;
      }>(`/api/c/study/sessions/${sessionId}/start`, {
        mode: practiceMode,
      });

      if (response.code !== 0) {
        if (practiceMode === 'wrong' && response.message?.includes('没有错题')) {
          Alert.alert('提示', '该学习记录中没有错题', [
            {text: '确定', onPress: () => navigation.goBack()},
          ]);
          return;
        }
        if (practiceMode === 'favorite' && response.message?.includes('没有收藏题目')) {
          Alert.alert('提示', '该学习记录中没有收藏题目', [
            {text: '确定', onPress: () => navigation.goBack()},
          ]);
          return;
        }
        throw new Error(response.message || '开始练习失败');
      }

      setTotalCount(response.data.totalCount);
      await fetchNextQuestion();
    } catch (err: any) {
      console.error('开始练习失败:', err);
      setError('开始练习失败: ' + String(err.message || err));
      Alert.alert('错误', '开始练习失败: ' + String(err.message || err), [
        {text: '确定', onPress: () => navigation.goBack()},
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 获取下一题
  // 后端逻辑：
  // - 首次调用：返回题目，不推进索引（currentIndex 保持为已完成题目的索引或 -1）
  // - 后续调用（点击下一题）：推进索引，返回下一题
  const fetchNextQuestion = async () => {
    // 防止并发调用：如果正在获取题目，直接返回
    if (fetchingRef.current) {
      console.log('⚠️ [fetchNextQuestion] 正在获取题目，跳过重复调用');
      return;
    }
    
    // 如果完成状态已经被处理过，直接返回，不再调用 API
    if (finishedHandledRef.current) {
      console.log('⚠️ [fetchNextQuestion] 完成状态已处理过（ref检查），跳过 API 调用');
      return;
    }
    
    // 标记正在获取题目
    fetchingRef.current = true;
    
    try {
      setLoading(true);
      setError('');

      // 添加时间戳参数避免缓存（304 Not Modified）
      const timestamp = Date.now();
      
      console.log('🔄 [fetchNextQuestion] 获取题目:', {
        sessionId,
        practiceMode,
        timestamp,
        currentIndex,
        totalCount,
      });

      let response;
      let retryCount = 0;
      const maxRetries = 3;

      // 构建查询参数
      const params: any = {
        mode: practiceMode,
        _t: Date.now(), // 时间戳避免缓存
      };

      // 重试逻辑：如果遇到 304，增加时间戳重试
      while (retryCount < maxRetries) {
        try {
          // 更新时间戳
          params._t = Date.now();
          
          response = await api.get<{
            code: number;
            data: {
              finished?: boolean;
              itemId: number;
              question: Question;
              currentIndex: number;
              totalCount: number;
              learningItemId: number;
            };
            message?: string;
          }>(`/api/c/study/sessions/${sessionId}/next`, params);

          console.log('✅ [fetchNextQuestion] 获取题目响应:', {
            code: response.code,
            finished: response.data?.finished,
            currentIndex: response.data?.currentIndex,
            totalCount: response.data?.totalCount,
            questionId: response.data?.question?.id,
            retryCount,
          });

          if (response.code !== 0) {
            throw new Error(response.message || '获取题目失败');
          }

          // 成功获取，跳出循环
          break;
        } catch (err: any) {
          retryCount++;
          if (err.response?.status === 304 && retryCount < maxRetries) {
            console.warn(`⚠️ [fetchNextQuestion] 304 响应，重试 ${retryCount}/${maxRetries}`);
            // 等待一小段时间后重试
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            continue;
          }
          throw err;
        }
      }

      if (!response) {
        throw new Error('获取题目失败：重试次数用尽');
      }

      if (response.data.finished) {
        // 使用 ref 同步检查，防止竞态条件（React 状态更新是异步的）
        if (finishedHandledRef.current) {
          console.log('⚠️ [PracticeScreen] 完成状态已处理过（ref检查），直接返回');
          navigation.goBack();
          return;
        }
        
        // 如果完成状态已经被处理过（无论用户选择是或否），直接返回，不再弹出 Alert
        if (finishedHandled) {
          console.log('⚠️ [PracticeScreen] 完成状态已处理过，直接返回');
          navigation.goBack();
          return;
        }
        
        // 立即设置 ref，防止重复调用（在弹出 Alert 之前就设置）
        finishedHandledRef.current = true;
        // 标记完成状态正在被处理
        setFinishedHandled(true);
        
        // 练习完成，询问是否重新开始（仅对全部模式）
        if (practiceMode === 'all') {
          Alert.alert(
            '提示',
            '练习完成，是否重新开始？',
            [
              {
                text: '保持当前状态',
                style: 'cancel',
                onPress: () => {
                  // 用户选择"否"：保持当前状态，返回学习记录列表
                  console.log('⚠️ [PracticeScreen] 用户选择保持当前状态，返回学习记录列表');
                  // 再次确认 ref 已设置
                  finishedHandledRef.current = true;
                  setFinishedHandled(true);
                  // 使用 setTimeout 确保 ref 设置后再调用 navigation.goBack
                  setTimeout(() => {
                    navigation.goBack();
                  }, 0);
                },
              },
              {
                text: '重新开始',
                onPress: async () => {
                  // 用户选择"是"：重置进度，然后重新开始练习（不返回，继续在当前页面）
                  try {
                    setLoading(true);
                    // 重置进度
                    const resetResponse = await api.post<{
                      code: number;
                      data: {reset: boolean};
                      message?: string;
                    }>(`/api/c/study/sessions/${sessionId}/reset-progress?mode=${practiceMode}`);

                    if (resetResponse.code !== 0) {
                      throw new Error(resetResponse.message || '重置进度失败');
                    }

                    console.log('✅ [PracticeScreen] 进度已重置，重新开始练习');
                    // 重置进度后，重新获取第一题（不返回，继续在当前页面练习）
                    // 重置标志，允许重新获取题目
                    finishedHandledRef.current = false;
                    setFinishedHandled(false);
                    // 重新获取第一题
                    await fetchNextQuestion();
                  } catch (err: any) {
                    console.error('❌ [PracticeScreen] 重置进度失败:', err);
                    // 确保 ref 已设置
                    finishedHandledRef.current = true;
                    Alert.alert('错误', '重置进度失败: ' + String(err.message || err));
                    navigation.goBack();
                  } finally {
                    setLoading(false);
                  }
                },
              },
            ],
            {cancelable: false}
          );
        } else {
          // 错题或收藏模式，直接返回
          finishedHandledRef.current = true;
          Alert.alert('提示', '练习完成！', [{text: '确定', onPress: () => navigation.goBack()}]);
        }
        return;
      }
      
      // 如果获取到题目，重置完成状态处理标志
      setFinishedHandled(false);
      finishedHandledRef.current = false; // 重置 ref

      setCurrentQuestion(response.data.question);
      setCurrentIndex(response.data.currentIndex); // 从1开始显示
      setTotalCount(response.data.totalCount);
      
      // 如果是最后一题，currentIndex 应该等于 totalCount
      // 此时不应该显示"下一题"按钮
      setCurrentItemId(response.data.itemId);
      setLearningItemId(response.data.learningItemId);
      setNote(response.data.question.note || '');
      setIsEditingNote(false);
      setEditingNote('');
      setStartTime(Date.now());
      setSelectedAnswer(null);
      setSubmitted(false);
      setIsCorrect(null);
    } catch (err: any) {
      console.error('获取题目失败:', err);
      // 如果完成状态已经被处理过，不再设置错误信息
      if (!finishedHandledRef.current) {
        setError('获取题目失败: ' + String(err.message || err));
      }
    } finally {
      // 重置获取标志
      fetchingRef.current = false;
      // 如果完成状态已经被处理过，不再设置 loading 状态
      if (!finishedHandledRef.current) {
        setLoading(false);
      }
    }
  };

  // 移动到下一题（直接调用 GET /next，后端会自动推进索引）
  const handleNext = async () => {
    try {
      setLoading(true);

      console.log('🔄 [handleNext] 开始移动到下一题', {
        sessionId,
        currentIndex,
        totalCount,
        practiceMode,
      });

      // 直接调用 GET /next，后端会自动推进索引并返回下一题
      // 后端逻辑：
      // - 全部模式：保存当前题目进度，推进索引，返回下一题
      // - 错题/收藏模式：推进索引，返回下一题
      // 不需要传递数据，因为数据已在提交答案时保存
      await fetchNextQuestion();
    } catch (err: any) {
      console.error('❌ [handleNext] 移动到下一题失败:', err);
      Alert.alert('错误', '移动到下一题失败: ' + String(err.message || err));
      setLoading(false);
    }
  };

  // 提交答案
  const handleSubmit = async () => {
    if (!selectedAnswer || submitted || !currentItemId) {
      return;
    }

    setSubmitting(true);
    try {
      const timeSpent = startTime ? Math.max(0, Math.floor((Date.now() - startTime) / 1000)) : 0;

      const response = await api.post<{
        code: number;
        data: {
          is_correct: boolean;
          response: string;
          time_spent_second: number;
        };
        message?: string;
      }>(`/api/c/study/sessions/${sessionId}/items/${currentItemId}/submit`, {
        answer: selectedAnswer,
        timeSpent: timeSpent,
      });

      if (response.code !== 0) {
        throw new Error(response.message || '提交答案失败');
      }

      setIsCorrect(response.data.is_correct);
      setSubmitted(true);
      
      // 如果是最后一题，提交答案后更新序号（currentIndex + 1）
      // 这样用户可以看到序号从 10/10 变成 11/10，表示已完成
      if (currentIndex >= totalCount && totalCount > 0) {
        console.log(`✅ [handleSubmit] 最后一题已提交，更新序号: ${currentIndex} -> ${currentIndex + 1}`);
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err: any) {
      console.error('提交答案失败:', err);
      Alert.alert('错误', '提交答案失败: ' + String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!learningItemId || isFavoriting || !currentQuestion) {
      return;
    }

    setIsFavoriting(true);
    try {
      const newFavoriteStatus = !currentQuestion.is_favorited;

      const response = await api.post<{
        code: number;
        data: {is_favorited: boolean};
        message?: string;
      }>(`/api/c/study/learning-items/${learningItemId}/favorite`, {
        is_favorited: newFavoriteStatus,
      });

      if (response.code !== 0) {
        throw new Error(response.message || '收藏操作失败');
      }

      setCurrentQuestion({
        ...currentQuestion,
        is_favorited: response.data.is_favorited,
      });
    } catch (err: any) {
      console.error('收藏操作失败:', err);
      Alert.alert('错误', '收藏操作失败: ' + String(err.message || err));
    } finally {
      setIsFavoriting(false);
    }
  };

  // 保存笔记（不推进索引）
  const handleSaveNote = async () => {
    if (!currentItemId || savingNote) {
      return;
    }

    setSavingNote(true);
    try {
      // 调用专门的保存笔记接口，不推进索引
      const response = await api.patch<{
        code: number;
        data: {
          id: number;
          note: string;
        };
        message?: string;
      }>(`/api/c/study/sessions/${sessionId}/items/${currentItemId}/note`, {
        note: editingNote || '',
      });

      if (response.code !== 0) {
        throw new Error(response.message || '保存笔记失败');
      }

      setNote(editingNote);
      setIsEditingNote(false);
      setEditingNote('');
      
      console.log('✅ [handleSaveNote] 笔记已保存');
    } catch (err: any) {
      console.error('❌ [handleSaveNote] 保存笔记失败:', err);
      Alert.alert('错误', '保存笔记失败: ' + String(err.message || err));
    } finally {
      setSavingNote(false);
    }
  };

  // 切换笔记编辑
  const handleToggleNote = () => {
    if (isEditingNote) {
      setIsEditingNote(false);
      setEditingNote('');
    } else {
      setEditingNote(note);
      setIsEditingNote(true);
    }
  };

  if (loading && !currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error && !currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const options = parseOptions(currentQuestion.options);
  const correctAnswers = parseAnswer(currentQuestion.answer);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 进度信息 */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          第 {currentIndex} / {totalCount} 题
        </Text>
      </View>

      {/* 题目 */}
      <View style={styles.questionCard}>
        <Text style={styles.stemText}>{currentQuestion.stem}</Text>
        
        {currentQuestion.image_url && (
          <Image
            source={{uri: currentQuestion.image_url}}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}

        {/* 操作按钮组 - 笔记和收藏 */}
        <View style={styles.actionButtonsRow}>
          {/* 笔记按钮 */}
          <TouchableOpacity
            style={[
              styles.actionButtonSmall,
              isEditingNote && styles.actionButtonSmallActive,
            ]}
            onPress={handleToggleNote}
            activeOpacity={0.7}>
            <Text style={[styles.actionButtonSmallText, isEditingNote && styles.actionButtonSmallTextActive]}>
              {isEditingNote ? '✕' : '📝'} {!isEditingNote && '笔记'}
            </Text>
          </TouchableOpacity>

          {/* 收藏按钮 */}
          {learningItemId && (
            <TouchableOpacity
              style={[
                styles.actionButtonSmall,
                currentQuestion.is_favorited && styles.actionButtonSmallFavorite,
              ]}
              onPress={handleToggleFavorite}
              disabled={isFavoriting}
              activeOpacity={0.7}>
              {isFavoriting ? (
                <ActivityIndicator size="small" color={currentQuestion.is_favorited ? '#ff6b35' : '#666'} />
              ) : (
                <Text style={[
                  styles.actionButtonSmallText,
                  currentQuestion.is_favorited && styles.actionButtonSmallTextFavorite,
                ]}>
                  {currentQuestion.is_favorited ? '★' : '☆'} {currentQuestion.is_favorited ? '已收藏' : '收藏'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 笔记编辑区域 */}
        {isEditingNote && (
          <View style={styles.noteEditContainer}>
            <Text style={styles.noteEditTitle}>📝 我的笔记：</Text>
            <TextInput
              style={styles.noteEditInput}
              value={editingNote}
              onChangeText={setEditingNote}
              placeholder="记录你的答题心得、易错点、知识点总结等..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.noteEditActions}>
              <TouchableOpacity
                style={[styles.noteActionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditingNote(false);
                  setEditingNote('');
                }}>
                <Text style={styles.noteActionText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.noteActionButton, styles.saveButton]}
                onPress={handleSaveNote}
                disabled={savingNote}>
                {savingNote ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.noteActionText, styles.saveButtonText]}>确定</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 选项 */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option.label;
            const isCorrectOption = correctAnswers.includes(option.label);
            const showResult = submitted;

            let buttonStyle = styles.optionButton;
            let textStyle = styles.optionText;

            if (showResult) {
              if (isCorrectOption) {
                buttonStyle = [styles.optionButton, styles.correctOption];
                textStyle = [styles.optionText, styles.correctOptionText];
              } else if (isSelected && !isCorrectOption) {
                buttonStyle = [styles.optionButton, styles.wrongOption];
                textStyle = [styles.optionText, styles.wrongOptionText];
              }
            } else if (isSelected) {
              buttonStyle = [styles.optionButton, styles.selectedOption];
              textStyle = [styles.optionText, styles.selectedOptionText];
            }

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => !submitted && setSelectedAnswer(option.label)}
                disabled={submitted}>
                <Text style={textStyle}>
                  {option.label}. {option.value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 提交/下一题按钮 - 在选项下方，题目卡片内 */}
        <View style={styles.submitButtonContainer}>
          {!submitted ? (
            <TouchableOpacity
              style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!selectedAnswer || submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>提交答案</Text>
              )}
            </TouchableOpacity>
          ) : (
            // 如果是最后一题（currentIndex >= totalCount），显示"完成练习"按钮
            // 点击后会调用 handleNext，后端会返回 finished: true，然后弹出 confirm 框
            currentIndex >= totalCount ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  console.log('🔘 [Button] "完成练习" 按钮被点击');
                  // 调用 handleNext，后端会检测到已完成，返回 finished: true
                  // 然后 fetchNextQuestion 会弹出 confirm 框
                  handleNext();
                }}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>完成练习</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  console.log('🔘 [Button] "下一题" 按钮被点击');
                  handleNext();
                }}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>下一题</Text>
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* 结果显示 - 提交后显示，在题目卡片外部 */}
      {submitted && (
        <View style={styles.resultContainer}>
          <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.wrongBadge]}>
            <Text style={styles.resultText}>
              {isCorrect ? '✓ 回答正确' : '✗ 回答错误'}
            </Text>
          </View>

          {/* 解析部分 */}
          {(currentQuestion.explanation_raw || currentQuestion.explanation_human || currentQuestion.explanation) && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>解析：</Text>
              
              {currentQuestion.explanation_raw && (
                <View style={styles.explanationSection}>
                  <Text style={styles.explanationSubtitle}>官方解释：</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation_raw}</Text>
                </View>
              )}
              
              {currentQuestion.explanation_human && (
                <View style={styles.explanationSection}>
                  <Text style={styles.explanationSubtitle}>通俗解释：</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation_human}</Text>
                </View>
              )}
              
              {!currentQuestion.explanation_raw && !currentQuestion.explanation_human && currentQuestion.explanation && (
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              )}
            </View>
          )}

          {/* 关联知识点 */}
          {currentQuestion.knowledge_nodes && currentQuestion.knowledge_nodes.length > 0 && (
            <View style={styles.knowledgeContainer}>
              <Text style={styles.knowledgeTitle}>关联知识点：</Text>
              {currentQuestion.knowledge_nodes.map((kn, idx) => (
                <View
                  key={kn.id || idx}
                  style={[
                    styles.knowledgeItem,
                    idx < currentQuestion.knowledge_nodes!.length - 1 && styles.knowledgeItemBorder,
                  ]}>
                  <View style={styles.knowledgeHeader}>
                    <View
                      style={[
                        styles.importanceBadge,
                        kn.importance === 'high' && styles.importanceHigh,
                        kn.importance === 'medium' && styles.importanceMedium,
                        kn.importance === 'low' && styles.importanceLow,
                      ]}>
                      <Text
                        style={[
                          styles.importanceText,
                          kn.importance === 'high' && styles.importanceTextHigh,
                          kn.importance === 'medium' && styles.importanceTextMedium,
                          kn.importance === 'low' && styles.importanceTextLow,
                        ]}>
                        {kn.importance === 'high' ? '高' : kn.importance === 'medium' ? '中' : '低'}
                      </Text>
                    </View>
                    <Text style={styles.knowledgeItemTitle}>{kn.title}</Text>
                  </View>
                  
                  {kn.description && (
                    <Text style={styles.knowledgeDescription}>{kn.description}</Text>
                  )}
                  
                  {kn.sources && kn.sources.length > 0 && (
                    <View style={styles.knowledgeSources}>
                      {kn.sources.map((source, sIdx) => (
                        <View key={sIdx} style={styles.knowledgeSourceItem}>
                          {source.source && (
                            <Text style={styles.knowledgeSourceText}>
                              {source.source.type === 'pdf' ? '📄' :
                               source.source.type === 'book' ? '📚' :
                               source.source.type === 'video' ? '🎬' : '🌐'}{' '}
                              {source.source.title}
                              {source.source.version && ` v${source.source.version}`}
                            </Text>
                          )}
                          <Text style={styles.knowledgeSourceChapter}>
                            {source.chapter}
                            {source.section && ` › ${source.section}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
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
    paddingBottom: 80,
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
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee',
    borderColor: '#fcc',
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stemText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: 12,
    borderRadius: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSmallActive: {
    backgroundColor: '#fff7e6',
    borderColor: '#faad14',
  },
  actionButtonSmallFavorite: {
    borderColor: '#ff6b35',
  },
  actionButtonSmallText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtonSmallTextActive: {
    color: '#faad14',
  },
  actionButtonSmallTextFavorite: {
    color: '#ff6b35',
  },
  noteEditContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  noteEditTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noteEditInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  noteEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  submitButtonContainer: {
    paddingTop: 8,
  },
  submitButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#ff6b35',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  correctOption: {
    borderColor: '#52c41a',
    backgroundColor: '#f6ffed',
  },
  wrongOption: {
    borderColor: '#ff4d4f',
    backgroundColor: '#fff1f0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007bff',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#52c41a',
    fontWeight: '600',
  },
  wrongOptionText: {
    color: '#ff4d4f',
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
  },
  resultBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  correctBadge: {
    backgroundColor: '#f6ffed',
    borderColor: '#52c41a',
    borderWidth: 1,
  },
  wrongBadge: {
    backgroundColor: '#fff1f0',
    borderColor: '#ff4d4f',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  explanationSection: {
    marginBottom: 12,
  },
  explanationSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  knowledgeContainer: {
    backgroundColor: '#fffbe6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  knowledgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  knowledgeItem: {
    paddingBottom: 12,
  },
  knowledgeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  knowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  importanceHigh: {
    backgroundColor: '#ffccc7',
  },
  importanceMedium: {
    backgroundColor: '#ffe7ba',
  },
  importanceLow: {
    backgroundColor: '#d4edda',
  },
  importanceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  importanceTextHigh: {
    color: '#a8071a',
  },
  importanceTextMedium: {
    color: '#ad6800',
  },
  importanceTextLow: {
    color: '#135200',
  },
  knowledgeItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  knowledgeDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginLeft: 60,
    lineHeight: 18,
  },
  knowledgeSources: {
    marginTop: 8,
    marginLeft: 60,
  },
  knowledgeSourceItem: {
    marginTop: 4,
  },
  knowledgeSourceText: {
    fontSize: 12,
    color: '#666',
  },
  knowledgeSourceChapter: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  noteActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  noteActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    color: '#fff',
  },
});

export default PracticeScreen;

