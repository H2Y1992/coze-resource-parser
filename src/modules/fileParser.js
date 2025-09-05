const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { Buffer } = require('buffer');

// 工具函数：Base64 转临时文件
function base64ToTempFile(base64Str, fileExt) {
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const fileName = `temp_${Date.now()}.${fileExt}`;
  const tempPath = path.join(tempDir, fileName);
  const buffer = Buffer.from(base64Str, 'base64');
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

// 1. PDF 解析（文字版，暂不支持扫描件OCR）
async function parsePdf(base64Str) {
  const tempPath = base64ToTempFile(base64Str, 'pdf');
  try {
    const dataBuffer = fs.readFileSync(tempPath);
    const data = await pdf(dataBuffer);
    return {
      title: 'PDF文件_' + Date.now(),
      content: data.text.trim() || 'PDF无文字内容',
      pageCount: data.numpages
    };
  } catch (error) {
    throw new Error(`PDF解析失败：${error.message}`);
  } finally {
    fs.unlinkSync(tempPath); // 删除临时文件
  }
}

// 2. DOC/DOCX 解析
async function parseDocx(base64Str) {
  const tempPath = base64ToTempFile(base64Str, 'docx');
  try {
    const result = await mammoth.convertToHtml({ path: tempPath });
    // 提取纯文本（去除HTML标签）
    const content = result.value.replace(/<[^>]+>/g, '\n').trim() || 'DOCX无内容';
    return { title: 'DOCX文件_' + Date.now(), content };
  } catch (error) {
    throw new Error(`DOCX解析失败：${error.message}`);
  } finally {
    fs.unlinkSync(tempPath);
  }
}

// 3. XLSX/CSV 解析（转成文本表格格式）
async function parseExcel(base64Str, fileType) {
  const tempPath = base64ToTempFile(base64Str, fileType);
  try {
    const workbook = XLSX.readFile(tempPath);
    let content = '';
    // 遍历所有工作表
    workbook.SheetNames.forEach(sheetName => {
      content += `=== 工作表：${sheetName} ===\n`;
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // 转二维数组
      // 数组转文本表格（用制表符分隔）
      jsonData.forEach(row => {
        content += row.join('\t') + '\n';
      });
      content += '\n';
    });
    return { title: `${fileType.toUpperCase()}文件_' + Date.now()`, content: content.trim() };
  } catch (error) {
    throw new Error(`${fileType.toUpperCase()}解析失败：${error.message}`);
  } finally {
    fs.unlinkSync(tempPath);
  }
}

// 4. TXT 解析
async function parseTxt(base64Str) {
  const tempPath = base64ToTempFile(base64Str, 'txt');
  try {
    const content = fs.readFileSync(tempPath, 'utf8').trim() || 'TXT无内容';
    return { title: 'TXT文件_' + Date.now(), content };
  } catch (error) {
    throw new Error(`TXT解析失败：${error.message}`);
  } finally {
    fs.unlinkSync(tempPath);
  }
}

// 对外暴露：根据文件类型分发解析
async function parseFile(fileType, fileContent) {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return await parsePdf(fileContent);
    case 'doc':
    case 'docx':
      return await parseDocx(fileContent);
    case 'xlsx':
    case 'csv':
      return await parseExcel(fileContent, fileType);
    case 'txt':
      return await parseTxt(fileContent);
    default:
      throw new Error(`不支持的文件格式：${fileType}`);
  }
}

module.exports = { parseFile };
