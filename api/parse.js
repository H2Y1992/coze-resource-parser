const express = require('express');
const cors = require('cors');
const { parseUrl } = require('../src/modules/urlParser');
const { parseFile } = require('../src/modules/fileParser');
const { standardizeContent, standardizeError } = require('../src/modules/contentStandard');

const app = express();
const port = process.env.PORT || 3000;

// 中间件：允许跨域（Coze 调用需要）、解析 JSON 格式
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 支持最大10MB的请求体（应对Base64文件）

// 核心接口：解析资源（URL/文件）
app.post('/parse-resource', async (req, res) => {
  try {
    const { resource_type, resource_url, file_type, file_content } = req.body;

    // 1. 校验输入参数
    if (!resource_type) {
      return res.status(400).json(standardizeError('缺少参数：resource_type（需为 url 或 file）'));
    }

    let rawResult;
    // 2. 路由到对应解析模块
    if (resource_type === 'url') {
      if (!resource_url) {
        return res.status(400).json(standardizeError('缺少参数：resource_url（网页链接）'));
      }
      rawResult = await parseUrl(resource_url);
    } else if (resource_type === 'file') {
      if (!file_type || !file_content) {
        return res.status(400).json(standardizeError('缺少参数：file_type（文件格式）或 file_content（Base64内容）'));
      }
      rawResult = await parseFile(file_type, file_content);
    } else {
      return res.status(400).json(standardizeError('resource_type 无效：仅支持 url 或 file'));
    }

    // 3. 标准化结果并返回
    const standardResult = standardizeContent(rawResult, resource_type);
    res.status(200).json(standardResult);

  } catch (error) {
    // 4. 错误处理
    const errorResult = standardizeError(error.message);
    res.status(500).json(errorResult);
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`Coze 资源解析插件服务启动：http://localhost:${port}`);
});
