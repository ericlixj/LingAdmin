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
} from 'react-native';
import gasService, {GasStation} from '../../services/gasService';
import {getDataArray} from '../../utils/dataFormatter';
import {usePostcodes} from '../../hooks/usePostcodes';

const GasStationsScreen: React.FC = () => {
  const [maxDistance, setMaxDistance] = useState('5');
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 使用邮编模块的邮编数据
  const {postcodes} = usePostcodes();
  
  // 获取第一个邮编（如果存在）
  const defaultPostcode = postcodes.length > 0 ? postcodes[0].postcode.replace(/\s+/g, '') : undefined;

  // 搜索加油站
  const searchGasStations = React.useCallback(async () => {
    if (!defaultPostcode) {
      Alert.alert('提示', '请先在邮编管理中配置邮编');
      return;
    }

    try {
      setLoading(true);
      const response = await gasService.getGasStations({
        postcode: defaultPostcode,
        maxDistance: parseInt(maxDistance, 10) || 5,
      });
      
      // 调试日志
      if (__DEV__) {
        console.log('📤 [GasStations] Request params:', {
          postcode: defaultPostcode,
          maxDistance: parseInt(maxDistance, 10) || 5,
          postcodesCount: postcodes.length,
        });
      }

      if (response.code === 0) {
        // 使用统一的数据提取工具
        const stationsData = getDataArray<GasStation>(response, ['stations', 'data']);
        setStations(stationsData);
      } else {
        Alert.alert('错误', response.message || '查询失败');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [GasStations Error]', error);
      }
      Alert.alert('错误', error.message || '查询失败');
    } finally {
      setLoading(false);
    }
  }, [defaultPostcode, maxDistance, postcodes.length]);

  // 渲染加油站项
  const renderItem = ({item}: {item: GasStation}) => (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemText}>{item.address}</Text>
      <Text style={styles.itemText}>
        {item.city}, {item.province} {item.postcode}
      </Text>
      {item.distance !== undefined && (
        <Text style={styles.distance}>
          距离: {item.distance.toFixed(2)} km
        </Text>
      )}
      {item.price !== null && item.price !== undefined && (
        <Text style={styles.price}>${item.price.toFixed(3)} /L</Text>
      )}
      {item.price_updated_at && (
        <Text style={styles.updateTime}>
          更新时间: {new Date(item.price_updated_at).toLocaleString()}
        </Text>
      )}
    </View>
  );

  // 自动搜索：当邮编加载完成时自动搜索
  useEffect(() => {
    if (defaultPostcode) {
      searchGasStations();
    }
  }, [defaultPostcode, searchGasStations]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {defaultPostcode && (
          <View style={styles.postcodeInfo}>
            <Text style={styles.postcodeInfoText}>
              使用邮编: {defaultPostcode}
            </Text>
          </View>
        )}
        <View style={styles.distanceRow}>
          <Text style={styles.distanceLabel}>最大距离 (km):</Text>
          <TextInput
            style={styles.distanceInput}
            value={maxDistance}
            onChangeText={setMaxDistance}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchGasStations}
          disabled={loading || !defaultPostcode}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>搜索</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && stations.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={stations}
          renderItem={renderItem}
          keyExtractor={(item, index) => `gas-${item.id || index}`}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {defaultPostcode ? '没有找到加油站' : '请先在邮编管理中配置邮编'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postcodeInfo: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  postcodeInfoText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  distanceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 4,
    fontWeight: '500',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 8,
  },
  updateTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
});

export default GasStationsScreen;


