module.exports = {
    apps : [{
        name: "loopback-Server-Dev",
        script: "server/server.js",
        watch: ["server", "package.json", "package-lock.json"],
        ignore_watch: ["node_modules", "server/storage"],
        watch_options: {
            usePolling: true
        }
    }]
  }