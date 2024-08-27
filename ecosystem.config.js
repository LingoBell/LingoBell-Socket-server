module.exports = {
  apps : [
    {
      name: "rtc_socket",  // Node.js 애플리케이션 이름
      script: "./chatroomServer.js",
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
      host : 'ec2-54-180-248-106.ap-northeast-2.compute.amazonaws.com',
      ref  : 'origin/main',
      repo : 'https://github.com/LingoBell/LingoBell-Socket-server.git',
      path: '/home/ubuntu/lingobell_socket_server',
      key: "~/develop/lingobell-EC2.pem",
      'post-deploy' : 'npm i && pm2 reload ecosystem.config.js --env production'
    }
  }
};
