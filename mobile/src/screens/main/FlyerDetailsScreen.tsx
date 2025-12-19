import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import flyerService, {FlyerItem} from '../../services/flyerService';
import {getDataArray} from '../../utils/dataFormatter';
import {usePostcodes} from '../../hooks/usePostcodes';

const PAGE_SIZE = 10;

const FlyerDetailsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'cn' | 'en' | 'hk'>('cn');
  const [flyers, setFlyers] = useState<FlyerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用邮编模块的邮编数据
  const {postcodes} = usePostcodes();
  
  // 获取第一个邮编（如果存在）
  const defaultZipCode = postcodes.length > 0 ? postcodes[0].postcode.replace(/\s+/g, '') : undefined;

  // 搜索传单
  const searchFlyers = useCallback(
    async (page: number = 0, append: boolean = false) => {
      try {
        if (page === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        // 使用默认邮编（第一个配置的邮编）
        const cleanZipCode = defaultZipCode;

        // 构建请求参数，确保空字符串也传递
        const requestParams: any = {
          lang,
          _start: start,
          _end: end,
        };

        // 只有当 searchQuery 有值时才添加 q 参数
        if (searchQuery && searchQuery.trim()) {
          requestParams.q = searchQuery.trim();
        }

        // 只有当有默认邮编时才添加 zip_code 参数
        if (cleanZipCode && cleanZipCode.trim()) {
          requestParams.zip_code = cleanZipCode.trim();
        }

        // 调试日志：打印请求参数
        if (__DEV__) {
          console.log('📤 [FlyerDetails] Request params:', {
            searchQuery,
            defaultZipCode,
            cleanZipCode,
            lang,
            start,
            end,
            requestParams,
            requestParamsString: JSON.stringify(requestParams, null, 2),
            postcodesCount: postcodes.length,
          });
        }

        const response = await flyerService.searchFlyers(requestParams);

        // 调试日志
        if (__DEV__) {
          console.log('🔍 [FlyerDetails Response]', {
            code: response.code,
            message: response.message,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
            dataLength: Array.isArray(response.data) ? response.data.length : null,
            total: response.total,
            from: response.from,
            size: response.size,
            fullResponse: JSON.stringify(response, null, 2).substring(0, 1000),
          });
        }

        if (response.code === 0) {
          // 处理数据：API 返回的 data 应该直接是数组
          let newData: FlyerItem[] = [];
          
          if (__DEV__) {
            console.log('🔍 [FlyerDetails] Processing response.data:', {
              dataType: typeof response.data,
              isArray: Array.isArray(response.data),
              isNull: response.data === null,
              isUndefined: response.data === undefined,
              value: response.data,
            });
          }

          if (Array.isArray(response.data)) {
            // 如果 data 直接是数组（标准格式）
            newData = response.data;
            if (__DEV__) {
              console.log('✅ [FlyerDetails] Data is array, length:', newData.length);
              if (newData.length > 0) {
                console.log('📦 [FlyerDetails] First item:', newData[0]);
              }
            }
          } else if (response.data === null || response.data === undefined) {
            newData = [];
          } else if (response.data && typeof response.data === 'object') {
            // 如果 data 是对象，尝试使用统一工具提取
            if (__DEV__) {
              console.log('⚠️ [FlyerDetails] Data is object, trying to extract array...', {
                dataKeys: Object.keys(response.data),
                dataValue: response.data,
              });
            }
            newData = getDataArray<FlyerItem>(response, ['data', 'items', 'results']);
            if (__DEV__) {
              console.log('📦 [FlyerDetails] Extracted array length:', newData.length);
            }
          } else {
            newData = [];
          }

          if (__DEV__) {
            console.log('✅ [FlyerDetails Parsed]', {
              itemsCount: newData.length,
              firstItem: newData[0] || null,
              allItems: newData,
              total: response.total,
              from: response.from,
              size: response.size,
            });
          }

          if (append) {
            setFlyers(prev => [...prev, ...newData]);
          } else {
            setFlyers(newData);
          }
          setTotal(response.total || newData.length);
          setHasMore(
            newData.length === PAGE_SIZE &&
              start + newData.length < (response.total || newData.length),
          );

          // 如果数据为空，显示提示
          // (已移除 console.warn)
        } else {
          if (__DEV__) {
            console.error('❌ [FlyerDetails] Response code is not 0:', response.code, response.message);
          }
          Alert.alert('错误', response.message || '搜索失败');
        }
      } catch (error: any) {
        Alert.alert('错误', error.message || '搜索失败');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, defaultZipCode, lang, postcodes.length],
  );

  // 初始加载：当语言改变或邮编加载完成时重新搜索
  useEffect(() => {
    // 等待邮编加载完成后再搜索
    if (postcodes.length > 0 || defaultZipCode === undefined) {
      searchFlyers(0, false);
    }
  }, [lang, defaultZipCode, searchFlyers]);

  // 加载更多
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      searchFlyers(nextPage, true);
    }
  };

  // 刷新
  const onRefresh = () => {
    setCurrentPage(0);
    setHasMore(true);
    searchFlyers(0, false);
  };

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(0);
    setHasMore(true);
    searchFlyers(0, false);
  };


  // 渲染传单项
  const renderItem = ({item}: {item: FlyerItem}) => (
    <View style={styles.item}>
      {item.cutout_image_url && (
        <Image
          source={{uri: item.cutout_image_url}}
          style={styles.image}
          resizeMode="contain"
        />
      )}
      <Text style={styles.itemTitle}>
        {item.title || item.cn_name || item.name || '无标题'}
      </Text>
      {item.brand && (
        <Text style={styles.itemText}>
          <Text style={styles.label}>品牌:</Text> {item.brand}
        </Text>
      )}
      {item.price !== null && item.price !== undefined && (
        <Text style={styles.price}>${item.price}</Text>
      )}
      {item.merchant && (
        <Text style={styles.itemText}>
          <Text style={styles.label}>商家:</Text> {item.merchant}
        </Text>
      )}
      {item.valid_from && item.valid_to && (
        <Text style={styles.itemText}>
          <Text style={styles.label}>有效期:</Text>{' '}
          {new Date(item.valid_from).toLocaleDateString()} -{' '}
          {new Date(item.valid_to).toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.filterRow}>
          <View style={styles.langButtons}>
            <TouchableOpacity
              style={[styles.langButton, lang === 'cn' && styles.langButtonActive]}
              onPress={() => setLang('cn')}>
              <Text style={[styles.langButtonText, lang === 'cn' && styles.langButtonTextActive]}>
                中文
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, lang === 'en' && styles.langButtonActive]}
              onPress={() => setLang('en')}>
              <Text style={[styles.langButtonText, lang === 'en' && styles.langButtonTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, lang === 'hk' && styles.langButtonActive]}
              onPress={() => setLang('hk')}>
              <Text style={[styles.langButtonText, lang === 'hk' && styles.langButtonTextActive]}>
                繁體中文
              </Text>
            </TouchableOpacity>
          </View>
          
          {defaultZipCode && (
            <View style={styles.zipInfo}>
              <Text style={styles.zipInfoText}>
                使用邮编: {defaultZipCode}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索商品名称..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && flyers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={flyers}
          renderItem={renderItem}
          keyExtractor={(item, index) => `flyer-${item.id || index}`}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#007bff" />
              </View>
            ) : !hasMore && flyers.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>已加载全部数据</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>没有找到传单详情</Text>
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  langButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  langButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  langButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  langButtonText: {
    fontSize: 14,
    color: '#666',
  },
  langButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  zipInfo: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  zipInfoText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
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
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  label: {
    fontWeight: '600',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginVertical: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default FlyerDetailsScreen;


