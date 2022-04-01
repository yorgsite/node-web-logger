# node-web-logger
Console loging to a browser terminal. Useful to not disturb the main terminal output.

This console outputs to a websocket server.
The served page dispatches logs to the browser console.

Install :

```
npm install -g node-web-logger
```

<hr/>

**launch**


Anywere in cli
```batch
node-web-logger
```

Use logger.
```javascript
let {Logger} = require('node-web-logger');
Logger.log('something');
```

<hr/>
Handled methods :

		"log","error","group","groupEnd",
		"warn","assert","clear","debug","info",
		"table","dir","count","countReset"


<br/>


