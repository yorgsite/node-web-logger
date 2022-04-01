#!/user/bin/env node
const {WSServer}=require(__dirname+'/../logger/WSServer.js');

let ws=new WSServer();

ws.start();