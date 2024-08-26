module.exports = {
  apps : [
    {
      name: "rtc_socket",  // Node.js 애플리케이션 이름
      script: "./socket-server.js",
      // args: "socket-server.js",  // 실행할 파일
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],

  deploy : {
    production : {
      user : 'ubuntu',
      host : '13.124.160.18',
      ref  : 'origin/main',
      repo : 'https://github.com/LingoBell/LingoBell-Socket-server.git',
      path: '/home/ubuntu/lingobell_socket_server',
      key: "~/develop/lingobell-EC2.pem",
      'post-deploy' : 'npm i && pm2 reload ecosystem.config.js --env production'
    }
  }
};
