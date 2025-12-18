import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import postcodeService, {Postcode} from '../../services/postcodeService';
import {getDataArray} from '../../utils/dataFormatter';

const PostcodeManagerScreen: React.FC = () => {
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPostcode, setEditingPostcode] = useState<Postcode | null>(null);
  const [postcode, setPostcode] = useState('');
  const [label, setLabel] = useState('');

  // 加载邮编列表
  const loadPostcodes = async () => {
    try {
      setLoading(true);
      const response = await postcodeService.getPostcodes();
      
      if (response.code === 0) {
        // 使用统一的数据提取工具
        const postcodesData = getDataArray<Postcode>(response, ['data', 'postcodes']);
        setPostcodes(postcodesData);
      } else {
        Alert.alert('错误', response.message || '加载失败');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [Postcodes Error]', error);
      }
      Alert.alert('错误', error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostcodes();
  }, []);

  // 格式化邮编
  const formatPostalCode = (value: string) => {
    let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  // 打开添加/编辑模态框
  const openModal = (item?: Postcode) => {
    if (item) {
      setEditingPostcode(item);
      setPostcode(item.postcode);
      setLabel(item.label);
    } else {
      setEditingPostcode(null);
      setPostcode('');
      setLabel('');
    }
    setModalVisible(true);
  };

  // 保存邮编
  const savePostcode = async () => {
    if (!postcode) {
      Alert.alert('错误', '请输入邮编');
      return;
    }

    const cleanPostcode = postcode.replace(/\s+/g, '');
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    if (cleanPostcode.length !== 6 || !postalCodeRegex.test(cleanPostcode)) {
      Alert.alert('错误', '邮编格式不正确，应为 A1A 1A1 格式');
      return;
    }

    try {
      if (editingPostcode) {
        // 更新
        const response = await postcodeService.updatePostcode(
          editingPostcode.id,
          {
            postcode: cleanPostcode,
            label: label || undefined,
          },
        );
        if (response.code === 0) {
          Alert.alert('成功', '更新成功');
          setModalVisible(false);
          loadPostcodes();
        } else {
          Alert.alert('错误', response.message || '更新失败');
        }
      } else {
        // 创建
        const response = await postcodeService.createPostcode({
          postcode: cleanPostcode,
          label: label || undefined,
        });
        if (response.code === 0) {
          Alert.alert('成功', '添加成功');
          setModalVisible(false);
          loadPostcodes();
        } else {
          Alert.alert('错误', response.message || '添加失败');
        }
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '操作失败');
    }
  };

  // 删除邮编
  const deletePostcode = (id: number) => {
    Alert.alert('确认删除', '确定要删除这个邮编吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await postcodeService.deletePostcode(id);
            if (response.code === 0) {
              Alert.alert('成功', '删除成功');
              loadPostcodes();
            } else {
              Alert.alert('错误', response.message || '删除失败');
            }
          } catch (error: any) {
            Alert.alert('错误', error.message || '删除失败');
          }
        },
      },
    ]);
  };

  // 渲染邮编项
  const renderItem = ({item}: {item: Postcode}) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemPostcode}>{item.postcode}</Text>
        {item.label && <Text style={styles.itemLabel}>{item.label}</Text>}
        <Text style={styles.itemTime}>
          创建: {new Date(item.create_time).toLocaleString()}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openModal(item)}>
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePostcode(item.id)}>
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+ 添加邮编</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={postcodes}
          renderItem={renderItem}
          keyExtractor={item => `postcode-${item.id}`}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>还没有邮编，点击上方按钮添加</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPostcode ? '编辑邮编' : '添加邮编'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="邮编 (A1A 1A1)"
              value={postcode}
              onChangeText={value => setPostcode(formatPostalCode(value))}
              maxLength={7}
              autoCapitalize="characters"
              editable={!editingPostcode}
            />

            <TextInput
              style={styles.input}
              placeholder="标签（可选）"
              value={label}
              onChangeText={setLabel}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={savePostcode}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    marginBottom: 12,
  },
  itemPostcode: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007bff',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PostcodeManagerScreen;

