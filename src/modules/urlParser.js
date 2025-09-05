const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

// 1. 静态页解析（无JS渲染，速度快）
async function parseStaticUrl(url) {
  try {
    // 设置请求头，模拟浏览器（避免被反爬）
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    };
    const response = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(response.data);

    // 提取标题（优先取 <title> 标签，无则取 <h1>）
    let title = $('title').text().trim() || $('h1').first().text().trim() || '无标题';

    // 提取正文（排除导航、广告等冗余标签，保留 <p>、<div> 核心内容）
    let content = '';
    $('body').find('p, div:not([class*="ad"], [class*="nav"], [class*="footer"])').each((i, el) => {
      content += $(el).text().trim() + '\n';
    });
    content = content.trim() || '无正文内容';

    return { title, content, type: 'static' };
  } catch (error) {
    throw new Error(`静态页解析失败：${error.message}`);
  }
}

// 2. 动态页解析（需渲染JS，如React/Vue页面）
async function parseDynamicUrl(url) {
  const browser = await puppeteer.launch({ headless: 'new' }); // 无头模式
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }); // 等待网络空闲
    const title = await page.title().catch(() => '无标题');
    // 提取正文（通过页面文本内容过滤，排除空白字符）
    const content = await page.evaluate(() => {
      const textNodes = document.body.innerText.split('\n').filter(txt => txt.trim());
      return textNodes.join('\n');
    });
    return { title, content, type: 'dynamic' };
  } catch (error) {
    throw new Error(`动态页解析失败：${error.message}`);
  } finally {
    await browser.close(); // 关闭浏览器
  }
}

// 对外暴露：自动判断是否需要动态渲染（简单规则：包含 "#" 或 "js_" 可能是动态页）
async function parseUrl(url) {
  if (url.includes('#') || url.includes('js_') || url.includes('react') || url.includes('vue')) {
    return await parseDynamicUrl(url);
  } else {
    return await parseStaticUrl(url);
  }
}

module.exports = { parseUrl };
