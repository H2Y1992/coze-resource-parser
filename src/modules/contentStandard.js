// 标准化输出格式
function standardizeContent(rawData, resourceType) {
  // 1. 统一字段：title（标题）、content（正文）、resourceType（资源类型）、timestamp（时间戳）
  const standardData = {
    title: rawData.title || '无标题',
    content: rawData.content || '无内容',
    resourceType: resourceType || 'unknown',
    timestamp: Date.now(),
    status: 'success'
  };

  // 2. 超长内容截断（Coze 对返回内容有长度限制，建议单条不超过 10000 字符）
  if (standardData.content.length > 10000) {
    standardData.content = standardData.content.slice(0, 10000) + '...（内容过长，已截断）';
    standardData.note = '内容超过10000字符，已截断';
  }

  // 3. 过滤特殊字符（如换行符、制表符转义，避免JSON解析错误）
  standardData.content = standardData.content.replace(/\r\n/g, '\n').replace(/\t/g, '  ');

  return standardData;
}

// 错误处理标准化
function standardizeError(errorMsg) {
  return {
    title: '解析失败',
    content: '',
    resourceType: 'unknown',
    timestamp: Date.now(),
    status: 'error',
    error: errorMsg
  };
}

module.exports = { standardizeContent, standardizeError };
