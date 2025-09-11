const express = require('express');
const cors = require('cors');
const { parseUrl } = require('./src/modules/urlParser');
const { parseFile } = require('./src/modules/fileParser');
const { standardizeContent, standardizeError } = require('./src/modules/contentStandard');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));


// 工具函数：判断是否为URL
function isUrl(str) {
  try {
    new URL(str); // 通过URL构造函数验证格式
    return str.startsWith('http://') || str.startsWith('https://');
  } catch {
    return false;
  }
}

// 工具函数：通过Base64前缀识别文件类型
function getFileTypeFromBase64(base64Str) {
  // 取Base64前10个字符（去除可能的dataURL前缀）
  const prefix = base64Str.replace(/^data:.+;base64,/, '').substring(0, 10);

  if (prefix.startsWith('JVBERi0')) return 'pdf'; // PDF特征
  if (prefix.startsWith('PK')) {
    // DOCX和XLSX都是ZIP格式（PK开头），这里简化判断（可根据实际需求细化）
    return 'docx'; // 若需区分，可解析ZIP内部结构，此处暂默认docx
    // 如需更精确，可改为：return prefix.includes('word/') ? 'docx' : 'xlsx';
  }
  if (/^[a-zA-Z0-9+/\n\r]+$/.test(prefix)) return 'txt'; // TXT（纯文本Base64）
  return null; // 无法识别
}


app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// 核心接口：自动识别资源类型
app.post('/parse-resource', async (req, res) => {
  try {
    const { resource } = req.body; // 统一接收资源（URL或Base64文件内容）

    if (!resource) {
      return res.status(400).json(standardizeError('缺少参数：resource（请传入URL或Base64文件内容）'));
    }

    let rawResult;
    // 1. 先判断是否为URL
    if (isUrl(resource)) {
      rawResult = await parseUrl(resource);
    }
    // 2. 否则尝试作为文件处理（Base64）
    else {
      const fileType = getFileTypeFromBase64(resource);
      if (!fileType) {
        return res.status(400).json(standardizeError('无法识别文件格式，请检查Base64内容是否正确'));
      }
      rawResult = await parseFile(fileType, resource);
    }

    const standardResult = standardizeContent(rawResult, isUrl(resource) ? 'url' : 'file');
    res.status(200).json(standardResult);

  } catch (error) {
    const errorResult = standardizeError(error.message);
    res.status(500).json(errorResult);
  }
});

app.get('/parse-resource', (req, res) => {
  res.json({ message: "接口可用，请使用POST方法调用，参数为resource（URL或Base64文件内容）" });
});


if (require.main === module) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`本地服务器运行在 http://localhost:${port}`);
  });
}

module.exports = app;
