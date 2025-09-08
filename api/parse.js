// api/parse.js 正确代码模板（必须完全符合）
const express = require('express');
const cors = require('cors');
// const { parseUrl } = require('../src/modules/urlParser'); // 路径必须正确（../src 对应根目录的 src）
const { parseFile } = require('../src/modules/fileParser');
const { standardizeContent, standardizeError } = require('../src/modules/contentStandard');

// 初始化 Express 实例
const app = express();

// 中间件（必须配置，否则无法解析 JSON 请求）
app.use(cors()); // 允许跨域（Coze 调用需要）
app.use(express.json({ limit: '10mb' })); // 解析 JSON 请求体

// 核心接口（路由名可以自定义，但访问时要对应）
app.post('/parse-resource', async (req, res) => {
  try {
    const { resource_type, resource_url, file_type, file_content } = req.body;

    // 简单参数校验
    if (!resource_type) {
      return res.status(400).json(standardizeError('缺少参数：resource_type（url 或 file）'));
    }

    let rawResult;
    if (resource_type === 'url' && resource_url) {
      // rawResult = await parseUrl(resource_url);
    } else if (resource_type === 'file' && file_type && file_content) {
      rawResult = await parseFile(file_type, file_content);
    } else {
      return res.status(400).json(standardizeError('缺少必要参数：url 需传 resource_url；file 需传 file_type 和 file_content'));
    }

    const standardResult = standardizeContent(rawResult, resource_type);
    res.status(200).json(standardResult);

  } catch (error) {
    const errorResult = standardizeError(error.message);
    res.status(500).json(errorResult);
  }
});

// 在 api/parse.js 中添加
app.get('/parse-resource', (req, res) => {
  res.json({ message: "接口可用，请使用 POST 方法调用" });
});



// 仅在本地直接运行该文件时启动服务器（不影响 Vercel 部署）
if (require.main === module) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`本地服务器运行在 http://localhost:${port}`);
  });
}

// 关键：导出 Express 实例（必须！不能有 app.listen()）
module.exports = app;
