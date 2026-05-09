# Capacitor App 打包说明

## 适用场景

- 保留现有 React H5 页面
- 打包为 Android / iOS App
- 继续复用当前 `server/` 后端接口

## 当前代码已做的适配

- 原生 App 环境下自动切换为 `HashRouter`
- 所有前端请求统一走 `client/src/utils/api.js`
- 登录态存储已抽象到 `client/src/utils/storage.js`
- 移动端安全区已补齐，避免刘海屏和底部手势区遮挡

## 首次安装

在 `client/` 目录执行：

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/camera @capacitor/preferences
```

初始化原生工程：

```bash
npx cap add android
npx cap add ios
```

## 后端地址配置

App 里不能再依赖 Vite 的 `/api` 代理，必须显式指定服务端地址。

1. 复制 `client/.env.mobile.example` 为 `client/.env.mobile`
2. 把 `VITE_API_BASE_URL` 改成你的后端地址

示例：

```bash
VITE_API_BASE_URL=http://192.168.1.10:3001/api
```

说明：

- Android 模拟器可用 `http://10.0.2.2:3001/api`
- iOS 模拟器可用 `http://localhost:3001/api`
- 真机必须填写你电脑在同一局域网下的 IP
- `client/.env.mobile` 只会在 `npm run build:app` 时生效

## 打包流程

```bash
cd client
npm run build:app
npm run cap:sync
npm run cap:android
```

或：

```bash
cd client
npm run build:app
npm run cap:sync
npm run cap:ios
```

## Android 直接出包

同步完原生工程后，可以直接在命令行生成 APK / Release 包：

```bash
cd client
npm run cap:sync:app
npm run android:debug
```

Release：

```bash
cd client
npm run cap:sync:app
npm run android:release
```

## 下一步建议

- 把图片上传从文件选择器升级为 Capacitor Camera
- 把 Toast / Confirm 替换为更接近原生的交互组件
- 如果后续要推送通知、离线缓存、扫码录入，再继续补原生插件
