
window.addEventListener('load',()=>{
	const config="%CONFIG%";

	let pile=[],nextId,lossTime=0,retryId,frameId;
	let dommsgs=document.getElementById("msgs");

	let _nextMg=msg=>{
		pile.push(Object.assign(msg,{local:Date.now()}));
		if(!nextId){
			nextId=requestAnimationFrame(_nextLogs);
		}
	};
	let _nextLogs=()=>{
		let local=Date.now(),msg;
		pile.sort((a,b)=>a.time-b.time);
		while(pile.length&&local-pile[0].local>config.logDelay){
			msg=pile.shift();
			console[msg.cmd](...msg.data);
			if(msg.trace&&msg.trace.length){//
				console.groupCollapsed('↳ %c'+config.traceLabel+' %c'+msg.trace[0],config.styles.traceLabel,config.styles.traceFirst);
				msg.trace.forEach(t=>console.log('%c'+t,config.styles.traceRow));
				console.groupEnd();	
			}
		}
		if(pile.length){
			nextId=requestAnimationFrame(_nextLogs);
		}else{
			nextId=0;
		}
	};

	const connect=function(){
		if(lossTime>config.reconnectTimeout){
			let err=[
				'-----------------------',
				'Connexion loss timeout',
				'Press F5 to refresh',
				'-----------------------',
			];
			dommsgs.innerHTML=err.join('<br/>');
			console.error(err.join('\n'));
			return;
		}
		dommsgs.innerHTML='try connect ... ( '+lossTime+' / '+config.reconnectTimeout+') ms';
		
		lossTime+=config.reconnectDelay;
		const socket = new (window.WebSocket || window.MozWebSocket)('ws://'+config.host+':'+config.port);
		const _send=(cmd,data)=>{
			socket.send(JSON.stringify({cmd,data}));
		};
	
		socket.addEventListener('open', function (event) {
			console.log('%c   CONSOLE READY   %c','color:#fff;background-color:#084;');
			dommsgs.innerHTML='websocket OK';
			if(retryId)clearTimeout(retryId);
			lossTime=0;
			retryId=0;
			socket.addEventListener('close', function (event) {
				if(frameId)cancelAnimationFrame(frameId);
				frameId=0;
				dommsgs.innerHTML='<u>/!\\</u> websocket closed';
				setTimeout(connect,config.reconnectDelay);
			});
		});
		
		// Listen for messages
		socket.addEventListener('message', function (event) {
			let msg=JSON.parse(event.data);
			if(msg.cmd==='clientType'){
				_send('clientType','web');
			}else if(config.overrides.includes(msg.cmd)){
				_nextMg(msg);
			}
			
		});
		socket.addEventListener('error', function (event) {
			frameId=requestAnimationFrame(()=>{
				frameId=0;
				retryId=setTimeout(connect,config.reconnectDelay);
			});
		});
	};

	connect();

});