import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {usePostcodes} from '../hooks/usePostcodes';
import {Postcode} from '../services/postcodeService';

interface PostcodePickerProps {
  selectedPostcode: string;
  onSelect: (postcode: string) => void;
  placeholder?: string;
  style?: any;
}

const PostcodePicker: React.FC<PostcodePickerProps> = ({
  selectedPostcode,
  onSelect,
  placeholder = '选择邮编',
  style,
}) => {
  const {postcodes, loading} = usePostcodes();
  const [modalVisible, setModalVisible] = useState(false);

  // 获取选中的邮编对象
  const selectedPostcodeObj = postcodes.find(
    p => p.postcode.replace(/\s+/g, '') === selectedPostcode.replace(/\s+/g, ''),
  );

  // 格式化显示文本
  const displayText = selectedPostcodeObj
    ? `${selectedPostcodeObj.postcode}${selectedPostcodeObj.label ? ` (${selectedPostcodeObj.label})` : ''}`
    : selectedPostcode || placeholder;

  const handleSelect = (postcode: Postcode) => {
    onSelect(postcode.postcode);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, style]}
        onPress={() => setModalVisible(true)}
        disabled={loading}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <View style={styles.pickerContent}>
            <Text
              style={[
                styles.pickerText,
                !selectedPostcode && styles.placeholderText,
              ]}>
              {displayText}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择邮编</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>

            {postcodes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  还没有配置邮编{'\n'}请先在邮编管理中添加邮编
                </Text>
              </View>
            ) : (
              <FlatList
                data={postcodes}
                keyExtractor={item => `postcode-${item.id}`}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.postcodeItem,
                      selectedPostcode.replace(/\s+/g, '') ===
                        item.postcode.replace(/\s+/g, '') &&
                        styles.postcodeItemSelected,
                    ]}
                    onPress={() => handleSelect(item)}>
                    <View>
                      <Text style={styles.postcodeText}>{item.postcode}</Text>
                      {item.label && (
                        <Text style={styles.postcodeLabel}>{item.label}</Text>
                      )}
                    </View>
                    {selectedPostcode.replace(/\s+/g, '') ===
                      item.postcode.replace(/\s+/g, '') && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  postcodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  postcodeItemSelected: {
    backgroundColor: '#f0f7ff',
  },
  postcodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  postcodeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkmark: {
    fontSize: 18,
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default PostcodePicker;

