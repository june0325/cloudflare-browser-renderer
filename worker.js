/**
 * Cloudflare 瀏覽器渲染 Worker
 * 
 * 這個 Worker 提供高級的瀏覽器渲染功能，可以繞過常見的反爬蟲保護
 * 並處理需要 JavaScript 執行的網頁內容。
 */

// 允許的來源域名，設為 '*' 表示允許所有來源
const ALLOWED_ORIGINS = '*';

// 用戶代理字符串列表，隨機選擇以減少被檢測的可能性
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
];

// 獲取隨機用戶代理字符串
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// 處理 CORS 預檢請求
function handleOptions(request) {
  const headers = request.headers;
  const origin = headers.get('Origin');
  
  // 返回 CORS 預檢響應
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
    status: 204,
  });
}

// 添加 CORS 頭部到響應
function addCorsHeaders(response, origin) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// 處理 HTML 內容，注入必要的腳本以模擬完整的瀏覽器環境
async function processHtml(html, targetUrl) {
  // 注入基本的腳本以處理常見的反爬蟲檢測
  const injectedScript = `
    <script>
      // 覆蓋 navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // 模擬鼠標移動
      function simulateMouseMovement() {
        const event = new MouseEvent('mousemove', {
          'view': window,
          'bubbles': true,
          'cancelable': true,
          'clientX': Math.floor(Math.random() * window.innerWidth),
          'clientY': Math.floor(Math.random() * window.innerHeight)
        });
        document.dispatchEvent(event);
      }
      
      // 定期模擬鼠標移動
      setInterval(simulateMouseMovement, 2000);
      
      // 設置頁面基本 URL，以確保相對路徑正確解析
      const base = document.createElement('base');
      base.href = "${targetUrl}";
      document.head.prepend(base);
      
      console.log('瀏覽器環境模擬已啟用');
    </script>
  `;
  
  // 在 </head> 標籤前插入腳本
  html = html.replace('</head>', `${injectedScript}</head>`);
  
  return html;
}

// 主要請求處理函數
async function handleRequest(request) {
  // 獲取請求 URL 和方法
  const url = new URL(request.url);
  const method = request.method;
  
  // 處理 OPTIONS 請求（CORS 預檢）
  if (method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  // 從查詢參數中獲取目標 URL
  const targetUrl = url.searchParams.get('url');
  
  // 檢查是否提供了目標 URL
  if (!targetUrl) {
    return new Response('請提供要渲染的 URL 參數 (例如: ?url=https://example.com)', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
      },
    });
  }
  
  try {
    // 準備請求頭
    const headers = new Headers({
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
    });
    
    // 從原始請求中獲取 Cookie（如果有）
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      headers.set('Cookie', cookie);
    }
    
    // 從原始請求中獲取 Referer（如果有）
    const referer = request.headers.get('Referer');
    if (referer) {
      headers.set('Referer', referer);
    }
    
    // 發送請求到目標 URL
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
    });
    
    // 獲取響應內容類型
    const contentType = response.headers.get('content-type') || '';
    
    // 處理不同類型的響應
    if (contentType.includes('text/html')) {
      // 處理 HTML 內容
      const html = await response.text();
      const processedHtml = await processHtml(html, targetUrl);
      
      return new Response(processedHtml, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
        },
      });
    } else {
      // 直接返回其他類型的內容（圖片、CSS、JS 等）
      return addCorsHeaders(response);
    }
  } catch (error) {
    // 處理錯誤
    return new Response(`渲染錯誤: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
      },
    });
  }
}

// 註冊 fetch 事件監聽器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});