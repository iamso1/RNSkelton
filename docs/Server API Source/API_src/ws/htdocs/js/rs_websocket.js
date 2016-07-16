
var DB_TYPE_FRIEND = 1;	// 
var DB_TYPE_GROUPS = 2;	// 群組
var DB_TYPE_COMM = 3;	// 社群

var DB_CM_TYPE_SET 		= "set";		// 
var DB_CM_TYPE_RECORD	= "record";		// 
var DB_CM_TYPE_CHAT 	= "chat";		// 聊天
var DB_CM_TYPE_PUSH_URL = "push_url";	// 
var DB_CM_TYPES_SYS 	= ["text","set","record","chat","push_url"];


var HOST_NUNotice = HOST_NUNotice||(sys_https ? "nuweb.ddns.net:5702" : "nuweb.ddns.net:5701");
var HOST_RTC = "nuweb.ddns.net:5702";
//var URL_CHATBOX = "https://nuweb.ddns.net:5702";
var URL_CHATBOX = sys_url_ptc+HOST_NUNotice;
var API_NUNotice = sys_url_ptc+HOST_NUNotice+"/nunotice";
var API_GCM 	= "/tools/GCM/gcm_api_tools.php";
var API_NOTICE 	= "/tools/api_notice.php";
var API_CHATBOX = "/cb_chatbox.html";
var API_CHAT 	= "/cb_chat.html";

var sys_debug = sys_debug||false;
// Debug
if (location.href.indexOf("10.0.0.120") > -1 || location.href.indexOf("10.0.0.28") > -1) {
	HOST_RTC = "10.0.0.120:5702";
	URL_CHATBOX = sys_url_ptc+(sys_https ? "10.0.0.120:5702" : "10.0.0.120:5701");
}



function ws_getUrlHost() {
	return sys_url_ptc+HOST_NUNotice;
}
//////////////////////////////////////////////////////////////////////
function OBJ_WebSocket()
{
	var url = ws_getUrlHost()+"/js/rs_websocket.css";
// console.log('~~~~~~ CSS_WebSocket url='+url+' ~~~~~~~~~~~~~~');
	if (!B_LinkIsExists(url))
		$('head').append('<link rel="stylesheet" type="text/css" href="'+url+'" />');
	
	url = ws_getUrlHost()+"/js/rs_webrtc.js";
console.log('~~~~~~ JS_WebRTC url='+url+' ~~~~~~~~~~~~~~');
	if (!B_LinkIsExists(url))
		$('head').append('<script type="text/javascript" src="'+url+'" />');
	
	
	
	var This = this;
	this._upload_file_id = 0;
	this.RECONNECTING_TIME = 10000;
	this.m_wsUri = (sys_https?"wss://":"ws://")+HOST_NUNotice+"/";
	this.m_wsProtocol = "nuweb-notice";
	this.websocket = null;
	this.bConnect = false;;
	this.m_arg = null;
	this.tt = null;
	this.$menu = null;
	this.cnt_noview = 0;
	this.bNUWeb = false;
	this.timeid_interval_ping = null;
	
	// 自訂攔截訊息
	this.m_custom_msg = null;
	// 監控訊息
	this.m_watch_msg = {};
	
	
	this.mi_ms = null;
	this.mi_cb = null;
	
	this.bNUDrive = false;
	this.cb_bLoad = false;
	this.cb_bNext = true;
	this.cb_ps = 20;
	
	this.cb_menu = null;
	this.cb_ud_cid = null;
	this.cb_ud_$dlg = null;
	
	
	
	var TimeID_window_resize = null;
	function window_resize() {
		clearTimeout(TimeID_window_resize);
		TimeID_window_resize = setTimeout(This.window_adjust, 300);
	}
	$(window).on("resize", window_resize);
	
	
}
OBJ_WebSocket.prototype = {

getUploadFileID: function()
{
	return "ws-"+(++this._upload_file_id);
},
/*
	arg => {mode, acn, sun, domain, server_acn, [func(...)]}
	func(...) :	
		msg_list({cnt, cnt_noview, recs})
		msg_item_upd({rec})
		msg_item_del({rec})
*/
init: function(arg)
{
// console.log('ws:init arg=', arg);
	if (arg == null || (arg.acn||"") == "" || (arg.sun||"") == "") {
		console.log('ws::init Error: Invalid acn or sun.', arg);
		$("#se_ws_msg").html('ws::init Error: Invalid acn or sun.', arg);
		return false;
	}

	var This = this;
	this.m_arg = arg;
	this.mi_ms = arg.mi_ms;
	this.mi_cb = arg.mi_cb;
	this.bNUDrive = arg.bNUDrive||false;
	this.connect();
	
	// Test
	$("#se_ws_sel").on("change", function(){
		var $t = $(this);
		var rec = $t.find("option").get($t.find("option:selected").index()).rec;
		console.log('change rec=', rec);
		This.send_ItemView(rec._id);
	})
	
	// NUWeb
	if (this.mi_ms && this.mi_ms.length) {
		var $bn = this.mi_ms.show();
		this.bNUWeb = true;
		this.$menu = $bn.menu2({
			positionOpts: {
				posX: 'left', 
				posY: 'bottom',
				offsetX: 0,
				offsetY: 0,
				directionH: 'right',
				directionV: 'down', 
				detectH: true, // do horizontal collision detection  
				detectV: false, // do vertical collision detection
				linkToFront: false
			}
			,width: 380
			,content: 
				'<div id="menu_notice" class="menu_msg_new">'
					+'<div class="hreader">'
						+'<div class="float_right">'
							+'<span id="bnReadAll" class="bnA">全部標示為已讀</span>'
						+'</div>'
						+'<span class="title">通知：</span>'
					+'</div>'
					+'<div class="scrollbar">'
						+'<ul class="items"></ul>'
					+'</div>'
					+'<div class="footer hide">'
					+'</div>'
				+'</div>'
			,onShowMenu: function(menu) {
			
				menu.addClass("scrollbar");
				if (window.sys_dlg_zIndex)
					menu.css({zIndex:sys_dlg_zIndex});
				
				setTimeout(function(){
					// 調整 Menu 高度
					var h_bn = $bn.offset().top+$bn.height();
					var h_hf = menu.find(".hreader").outerHeight()+menu.find(".footer").outerHeight();
					menu.css({maxHeight:"none"});
					menu.find(".scrollbar").css({maxHeight:($(window).height()-h_hf-h_bn-10)+'px', overflowY:'auto'});
					//
					menu.find(".img_square").f_img_square();
				},100);
			}
			,onchooseItem: function(item) {
				This.nt_item_onClick($(item).parent());
			}
		});
		this.$menu.create();
		this.$menu.kill();
		//
		this.$menu.$dlg.find(".hreader #bnReadAll")
			.on("click", function(){
				
				This.api_getMsg({
					msg:{
						mode: "nt_set_read_all"
						,act: "clear"
					}
					,funcOK: function(data, err) {
						if (err) 
							B_Message(err)
					}
				});
			});
		// 
		if (window.main_icon_resize)
			window.main_icon_resize();
	}
	
	// rs_webrtc.js 沒有即時載入，所以慢一點判斷
	function do_rtc_init(){
		if (window.oWRTC)
			oWRTC.init();
		else
			setTimeout(do_rtc_init, 300);
	}
	if (This.mi_cb)
		do_rtc_init();
	
	return true;
},
window_adjust: function()
{
	var $dlgs = $(".cb_chatbox_dlg");
	if ($dlgs.length) {
		var $win = $(window);
		var w_win = $win.width();
		var h_win = $win.height();
		$(".cb_chatbox_dlg").each(function(){
			var $dlg = $(this);
			if ($dlg.is(":hidden")) return;
			var os = $dlg.offset();
			var css = {}, l = 0;
			if (os.left < 0 || os.left+$dlg.width() > w_win){
				l++; css.left = w_win-$dlg.width()-1;
				if (css.left < 0) css.left = 0;
			}
			if (os.top < 0 || os.top+$dlg.height() > h_win) {
				l++; css.top = h_win-$dlg.height()-1;
				if (css.top < 0) css.top = 0;
			}
			if (l) $dlg.css(css);
			if ($dlg.height() > h_win) {
				var $dlgC = $dlg.find(".ui-dialog-content");
				$dlgC.height(h_win-$dlg.find(".ui-dialog-titlebar").outerHeight());
				$dlgC.get(0).arg.resize();
			}
		});
	}
},
connect: function()
{ 
	if (this.bConnect) {
		console.log('ws::connect Already online');
		$("#se_ws_msg").html('ws::connect Already online');
		return;
	}
	if (!this.m_arg) {
		console.log('ws::connect Not arg');
		$("#se_ws_msg").html('ws::connect Not arg');
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
	
	$("#se_ws_msg").html("");
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
	if (!arg) return
console.log('ws::onMessage mode='+arg.mode);

		
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
	if (this.m_watch_msg) {
		if (this.m_watch_msg[arg.mode])
			this.m_watch_msg[arg.mode](arg);
	}
	
	switch(arg.mode){
		case "error":
			B_Message(arg.msg);
			break;
			
		case "list":
		case "notice_getList":
		case "nt_getList":
			this._nt_getList(arg);
			if (this.m_arg.msg_list) this.m_arg.msg_list(arg);
			break;
		case "item_upd":
			this._nt_item_upd(arg);
			if (this.m_arg.msg_item_upd) this.m_arg.msg_item_upd(arg);
			break;
		case "item_del":
			this._nt_item_del(arg);
			if (this.m_arg.msg_item_del) this.m_arg.msg_item_del(arg);
			break;
		
		// ChatBox
		case "cb_getList":
			this._cb_getList(arg);
			break;
		case "cb_friend_add":
			this._cb_friend_add(arg);
			break;
		case "cb_openBox":
			arg.bSound = false;
			this._cb_upd(arg);
			this._cb_openBox(arg);
			break;
		case "cb_upd":
			this._cb_upd(arg);
			break;
		case "cb_set_quit":
			this._cb_set_quit(arg);
			break;
			
		case "cb_msg_getList":
			this._cb_msg_getList(arg);
			break;
		case "cb_msg_add":
			this._cb_msg_add(arg);
			break;
			
// Debug
		case "cb_rtc_call":
console.log('ws::onMessage cb_rtc_call act='+(arg.act ? arg.act : "null"));
console.log('ws::onMessage cb_rtc_call m_watch_msg=', this.m_watch_msg);
			break;
			
		default:
		
			console.log('ws::onMessage Error: Invalid mode('+arg.mode+").");
			break;
	}
},
// 設定監控訊息
set_watch_msg: function(mode, func)
{
	this.m_watch_msg[mode] = func;
},
msg_mode_set: function(mode, func)
{
	this.m_watch_msg[mode] = func;
},


_nt_getList: function(arg)
{
	// NUWeb
	if (this.bNUWeb) {
		var $se = this.$menu.$dlg.find("#menu_notice .items").empty();
		if (arg.recs && arg.recs.length) {
			for (var x=0; x<arg.recs.length; x++) {
				var rec = arg.recs[x];
				var $ti = this.nt_item_append($se, rec);
			}
			//this.$menu.items_reset();
		}
		else {
			$se.html(
				'<li class="item nomsgs"><a href="#">'
					+'<div class="msg_not_content">'
						+'沒有新訊息' // +gLang['s_NoNewMessage'] // 沒有新訊息
					+'</div>'
				+'</a></li>'
			);
		}
		//
		this.nt_cnt_noview_reset();
	}
},
_nt_item_upd: function(arg)
{
	// NUWeb
	if (this.bNUWeb) {
		// Icon Menu
		var bPlay = false;
		var rec = arg.rec;
		var $se = this.$menu.$dlg.find("#menu_notice .items");
		var $ti = $se.find("li.item[did="+rec._id+"]");
		$ti.find(".content").html(rec.content);
		if (!$ti.length) {
			bPlay  = true;
			
			$se.find(".item.nomsgs").remove();
			
			$ti = this.nt_item_append($se, rec);
			//this.$menu.items_reset();
		}
		else {
			var recOld = $ti.get(0).rec;
			bPlay = rec.cnt > recOld.cnt;
			
			$ti.get(0).rec = rec;
			this.nt_item_upd($ti);
		}
		// 
		if (bPlay && window.B_wav_play) B_wav_play();
		
		// 動態訊息
		if (rec.url_type == "msgs") {
			var uid = B_URL_GetArg(rec.url, "uid")||"";
			if (uid != "" && window.sys_main_type == "msgs" && window.msgs_reload) {
				// 通知太快, 動態DB來不及更新, 加入延遲
				setTimeout(function(){
					window.msgs_reload(1, true);
				},1000);
			}
		}
		//
		this.nt_cnt_noview_reset();
	}
},
// arg => {mode, rec}
_nt_item_del: function(arg)
{
	// NUWeb
	if (this.bNUWeb) {
		var rec = arg.rec;
		var $se = this.$menu.$dlg.find("#menu_notice .items");
		var $ti = $se.find("li.item[did="+rec._id+"]");
		if ($ti.length)
			$ti.remove();
		if (!$se.find(".item").length)
			this.nt_item_append_nomsg($se);
		//
		this.nt_cnt_noview_reset();
	}
},
nt_cnt_noview_reset: function()
{
	var user_acn = this.m_arg.acn;
	var $tis = this.$menu.$dlg.find("#menu_notice .items .item")
	var cnt_noview = 0, rec, cnt;
	$tis.each(function(){
		rec = this.rec;
		if (rec && rec.cnt > 0) {
			cnt_noview++;
		}
	});
	if (cnt_noview > 0)
		$("#Function_Menu .bnt[rel='cloud'] .axlabel_warning").html(cnt_noview).show();
	else
		$("#Function_Menu .bnt[rel='cloud'] .axlabel_warning").html(cnt_noview).hide();
},

nt_item_append: function($se, rec)
{
	if (!rec || !rec._id || !rec.title)
		return;
	var This = this;
	var info = 'did="'+rec['_id']+'" durl="'+rec['url']+'" ';
	var $ti = $(
		'<li class="item" '+info+'><a href="#">'
			+'<span class="user_icon img_square"><img></span>'
			+'<div class="msg_content">'
				+'<div class="postbody">'
					+'<span class="title"></span>'
					+'<span class="content"></span>'
				+'</div>'
				+'<div class="minfo">'
					+'<span class="postdetails"></span>'
				+'</div>'
			+'</div>'
			+'<i class="bnDelete transparent fa fa-times" title="刪除"></i>'
		+'</a></li>'
	);
	$ti.get(0).rec = rec;
	$ti.appendTo($se);
	this.nt_item_upd($ti);
	// OnClick
	$ti.find("> a").on("click", function(){
		This.nt_item_onClick($(this).parent());
	});
	//
	$ti.find(".bnDelete").on("click",function(){
		This.nt_item_bnDelete($ti);
		return false;
	});
	return $ti;
},
nt_item_append_nomsg: function($se)
{
	$se.html(
		'<li class="item nomsgs"><a href="#">'
			+'<div class="msg_not_content">'
				+'沒有新訊息' // +gLang['s_NoNewMessage'] // 沒有新訊息
			+'</div>'
		+'</a></li>'
	);
},
// arg => {mode, rec}
nt_item_upd: function($ti)
{
	var rec = $ti.get(0).rec;
	
	$ti.find(".user_icon img").attr("src", URL_USER_ICON+rec.owner);
	$ti.find(".title").html(
		B_HTMLEnCode(rec.title,false).replace(/\&lt\;b\&gt\;(.*)\&lt\;\/b\&gt\;(.*)/, 
		'<span class="msg_author">$1</span> <span class="cnt">('+rec.cnt+')</span>$2')
	);
	if (!$ti.find(".title .cnt").length)
		$ti.find(".title").prepend('<span class="cnt">('+rec.cnt+')</span>');
	if (rec.cnt > 0)
		$ti.find(".title .cnt").show();
	else
		$ti.find(".title .cnt").hide();
	$ti.find(".content").html(B_HTMLEnCode(rec.content, false));
	$ti.find(".minfo .postdetails")
			.attr("title", B_con_rectime2html(rec.time,1))
			.html(B_con_rectime2html(rec.time,2))
	
	if (!this.$menu.$dlg.is(":hidden"))
		$ti.find(".img_square").f_img_square();
		
	if (rec.MyView == false) {
		$ti.addClass("noread");
	} else
		$ti.removeClass("noread");
	// 調整位置
	var $tiPrev;
	while(($tiPrev=$ti.prev()).length) {
		if ($tiPrev.get(0).rec.time > rec.time)
			break;
		$tiPrev.before($ti);
	}
},


onError: function(evt) 
{
	console.log('ws::onError data=', evt.data);
},
login: function()
{
	if (!this.bConnect) return;
	
	var b_info = B_getBrowserName();
	this.send_arg({
		mode: 		"login"
		,nu_code: 	this.m_arg['nu_code']
		,mode2: 	this.m_arg['mode']
		,acn: 		this.m_arg['acn']
		,sun: 		this.m_arg['sun']
		,server_acn:this.m_arg['server_acn']
		,platform: 	b_info.name+' '+b_info.ver
		,os: 		b_info.os+' '+b_info.osVer
		,fun_cb:	(this.mi_cb ? true : false)
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
			console.log('ws::interval_ping ~~~');
			This.timeid_interval_ping = setTimeout(do_ping, 180000);
		} catch(e) {
			This.onClose();
		}
	}
	if (This.timeid_interval_ping)
		clearTimeout(This.timeid_interval_ping);
	This.timeid_interval_ping = setTimeout(do_ping, 180000);
},

send_ItemView: function(id)
{
	this.send_arg({
		mode: "item_view"
		,_id: id
	});
},
send_arg: function(arg)
{
	if (!this.bConnect) return;
	var data = JSON.stringify(arg);
	this.websocket.send(data);
},

nt_item_onClick: function($ti)
{
	var rec = $ti.get(0).rec;
	var did = $ti.attr("did");
	// WebSocket
	if ( rec.MyView == false) {
		this.send_ItemView(rec._id);
	}
	// NUDrive
	if (rec.url_type == "msgs") {
		var id = B_URL_GetArg(rec.url,"uid");
		if (id == null) id = rec.url;
		if (location.href.indexOf("/Driver") > -1) {
			main_item_switch({
				main_type:"msgs"
				,id:id
			})
		}
		else {
			location.href = sys_url_main_drive+"#main_type=msgs&id="+encodeURIComponent(id);
		}
	}
	else {
		open(rec.url);
	}
},
nt_item_bnDelete: function($ti)
{
	var This = this;
	var rec = $ti.get(0).rec;
	B_Dialog({
		Title:"刪除"
		,Msg:"確定要刪除通知嗎？"
		,OnOK: function(){
			
			This.send_arg({
				mode: "item_del"
				,_id: rec._id
			});
		}
	});
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
// console.log('~~~~ api_getMsg diff=', diff);

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
	setTimeout(do_work, 30);
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
},



// ***** ChatBox *****
// arg => {cid, friend}
cb_openBox: function(arg)
{
	this.send_arg({
		mode: 	"cb_openBox"
		,cid:	arg.cid
		,users:	((arg.friend||"") != "" ? [arg.friend] : "")
	});
},
_cb_getList: function(arg)
{
// console.log('~~~ _cb_getList arg=', arg);
	
	if (!this.mi_cb) return;
	
	this.mi_items_reload(arg);
},
// 加朋友進來
// arg => {mode, [fid(friend id)], cid, rec}
_cb_friend_add: function(arg)
{
	if (!this.mi_cb) return;
	
	var This = this;
	var recCB = arg.rec;
	var cid = recCB._id;
	var time = recCB.time;
	var id_dlg = "cb_"+cid;
	var $dlg = $("#cb_"+cid);
	var $ti = $("#menu_chatbox .items .item[cid=\""+cid+"\"]");
	
	if ($dlg.length) {
		$dlg.dialog("open");
		this.cb_dlg_view_OnClick($dlg);
		this._cb_upd(arg);
	}
	else {
		if (recCB.type == DB_TYPE_FRIEND) {
			this._cb_openBox(arg);
		}
		else {
			var bOK = false;
			if (arg.fid) {
				var $dlgF = $("#cb_"+arg.fid);
				if ($dlgF.length) {
					$dlgF.dialog("close");
					this._cb_openBox(arg);
					bOK = true;
				}
			}
			if (!bOK) {
				this._cb_upd(arg);
			}
		}
	}
},
// arg => {mode, cid, rec}
_cb_set_quit: function(arg)
{
	if (!this.mi_cb) return;
	
	var recCB = arg.rec;
	var cid = recCB._id;
	var id_dlg = "cb_"+cid;
	var $dlg = $("#cb_"+cid);
	var $ti = $("#menu_chatbox .items .item[cid=\""+cid+"\"]");

	//聊天視窗
	if ($dlg.length)
		this.cb_dlg_destroy($dlg);
	// Icon Menu
	if ($ti.length)
		$ti.remove();
},
// arg => {mode, cid, rec,  ,[bSound]}
_cb_upd: function(arg)
{
	if (!this.mi_cb) return;
	
	var This = this;
	var user_acn = this.m_arg.acn;
	var recCB = arg.rec;
	var cid = recCB._id;
	var time = recCB.time;
	var id_dlg = "cb_"+cid;
	var $dlg = $("#cb_"+cid);
	var $ti = $("#menu_chatbox .items .item[cid=\""+cid+"\"]");
	var $se_ud = this.cb_ud_menu_get_se();
	var $ti_ud = $se_ud ? $se_ud.find(".item[cid=\""+cid+"\"]") : null;
	
	// 調整位置
	function do_adjust($ti) {
		var $tiPrev;
		while(($tiPrev=$ti.prev()).length) {
			if ($tiPrev.get(0).rec.time > time)
				break;
			$tiPrev.before($ti);
		}
	}
	
	// 已經退出
	var bMyExis = arg.rec.allow.indexOf(this.m_arg.acn) > -1;
	if (!bMyExis)
	{
		//*** 聊天視窗
		if ($dlg.length)
			This.cb_dlg_destroy($dlg);
		//*** Icon Menu
		if ($ti.length)
			$ti.remove();
		//*** NUDrive Icon Menu
		if ($ti_ud && $ti_ud.length)
			$ti_ud.remove();
	}
	else
	{
		//*** 聊天視窗
		if ($dlg.length) {
			$dlg.get(0).rec = recCB;
			this.cb_dlg_data_upd($dlg);
			this.cb_dlg_data_read($dlg);
		}
		var bNewMsg = false;
	//*** Icon Menu
		if ($ti.length) {
			var rec = $ti.get(0).rec;
			var cntOld = !rec || !rec.users || !rec.users[user_acn] ? 0
						: (rec.users[user_acn].cnt_noview||0);
			var cntNew = !recCB.users || !recCB.users[user_acn] ? 0
						: (recCB.users[user_acn].cnt_noview||0);
			bNewMsg = cntNew > cntOld;
			//
			this.mi_item_upd($ti, recCB);
		}
		else {
			bNewMsg = true;
			//
			var $se = this.cb_menu.$dlg.find("#menu_chatbox .items");
			$ti = this.mi_item_append($se, recCB);
			$ti.find(".img_square").f_img_square();
			this.cb_menu.items_reset();
			
			$se.find(".item.nomsgs").remove();
		}
		// 調整位置
		if ($ti.length) do_adjust($ti);
		this.mi_cnt_noview_reset();
	//*** NUDrive Icon Menu
		if ($se_ud) {
			if ($ti_ud && $ti_ud.length) {
				this.mi_item_upd($ti_ud, recCB);
			}
			else {
				var $se = this.cb_menu.$dlg.find("#menu_chatbox .items");
				$ti_ud = this.mi_item_append($se_ud, recCB);
				$ti_ud.find(".img_square").f_img_square();
				this.cb_ud_menu_item_reset($ti_ud);
				
				$se_ud.find(".item.nomsgs").remove();
			}
			// 調整位置
			if ($ti_ud && $ti_ud.length) do_adjust($ti_ud);
		}
		
	//*** WAV Play
		if (bNewMsg && arg.bSound != false) {
			if (window.B_wav_play) B_wav_play();
		}
	}
},
// arg => {mode, rec{_id, allow, ...}}
_cb_openBox: function(arg)
{
// console.log('~~~ _cb_openBox arg=', arg);
	if (!this.mi_cb) return;
	
	var This = this;
	var recCB = arg.rec;
	var cid = recCB._id;
	var id_dlg = "cb_"+cid;
	var $dlg;

	var h = 
		'<div class="cb_input_zone">'
			+'<div class="se_add_friend">'
				+'<table cellpadding=0 cellspacing=0 border=0><tr>'
					+'<td width="95%">'
						+'<label>'
							// User Items
							+'<div class="user_items"></div>'
							// User Input
							+'<input id="in_add_friend" type="text">'
						+'</label>'
						// Dropdown Items
						+'<ul class="dropdown scrollbar"></ul>'
					+'</td>'
					+'<td><button id="bnOK">完成</button></td>'
				+'</tr></table>'
			+'</div>'
			+'<div class="se_edit_title">'
				+'<table cellpadding=0 cellspacing=0 border=0><tr>'
					+'<td width="95%">'
						+'<label>'
							+'<input id="in_edit_title" type="text">'
						+'</label>'
					+'</td>'
					+'<td><button id="bnOK">完成</button></td>'
				+'</tr></table>'
			+'</div>'
		+'</div>'
		+'<div class="cb_main_zone scrollbar"><div class="items"></div></div>'
		+'<div class="cb_bottom_bar">'
			+'<div class="cb_toolbar">'
				+'<a href="#" id="bnVideo" class="bnt float_right">'
					+'<i class="fa fa-video-camera"></i>'
				+'</a>'
				+'<a href="#" id="bnPhone" class="bnt float_right">'
					+'<i class="fa fa-phone"></i>'
				+'</a>'
				+'<a href="#" id="bnAddFile" class="bnt uploader">'
					+'<i class="fa fa-camera"></i>'
					+'<input name="file" type="file" multiple="">'
				+'</a>'
			+'</div>'
			+'<div class="cb_input"><textarea placeholder="輸入訊息..."></textarea></div>'
			+'<div class="attach"></div>'
		+'</div>'
	var $se_ud = this.cb_ud_msg_get_se();
	if ($se_ud)
	{
		$dlg = $se_ud.find(".cb_dlg");
		if ($dlg.length) {
			// 已經存在了
			if ($se_ud.attr("id") == cid) {
				this.cb_msg_getList($dlg);
				this.cb_dlg_resize($dlg);
				return;
			}
			// 不一樣, 刪除
			else {
				$dlg.remove();
				$dlg = null;
				$se_ud.find(".cb_dlg_title > i").remove();
			}
		}
		if (!$dlg || !$dlg.length) {
			this.cb_ud_cid = cid;
			$dlg = $('<div id="'+id_dlg+'" class="cb_dlg">'+h+'</div>').appendTo($se_ud);
			$dlg.get(0).arg = {
				resize: function(){
					This.cb_ud_dlg_resize();
				}
			}
		}
		this.cb_ud_$dlg = $dlg;
	}
	else
	{
		$dlg = $("#"+id_dlg);
		if ($dlg.length) {
			if (!$dlg.parents("#se_chatbox").length)
				$dlg.dialog("open");
			this.cb_dlg_view_OnClick($dlg);
			return;
		}
		
		this.cb_ud_$dlg = null;
		
		$dlg = B_Dialog2({
			id: 		id_dlg
			,Title:		"ChatBox"
			,Content: 	h
			,autoOpen:	true
			,width: 	300
			,height: 	400
			,modal: 	false
			,position: {at:"right bottom"}
			,resize:	function($dlg){
				var h = $dlg.height() - $dlg.find(".cb_bottom_bar").outerHeight();
				var $iz = $dlg.find(".cb_input_zone");
				if (!$iz.is(":hidden")) h -= $iz.outerHeight();
				
				$dlg.find(".scrollbar").height(h);
				return false;
			}
			,open: function(e, tc){
				var $dlg2 = $(tc);
				// 調整 Dialog 位置
				setTimeout(function(){
					This.cb_dlg_view_OnClick($dlg);
					This.cb_dlg_adjust($dlg);
					This.window_adjust();
				},100);
			}
			,close: function(){
			}
			,hide: function(){
				return false;
			}
		});
	}
// Debug
if (this.m_arg.server_acn != "tw1f7" // 10.0.0.112 ookonweb
		&& this.m_arg.server_acn != "tw21b" // green-cloud.green-computing.com
		&& this.m_arg.server_acn != "WheeRegion"	// 10.0.0.120
		&& this.m_arg.server_acn != "ookon_test001"	// 10.0.0.28
		) {
	$dlg.find(".cb_toolbar").find("#bnVideo, #bnPhone").remove();
}
console.log('!!! this.m_arg.server_acn=', this.m_arg.server_acn);
	
	$dlg.get(0).rec = recCB;
	$dlg.parent()
		.addClass("cb_chatbox_dlg")
		.on("mousedown", function(e){
			switch (e.which) {
				case 1:	// Left
					This.cb_dlg_view_OnClick($dlg);
					break;
				case 2: // Middle
					break;
				case 3: // Right
					break;
			}
		})
	$dlg.addClass("cb_dlg");
	
// Dialog Title
	var $dlgT = $dlg.prev().addClass("cb_dlg_title");
	// dblclick 開啟 NUDrive 聊天室
	$dlgT.on("dblclick", function(){
		This.cb_dlg_open_NUDrive($dlg);
	});
	// 加朋友進來
	var $bnUserAdd = $('<a href="#" id="bnUserAdd"><i class="fa fa-user-plus transparent" title="加朋友進來"></i></a>')
		.prependTo($dlgT)
		.f_tooltip()
		.on("click", function(){
			This.cb_dlg_in_show($dlg, "af");
			return false;
		})
	// 選項
	var $bnSel = $('<a href="#" id="bnSel"><i class="fa fa-cog transparent" title="選項"></i></a>')
		.prependTo($dlgT)
		.f_tooltip()
	this.cb_dlg_bnSel_init($dlg, $bnSel);
	this.cb_dlg_data_upd($dlg);
	
	// 監控 ScrollBar 
	if ($se_ud) { // NUDrive
		// 改到 storage.js scroll_chage_init()
	}
	else {	// Popup Window
		$dlg.find(".scrollbar").scroll(function(){
			var $scrollbar = $(this);
			var scrollTop = $scrollbar.scrollTop();
			if (scrollTop < 10 && This.cb_bNext) {
				This.cb_msg_getList($dlg, true);
			}
		});
	}
	// 編輯對話名稱
	this.cb_dlg_edit_title_init($dlg);
	// 加朋友進來 - input
	$dlg.find(".se_add_friend #bnOK").on("click", uf_in_ok);
	var uf_in = $dlg.find(".se_add_friend #in_add_friend")
		.on("keydown", function(e){
			if (!e) e = event;
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			var $t = $(this);
			if (key == 27) {
				uf_user_close();
				return false;
			}
			else if (key == 13) {
				return uf_in_ok();
			}
			// 上38
			else if (key == 38) {
				if (uf_dd_items.is(":hidden"))
					return false;
				var $ti = uf_dd_items.find(".dd_item.sel");
				var $ti_pre = $ti.prev();
				if ($ti_pre.length) {
					$ti.removeClass("sel");
					$ti_pre.addClass("sel")
						.get(0).scrollIntoView();
				}
				return false;
			}
			// 下40
			else if (key == 40) {
				if (uf_dd_items.is(":hidden"))
					return false;
				var $ti = uf_dd_items.find(".dd_item.sel");
				var $ti_next = $ti.next();
				if ($ti_next.length) {
					$ti.removeClass("sel");
					$ti_next.addClass("sel")
						.get(0).scrollIntoView();
				}
				return false;
			}
			// Backspace 8
			else if (key == 8) {
				if ($t.val().length > 0)
					return;
				var $ti_last = uf_ui_items.find(".user_item:last");
				if ($ti_last.length) $ti_last.remove();
			}
		})
		.on("keyup", function(e){
			if (!e) e = event;
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			var $t = $(this);
// console.log('~~~~~~ key=', key);
			if (key == 13) {
			}
			else {
				var str = $.trim($t.val());
				uf_find(str);
				// 調整寬度
				var w = this.scrollWidth;
				if (w > $t.width())
					$t.width(w+20);
			}
		});
	var uf_dd_items = $dlg.find(".se_add_friend .dropdown").hide();
	var uf_ui_items = $dlg.find(".se_add_friend .user_items");
	var uf_key;
	var uf_timeid;
	var uf_recs;
	function uf_in_clear(){
		uf_key = null;
		uf_in.val("");
		uf_in.width(20);
		uf_dd_items.hide();
	}
	function uf_in_ok(){
		if (uf_dd_items.is(":hidden")) {
			// 送出 - 新成員
			if (uf_in.val() == "" && uf_ui_items.find(".user_item").length) {
				This.cb_friend_add($dlg);
				if (recCB.type == DB_TYPE_FRIEND)
					$dlg.dialog("close");
			}
			return false;
		}
		
		var $ti = uf_dd_items.find(".dd_item.sel");
		if ($ti.length == 0) return false;
		uf_ui_add2rec($ti.get(0).rec);
		uf_in_clear();
		return false;
	}
	function uf_user_close(){
		uf_ui_items.empty();
		uf_in_clear();
		This.cb_dlg_in_show($dlg);
	}
	function uf_find(str){
		function do_getFilter(){
			var list = B_array_merge(recCB.allow);
			$dlg.find(".se_add_friend .user_items .user_item").each(function(){
				list.push(this.rec.acn);
			})
			return list;
		}
		function do_find(){
			if (uf_key != str) {
				uf_key = str;
				if (uf_key == "") {
					uf_dd_items.hide();
					return;
				}
				rs_find_userInfo2(uf_key, {bNotGroup:true, filter:do_getFilter()}, function(recs){
					uf_recs = recs||[];
					if (uf_recs.length > 0) {
						uf_dd_items.empty().show();
						for(var x=0; x<uf_recs.length && x<50; x++) {
							uf_dd_add2rec(uf_recs[x]);
						}
						uf_dd_items.find(".img_square").f_img_square();
						uf_dd_items.find(".dd_item:first").addClass("sel");
					}
					else {
						uf_dd_items.hide();
					}
				});
			}
		}
		if (uf_timeid) clearTimeout(uf_timeid);
		uf_timeid = setTimeout(do_find, 600);
	}
	function uf_dd_add2rec(rec){
		var $ti = $(
			'<li class="dd_item">'
				+'<span class="img img_square"><img src="'+URL_USER_ICON+rec.acn+'"></span>'
				+'<span class="name">'+(rec.sun||rec.acn)+'</span>'
				+'<span class="desc">'+B_HTMLEnCode(rec.description,false)+'</span>'
			+'</li>'
		);
		$ti.get(0).rec = rec;
		$ti.appendTo(uf_dd_items);
		// Click
		$ti.on("click", function(){
			uf_dd_items.find(".dd_item.sel").removeClass("sel");
			$ti.addClass("sel");
			uf_in_ok();
		});
		return $ti;
	}
	function uf_ui_add2rec(rec){
		var $ti = $(
			'<div class="user_item">'
				+'<span class="name">'+rec.sun+'</span>'
				+'<i id="bnDel" class="fa fa-times"></i>'
			+'</div>'
		);
		$ti.get(0).rec = rec;
		$ti.appendTo(uf_ui_items);
		
		$ti.find("#bnDel").on("click", function(){
			$ti.remove();
		});
		return $ti;
	}
	
	// 留言輸入
	this.cb_dlg_input_init($dlg);
	// 拖曳檔案上傳
	this.cb_drag_file_init($dlg);
	// 檔案上傳
	this.cb_upload_file_init($dlg);
	// 貼圖上傳
	this.cb_paste_init($dlg);
	this.cb_msg_getList($dlg);
	this.cb_dlg_resize($dlg);
	// 視訊通話
	this.cb_dlg_rtc_init($dlg);
},
// 視訊通話
cb_dlg_rtc_init: function($dlg)
{
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	var id_dlg = "cb_"+cid;
	var bShowTitle = recCB.type != DB_TYPE_FRIEND && (recCB.title||"") != "";
	
	if (oWRTC.sys_available) {
		$dlg.find(".cb_bottom_bar #bnVideo").on("click", function(){
			oWRTC.do_call(recCB, "video");
			return false;
		});
		$dlg.find(".cb_bottom_bar #bnPhone").on("click", function(){
			oWRTC.do_call(recCB, "phone");
			//oWRTC.do_call_test(recCB, "phone");
			return false;
		});
	}
	else {
		$dlg.find(".cb_bottom_bar #bnVideo, .cb_bottom_bar #bnPhone")
				.addClass("disabled")
				.attr("title", oWRTC.sys_available_msg).f_tooltip()
	}
	
},
cb_dlg_open_NUDrive: function($dlg)
{
	if (this.cb_ud_msg_get_se())
		return;
	
	var dlg, recCB, cid;
	if ($dlg) {
		dlg = $dlg.get(0);
		recCB = dlg.rec;
		cid = recCB._id;
	}
	
	if (sys_is_nudrive)
	{
		main_item_switch({
			main_type: "chatbox"
			,cid: cid
		});
		
		if ($dlg) this.cb_dlg_destroy($dlg);
	}
	else if (sys_url_main_drive)
	{
		location.href = sys_url_main_drive
				+"#main_type=chatbox&cid="+(cid||"");
	}
	else
	{
		//location.href = "/tools/page/show_page.php?page_url=/Site/web/&type=Site&q="+q;
		return;
	}
},
cb_dlg_rec_init: function(recCB)
{
	recCB['id_dlg'] = "cb_"+recCB._id;
	recCB['bOwner'] = recCB.owner == this.m_arg.acn;
	recCB['friends']= B_array_del(recCB.allow, this.m_arg.acn);
	recCB['admin'] 	= recCB.admin||[];
	return recCB;
},
cb_dlg_data_upd: function($dlg)
{
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = this.cb_dlg_rec_init(dlg.rec);
	var bShowTitle = recCB.type != DB_TYPE_FRIEND && (recCB.title||"") != "";
	
	var bTypeFriend = recCB.type == DB_TYPE_FRIEND;
	var bTypeComm = recCB.type == DB_TYPE_COMM;
	var bUserOwner = This.m_arg.acn == recCB.owner
	var bUserAdmin = bUserOwner || (recCB.admin && recCB.admin.indexOf(This.m_arg.acn) > -1) ? true : false;
	var arg = recCB.arg||{};
	arg.friend_add = arg.friend_add != false;
	
	// Arg
	if (!bTypeComm && (bUserAdmin || arg.friend_add)) {
		$dlg.prev().find("#bnUserAdd").show();
	} else {
		$dlg.prev().find("#bnUserAdd").hide();
	}
	// Title
	var $dlgT = $dlg.prev();
	if (bShowTitle) {
		var T = B_HTMLEnCode(recCB.title, false);
		$dlgT.find(".ui-dialog-title").html(T);
	}
	
	rs_con_acns2info2(recCB.allow, ["acn", "sun", "mail"], function(list){
		recCB['mbs_info'] = list;
		var suns = B_obj_getCols(list, "sun");
		if (!bShowTitle) $dlgT.find(".ui-dialog-title")
								.html((bTypeFriend ? B_array_del(suns, This.m_arg.sun) : suns).join("、"));
		$dlgT.find(".ui-dialog-title").attr("title",suns.join("<br>")).f_tooltip();
	});
},
// 標示已讀
cb_dlg_data_read: function($dlg)
{
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var $tisME = $dlg.find(".cb_main_zone .item.item_me");
	
	try {
		if (recCB.type == DB_TYPE_FRIEND)
		{
			var friend_acn = recCB.friends[0];
			var friend_info = recCB.users[friend_acn];
			var t = friend_info.tLast;
			if (t && t.length) {
				$tisME.each(function(){
					var rec = this.rec;
					if (rec.time <= t)
						$(this).find(".read").show();
				});
			}
		}
		else
		{
			if (!$tisME.length)
				return;
			
			var acns = [];
			var $read = $dlg.find(".item_msg.item_read");
			var $tiLast = $tisME.eq($tisME.length-1);
			var time = $tiLast.get(0).rec.time;
			for (var acn in recCB.users) {
				var info = recCB.users[acn];
				if (info.tLast >= time)
					acns.push(acn);
			}
			acns = B_array_del(acns, this.m_arg.acn);
			
			// 有讀取名單
			if (acns.length) {
				rs_con_acns2suns(acns, "sun", function(list){
					var msg = list.join("、")+' 已讀';
					if ($read.length && $read.get(0) == $tiLast.next().get(0)) {
						$read.find(".desc").html(msg);
					}
					else {
						if ($read.length) $read.remove();
						$read = $(
							'<div class="item_msg item_read">'
								+'<div class="desc">'+msg+'</div>'
							+'</div>'
						);
						$tiLast.after($read);
					}
					// 這是最後一第, 移到顯示區
					if (!$read.next().length)
						$read.get(0).scrollIntoView()
				});
			} 
			else {
				if ($read.length) $read.remove();
			}
		}
	} catch(e) {}
	
},
cb_dlg_in_show: function($dlg, m)
{
	var This = this;
	var dlg = $dlg.get(0);
	var $se = $dlg.find(".cb_input_zone");
	var $se_af = $dlg.find(".se_add_friend");
	var $se_et = $dlg.find(".se_edit_title");
	function do_show(){
		// 加朋友進來
		if (m == "af") {
			$se_af.show();
			$se.slideDown(function(){
				$(this).css({overflow:"initial"});
				$se_af.find("input").focus();
			});
		}
		else if (m == "et") {
			dlg.f_edit_title_show();
			$se.slideDown(function(){
				$se_et.find("input").focus();
			});
		}
		This.cb_dlg_resize($dlg);
	}
	if (!$se.is(":hidden")) {
		$se.slideUp(function(){
			$se.find("> div").hide();
			do_show();
		});
	}
	else {
		do_show();
	}
},
// 調整 Dialog 位置
cb_dlg_adjust: function($dlg)
{
	if (!window._chatbox_dlg_id)
		window._chatbox_dlg_id = 0;
	var dlg_id = window._chatbox_dlg_id++;
	var dlg_id = $(".cb_dlg").not(":hidden").length - 1;
	
	var $dlgP = $dlg.parent();
	var w_win = $(window).width();
	var h_win = $(window).height();
	var w_cols = parseInt(w_win/310);
	var h_rows = parseInt((h_win-400)/50);
	var x_top = parseInt(dlg_id/w_cols);
	var top = h_win-400-(50*(x_top%h_rows));
	var left = w_win-(310*(dlg_id%w_cols+1));
	$dlgP.css({left:left, top:top});
},
// 留言輸入
cb_dlg_input_init: function($dlg)
{
	function doAdjustHeight($t){
		if ($t.hasScrollBar()) {
			$t.height($t.prop('scrollHeight'));
			This.cb_dlg_resize($dlg);
		}
	}
	
	var This = this;
	var $bnIN = $dlg.find(".cb_bottom_bar .cb_input textarea")
		// 自動調整高度
		.on('keyup', function(){
			doAdjustHeight($(this));
		})
		.on('keydown', function(e){
			if (!e) e = event;
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			// 訊息送出
			if (!e.shiftKey && key == 13) {
				This.cb_msg_add($dlg);
				return false;
			}
			// else if (key == 27) {
			// }
			else {
				This.cb_dlg_view_OnClick($dlg);
			}
		})
		.on('focus', function(e){
			$(this).css({minHeight:"34px"});
			doAdjustHeight($(this));
		})
		.on('blur', function(e){
			$(this).css({minHeight:"auto"});
			This.cb_dlg_resize($dlg);
		})
		.on('paste', function(e){
			doAdjustHeight($(this));
		})
	//	
	var dlg = $dlg.get(0);
	var cid = dlg.rec._id;
	var id_dlg = "cb_"+cid;
	dlg.cb_oPU = new OBJ_PushUrl();
	dlg.cb_oPU.start_watch({
		sid:	"#"+id_dlg
		,bn:	$bnIN
		,fPush:	function(b){
			This.cb_dlg_resize($dlg);
		}
		,fClose:function(){
			This.cb_dlg_resize($dlg);
		}
	});
},
cb_dlg_resize: function($dlg)
{
	if ($dlg && $dlg.length)
		$dlg.get(0).arg.resize();
},
cb_dlg_bnSel_init: function($dlg, $bnSel)
{
	var This = this;
	var	h = 
		'<ul id="menu_cb_sel">'
			// 設定
			+'<li class="set"><a href="" rel="set"><span class="menu-icon ui-icon"></span>'+'設定'+'</a></li>'
			+'<li class="set space"></li>'
			// 加朋友進來
			+'<li class="add_friend"><a href="" rel="add_friend"><span class="menu-icon ui-icon"></span>'+'加朋友進來'+'</a></li>'
			// 編輯聊天室名稱
			+'<li class="edit_title"><a href="" rel="edit_title"><span class="menu-icon ui-icon"></span>'+'編輯聊天室名稱'+'</a></li>'
			// 聊天室成員
			+'<li class="edit_friend"><a href="" rel="edit_friend"><span class="menu-icon ui-icon"></span>'+'聊天室成員'+'</a></li>'
			+'<li class="space"></li>'
			// 刪除對話
			+'<li class="del_msg"><a href="" rel="del_msg"><span class="menu-icon ui-icon"></span>'+'刪除對話...'+'</a></li>'
			// 離開聊天室...
			+'<li class="quit"><a href="" rel="quit"><span class="menu-icon ui-icon"></span>'+'離開聊天室...'+'</a></li>'
		+'</ul>';
	$bnSel.menu2({
		positionOpts: {
			posX: 'left', 
			posY: 'bottom',
			offsetX: 0,
			offsetY: 0,
			directionH: 'right',
			directionV: 'down', 
			detectH: true, // do horizontal collision detection  
			detectV: false, // do vertical collision detection
			linkToFront: false
		}
		,content: h
		,onShowMenu: function(menu) {
			if (window.sys_dlg_zIndex)
				menu.css({zIndex:sys_dlg_zIndex+3});

			var recCB = $dlg.get(0).rec;
			var bTypeFriend = recCB.type == DB_TYPE_FRIEND;
			var bTypeComm = recCB.type == DB_TYPE_COMM;
			var bUserOwner = This.m_arg.acn == recCB.owner
			var bUserAdmin = bUserOwner || (recCB.admin && recCB.admin.indexOf(This.m_arg.acn) > -1) ? true : false;
			var arg = recCB.arg||{};
			arg.friend_add = arg.friend_add != false;
			
			menu.find("li").show();
			if (!bUserAdmin) {
				menu.find(".set, .edit_title").hide();
				
				if (!arg.friend_add) {
					menu.find(".add_friend").hide();
				}
			}
			if (bTypeFriend)
				menu.find(".set, .edit_title, .edit_friend, .quit").hide();
			else if (bTypeComm)
				menu.find(".set, .add_friend, .edit_title, .quit").hide();
		}
		,onchooseItem: function(item) {
			var $t=$(item);
			var rel = $t.attr("rel");
			switch(rel) {
				case "set":
					This.cb_dlg_set($dlg);
					break;
				case "add_friend":
					This.cb_dlg_in_show($dlg, "af");
					break;
				case "edit_title":
					This.cb_dlg_in_show($dlg, "et");
					break;
				case "edit_friend":
					This.cb_dlg_set($dlg, 1);
					break;
				case "del_msg":
					This.cb_dlg_msg_del_all($dlg);
					break;
				case "quit":
					This.cb_dlg_cb_quit($dlg);
					break;
			}
		}
	});
	
},
cb_dlg_set: function($dlgPar, index)
{
	var This = this;
	var dlg = $dlgPar.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	
	var bTypeComm = recCB.type == DB_TYPE_COMM;
	var bUserOwner = This.m_arg.acn == recCB.owner
	var bUserAdmin = bUserOwner || (recCB.admin && recCB.admin.indexOf(This.m_arg.acn) > -1) ? true : false;
	var arg = recCB.arg||{};
	arg.friend_add = arg.friend_add != false;
	
	var h =
		'<div id="tabs">'
			+'<ul>'
				+'<li><a href="#tabs-1">一般</a></li>'
				+'<li><a href="#tabs-2">成員</a></li>'
			+'</ul>'
			+'<div class="main_body">'
				+'<div id="tabs-1" class="scrollbar">'
					+'<table class="tabs-table" border="0" cellpadding="0" cellspacing="0">'
						+'<colgroup>'
							+'<col width="30%">'
							+'<col >'
						+'</colgroup>'
						+'<tr>'
							+'<td>用途說明</td>'
							+'<td>設定選項</td>'
						+'</tr>'
						+'<tr class="tr_firend_add">'
							+'<td>加朋友進來</td>'
							+'<td>'
								+'<label>'
									+'<input id="cb_friend_add1" type="radio" name="cb_friend_add">'
									+'允許 成員加朋友進來'
								+'</label>'
								+'<label>'
									+'<input id="cb_friend_add2" type="radio" name="cb_friend_add">'
									+'不允許 成員加朋友進來'
								+'</label>'
							+'</td>'
						+'</tr>'
					+'</table>'
				+'</div>'
				+'<div id="tabs-2" class="scrollbar">'
					+'<ul id="members" class="cb_users"></ul>'
				+'</div>'
			+'</div>'
			+'<div class="main_bottom">'
				+'<a href="#" class="btn btn-success btn-xs" id="bnOK">儲存</a>&nbsp;&nbsp;&nbsp;'
				+'<a href="#" class="btn btn-default btn-xs" id="bnCancel">離開</a>'
			+'</div>'
		+'</div>'
	var $dlg = B_Dialog2({
		id: 		"cb_dlg_set"
		,Title:		"設定"
		,Content: 	h
		,autoOpen:	true
		,width: 	400
		,height: 	400
		,modal: 	true
//		,position: {at:"right bottom"}
		,resize:	function($dlg){
			$dlg.find(".scrollbar").height($dlg.find(".main_body").height());
			return false;
		}
		,open: function(e, tc){
		}
		,close: function(){
		}
		,hide: function(){
		}
	});
	// Arg Init 
	{
		var $bns = $dlg.find(".tr_firend_add input");
		if (arg.friend_add) {
			$bns.eq(0).attr("checked", true);
			$bns.eq(1).attr("checked", false);
		} else {
			$bns.eq(0).attr("checked", false);
			$bns.eq(1).attr("checked", true);
		}
	}
	//
	var $bnOK = $dlg.find("#bnOK");
	var $bnCancel = $dlg.find("#bnCancel");
	if (!index) index = 0;
	if (bTypeComm || !bUserAdmin) {
		if (index != 1) index = 1;
		$dlg.find("#tabs > ul li:first").hide();
	}
	$dlg.find("#tabs").tabs(); //{selected:index});
	$dlg.find("#tabs a.ui-tabs-anchor").on("click", function(){
		var id = $(this).attr("href");
		if (id == "#tabs-1") {
			$bnOK.show();
		}
		else {
			$dlg.find("#tabs-2 .img_square").f_img_square();
			$bnOK.hide();
		}
	}).get(index).click();
	function do_is_owner(acn){
		return acn == recCB.owner;
	}
	function do_is_admin(acn){
		if (do_is_owner(acn)) return true;
		return recCB.admin && recCB.admin.indexOf(acn) > -1 ? true : false;
	}
	function do_users_item_append($se, rec){
		var u_thumb = URL_USER_ICON+rec.acn;
		var $ti = $(
			'<li class="item">'
				+'<span class="user_icon img_square"><img src="'+u_thumb+'"></span>'
				+'<div class="content">'
					+'<div class="name">'
						+B_HTMLEnCode(rec.sun,false)
					+'</div>'
					+'<div class="info"></div>'
				+'</div>'
				+'<a id="bnMenu" href="#" class="btn btn-default">'
					+'<span class="caret"></span>'
				+'</a>'				
			+'</li>'
		);
		$ti.get(0).rec = rec;
		$ti.appendTo($se);
		return $ti;
	}
	function do_users_item_menu($ti){
		var rec = $ti.get(0).rec;
		var $bn = $ti.find("#bnMenu");
		var	h = 
			'<ul id="menu_cb_user_item">'
				// 轉移擁有者
				+'<li class="transfer"><a href="#" rel="transfer"><span class="menu-icon ui-icon"></span><span class="name">'+'轉移擁有者'+'</a></li>'
				// 設為管理者
				+'<li class="admin"><a href="#" rel="admin"><span class="menu-icon ui-icon"></span><span class="name">'+'設為管理者'+'</a></li>'
				// 移除
				+'<li class="del"><a href="#" rel="del"><span class="menu-icon ui-icon"></span>'+'移除'+'</a></li>'
			+'</ul>';
		$bn.menu2({
			positionOpts: {
				posX: 'left', 
				posY: 'bottom',
				offsetX: 0,
				offsetY: 0,
				directionH: 'right',
				directionV: 'down', 
				detectH: true, // do horizontal collision detection  
				detectV: false, // do vertical collision detection
				linkToFront: false
			}
			,content: h
			,onShowMenu: function(menu) {
				if (window.sys_dlg_zIndex)
					menu.css({zIndex:sys_dlg_zIndex+3});
				
				var bAdmin = do_is_admin(rec.acn);
				if (bUserOwner) {
					if (bAdmin)
						menu.find(".admin .name").html('移除管理者');
					else
						menu.find(".admin .name").html('設為管理者');
				} else {
					menu.find(".admin, .transfer").remove();
				}
				if (!bUserAdmin) {
					menu.find(".del").remove();
				}
			}
			,onchooseItem: function(item) {
				var $t=$(item);
				var rel = $t.attr("rel");
				switch(rel) {
					case "transfer":
						do_users_item_menu_transfer($ti);
						break;
					case "admin":
						do_users_item_menu_admin($ti);
						break;
					case "del":
						do_users_item_menu_del($ti);
						break;
				}
			}
		});
	}
	function do_users_item_menu_transfer($ti){
		var rec = $ti.get(0).rec;
		if (bUserOwner) {
			B_Dialog({
				Title:	'擁有者轉移'
				,Msg:	'確定要將擁有者權限轉移到 "$1" 嗎？'.replace("$1", rec.sun)
				,OnOK:	function(){
					
					This.send_arg({
						mode: "cb_set_admin"
						,cid: cid
						,act: "transfer"
						,acn: rec.acn
						,sun: rec.sun
					});
					//
					do_bnCancel();
					setTimeout(function(){
						This.cb_dlg_set($dlgPar,1);
					}, 500);
				}
			});
		}
	}
	function do_users_item_menu_admin($ti){
		var rec = $ti.get(0).rec;
		if (do_is_admin(rec.acn)) {
			B_Dialog({
				Title:	'移出管理者'
				,Msg:	'確定要將 "$1" 移出管理者嗎？'.replace("$1", rec.sun)
				,OnOK:	function(){
					
					This.send_arg({
						mode: "cb_set_admin"
						,cid: cid
						,act: "del"
						,acn: rec.acn
						,sun: rec.sun
					});
					
					recCB.admin = B_array_del(recCB.admin, rec.acn);
					do_users_item_upd($ti);
				}
			});
		}
		else {
			B_Dialog({
				Title:	'設為管理者'
				,Msg:	'確定要將 "$1" 設為管理者嗎？'.replace("$1", rec.sun)
				,OnOK:	function(){
					
					This.send_arg({
						mode: "cb_set_admin"
						,cid: cid
						,act: "add"
						,acn: rec.acn
						,sun: rec.sun
					});
					
					recCB.admin = B_array_add(recCB.admin||[], rec.acn);
					do_users_item_upd($ti);
				}
			});
		}
	}
	function do_users_item_menu_del($ti){
		var rec = $ti.get(0).rec;
		B_Dialog({
			Title:	'移除'
			,Msg:	'確定要將 "$1" 移除嗎？'.replace("$1", rec.sun)
			,OnOK:	function(){
				
				This.api_getMsg({
					msg:{
						mode: "cb_set_friend"
						,cid: cid
						,act: "del"
						,acns: [rec.acn]
						,suns: [rec.sun]
					}
					,funcOK: function(data, err) {
						if (err) 
							B_Message(err)
						else
							$ti.remove();
					}
				});
			}
		});
	}
	function do_users_item_upd($ti){
		var rec = $ti.get(0).rec;
		var info = rec.acn == recCB.owner ? '擁有者'
				: recCB.admin && recCB.admin.indexOf(rec.acn) > -1 ? '管理者'
				: '成員';
		$ti.find(".info").html(info);
	}
	function do_users_reload(){
		var $se = $dlg.find("#members").empty();
		var acns = recCB.allow;
		rs_con_acns2info(acns, function(recs){
			if (recs && recs.length) {
				var bUserAdmin = do_is_admin(This.m_arg.acn);
				var $ti, rec;
				for (var x=0; x<recs.length; x++) {
					rec = recs[x];
					$ti = do_users_item_append($se, rec);
					do_users_item_upd($ti);
					if (do_is_owner(rec.acn)) {
						$ti.find("#bnMenu").remove();
						$ti.prependTo($se);
					} else if (bTypeComm || !bUserAdmin) {
						$ti.find("#bnMenu").remove();
					} else {
						do_users_item_menu($ti);
					}
				}
				$se.find(".img_square").f_img_square();
			}
		});
	}
	function do_bnCancel(){
		$dlg.dialog("close");
	}
	function do_bnOK(){
		var argNew = {
			friend_add: $dlg.find(".tr_firend_add input").eq(0).is(":checked")
		}
		if (argNew.friend_add != arg.friend_add) {
			This.api_getMsg({
				msg:{
					mode: "cb_arg_set"
					,cid: cid
					,arg: argNew
				}
				,funcOK: function(data, err) {
					if (data) {
						if (data.result)
							B_Message(data.error);
						else if (data.error)
							B_Message(data.error);
					}
					else if (err)
						B_Message(err);
					//
					do_bnCancel();
				}
			});
		}
		else {
			do_bnCancel();
		}
	}
	$bnOK.on("click", do_bnOK);
	$bnCancel.on("click", do_bnCancel);
	do_users_reload();
},
// 編輯對話名稱
cb_dlg_edit_title_init: function($dlg)
{
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = dlg.rec._id;
	var $se = $dlg.find(".se_edit_title");
	var $se_in = $se.find("#in_edit_title");
	var $se_bnOK = $se.find("#bnOK");
	var T = dlg.rec.title||"";
	function do_show(){
		T = dlg.rec.title||"";
		$se_in.val(T);
		$se.show();
	}
	function do_ok(){
		var v = $.trim($se_in.val());
		if (v == "" || v == T)
			return;
		
		// Send
		This.send_arg({
			mode: 	"cb_set_title"
			,cid: 	cid
			,title:	v
		});
		//
		This.cb_dlg_in_show($dlg);
		return false;
	}
	$se_bnOK.on("click", do_ok);
	$se_in
		.on("keydown", function(e){
			if (!e) e = event;
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			if (key == 27) {
				var v = $.trim($se_in.val());
				if (v != "") {
					$se_in.val("");
				}
				else {
					This.cb_dlg_in_show($dlg);
				}
				return false;
			}
			else if (key == 13) {
				return do_ok();
			}
		})
	// Function
	dlg.f_edit_title_show = do_show;
},
cb_dlg_view_OnClick: function($dlg)
{
	if (!$dlg || !$dlg.length) return;
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	var user_info = recCB.users && recCB.users[this.m_arg.acn] ? recCB.users[this.m_arg.acn] : null;
	var cnt_noview = user_info && user_info.cnt_noview > 0 ? user_info.cnt_noview : 0;
	if (cnt_noview == 0 || dlg.cnt_noview_update == true)
		return;
	
	this.api_getMsg({
		msg:{
			mode: "cb_user_view"
			,cid: cid
		}
		,return_mode: "cb_upd"
		,funcOK: function(data, err) {
			
			if (data) {
				This._cb_upd(data);
			}
		}
	});
},
cb_dlg_msg_del_all: function($dlg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	B_Dialog({
		Title:"刪除對話"
		,Msg:"刪除對話副本，將會無法復原，您確定要刪除嗎？"
		,OnOK: function(){
			// Send
			This.api_getMsg({
				msg:{
					mode: "cb_msg_del_all"
					,cid: cid
				}
				,funcOK: function(data, err) {
					
					if (data) {
						This.cb_msg_getList($dlg);
					}
				}
			});
		}
	});
},
cb_dlg_cb_quit: function($dlg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	var bUserOwner = This.m_arg.acn == recCB.owner
	
	function do_close()
	{
		B_Dialog({
			Title:"關閉聊天室"
			,Msg:"再次確認：<br>關閉後無法回復，確定要關閉聊天室嗎？"
			,OnOK: function(){
				// Send
				This.send_arg({
					mode: "cb_set_close"
					,cid: cid
				});
			}
		});
	}
	
	if (bUserOwner)
	{
		var buttons = {
			'轉移擁有者' : function(){
				$(this).dialog('close');
				
				This.cb_dlg_set($dlg,1);
			}
			,'關閉聊天室' : function(){
				$(this).dialog('close');
				
				setTimeout(function(){
					do_close();
				},100);
			}
		}
		B_Dialog({
			Title:"離開聊天室"
			,Msg:"警告：擁有者離開聊天室會關閉整個聊天室，其他成員將不能再聊天<br>"
				+"如果要讓成員繼續聊天，請先轉移擁有者權限給其他成員再離開。<br><br>"
			,buttons: buttons
			,OnOK: false
		});
	}
	else
	{
		B_Dialog({
			Title:"離開聊天室"
			,Msg:"您確定要離開聊天室嗎？"
			,OnOK: function(){
				// Send
				This.send_arg({
					mode: "cb_set_quit"
					,cid: cid
				});
			}
		});
	}
},
cb_dlg_destroy: function($dlg)
{
	$dlg.dialog("destroy").remove();
},
cb_user_close: function($dlg)
{
	$dlg.find(".se_add_friend .user_items").empty();
	$dlg.find(".se_add_friend #in_add_friend")
		.val("").width(20);
	$dlg.find(".se_add_friend .dropdown").hide();
	//
	this.cb_dlg_in_show($dlg);
},
cb_friend_add: function($dlg)
{
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	var $tis = $dlg.find(".se_add_friend .user_items .user_item");
	if ($tis.length == 0) return;
	
	var acns = [], suns = [];
	$tis.each(function(){
		acns.push(this.rec.acn);
		suns.push(this.rec.sun);
	});
	// Send
	this.send_arg({
		mode: 	"cb_friend_add"
		,cid: 	cid
		,acns:	acns
		,suns:	suns
	});
	// Clear
	this.cb_user_close($dlg);
},
cb_msg_add: function($dlg)
{
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	var $in = $dlg.find(".cb_bottom_bar .cb_input textarea");
	var dataPush = dlg.cb_oPU.getContent();
	var content = $.trim($in.val());
	if (content == "" && !dataPush) return;
	
	
	var data = {
		mode: 	"cb_msg_add"
		,cid: 	cid
		,type:	DB_CM_TYPE_CHAT
		,content:content
	};
	if (dataPush) {
		data.type = DB_CM_TYPE_PUSH_URL;
		data.file_info = dataPush;
	}
	this.send_arg(data);
	// 清除資料
	dlg.cb_oPU.close();
	$in.val("");
	$in.height(18);
	this.cb_dlg_resize($dlg);
},
// 貼圖上傳
cb_paste_init: function($dlg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	// 留言區的檔案上傳
	$dlg.find(".cb_input textarea").on('paste', function(){
		
		var evt = arguments[0].originalEvent;
		var item = evt.clipboardData.items && evt.clipboardData.items.length > 0 ? evt.clipboardData.items[0] : null;
		if (item.kind == "file" && item.type == "image/png") {
			var file = item.getAsFile();
			file.name = "img_"+B_getCurrentTimeStr(null,1)+".png";
			This.cb_upload_file_do_file($dlg, file);
		}
	});
},
// 拖曳檔案上傳
cb_drag_file_init: function($dlg)
{
	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	
	dlg.dropEffect = "none"; //[copy/link/move/none]
	dlg.dropType = null;
	
	$dlg
		.on("dragenter", function(){
			var evt = arguments[0].originalEvent;
// console.log('cb_drag_file_init ~~~~~~~~~~~~~~~~~  evt=', evt);
			dlg.dropEffect = "none";
			
// console.log('cb_drag_file_init ~~~~~~~~~~~~~~~~~ items l=', (evt.dataTransfer.items ? evt.dataTransfer.items.length : "NULL"));
// console.log('cb_drag_file_init ~~~~~~~~~~~~~~~~~ types l=', (evt.dataTransfer.types ? evt.dataTransfer.types.length : "NULL"));
			if (evt.dataTransfer.items) {
				var items = evt.dataTransfer.items;
				for (var n in items) {
					var item = items[n];
// console.log('~~~~~~~~~~~~~~~~~ item n=', n, items.length, item.type, item.kind);
					if (item.kind == "file") {
						dlg.dropType = "file";
						dlg.dropEffect = "copy";
						break;
					}
					// Link or Image
					if (item.type == "text/uri-list") {
						dlg.dropType = "uri";
						dlg.dropEffect = "copy";
						break;
					}
				}
			}
			else if (evt.dataTransfer.types) {
				var types = evt.dataTransfer.types;
				for (var n in types) {
					var type = types[n];
// console.log('cb_drag_file_init ~~~~~~~~~~~~~~~~~ types n='+n+"/"+types.length, type);
					if (type == "Files") {
						dlg.dropType = "file";
						dlg.dropEffect = "copy";
						break;
					}
				}
			}
// console.log('cb_drag_file_init ~~~~~~~~~~~~~~~~~ dlg.dropType=', dlg.dropType);
			return false;
		})
		.on("dragleave", function(){
			var evt = arguments[0].originalEvent;
			return false;
		})
		.on("dragover", function(){
			var evt = arguments[0].originalEvent;
			evt.dataTransfer.dropEffect = dlg.dropEffect;
			return false;
		})
		.on("drop", function(){
			// File
			var evt = arguments[0].originalEvent;
			if (evt.dataTransfer) {
				
				//http://10.0.0.120/Site/wheechen/Driver/Favorites/file_ird3am.jpg?nuweb_drop_download=WheeRegion
				function do_url(url){
					var cs = B_URL_GetArg(url, "nuweb_drop_download");
					var ufp = rs_con_Url2UrlPath(url);
					if (!cs) {
						B_Message("無效的連結檔");
						return;
					}
					
					WRS_API_get_page_info({
						fp:			ufp
						,funcOK:		function(data){
// console.log('~~~~~~ WRS_API_get_page_info data=', data);
							
							if (data) {
								var u = "http://"+cs+".nuweb.cc/tools/page/show_page.php"
										+"?page_url="+ufp
										+"&nu_code="+This.m_arg.nu_code;
								This.cb_upload_file_do_file($dlg, null, {
									url:u
									,name: data.rec.filename
									,size: data.rec.size
									,mtime:data.rec.mtime
								});
							}
						}
					});
					
				}
				// Uri
				if (evt.dataTransfer.items) {
					var items = evt.dataTransfer.items;
					
	// for (var x=0; x<items.length; x++) {
		// var item = items[x];
// console.log('item x=', x, items.length, item.type);
		// item.getAsString(function(data){
// console.log('item data=', x, data);
		// });
	// }
					
					
					if (dlg.dropType = "uri") {
						for (var x=0; x<items.length; x++) {
							var item = items[x];
							if (item.type == "text/uri-list") {
								item.getAsString(function(url){
									if (url) do_url(url);
								});
							}
						}
					}
				}
				else {
				}
				
				// File
				var files = evt.dataTransfer.files;
				if (files && files.length) {
					for (var x=0; x<files.length; x++){
						This.cb_upload_file_do_file($dlg, files[x]);
					}
				}
			}
			return false;
		})
},
// 檔案上傳
cb_upload_file_init: function($dlg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	// 留言區的檔案上傳
	$dlg.find("#bnAddFile input").on('change', function(){
		
		var evt = arguments[0].originalEvent;
		if (!evt.target || !evt.target.files)
			return;
		
		var files = evt.target.files;
		for(var x = 0; files[x]; x++) {
			file = files[x];
			This.cb_upload_file_do_file($dlg, file);
		};
	});
},
cb_upload_file_do_file: function($dlg, file, arg)
{
// console.log('~~~~~~ cb_upload_file_do_file file=', file);
// console.log('~~~~~~ cb_upload_file_do_file arg=', arg);
	var This = this;
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	var fid = this.getUploadFileID();
	if (arg)
	{
		// 顯示上傳區塊
		this.cb_msg_item_append_UpFile($dlg, fid, arg.name);
		This.send_arg({
			mode: 	"cb_upload_file"
			,cid: 	cid
			,fid:	fid
			,fn: 	arg.name
			,fs:	arg.size
			,mtime:	arg.mtime
			,url: 	arg.url
		});
	}
	else
	{
		// 顯示上傳區塊
		this.cb_msg_item_append_UpFile($dlg, fid, file.name);
		//
		var reader = new FileReader();
		reader.onload = function(event) {
			This.send_arg({
				mode: 	"cb_upload_file"
				,cid: 	cid
				,fid:	fid
				,fn: 	file.name
				,fs: 	file.size
				,mtime:	B_getCurrentTimeStr((file.lastModifiedDate ? file.lastModifiedDate : new Date(n)).getTime(), 1)
				,data: 	event.target.result
			});
		};
		reader.onerror = function(event) {
		};
		reader.readAsBinaryString(file/*, "UTF-8"*/);
	}
	
	
/*	
	var bbs_path = This.get_path_bbs(url);
	var id = "msg_uf_"+(++This.upload_file_uploading_id);
	var $msg = This.Upload_file_msg_add($se, id, bPro);
	$msg.find(".filename").html(file.name).attr("title",file.name);
	var $obj_arg = {
		u_bbs:	bbs_path
		,path:	".nuweb_msg/"
		,id:	id
		,bPro:	bPro
		,file:	file
		,fn:	file.name
		,fs:	file.size
		,tm:	parseInt(file.lastModifiedDate.getTime()/1000)
		,$msg:	$msg
		,xhr:	new XMLHttpRequest()

	}
	// Upload OK
	$obj_arg.funcOK = function(data){
		// T: "3_05_tighten_01"
		// Y: 16
		// fn: "3_05_tighten_01.jpg"
		// fp: "GROUP_NEWS/attach/52148466.jpg"
		// fs: 829977
		// success: true
		// tn: "GROUP_NEWS/attach/52148466.jpg.jpg"
		if (data)
		{
			var u_img;
			if (data.Y == "16") {
				u_img = URL_THUMBS+bbs_path+data.fp+"&type=Image";
			}
			else if (data.Y == "Video") {
				u_img = URL_THUMBS+bbs_path+data.fp+"&type=Video";
			}
			else {
				var ext = B_URL_MakeExtension(data.fn).toLowerCase();
				u_img = rs_con_ext2icon(ext, false);
				if (!u_img) u_img = URLPATH_ICON_MAX_ATTACH;
			}
			var $tImg = $(
				'<div class="img_square">'+
					'<img src="'+u_img+'">'+
				'</div>'
			).appendTo($obj_arg.$msg).f_img_square();
			$obj_arg.$msg.find(".progress , .wait").remove();
			$obj_arg.$msg.addClass("bok");
			$obj_arg.$msg[0]['d-data'] = data;
		}
		else
		{
			$obj_arg.$msg.remove();
		}
	}
	// Click OnCancel
	$obj_arg.OnCancel = function(){
		$obj_arg.$msg.remove();
	}
	$msg.find("#bnCancel").click(function(){
		$obj_arg.OnCancel();
	});
	// Send File
	This.bbs_upload_file_obj_xhr($obj_arg);
*/
},
cb_upload_file_msg_add: function($se, filename)
{
	var This = this;
	var $ti = $(
		'<div class="item_file">'
			+'<span id="bnCancel" class="gray_icon ui-icon-closethick transparent" title="'+"中斷"+'"></span>' // 中斷
			+'<div class="fileinfo">'
				+'<div class="filename">'+filename+'</div>'
			+'</div>'
			+'<div class="progress progress-striped active">'
				+'<div class="bar" style="width:0"></div>'
			+'</div>'
		+'</div>'
	);
	$ti.appendTo($se);
	$ti.get(0).scrollIntoView();
	return $ti;
},

// arg => {url, rec, xhr, probar, funcOK}
api_upload_file_obj_xhr: function(arg)
{
	var dataArg = new FormData();
	for(var key in arg.rec)
		dataArg.append(key, arg.rec[key]);
	if (dataArg) {
		var xhr = arg.xhr;
		var $ProBar = arg.probar;
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4) {
				$ProBar.width("100%");
				var data = null;
				if (xhr.status == 200 && !B_CheckError_SendResult(xhr.responseText, true)) {
					try {
						data = eval("(" + xhr.responseText + ")");
					} catch(err){
						B_Message("Error: "+xhr.responseText);
					}
				} else {
					B_Message("Error: "+xhr.status+", "+xhr.responseText);
				}
				// 上傳完成
				arg.funcOK(data);
			}
		};
		xhr.upload.addEventListener("progress", function(ev) {
			if (ev.lengthComputable) {
				$ProBar.width((ev.loaded/ev.total) *100 +"%");
			}
		}, false);
		xhr.open(
			"POST",
			arg.url
		);
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(dataArg);
	}
},


cb_msg_getList: function($dlg, bNext)
{
	var lt = null;
	if (bNext != true)
	{
		this.cb_bLoad = true;
		this.cb_bNext = true;
		$dlg.find(".cb_main_zone .items").empty();
	}
	else
	{
		if (this.cb_bLoad)
			return; // 下載中...
		
		this.cb_bLoad = true;
		$ti_first = $dlg.find(".cb_main_zone .item:first");
		if ($ti_first.length) {
			try {
				lt = $ti_first.get(0).rec.time;
			} catch(e){}
		}
	}
	
	var cid = $dlg.get(0).rec._id;
	this.send_arg({
		mode: "cb_msg_getList"
		,cid: cid
		,lt:  lt
		,ps:  this.cb_ps
	});
},
// arg => {mode, cid, recs}
_cb_msg_getList: function(arg)
{
	do {

		var cid = arg.cid||"";
		if (cid == "" || !arg.recs)
			break;
		var $dlg = $("#cb_"+cid);
		if ($dlg.length == 0)
			break;
		
		var bSEChatBox = $dlg.parents("#se_chatbox").length > 0;
		var $se = $dlg.find(".cb_main_zone .items");
		var $tiFirst = $se.find(".item:first");
		var dlgArg = $dlg.get(0).arg;
		var recCB = $dlg.get(0).rec;
		var bEmpty = $se.find(".item").length == 0;
		var $ti;
		if (bEmpty) {
			if (bSEChatBox) $(window).scrollTop(1);
		}
		if (arg.recs.length) {
			// Items
			for (var x=0; x<arg.recs.length; x++) {
				$ti = this.cb_msg_item_append($dlg, arg.recs[x], 1);
				if (!bEmpty && $tiFirst.length)
					$tiFirst.get(0).scrollIntoView(true);
			}
			this.cb_bNext = arg.recs.length == this.cb_ps;
			if (!this.cb_bNext && arg.recs.length) 
				this.cb_msg_item_chk_time($se, arg.recs[arg.recs.length-1], 1, true);
			// 調整 ScrollBar
			if (bEmpty) {
				$ti = $se.find(".item, .item_msg").filter(":last");
				if ($ti.length) {
					setTimeout(function(){
						$ti.get(0).scrollIntoView();
					},500);
				}
				// 標示已讀
				this.cb_dlg_data_read($dlg);
			}
			else {
				if ($tiFirst.length) {
					setTimeout(function(){
						$tiFirst.get(0).scrollIntoView(true);
					},500);
				}
			}
			this.cb_dlg_resize();
		}
		else {
			this.cb_bNext = false;
		}
		
	} while(false);
	this.cb_bLoad = false;
},
// arg => {mode, cid, rec}
_cb_msg_add: function(arg)
{
// console.log('~~~ _cb_msg_add arg=', arg);
	var cid = arg.cid||"";
	if (cid == "" || !arg.rec) return;
	var $dlg = $("#cb_"+cid);
	if ($dlg.length == 0) return;
	
	// 移除等待中的區塊
	if (arg.rec.owner == this.m_arg.acn) {
		if (arg.rec.fid)
			$dlg.find('.item_upload[fid="'+arg.rec.fid+'"]').remove();
		else
			$dlg.find('.item_upload[fn="'+arg.rec.filename+'"]').remove();
	}
	//
	var dlgArg = $dlg.get(0).arg;
	var recCB = $dlg.get(0).rec;
	var $se = $dlg.find(".cb_main_zone .items");
	var $ti = this.cb_msg_item_append($dlg, arg.rec, 0);
	if ($ti && $ti.length) {
		setTimeout(function(){
			$ti.get(0).scrollIntoView();
		},300);
	}
},
// 顯示日期
cb_msg_item_chk_time: function($se, rec, pos, bView)
{
	var time;
	var $ti_last = (pos == 0 ? $se.find(".item:last") : $se.find(".item:first")).not(".item_upload");
	if (bView == true) {
		time = rec.time;
	}
	else if ($ti_last.length > 0) {
		var YMD = B_con_rectime2html($ti_last.get(0).rec.time, 6);
		if (YMD != B_con_rectime2html(rec.time, 6))
			time = pos == 0 ? rec.time : $ti_last.get(0).rec.time;
	}
	//
	if (time) {
		var $ti_time = $(
			'<div class="item_msg">'
				+'<div class="desc">'+B_con_rectime2html(time,7)+'</div>'
			+'</div>'
		);
		if (pos == 0)
			$ti_time.appendTo($se);
		else
			$ti_time.prependTo($se);
	}
},
// pos => [0(bottom) / 1(top)]
cb_msg_item_append: function($dlg, rec, pos)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	var $se = $dlg.find(".cb_main_zone .items");
	
	this.cb_msg_item_chk_time($se, rec, pos);
	
	var $ti, C;
	var bMy = rec.owner == this.m_arg.acn;
	var h_calss = bMy ? "item_me" : "item_friend";
	var bBnView = true;
	if (rec.type == DB_CM_TYPE_SET || rec.type == DB_CM_TYPE_RECORD) {
		var bOwner = rec.content.substr(0,2) != "%*"; // 不顯示 Owner
		if (bOwner)
			C = (bMy?'你':rec.owner_sun)+'</b> '+B_HTMLEnCode(rec.content, true);
		else
			C = B_HTMLEnCode(rec.content.substr(2), true);
		if (rec.type == DB_CM_TYPE_RECORD) {
			C += ' <a id="bnPlayer" class="btn btn-default" href="#"><i class="fa fa-play-circle-o"></i></a>';
		}
		$ti = $(
			'<div class="item_msg">'
				+'<div class="desc">'+C+'</div>'
			+'</div>'
		);
		$ti.get(0).rec = rec;
		if (pos == 0)
			$ti.appendTo($se);
		else
			$ti.prependTo($se);
		
		function do_player(){
			var $ti = $(this).parents(".item_msg:first");
			var rec = $ti.get(0).rec;
			var mid = rec._id;
			var url = ws_getUrlHost()+"/cb_view_record.html?mid="+mid+"&server_acn="+This.m_arg.server_acn;
			open(url);
		}
		$ti.find("#bnPlayer").on("click", do_player);
		return $ti;
	}
	
	// Item
	var h_filename = B_HTMLEnCode(rec.filename, false);
	var h_desc = B_HTMLEnCode(rec.desc||"", false);
	var h_toolbar = 
		'<div class="toolbar">'
			+'<a id="bnDownload" href="#" class="btn btn-default btn-sm" title="下載">'
				+'<i class="fa fa-download"></i>'
			+'</a>&nbsp;'
			+'<a id="bnView" href="#" class="btn btn-default btn-sm" title="瀏覽">'
				+'<i class="fa fa-eye"></i>'
			+'</a>'
		+'</div>';
	switch(rec.type){
		case "text":
		case DB_CM_TYPE_CHAT:
			C = '<div class="text">'
					+B_HTMLEnCode(rec.content, true)
				+'</div>'
			break;
		case DB_CM_TYPE_PUSH_URL:
			img = B_IsUrl(rec.file_info.img) ? rec.file_info.img : ws_getUrlHost()+rec.file_info.img;
			C = '<div class="text">'
					+B_HTMLEnCode(rec.content, true)
				+'</div>'
				+'<div class="se_push_url">'
					+'<div class="img img_square">'
						+'<img src="'+img+'">'
					+'</div>'
					+'<div class="content">'
						+'<div class="title"><a href="#">'+B_HTMLEnCode(rec.file_info.title,false)+'</a></div>'
						+'<div class="desc">'+B_HTMLEnCode(B_STR_Substr(rec.file_info.desc,220,true),false)+'</div>'
						+'<div class="host">'+rec.file_info.host+'</div>'
					+'</div>'
				+'</div>'
			break;
		case DB_CM_TYPE_SET:
			C = (bMy?"你":rec.owner_sun)+B_HTMLEnCode(rec.content, true);
			break;
			
		case "Image":
			h_calss += " file";
			if (rec.file_info && rec.file_info.width < 300)
				img = ws_getUrlHost()+rec.url;
			else
				img = ws_getUrlHost()+rec.url+".thumbs.jpg";
			C = '<div class="img file">'
					+'<img src="'+img+'">'
				+'</div>'
				+h_toolbar;
			break;
		case "Video":
			h_calss += " file";
			img = ws_getUrlHost()+rec.url+".thumbs.jpg";
			C = '<div class="img file">'
					+'<img src="'+img+'">'
					+'<i class="icon fa fa-play-circle-o fa-5x"></i>'
				+'</div>'
				+h_toolbar;
			break;
		case "Audio":
			h_calss += " file";
			ext = B_URL_MakeExtension(rec.filename).toLowerCase();
			img = rs_con_ext2icon(ext, false);
			C = '<div class="file">'
					+'<img class="img" src="'+img+'">'
					+'<div class="filename">'+h_filename+'</div>'
					+'<div class="desc">'+h_desc+'</div>'
				+'</div>'
				+h_toolbar;
			break;
			
		default:
			bBnView = rec.type == "Document" ? true : false;
			h_calss += " file";
			ext = B_URL_MakeExtension(rec.filename).toLowerCase();
			img = rs_con_ext2icon(ext, false);
			C = '<div class="file">'
					+'<img class="img" src="'+img+'">'
					+'<div class="filename">'+h_filename+'</div>'
					+'<div class="desc">'+h_desc+'</div>'
				+'</div>'
				+h_toolbar;
			break;
	}
	
	var h_2 =
		'<div class="f2">'
			+'<div class="read">已讀</div>'
			+'<div class="time">'+B_con_rectime2html(rec.time,4)+'</div>'
		+'</div>';
	var h_c = '<div class="content">'+C+'</div>';
	var u_thumb = URL_USER_ICON+rec.owner;
	h_calss += " "+rec.type;
	$ti = $(
		'<div class="item '+h_calss+'">'
			+(bMy ? '' : '<div class="icon img_square"><img src="'+u_thumb+'"></div>')
			+'<div class="arrow arrow1"></div>'
			+'<div class="arrow arrow2"></div>'
			+(bMy ? h_2+h_c : h_c+h_2)
		+'</div>'
	);
	if (pos == 0)
		$ti.appendTo($se);
	else
		$ti.prependTo($se);
	$ti.get(0).rec = rec;
	$ti.find(".img_square").f_img_square();
	// 顥示 - 已讀
	if (bMy && recCB.type == DB_TYPE_FRIEND) {
		try {
			var friend_acn = recCB.friends[0];
			var friend_info = recCB.users[friend_acn];
			var t = friend_info.tLast;
			if (t && t.length && t >= rec.time) {
				$ti.find(".read").show();
			}
		} catch(e) {}
	}
	//
	function do_view(){
		var url = ws_getUrlHost()+"/cb_view_file?url="+rec.url+"&type="+rec.type;
		if (bBnView)
			open(url);
		else
			location.href = url;
	}
	function do_view_push_url(){
		if (!rec.file_info || !rec.file_info.url) return;
		var url = B_IsUrl(rec.file_info.url) ? rec.file_info.url : ws_getUrlHost()+rec.file_info.url;
		open(url);
	}
	function do_download(){
		var url = ws_getUrlHost()+"/cb_view_file?url="+rec.url+"&type="+rec.type+"&mode=download";
		location.href = url;
	}
	$ti.find(".file").on("click", do_view);
	$ti.find(".se_push_url").on("click", do_view_push_url);
	$ti.find("#bnView").on("click", do_view);
	$ti.find("#bnDownload").on("click", do_download);
	if (!bBnView) $ti.find(".toolbar #bnView").remove();
	
	
	return $ti;
},
cb_msg_item_append_UpFile: function($dlg, fid, fn)
{
	var $se = $dlg.find(".cb_main_zone .items");
	$ti = $(
		'<div class="item item_me item_upload" fid="'+fid+'" fn="'+fn+'">'
			+'<div class="arrow arrow1"></div>'
			+'<div class="arrow arrow2"></div>'
			+'<div class="content">'
				+'<div class="file">'
					+'<i class="fa fa-spinner fa-pulse fa-3x"></i>'
					+'<div class="filename">'+fn+'</div>'
				+'</div>'
			+'</div>'
		+'</div>'
	);
	$ti.appendTo($se);
	$ti.get(0).scrollIntoView();
},
// arg => {scrollTop, height}
cb_ud_dlg_auto_reload: function(arg)
{
	if (!this.cb_ud_$dlg || !this.cb_ud_msg_get_se())
		return;
	
	if (arg.scrollTop < 1 && this.cb_bNext) {
		this.cb_msg_getList(this.cb_ud_$dlg, true);
	}
},
cb_ud_dlg_resize: function(h)
{
	if (h > 0) this.cb_ud_window_h = h;
	if (!this.cb_ud_window_h) return;
	
	var $barBottom = $("#se_chatbox .cb_bottom_bar");
	if ($barBottom.length > 0) {
		$barBottom.width($("#se_chatbox .cb_chatbox_dlg").width()-10);
		
		var h_main = this.cb_ud_window_h - $barBottom.outerHeight(true) 
						- $("#se_chatbox .cb_dlg_title").outerHeight(true)
						- $(".main_top_bar").outerHeight(true)
		$("#se_chatbox .cb_main_zone.scrollbar").css({minHeight:h_main+"px"});
	}
},
cb_ud_menu_reload: function()
{
	this.send_arg({
		mode: "cb_getList"
	});
},
cb_ud_menu_get_se: function()
{
	if (!this.bNUDrive) return;
	$se = $("#se_chatbox .menu_msg_new .items");
	if (!$se.length) return;
	return $se;
},
cb_ud_menu_item_reset: function($ti)
{
	var This = this;
	$ti.find("> a").on("click", function(){
		This.mi_item_onClick($(this).parent());
		return false;
	});
	$ti.find(".img_square").f_img_square();
},
cb_ud_msg_get_se: function()
{
	if (!this.bNUDrive) return;
	$se = $("#se_chatbox .se_zone > .msgs #s_mode");
	if (!$se.length) return;
	return $se;
},
cb_ud_msg_reload: function()
{
	if (this.cb_ud_cid) {
		this.send_arg({
			mode: "cb_msg_getList"
			,cid: this.cb_ud_cid
			,ps:  this.cb_ps
		});
	}
},


// 聊天室 Menu
mi_init: function()
{
	this.send_arg({
		mode: "cb_getList"
	});
	//
	var This = this;
	var $bn = this.mi_cb.show();
	this.cb_menu = $bn.menu2({
		positionOpts: {
			posX: 'left', 
			posY: 'bottom',
			offsetX: 0,
			offsetY: 0,
			directionH: 'right',
			directionV: 'down', 
			detectH: true, // do horizontal collision detection  
			detectV: false, // do vertical collision detection
			linkToFront: false
		}
		,width: 340
		,content: 
			'<div id="menu_chatbox" class="menu_msg_new">'
				+'<div class="hreader">'
					+'<span class="title">聊天室：</span>'
				+'</div>'
				+'<div class="scrollbar">'
					+'<ul class="items"></ul>'
				+'</div>'
				+'<div class="footer text-center">'
					+'<span id="bnViewAll" class="bnA">查看全部</span>'
				+'</div>'
			+'</div>'
		,onShowMenu: function(menu) {
			
			// 平板改用視窗
			if (sys_is_mobile) {
				// 
				setTimeout(function(){
					This.cb_menu.kill();
				},1);
				//
				This.do_openChatBox();
				return false;
			}
			
			
		
			if (window.sys_dlg_zIndex)
				menu.css({zIndex:sys_dlg_zIndex});
			
			setTimeout(function(){
				// 調整 Menu 高度
				var h_bn = $bn.offset().top+$bn.height();
				var h_hf = menu.find(".hreader").outerHeight()+menu.find(".footer").outerHeight();
				menu.css({maxHeight:"none"});
				menu.find(".scrollbar").css({maxHeight:($(window).height()-h_hf-h_bn-10)+'px', overflowY:'auto'});
				//
				menu.find(".img_square").f_img_square();
			},100);
			// 修改 Item 時間
			menu.find("li.item").each(function(){
				var $ti = $(this);
				var rec = this.rec;
				if (!rec) return;
				$ti.find(".minfo .postdetails").html(B_con_rectime2html(rec.time,2));
			});
		}
		,onchooseItem: function(item) {
			This.mi_item_onClick($(item).parent());
		}
	});
	this.cb_menu.create();
	this.cb_menu.kill();
	// 
	this.cb_menu.$dlg.find("#bnViewAll").on("click", function(){
		This.cb_dlg_open_NUDrive();
	});
	if (window.main_icon_resize)
		window.main_icon_resize();
},
mi_items_reload: function(arg)
{
	if (!this.cb_menu)
		return;
	
	var user_acn = this.m_arg.acn;
	var $se = this.cb_menu.$dlg.find("#menu_chatbox .items").empty();
	var $se_ud = this.cb_ud_menu_get_se();
	if (arg.recs && arg.recs.length) {
		for (var x=0; x<arg.recs.length; x++) {
			var rec = arg.recs[x];
			var user_info = rec.users && rec.users[user_acn] ? rec.users[user_acn] : null;
			if (rec.type != DB_TYPE_GROUPS && (user_info && user_info.tFirst >= rec.time)) {
				continue; // 過濾沒有訊息的聊天室
			}
			var $ti = this.mi_item_append($se, rec);
			this.cb_item_reset($ti);
			if ($se_ud) {
				var $ti = this.mi_item_append($se_ud, rec);
				this.cb_ud_menu_item_reset($ti);
			}
		}
		this.cb_menu.items_reset();
	}
	else {
		this.nt_item_append_nomsg($se);
	}
	this.mi_cnt_noview_reset();
},
mi_cnt_noview_reset: function()
{
	var user_acn = this.m_arg.acn;
	var $tis = this.cb_menu.$dlg.find("#menu_chatbox .items .item");
	var cnt_noview = 0, rec, cnt;
	$tis.each(function(){
		rec = this.rec;
		cnt = !rec || !rec.users || !rec.users[user_acn] ? 0
				: (rec.users[user_acn].cnt_noview||0);
		if (cnt > 0) cnt_noview++;
	});
	this.cnt_noview = cnt_noview;
	if (cnt_noview > 0)
		$("#Function_Menu .bnt[rel='chatbox'] .axlabel_warning").html(cnt_noview).show();
	else
		$("#Function_Menu .bnt[rel='chatbox'] .axlabel_warning").html(cnt_noview).hide();
},
cb_item_reset: function($ti)
{
	var This = this;
	$ti.find("> a").on("click", function(){
		This.mi_item_onClick($(this).parent());
	});
	$ti.find(".img_square").f_img_square();
},
mi_item_onClick: function($ti)
{
	var recCB = $ti.get(0).rec;
	var cid = recCB._id;
	// this._cb_openBox({
		// mode: "cb_openBox"
		// ,rec: recCB
	// });
	this.do_openChat(cid);
},
mi_item_append: function($se, rec)
{
	if (!rec || !rec._id || !rec.allow)
		return;
	var This = this;
	var info = 'cid="'+rec._id+'"';
	var friends = B_array_del(rec.allow, this.m_arg.acn);
	var u_thumb = URL_USER_ICON+friends[0];
	var u_title = B_HTMLEnCode(rec.type == DB_TYPE_GROUPS && (rec.title||"") != "" ? rec.title : "");
	var $ti = $(
		'<li class="item" '+info+'><a href="#">'
			+'<span class="user_icon img_square"><img src="'+u_thumb+'"></span>'
			+'<div class="msg_content">'
				+'<div class="postbody">'
					+'<span class="title">'+u_title+'</span>'
					+'<span class="content">'+(rec.msg_rec ? B_HTMLEnCode(rec.msg_rec.content||"",false) : "")+'</span>'
				+'</div>'
				+'<div class="minfo">'
					+'<span class="postdetails" title="'+B_con_rectime2html(rec.time,1)+'">'+B_con_rectime2html(rec.time,2)+'</span>'
				+'</div>'
			+'</div>'
			//+'<i class="bnDelete transparent fa fa-times" title="刪除"></i>'
		+'</a></li>'
	);
	$ti.appendTo($se);
	this.mi_item_upd($ti, rec);
	$ti.find("[title]").f_tooltip();
	return $ti;
},
mi_item_upd: function($ti, rec)
{
	var recOld = $ti.get(0).rec;
	
	$ti.get(0).rec = rec;
	var user_acn = this.m_arg.acn;
	var user_info = rec.users && rec.users[user_acn] ? rec.users[user_acn] : null;
	var cnt_noview = user_info && user_info.cnt_noview > 0 ? user_info.cnt_noview : 0;
	var h_cnt_noview = cnt_noview > 0 ? " ("+cnt_noview+")" : "";
	var h_title = B_HTMLEnCode(B_STR_Substr((rec.type!=DB_TYPE_FRIEND && (rec.title||"") != "" ? rec.title : ""), 48,true));
	var h_icon = rec.type == DB_TYPE_COMM ? '<span class="bn_bg s_community"></span>&nbsp;'
			:'<i class="fa '+(rec.type==DB_TYPE_FRIEND?'fa-user':'fa-users')+'"></i>&nbsp;';
	
	// 群組
	if (rec.type != DB_TYPE_FRIEND) {
		
		$ti.find(".user_icons, .user_icon").remove();
		
		var user1 = rec.msg_rec && rec.msg_rec.owner ? rec.msg_rec.owner : user_acn;
		var friends = B_array_del(rec.allow, user1);
		var cnt = (friends.length > 2 ? 2 : friends.length)+1;
		if (cnt > 1) {
			var h_imgs = '<span class="user_icon img_square"><img src="'+URL_USER_ICON+user1+'"></span>';
			for (var x=0; x<friends.length && x<2; x++)
				h_imgs += '<span class="user_icon img_square"><img src="'+URL_USER_ICON+friends[x]+'"></span>';
			var h = '<span class="user_icons user_icons'+cnt+'">'+h_imgs+'</span>';
			$ti.find("> a").prepend(h);
		} 
		else {
			$ti.find("> a").prepend(
				'<span class="user_icon img_square"><img src="'+URL_USER_ICON+user1+'"></span>'
			);
		}
		$ti.find(".img_square").f_img_square();
	}
	//
	if (cnt_noview > 0)
		$ti.addClass("noread");
	else
		$ti.removeClass("noread");
	// Title
	if (h_title != "") {
		$ti.find(".postbody .title").html(h_icon+h_title+h_cnt_noview);
	}
	else {
		var list = rec.type == DB_TYPE_FRIEND ? B_array_del(rec.allow, user_acn) : rec.allow;
		rs_con_acns2suns(list, "sun", function(suns){
			if (suns)
				$ti.find(".postbody .title").html(
					h_icon
					+B_STR_Substr(suns.join("、"), 48,true)
					+h_cnt_noview
				);
		})
	}
	// Content
	$ti.find(".postbody .content").html((rec.msg_rec ? B_HTMLEnCode(rec.msg_rec.content||"",false) : ""));
	// Time
	$ti.find(".minfo .postdetails")
		.attr("title", B_con_rectime2html(rec.time,1))
		.html(B_con_rectime2html(rec.time,2))
	//
	this.mi_cnt_noview_reset();
},



do_openChatBox: function()
{
	var url = URL_CHATBOX+API_CHATBOX
		+"?nu_code="	+this.m_arg.nu_code
		+"&acn="		+this.m_arg.acn
		+"&sun="		+this.m_arg.sun
		+"&domain="		+this.m_arg.domain
		+"&server_acn="	+this.m_arg.server_acn
	var specs = "";
	if (!sys_is_mobile) {
		specs = "toolbar=no, scrollbars=no, width=420, height=500"
			+",left="+((screen.width-420)/2)+",top="+((screen.height-500)/2)
	}
	open(url, "nuweb_chatbox", specs);
},
do_openChat: function(cid, friend)
{
	var url = URL_CHATBOX+API_CHAT
				+"?nu_code="	+this.m_arg.nu_code
				+"&acn="		+this.m_arg.acn
				+"&sun="		+this.m_arg.sun
				+"&domain="		+this.m_arg.domain
				+"&server_acn="	+this.m_arg.server_acn
				+"&pop=y"
				+(friend ? 	"&friend="+friend
						: 	"&cid="+cid)
	var specs = "";
	if (!sys_is_mobile) {
		specs = "toolbar=no, scrollbars=no, width=420, height=500"
			+",left="+((screen.width-420)/2)+",top="+((screen.height-500)/2)
	}
	open(url, "chat_"+(friend||cid), specs);
}



}
var oWS = new OBJ_WebSocket();






