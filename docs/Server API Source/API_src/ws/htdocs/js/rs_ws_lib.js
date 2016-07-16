
var DB_TYPE_FRIEND = 1;	// 
var DB_TYPE_GROUPS = 2;	// 群組
var DB_TYPE_COMM = 3;	// 社群

var DB_CM_TYPE_SET 		= "set";		// 
var DB_CM_TYPE_RECORD	= "record";		// 
var DB_CM_TYPE_CHAT 	= "chat";		// 聊天
var DB_CM_TYPE_PUSH_URL = "push_url";	// 
var DB_CM_TYPES_SYS 	= ["text","set","record","chat","push_url"];

var sys_https = location.protocol == "https:";
var sys_url_ptc = location.protocol+"//";

var HOST_NUNotice = HOST_NUNotice||(sys_https ? "nuweb.ddns.net:5702" : "nuweb.ddns.net:5701");
// Debug
if (location.href.indexOf("10.0.0.120") > -1) {
	HOST_NUNotice = sys_https ? "10.0.0.120:5702" : "10.0.0.120:5701";
}
if (location.href.indexOf("nuweb.ddns.net:6604") > -1) {
	HOST_NUNotice = sys_https ? "nuweb.ddns.net:5712" : "nuweb.ddns.net:5711";
}
console.log('~~~~~~ HOST_NUNotice='+HOST_NUNotice+' ~~~~~~~~~~~~~~');

var API_NUNotice = sys_url_ptc+HOST_NUNotice+"/nunotice";
var API_GCM = "/tools/GCM/gcm_api_tools.php";
var API_NOTICE = "/tools/api_notice.php";

var sys_debug = sys_debug||false;

function ws_getUrlHost() {
	return sys_url_ptc+HOST_NUNotice;
}
//////////////////////////////////////////////////////////////////////
function OBJ_WS()
{
	var This = this;
	this.RECONNECTING_TIME = 10000;
	this.m_wsUri = (sys_https?"wss://":"ws://")+HOST_NUNotice+"/";
	this.m_wsProtocol = "nuweb-notice";
	this.websocket = null;
	this.bConnect = false;;
	this.m_arg = null;
	this.tt = null;
	this.timeid_interval_ping = null;
	
	// 自訂攔截訊息
	this.m_custom_msg = null;
	// 監控訊息
	this.m_msg_mode = {};
	this.m_msg_list = [];
	
	
	
}
OBJ_WS.prototype = {

/*
	arg => {nu_code, mode, acn, sun, server_acn, [func(...)]}
	func(...) :	
		msg_list({cnt, cnt_noview, recs})
		msg_item_upd({rec})
		msg_item_del({rec})
*/
init: function(arg)
{
// console.log('rws:init arg=', arg);
	if (arg == null || (arg.acn||"") == "" || (arg.sun||"") == "") {
		console.log('ws::init Error: Invalid acn or sun.', arg);
		$("#se_ws_msg").html('ws::init Error: Invalid acn or sun.', arg);
		return false;
	}

	this.m_arg = arg;
	this.connect();
},
connect: function()
{ 
// console.log('rws:connect ~~~~~~~~~~~~~~~~~~~~~~~~~~');
	if (this.bConnect) {
		console.log('ws::connect Already online');
		return;
	}
	if (!this.m_arg) {
		console.log('ws::connect Not arg');
		return;
	}
	
	var This = this;
	This.tt = B_getCurrentTime();
	try {
// console.log('~~~ WebSocket connect m_wsUri=', This.m_wsUri);
		This.websocket = new WebSocket(This.m_wsUri, This.m_wsProtocol); 
	} catch(e) {
		This.onClose();
		return;
	}
	This.websocket.onopen 	= function(evt) { This.onOpen(evt);		} 
	This.websocket.onclose 	= function(evt) { This.onClose(evt); 	} 
	This.websocket.onmessage = function(evt) { This.onMessage(evt); 	} 
	This.websocket.onerror 	= function(evt) { This.onError(evt);	} 
},
close: function()
{
	this.m_arg = null;
	if (this.websocket)
		this.websocket.close();
},
onOpen: function(evt) 
{
	this.bConnect = true;
	this.login();
	this.interval_ping();
},
onClose: function(evt) 
{
	this.bConnect = false;
	this.websocket = null;
	
	// Reconnecting 
	var This = this;
	if (this.m_arg) {
		setTimeout(function(){
			This.connect();
		}, This.RECONNECTING_TIME);
	}
},
onMessage: function(evt) 
{
	try{var arg = JSON.parse(evt.data); }catch(e){}
// console.log('rws::onMessage arg.mode='+(arg && arg.mode ? arg.mode : "null"));
// console.log('rws::onMessage this.m_custom_msg typeof='+typeof this.m_custom_msg);
	
	if (arg) {
		// 自訂攔截訊息
		if (this.m_custom_msg) {
			if ((this.m_custom_msg.return_mode && arg.mode == this.m_custom_msg.return_mode)
					|| this.m_custom_msg.msg.mode == arg.mode ) {
				this.m_custom_msg.result = arg;
				this.m_custom_msg = null;
				return;
			}
		}
		// 監控訊息
		if (this.m_msg_mode[arg.mode])
			this.m_msg_mode[arg.mode](arg);
		for(var x=0; x<this.m_msg_list.length; x++) {
			this.m_msg_list[x](arg);
		}
		
/*		switch(arg.mode){
			case "error":
				B_Message(arg.msg);
				break;
				
			default:
				console.log('ws::onMessage Error: Invalid mode('+arg.mode+").");
				break;
		}*/
	}
},
onError: function(evt) 
{
	console.log('rws::onError data=', evt.data);
},
login: function()
{
	if (!this.bConnect) return;
	
	var b_info = B_getBrowserName();
	this.send_arg({
		mode: 		"login"
		,mode2: 	this.m_arg['mode']
		,nu_code: 	this.m_arg['nu_code']
		,acn: 		this.m_arg['acn']
		,sun: 		this.m_arg['sun']
		,server_acn:this.m_arg['server_acn']
		,fun_cb: 	(this.m_arg['fun_cb']||"")
		,platform: 	b_info.name+' '+b_info.ver
		,os: 		b_info.os+' '+b_info.osVer
	});
	// 
	var This = this;
	if (This.mi_cb) {
		setTimeout(function(){
			This.mi_init();
		},300);
	}
},
// 間隔 3分鐘 Ping 一次, 有發生錯誤就重新連線
interval_ping: function()
{
	var This = this;
	function do_ping() {
		if (This.bConnect == false)
			return;
		
		if (This.timeid_interval_ping)
			clearTimeout(This.timeid_interval_ping);
		
		try {
			var arg = {mode:"ping"};
			This.websocket.send(JSON.stringify(arg));
			console.log('rws::interval_ping ~~~');
			This.timeid_interval_ping = setTimeout(do_ping, 180000);
		} catch(e) {
			This.onClose();
		}
	}
	if (This.timeid_interval_ping)
		clearTimeout(This.timeid_interval_ping);
	This.timeid_interval_ping = setTimeout(do_ping, 180000);
},


cb_dlg_rec_init: function(recCB)
{
	recCB['id_dlg'] = "cb_"+recCB._id;
	recCB['bOwner'] = recCB.owner == this.m_arg.acn;
	recCB['friends']= B_array_del(recCB.allow, this.m_arg.acn);
	recCB['admin'] 	= recCB.admin||[];
	return recCB;
},



// 設定監控訊息
msg_mode_set: function(mode, func)
{
	this.m_msg_mode[mode] = func;
},
msg_set: function(func)
{
	for(var x=0; x<this.m_msg_list.length; x++) {
		if (this.m_msg_list[x] == func)
			return;
	}
	this.m_msg_list.push(func);
},
msg_del: function(func)
{
	for(var x=0; x<this.m_msg_list.length; x++) {
		if (this.m_msg_list[x] == func) {
			this.m_msg_list.splice(x,1);
			return;
		}
	}
},
send_arg: function(arg)
{
	if (!this.bConnect) return;
	var data = JSON.stringify(arg);
	this.websocket.send(data);
},



// arg => {msg{mode,...}, [return_mode], delay, funcOK}
api_getMsg: function(arg)
{
	if (this.m_custom_msg) {
		if (arg.funcOK) arg.funcOK(null, "Error: busy.");
		return;
	}

	if (!arg.delay) arg.delay = 2000;
	
	var This = this;
	var diff, tt = (new Date()).getTime();
	this.m_custom_msg = arg
	this.send_arg(arg.msg);
	function do_work() {
// Debug		
// diff = (new Date()).getTime() - tt;
// console.log('~~~~ api_getMsg diff='+diff);

		if (arg.result) {
			if (arg.funcOK) {
				if (arg.result.error)
					arg.funcOK(null, arg.result.error);
				else
					arg.funcOK(arg.result);
			}
			return;
		}
		diff = (new Date()).getTime() - tt;
		if (diff < arg.delay)
			setTimeout(do_work, 30);
		else {
			This.m_custom_msg = null;
			if (arg.funcOK) arg.funcOK(null, "Error: timeout.");
		}
	}
	//setTimeout(do_work, 30);
	setTimeout(function(){
		do_work();
	}, 30);
},
// arg => {mode, [...]}
api_send_cb_msg: function(arg, funcOK)
{
	var This = this;
	var request_data = {
		data: JSON.stringify(arg)
	}
	$.ajax(API_NUNotice, {
		data: 		request_data,
		nu_code: 	B_getCookie("nu_code"),
		dataType: 	'jsonp', 
		jsonp: 		"callback",
		success: 	function(data) {
			
// console.log(API_NUNotice+"?"+B_con_Object2UrlArg(request_data));
// console.log('data=', data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
				if (funcOK) funcOK(data, err);
				return;
			}
			// GCM
			This.api_sendGCM({
				key: 	 arg.allow
				,time: 	 B_getCurrentTimeStr(null,1)
				,msg: 	 {cnt_noview:1}
				,title:  arg.title
				,content:arg.content
			}, function(data, err){
				
				if (B_CheckError_SendResult(data, false)) {
					err = data;
					data = null;
				}
				if (funcOK) funcOK(data, err);
			});
		},
		error: function(xhr) {
// console.log(API_NUNotice+"?"+B_con_Object2UrlArg(request_data));
// console.log('xhr=', xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK(null, err);
		}
	});
},
// arg => {owner, url, url_type, allow, title, content}
api_sendNotice: function(arg, funcOK)
{
	var This = this;
	var request_data = {
		data: JSON.stringify(arg)
	}
	$.ajax(API_NUNotice, {
		data: 		request_data,
		nu_code: 	B_getCookie("nu_code"),
		dataType: 	'jsonp', 
		jsonp: 		"callback",
		success: 	function(data) {
			
// console.log(API_NUNotice+"?"+B_con_Object2UrlArg(request_data));
// console.log('data=', data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
				if (funcOK) funcOK(data, err);
				return;
			}
			// GCM
			This.api_sendGCM({
				key: 	 arg.allow
				,time: 	 B_getCurrentTimeStr(null,1)
				,msg: 	 {cnt_noview:1}
				,title:  arg.title
				,content:arg.content
			}, function(data, err){
				
				if (B_CheckError_SendResult(data, false)) {
					err = data;
					data = null;
				}
				if (funcOK) funcOK(data, err);
			});
		},
		error: function(xhr) {
// console.log(API_NUNotice+"?"+B_con_Object2UrlArg(request_data));
// console.log('xhr=', xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK(null, err);
		}
	});
},
// arg => {url, [url_group], url_type, allow, title, content}
api_sendNotice2: function(arg, funcOK)
{
	var This = this;
	var request_data = {
		mode:"send"
		,rec: JSON.stringify(arg)
	}
	$.ajax({
		type: 		"POST"
		,url: 		API_NOTICE
		,data: 		request_data
		,dataType: 	'json'
		,success: 	function(data) {
			
// console.log(API_NOTICE+"?"+B_con_Object2UrlArg(request_data));
// console.log('data=', data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
				if (funcOK) funcOK(data, err);
				return;
			}
			// GCM
			This.api_sendGCM({
				key: 	 arg.allow
				,time: 	 B_getCurrentTimeStr(null,1)
				,msg: 	 {cnt_noview:1}
				,title:  arg.title
				,content:arg.content
			}, function(data, err){
				
				if (B_CheckError_SendResult(data, false)) {
					err = data;
					data = null;
				}
				if (funcOK) funcOK(data, err);
			});
		}
		,error: function(xhr) {
// console.log(API_NOTICE+"?"+B_con_Object2UrlArg(request_data));
// console.log('xhr=', xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK(null, err);
		}
	});
},
// arg => {mode, rec{...}}
api_sendNotice3: function(arg, funcOK)
{
	var This = this;
	var request_data = {
		mode: arg.mode
		,rec: JSON.stringify(arg.rec)
	}
	$.ajax({
		type: 		"POST"
		,url: 		API_NOTICE
		,data: 		request_data
		,dataType: 	'json'
		,success: 	function(data) {
			
// console.log(API_NOTICE+"?"+B_con_Object2UrlArg(request_data));
// console.log('data=', data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
				if (funcOK) funcOK(data, err);
				return;
			}
		}
		,error: function(xhr) {
// console.log(API_NOTICE+"?"+B_con_Object2UrlArg(request_data));
// console.log('xhr=', xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK(null, err);
		}
	});
},
// rec => {key, time, msg{JSON}, title, content}
api_sendGCM: function(rec, funcOK)
{
// console.log("api_sendGCM - rec=", rec);
	if (typeof(rec.msg) == "object")
		rec.msg = JSON.stringify(rec.msg)
	var request_data = {
		mode:	 'send2'
		,rec:	 rec_con_obj2rec(rec)
		,nu_code:B_getCookie("nu_code")
	}
	$.ajax({
		type: "POST"
	,	cache: false
	,	url: API_GCM
	,	data: request_data
	,	success: function(data, textStatus) {
		
// console.log("api_sendGCM - url="+API_GCM+"?"+B_con_Object2UrlArg(request_data));
// console.log("api_sendGCM - data", data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
			}
			if (funcOK) funcOK(data, err);
		}
	,	error: function(xhr) {
// console.log("api_sendGCM - url="+API_GCM+"?"+B_con_Object2UrlArg(request_data));
// console.log("api_sendGCM - xhr", xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK(null, err);
		}
	});
}

}
var oWS = new OBJ_WS();






