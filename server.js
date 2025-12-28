const http = require("http");
const nextServer = require("./.next/standalone/server");

const port = process.env.PORT || 8080;
const requestListener =
  typeof nextServer === "function" ? nextServer : nextServer.default;

const server = http.createServer((req, res) => {
  requestListener(req, res);
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
