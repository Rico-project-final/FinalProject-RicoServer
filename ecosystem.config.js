module.exports = {
  apps : [{
    name   : "RicoServer",
    script : "dist/app.js",
    env_production: {
      NODE_ENV: "prod",
      PORT: 443
    },
  }]
}
