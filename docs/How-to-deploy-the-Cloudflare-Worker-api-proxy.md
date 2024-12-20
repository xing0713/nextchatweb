### How to use Cloudflare Worker

To create your first Worker using the Cloudflare dashboard:

1. Log in to the Cloudflare dashboard and select your account.
2. Select Workers & Pages > Create application.
3. Select Create Worker > Deploy.

### Worker Scripts

Copy the following code to replace the original `worker.js` code, and then click Deploy.

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

### Set a custom domain (optional)

Since the `workers.dev` domain can not be accessed normally in some countries, you can solve this problem by setting a custom domain.

1. Select Workers & Pages > [Your Worker Script].
2. Select Settings > Triggers.
3. Choose Add Custom Domain.
