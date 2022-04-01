#!/user/bin/env node

const {WSServer}=require('./WSServer.js');

let ws=new WSServer();

ws.start();