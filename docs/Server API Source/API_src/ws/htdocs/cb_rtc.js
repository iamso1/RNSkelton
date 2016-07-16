

if (B_is_firefox()) {
console.log('~~~~~~~~~~~~~~~~~~~');
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
	
	$(".webrtc_dlg .se_webrtc").height(h_win);
}


var gArg = {};

//////////////////////////////////////////
$(document).ready(function() {
	
	var url = location.href;
	gArg.nu_code = B_URL_GetArg(url, "nu_code");
	gArg.acn 	 = B_URL_GetArg(url, "acn");
	gArg.sun 	 = B_URL_GetArg(url, "sun");
	gArg.server_acn=B_URL_GetArg(url, "server_acn");
	gArg.cid 	 = B_URL_GetArg(url, "cid");
	
	gArg.mode 	 = B_URL_GetArg(url, "mode");
	gArg.type 	 = B_URL_GetArg(url, "type");

	if (gArg.nu_code == null || gArg.nu_code == "") {
		alert("empty code");
		//window.close();
		return;
	}
console.log('cr:ready gArg=', gArg);


	

	oWS.init({
		mode: 		"rtc"
		,nu_code:	gArg.nu_code
		,acn:		gArg.acn
		,sun:		gArg.sun
		,server_acn:gArg.server_acn
		,fun_cb:	true
	});
	oWS.msg_set(rtc_msg)

	var $dlg = $("#webrtc_dlg");
	$dlg.dialog = function(m) {
		console.log('~~~ $dlg.dialog m=', m);
	}
	oWRTC.init({
		dlg:	$dlg
		,bPopup:true
		
		,onClose: function(err){
console.log('cr:ready oWRTC:onClose err=', err);
			//if (err && err != "")
			//	alert(err);
		
			// Android App
			if (sys_is_app) {
				if (window.jsChat)
					window.jsChat.onClose();
			}
			window.close();
		}
	});
	

	main_window_adjust();
});
function rtc_msg(arg)
{
	switch(arg.mode){
		case "error":
			B_Message(arg.msg);
			break;
			
		case "login":
			_rtc_login(arg);
			break;
			
		case "cb_getCID":
			_cb_getCID(arg);
			break;
			
		default:
// console.log('rtc_msg: Error: Invalid mode('+arg.mode+").");
			break;
	}
}
function _rtc_login(arg)
{
console.log('_rtc_login: arg.result='+arg.result);
	if (arg.result == "ok")
	{
		if (gArg.mode == "callin")
		{
			oWRTC.do_call_callin(gArg.cid, gArg.type);
		}
		else
		{
			oWS.send_arg({
				mode: "cb_getCID"
				,cid: gArg.cid
			});
		}
	}
	// 登入失敗
	else {
		alert(arg.error);
		window.close();
	}
}
function _cb_getCID(arg)
{
	if (arg && arg.rec) {
		gArg.recCB = arg.rec;
		
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

function rtc_do_deny()
{
	oWRTC.do_deny();
}
function rtc_close()
{
	window.close();
}

