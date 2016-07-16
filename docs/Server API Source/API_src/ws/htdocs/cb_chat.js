
var sys_mode = null;
var sys_init_fn = false;
var sys_init_cb = false;
var gArg = {};

if (B_is_firefox()) {
console.log('~~~ firefox ~~~~~~~~~~~~~~~~~~~');
	document.write('<link type="text/css" rel="stylesheet" media="screen" href="//fonts.googleapis.com/css?family=PT+Sans:400,700,400italic,700italic&amp;subset=latin,cyrillic-ext,latin-ext,cyrillic">');
}

//////////////////////////////////////////
$(window).resize(main_window_resize);
var main_TimeID_window_resize = null;
function main_window_resize() {
	clearTimeout(main_TimeID_window_resize);
	main_TimeID_window_resize = setTimeout(main_window_adjust, 300);
}
function main_window_adjust() {
	var h_win = $(window).height();
	if (!$(".cb_dlg_title").is(":hidden"))
		h_win -= $(".cb_dlg_title").outerHeight(true);
	
	function getHC(){
		return h_win
			- $(".cb_dlg .cb_input_zone").outerHeight(true)
			- $(".cb_dlg .cb_bottom_bar").outerHeight(true)
	}
	
	if (oWC._mode == "c")
	{
		// ChatBox
// console.log('main_window_adjust cb_dlg_title='+$(".cb_dlg_title").outerHeight(true)+", hide="+$(".cb_dlg_title").is(":hidden"));
		$(".cb_dlg .cb_main_zone").height(getHC()+3);
	}
	else if (oWC._mode == "v")
	{
		// WebRTC
		$(".webrtc_dlg .se_webrtc").height(h_win-5);
// console.log('cc::main_window_adjust se_webrtc h=', h_win);
	}
	else
	{
		var h_c = getHC();
		if (h_c < 30) 
			h_c = 30;
		else if (h_c > h_win/2) 
			h_c = parseInt(h_win/2);
		
		$(".cb_dlg .cb_main_zone").height(h_c);
		$(".webrtc_dlg .se_webrtc").height(h_win-h_c);
// console.log('cc::main_window_adjust se_webrtc h=', h_win-h_c);
	}
	
}
//////////////////////////////////////////
$(document).ready(function() {
	
	var url = location.href;
	gArg.nu_code = B_URL_GetArg(url, "nu_code");
	gArg.acn 	 = B_URL_GetArg(url, "acn");
	gArg.sun 	 = B_URL_GetArg(url, "sun");
	gArg.server_acn=B_URL_GetArg(url, "server_acn");
	// ChatBox
	gArg.cid	 = B_URL_GetArg(url, "cid")||"";
	gArg.friend	 = B_URL_GetArg(url, "friend")||"";
	// WebRTC
	gArg.mode 	 = B_URL_GetArg(url, "mode")||"";
	gArg.type 	 = B_URL_GetArg(url, "type")||"";
	
// console.log('ready: gArg=', gArg);
	if (gArg.nu_code == null || gArg.nu_code == "") {
		alert("empty code");
		window.close();
		return;
	}
	
	//
	rs_cb_init({
		u_srv: 		"http://"+gArg.server_acn+".nuweb.cc"
		,nu_code: 	gArg.nu_code
	});
	// 聊天室
	oWC.init({
		acn:		gArg.acn
		,sun:		gArg.sun
		,server_acn:gArg.server_acn
		,nu_code:	gArg.nu_code
		
		,cid:		gArg.cid
		,friend:	gArg.friend
		
		,mode:		gArg.mode
		,type:		gArg.type
		
		,onWindowAdjust: main_window_adjust
	});
	// 
	oWS.msg_set(onMessage);
	oWS.init({
		mode: 		"chatbox"
		,nu_code:	gArg.nu_code
		,acn:		gArg.acn
		,sun:		gArg.sun
		,server_acn:gArg.server_acn
		,fun_cb:	true
	});

	
	
	main_window_adjust();
	setTimeout(function(){
		main_window_adjust();
	}, 1000);
	
	
// Debug
	$("#bnTest").on("click", function(){
		setTimeout(function(){
			cb_onSettings();
		},1);
	});
	
	// setTimeout(function(){
		
		// $("#se_sel_bar").show();
	// }, 1000);
	
});

function onMessage(arg)
{
// console.log('cc::onMessage: arg=', arg);

	switch(arg.mode){
		case "error":
			B_Message(arg.msg);
			break;
			
		case "login":
			cb_init();
			break;
	}
	oWC.onMessage(arg);
}
function cb_init()
{
// console.log('cc::cb_init: window.jsChat=', window.jsChat);
}
function cb_onSettings()
{
	oWC.cb_dlg_openSelMenu();
}







function setMode(m)
{
	switch(m){
		case "list_friend":
			$(".se_lists").show();
			$(".se_chatbox").hide();
			$(".se_lists .se_friend").show();
			$(".se_lists .se_chat").hide();
			if (!sys_init_fn) {
				sys_init_fn = true;
				fn_reload();
			}
			break;
			
		case "list_chat":
			$(".se_lists").show();
			$(".se_chatbox").hide();
			$(".se_lists .se_friend").hide();
			$(".se_lists .se_chat").show();
			if (!sys_init_cb) {
				sys_init_cb = true;
				cb_reload();
			}
			break;
			
		case "chatbox":
			$(".se_lists").hide();
			$(".se_chatbox").show();
			break;
	}
}






function _rtc_login(arg)
{
	if (arg.result == "ok"){
		rtc_init();
	}
	// 登入失敗
	else {
		alert(arg.error);
		window.close();
	}
}
function rtc_close()
{
	//window.close();
}
function rtc_init()
{
	oWS.api_getMsg({
		msg:{
			mode: "cb_getCID"
			,cid: gArg.cid
		}
		,funcOK: function(data, err) {
			if (data && data.rec) {
				gArg.recCB = data.rec;
				
				if (gArg.mode == "call")
				{
					oWRTC.do_call(gArg.recCB, gArg.type);
				}
				else if (gArg.mode == "accept")
				{
					oWRTC.do_accept(gArg.recCB, gArg.type);
				}
			}
			else {
				rtc_close();
			}
		}
	});
}

