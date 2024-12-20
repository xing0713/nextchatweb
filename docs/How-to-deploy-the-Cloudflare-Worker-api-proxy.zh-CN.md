### 如何使用 Cloudflare Worker

使用 Cloudflare 仪表板创建您的第一个 Worker：

1. 登录 Cloudflare 仪表板并选择您的帐户。
2. 选择 Workers 和 Pages > 创建应用程序。
3. 选择 创建 Worker > 部署。

### Worker 脚本

复制以下代码替换原有的 `worker.js` 代码，然后点击 部署。

```javascript
addEventListener('fetch', (event) => {
  const headers = event.request.headers
  const url = new URL(event.request.url)
  url.hostname = 'generativelanguage.googleapis.com'
  url.protocol = 'https'
  const request = new Request(url, event.request)
  return event.respondWith(fetch(request))
})
```

### 设置自定义域名（可选）

由于在部分国家无法正常访问 `workers.dev` 域名，可以通过设置自定义域名来解决这个问题。

1. 选择 Workers 和 Pages > [您的 Worker 脚本]。
2. 选择 设置 > 触发器。
3. 选择 添加自定义域。
