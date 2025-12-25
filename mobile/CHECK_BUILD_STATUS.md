# 查看构建状态和下载 APK

## 查看构建列表

```bash
cd mobile
eas build:list --platform android --limit 10
```

## 查看特定构建的详细信息

```bash
eas build:view [BUILD_ID]
```

## 下载最新构建的 APK

```bash
# 下载最新的 Android 构建
eas build:download --latest --platform android

# 或下载特定构建
eas build:download [BUILD_ID]
```

## 在线查看构建进度

访问 Expo 控制台：
https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

## 重新启动构建

如果构建被取消或失败，可以重新启动：

```bash
cd mobile
eas build --platform android --profile preview
```

构建过程中可以按 `Ctrl+C` 退出，构建会在后台继续。

## Preview 环境配置

当前 preview 环境使用的 API 地址：
- API_BASE_URL: https://c-api-staging.kxf.ca
- API_BASE_URL_IOS: https://c-api-staging.kxf.ca
- API_BASE_URL_ANDROID: https://c-api-staging.kxf.ca
