
const WebSocketClient = require('websocket').client;
const fs	= require('fs');
const {NodeClient}=require('./NodeClient.js');

const confProxy=(obj)=>{
	return new Proxy({},{
		get:(tgt,prop)=>{
			return typeof(obj[prop])==='object'?confProxy(obj[prop]):obj[prop];
		},
		set:(tgt,prop,val)=>{
			if(typeof(obj[prop])==='object'){
				setObj(obj[prop],val);
			}else{
				obj[prop]=val;
			}
		}
	});
};
const setObj=(tgt,obj)=>{
	let cp=confProxy(tgt);
	Object.keys(obj).map(k=>cp[k]=obj[k]);
};

class AbstractLogger{
	constructor(client,params){
		this.client = client;
		this.params = params;
		this.client.config.overrides.map(cmd=>{
			this[cmd]=(...args)=>this.client.send(cmd,args,params.anon);
		});
	}
	get config(){
		// return this.client.config;
		return confProxy(this.client.config);
	}
	set config(v){
		setObj(this.client.config,v);
	}
	try(callback){
		return new Promise((res,rej)=>{
			try {
				callback();
				res();
			} catch (error) {
				let pol=this.client.config.policy;
				this.client.config.policy='file';
				
				this.client.send('error',['Error:\n'+error+''],this.params.anon,3);
				
				this.client.config.policy=pol;
				rej(error);
			}
		});
	}
}
class Logger extends AbstractLogger{
	constructor(){
		super(new NodeClient(),{});
		this.anon=new AbstractLogger(this.client,{anon:true});
	}
};

let logger=null;
let obj={};
Object.defineProperty(obj,'Logger',{get:()=>logger?logger:(logger=new Logger())})

module.exports=obj;