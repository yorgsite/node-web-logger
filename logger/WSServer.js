

const WebSocketServer = require('websocket').server;
const HTTP	= require('http');
// const Path	= require('path');
// const Mime	= require('mime');
const fs	= require('fs');
const styl	= require('node-styl');
// const {WSConfig}=require('./WSConfig.js')
// const {Listener}=require('./shared/Listener.js')
// const {WSHost}=require('./WSHost.js')
// const {Sources}=require('./Sources.js')
let hc=0;
class WSHost{
	constructor(server,request){
		this.id=hc++;
		this.server=server;
		this.socket=request.accept(null, request.origin);
		this.socket.on('close', (evt)=>{
			delete server._hosts[this.id];
		});
		
		this.socket.on('message', (message)=>{
			console.log(styl('message').cyan+'',message.utf8Data);
			if (message.type === 'utf8') {
				let msg=JSON.parse(message.utf8Data);
				this.onCmd(msg.cmd,msg.data);
			}
		});
		// this.socket.on('message', (message)=>{});
		this.type=null;
	}
	onCmd(cmd,data){
		console.log('onCmd',cmd,data);
		if(cmd==='clientType'){
			this.type=data;
		}
	}
	send(cmd,data,trace){
		this.socket.send(JSON.stringify({cmd,data,trace}));
	}
};


class WSServer{
	constructor(params={}){
		this.cwd= process.cwd().split('\\').join('/');
		this.config=JSON.parse(fs.readFileSync(__dirname+'/config.json','utf-8'));
		// this.config=new WSConfig(params);
		// this._listener=new Listener();
		// this._sources=new Sources(this);
		this._hosts={};

	}
	on(type,cb){
		this._listener.add(type,cb);
		return this;
	}
	onOpen(cb){
		return this.on('open',cb);
	}
	onCmd(cmd,data,trace){
		// console.log('srv onCmd',cmd,data);
		if(this.config.overrides.includes(cmd)){
			Object.values(this._hosts).filter(v=>v.type==='web').map(v=>v.send(cmd,data,trace));
		}
	}
	onMsg(msg){
		// console.log(styl('onMsg<').cyan+"",body,styl('>onMsg').cyan+"");
		try{
			let post = JSON.parse(msg);
			this.onCmd(post.cmd,post.data,post.trace);

		}catch(e){
			this.onCmd('warn',[msg],null);
		}
	}
	start(){
		this.server = HTTP.createServer((request, response)=>{
			let path=request.url.split('/').filter(v=>v).join('/');
			// console.log('path',JSON.stringify(path));
			if(!path){
				response.writeHeader(200, {"Content-Type":'text/html'});
				response.write(fs.readFileSync(__dirname+'/client/index.html','utf-8'));
			}else if(path==='script.js'){
				// console.log('script');
				response.writeHeader(200, {"Content-Type":'application/javascript'});
				response.write(fs.readFileSync(__dirname+'/client/script.js','utf-8').split('"%CONFIG%"')
				.join(JSON.stringify(this.config)));

			}else if(path==='cmd'){
				// console.log('cmd');
				let body = '';
				request.setEncoding('utf8');
				request.on('data', (data)=> {
					body += data;
					// console.log(styl('data<').yellow+''+data+styl('>data').yellow+"");
					if (body.length > 1e6) request.connection.destroy();
				});
				request.on('end',  () =>{
					this.onMsg(body);
				});
			}else{
				response.writeHeader(200, {"Content-Type":'text/html'});
				response.write('### Error: ressource not found : '+request.url+' \n '+JSON.stringify(path));
			}
			response.end();
		});
		let url="http://"+this.config.host+":"+this.config.port+"/";
		this.server.listen(this.config.port, ()=>{
			console.log(styl("─────────────────────────────────────────────").green.bold+'');
			console.log(' '+styl('Server starts').green.bold+'');
			console.log(' '+(new Date()));
			console.log(" Listening on port : "+ styl(this.config.port).cyan.bold);
			console.log(" Try url           : "+ styl(url).cyan.bold);
			console.log(styl("─────────────────────────────────────────────").green.bold+'');
		});
		this.wsServer = new WebSocketServer({
			httpServer: this.server
		});
		// wsServer.on('connection', socket => {

		let opid=this.config.openDelay?
		setTimeout(()=>{
			let start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
			try{require('child_process').exec(start + ' ' + url);
			}catch(e){}
		},this.config.openDelay):0;

		this.wsServer.on('request', (request)=>{
			console.log('request');
			if(opid){
				clearTimeout(opid);
				opid=0;
			}
			let host=new WSHost(this,request);
			this._hosts[host.id]=host;
			host.send('clientType','');
		});
		
		let msgdir=__dirname+'/_messages/';

		let msid=0;
		const readMessages=()=>{
			// console.log('readMessages');
			if(!msid)msid=setTimeout(() => {
				fs.readdirSync(msgdir)
				.map(file=>{
					let json=fs.readFileSync(msgdir+file,'utf-8');
					fs.unlinkSync(msgdir+file);
					this.onMsg(json);
				});
				msid=0;
			}, 5);

		};
		fs.watch(msgdir,readMessages);
		readMessages();
	}
}

module.exports={WSServer};