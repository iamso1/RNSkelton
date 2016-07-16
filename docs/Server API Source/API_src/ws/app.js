
var SV_PORT = 5701;
var SVS_PORT = 5702;

// mongoose setup
require('./db');

var os 			= require('os');
var express 	= require('express');
var http 		= require('http');
var https 		= require('https');
var fs 			= require('fs');
var path 		= require('path');
var favicon		= require('serve-favicon');
var colors 		= require('colors');
var multer  	= require('multer')
var upload 		= multer({dest:os.tmpdir()+"/"})

var util		= require('./utils');
var routes 		= require('./routes');
var ws 			= require('./routes/websocket');
var cb 			= require('./routes/chatbox');
var user 		= require('./routes/user');



/*
var cluster 	= require('cluster');
var numCPUs 	= os.cpus().length;
console.log('~~~ numCPUs='+numCPUs+', isMaster='+cluster.isMaster);
if (cluster.isMaster)
{
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('exit', function(worker, code, signal) {
		console.log('cluster:exit worker: ' + worker.process.pid + ' died');
		console.log('cluster:exit code: ', code);
		console.log('cluster:exit signal: ', signal);
	});
}
else
{ 
*/


//var privateKey  = fs.readFileSync('/etc/apache2/ssl/apache.key', 'utf8');
//var certificate = fs.readFileSync('/etc/apache2/ssl/apache.pem', 'utf8');
var privateKey  = fs.readFileSync('/data/ws/ssl/apache.key', 'utf8');
var certificate = fs.readFileSync('/data/ws/ssl/apache.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};

var app = express();
var httpsServer = https.createServer(credentials, app);
var expressWs = require('./express-ws')(app, httpsServer);
// all environments
app.set('port', SV_PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname+'/htdocs/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.json({limit: '100mb'}));
app.use(express.urlencoded({limit: '100mb'}));
//app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'htdocs')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.all('/nunotice', 		routes.nunotice);
app.all('/UserProfile/user_image.php',routes.user_image);
app.all('/api_external',	routes.api_external);
app.all('/api_upload_file_p',upload.array('file', 64), routes.api_upload_file_p);

app.all('/cb_msg', 			cb.cb_msg);
app.all('/cb_view_file',	cb.cb_view_file);
app.all('/cb_tools',		cb.cb_tools);
app.all('/cb_upload_file',	upload.array('file', 64), cb.cb_upload_file);
app.all('/cb_upload_record',upload.array('file', 64), cb.cb_upload_record);

//app.get('/', routes.index);
//app.get('/users', user.list);
app.get('/server', routes.server);
app.get('/ws_test', routes.ws_test);
app.get('/nudb', routes.nudb);
// Test
app.get('/test', function(req, res){
	try {
		var bCallback = req.body['callback']||req.query['callback'];
	} catch(e){}
	
	if (bCallback) {
		var out = {result:"ok"};
		res.jsonp(out).end();
	} else {
		res.setHeader('Content-Type', 'text/plain');
		res.end("ok");
	}
});


// Web Socket
app.ws('/', ws.onRequest);
app.wss('/', ws.onRequest);

app.listen(app.get('port'), function(){
	console.log('Express server listening on port '+app.get('port'));
});
httpsServer.listen(SVS_PORT, function(){
	console.log('Https Express server listening on port '+SVS_PORT);
});



/*
// Debug
util.url_getFile({
//	url:	"http://tw.news.yahoo.com/iphone-se%E9%96%8B%E6%94%BE%E9%A0%90%E8%B3%BC-%E6%9E%9C%E7%B2%89%E6%9C%80%E6%84%9B64g%E7%8E%AB%E7%91%B0%E9%87%91-071219183.html?arg=123456&cc=WWW"
//	url:	"http://10.0.0.28/tools/page/show_page.php?page_url=/Site/wheechen/Driver/"
//	url:	"HTTPS://www.google.com.tw:8080/"
	url:	"https://ser001.nuweb.smartnetwork.com.tw/API/get_relation_list.php"
	,cookie:	"nu_code=Lj566B060A067858100A34020A00290C27053C0600046201080F6B30010D29210F073F5Dvk"
	,getHeaders: true
//	,data: {
//	}
	,funcOK: function(data, err){
console.log('~~~~~~~~ data=', data);
console.log('~~~~~~~~ err=', err);
	}
});

*/



//}
