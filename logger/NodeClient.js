
const WebSocketClient = require('websocket').client;
const fs	= require('fs');
const HTTP	= require('http');

class GhostServer{
	constructor(){
		let cmd='node '+__dirname+'/start';
		// console.log(cmd);
		require('child_process').exec(cmd);
	}
};

let ghostServer,idcnt=1;

class LogData{
	constructor(args=[],maxDepth=1){
		this.args=args;
		this.maxDepth=maxDepth;
	}
	toDataIter(src,list=[],depth=0){
		if(depth<this.maxDepth){
			let t=typeof(data);
			let res;
			if(t==='object'){
				// let ci=list.indexOf(data);
				
			}
	
		}else{
			return '…';
		}

	}
	toData(){
		return this.toDataIter(this.args);
	}
	fromData(){}
};

class NodeClient{
	constructor(){
		this.config=JSON.parse(fs.readFileSync(__dirname+'/config.json','utf-8'));
		this.config.startedAt=Date.now();
		// this.config.maxDepth
	}
	send(cmd,data,anon=false,level=0){
		let trace=anon?null:(new Error()).stack.split('\n').slice(3+level);
		let msg = JSON.stringify({cmd,trace,data:this.extractData(data),time:Date.now()});
		if(msg.length>this.config.chuck){
			this.sendParts(msg);
		}else{
			this.sendMessage(msg);

		}
		// msg = encodeURIComponent(msg);
		// console.log(msg);
	}
	sendParts(msg){
		let dsize=Math.foor(this.config.chuck*0.7),
		id=idcnt++,
		nb=Math.ceil(msg.length/dsize);
		for(let i=0,ofs=0,nofs=0;i<nb;i++){				
			nofs=msg.charAt((i+1)*dsize-1)==='\\'?1:0;
			this.send('_part_',{i,id,nb,str:msg.substring(i*dsize+ofs,(i+1)*dsize+nofs)});
			ofs=nofs;
		}
	}
	sendMessage(msg){
		if(this.config.policy==='file'){
			this.sendMessageFile(msg);
		}else{
			this.sendMessageRequest(msg);
		}
	}
	sendMessageFile(msg){
		let file=__dirname+'/_messages/'+this.config.filesName+'_'+this.config.startedAt+'_'+(idcnt++)+'.json';
		fs.writeFileSync(file,msg,'utf-8');
	}
	sendMessageRequest(msg){
		const options = {
			hostname: this.config.host,
			port: this.config.port,
			path: '/cmd',
			method: 'POST',
			encoding:'utf8',
			headers: {
				'Content-Type': 'text',
				'Content-Length': msg.length
			},
		}
		const req = HTTP.request(options, res => {
			// console.log('req result',res);
		});
		req.on('error', (err)=>{
			// console.log('req error',err);
			// if(!ghostServer){
			// 	ghostServer=new GhostServer();
			// }
			// setTimeout(()=>this.send(cmd,data),2000);
		});
		
		req.write(msg);
		req.end();
	}
	extractData(data,depth=0){
		if(depth<this.config.maxDepth){
			let t=typeof(data);
			if(t==='object'&&data!==null){
				
				if(data instanceof Array)return data.map(v=>this.extractData(v,depth+1));
				else{
					let res={};
					Object.keys(data).map(k=>res[k]=this.extractData(data[k],depth+1));
					return res;
				}
			}else if(t==='function'){
				return data+'';
			}else return data;
		}else{
			return '...';
		}

	}
	
};



module.exports={NodeClient};