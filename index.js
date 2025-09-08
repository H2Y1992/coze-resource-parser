// app.js 入口文件
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello Vercel1123!");
});

// 在 api/parse.js 中添加
app.get('/parse-resource', (req, res) => {
  res.json({ message: "接口可用，请使用 POST 方法调用" });
});

if (require.main === module) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`本地服务器运行在 http://localhost:${port}`);
  });
}

module.exports = app;
