// app.js 入口文件
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello Vercel1123!");
});

if (require.main === module) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`本地服务器运行在 http://localhost:${port}`);
  });
}

module.exports = app;
