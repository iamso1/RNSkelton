
var sys_mode = null;
var sys_init_fn = false;
var sys_init_cb = false;
var gArg = {};


// Android App
var sys_is_app = sys_is_app || typeof window.jsChat == "object";



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
	$(".se_main").height(h_win - $(".se_top_bar").outerHeight(true));
	
	
	
}
//////////////////////////////////////////
$(document).ready(function() {
	
	var url = location.href;
	gArg.nu_code = B_URL_GetArg(url, "nu_code");
	gArg.acn 	 = B_URL_GetArg(url, "acn");
	gArg.sun 	 = B_URL_GetArg(url, "sun");
	gArg.server_acn=B_URL_GetArg(url, "server_acn");

// console.log('ready: gArg=', gArg);
	if (gArg.nu_code == null || gArg.nu_code == "") {
		alert("empty code");
		window.close();
		return;
	}
	// Android App
	if (sys_is_app) {
		var verChrome = jsChat.getChromeVer();
		if (verChrome != "") verChrome = parseInt(verChrome.split(".")[0]);
		var infoBrow = B_getBrowserName();
		var verOS = infoBrow && infoBrow.osVer ? parseInt(infoBrow.osVer.split(".")[0]) : 0;
		var verWebView = B_is_chrome();
// console.log('ready: verChrome='+verChrome+", verWebView="+verWebView+", verOS="+verOS);
		//if (verOS < 5 && verWebView < 36 && verChrome == "")
		if (verChrome == "")
		{
			$("#se_not_warning").show();
			$("#se_chatbox").hide();
			return;
		}
	}
	
	
	
	//
	rs_cb_init({
		u_srv: "http://"+gArg.server_acn+".nuweb.cc"
		,nu_code: gArg.nu_code
	});
	//
	oWS.init({
		mode: 		"chatbox"
		,nu_code:	gArg.nu_code
		,acn:		gArg.acn
		,sun:		gArg.sun
		,server_acn:gArg.server_acn
		,fun_cb:	true
	});
	oWS.msg_set(onMessage)

	// var $dlg = $("#webrtc_dlg");
	// $dlg.dialog = function(m) {
		// console.log('~~~ $dlg.dialog m=', m);
	// }
	// oWRTC.init({dlg:$dlg, bPopup:true});

	
	$(".se_top_bar a.btn").on("click", function(){
		var $t = $(this);
		var mode = $t.attr("rel");
		if (mode != sys_mode) {
			sys_mode = mode;
			setMode(sys_mode);
			
			$(".se_top_bar a.btn.active").removeClass("active");
			$t.addClass("active");
		}
	});
	main_window_adjust();
});
function cb_init()
{
	var mode = B_URL_GetArg(location.href, "mode")||"";
	var ndx = mode == "friend" ? 0 : 1; 
	$(".se_top_bar a.btn")
		.get(ndx).click();
}
function onMessage(arg)
{
// console.log('onMessage: arg=', arg);

	switch(arg.mode){
		case "error":
			B_Message(arg.msg);
			break;
			
		case "login":
			cb_init();
			break;
			
		case "cb_getList":
			cb_items_reload(arg);
			break;
			
		default:
// console.log('rtc_msg: Error: Invalid mode('+arg.mode+").");
			break;
	}
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



function cb_reload()
{
	oWS.send_arg({
		mode: "cb_getList"
	});
}
function cb_items_reload(arg)
{
// console.log('cb_items_reload arg=', arg);
	
	var user_acn = gArg.acn;
	var $se = $(".se_lists .se_chat.items").empty();
	if (arg.recs && arg.recs.length) {
		for (var x=0; x<arg.recs.length; x++) {
			var rec = arg.recs[x];
			var user_info = rec.users && rec.users[user_acn] ? rec.users[user_acn] : null;
			if (rec.type != DB_TYPE_GROUPS && (user_info && user_info.tFirst >= rec.time)) {
				continue; // 過濾沒有訊息的聊天室
			}
			var $ti = cb_item_append($se, rec);
			cb_item_reset($ti);
		}
	}
	else {
		cb_item_append_nomsg($se);
	}
	cb_cnt_noview_reset();
}
function cb_item_reset($ti)
{
	$ti.on("click", function(){
		cb_item_onClick($(this));
	});
	$ti.find(".img_square").f_img_square();
}
function cb_item_onClick($ti)
{
	var recCB = $ti.get(0).rec;
	var cid = recCB._id;
	var url = "/cb_chat.html"
				+"?nu_code="+gArg.nu_code
				+"&acn="+gArg.acn
				+"&sun="+gArg.sun
				+"&server_acn="+gArg.server_acn
				+"&cid="+cid
				+"&pop=y"
	var specs = "";
	if (!sys_is_mobile) {
		specs = "toolbar=no, scrollbars=no, width=420, height=500"
			+",left="+((screen.width-420)/2)+",top="+((screen.height-500)/2)
	}
	open(url, "nuweb_chat", specs);
}
function cb_item_append($se, rec)
{
	if (!rec || !rec._id || !rec.allow)
		return;
	var info = 'cid="'+rec._id+'"';
	var friends = B_array_del(rec.allow, gArg.acn);
	var u_thumb = rs_con_acn2thumbs(friends[0]);
	var u_title = B_HTMLEnCode(rec.type == DB_TYPE_GROUPS && (rec.title||"") != "" ? rec.title : "");
	var $ti = $(
		'<li class="list-group-item item" '+info+'>'
			+'<div class="user_icon img_square"><img src="'+u_thumb+'"></div>'
			+'<div class="msg_content">'
				+'<div class="postbody">'
					+'<span class="title">'+u_title+'</span>'
					+'<span class="content">'+(rec.msg_rec ? B_HTMLEnCode(rec.msg_rec.content||"",false) : "")+'</span>'
				+'</div>'
				+'<div class="minfo">'
					+'<span class="postdetails" title="'+B_con_rectime2html(rec.time,1)+'">'+B_con_rectime2html(rec.time,2)+'</span>'
				+'</div>'
			+'</div>'
		+'</li>'
	);
	$ti.appendTo($se);
	cb_item_upd($ti, rec);
	$ti.find("[title]").f_tooltip();
	return $ti;
}
function cb_item_append_nomsg($se)
{
	$se.html(
		'<li class="item nomsgs"><a href="#">'
			+'<div class="msg_not_content">'
				+'沒有新訊息' // +gLang['s_NoNewMessage'] // 沒有新訊息
			+'</div>'
		+'</a></li>'
	);
}
function cb_item_upd($ti, rec)
{
	var recOld = $ti.get(0).rec;
	
	$ti.get(0).rec = rec;
	var user_acn = gArg.acn;
	var user_info = rec.users && rec.users[user_acn] ? rec.users[user_acn] : null;
	var cnt_noview = user_info && user_info.cnt_noview > 0 ? user_info.cnt_noview : 0;
	var h_cnt_noview = cnt_noview > 0 ? " ("+cnt_noview+")" : "";
	var h_title = B_HTMLEnCode(B_STR_Substr((rec.type!=DB_TYPE_FRIEND && (rec.title||"") != "" ? rec.title : ""), 48,true));
	var h_icon = rec.type == DB_TYPE_COMM ? '<span class="bn_bg s_community"></span>&nbsp;'
			:'<i class="fa '+(rec.type==DB_TYPE_FRIEND?'fa-user':'fa-users')+'"></i>&nbsp;';
	
	// 群組
	if (rec.type != DB_TYPE_FRIEND) {
// console.log('群組 ~~~~~~~~~~~~~~~~~~~ rec=', rec);

		$ti.find(".user_icons, .user_icon").remove();
		
		var user1 = rec.msg_rec && rec.msg_rec.owner ? rec.msg_rec.owner : user_acn;
		var friends = B_array_del(rec.allow, user1);
		var cnt = (friends.length > 2 ? 2 : friends.length)+1;
// console.log('群組 ~~~ cnt=', cnt, friends);
		if (cnt > 1) {
			var h_imgs = '<span class="user_icon img_square"><img src="'+rs_con_acn2thumbs(user1)+'"></span>';
			for (var x=0; x<friends.length && x<2; x++)
				h_imgs += '<span class="user_icon img_square"><img src="'+rs_con_acn2thumbs(friends[x])+'"></span>';
			var h = '<span class="user_icons user_icons'+cnt+'">'+h_imgs+'</span>';
			$ti.prepend(h);
		} 
		else {
			$ti.prepend(
				'<span class="user_icon img_square"><img src="'+rs_con_acn2thumbs(user1)+'"></span>'
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
	cb_cnt_noview_reset();
}
function cb_cnt_noview_reset()
{
	var user_acn = gArg.acn;
	var $tis = $(".se_lists .se_chat.items .item");
	var cnt_noview = 0, rec, cnt;
	$tis.each(function(){
		rec = this.rec;
		cnt = !rec || !rec.users || !rec.users[user_acn] ? 0
				: (rec.users[user_acn].cnt_noview||0);
		if (cnt > 0) cnt_noview++;
	});
// console.log('~~~ cb_cnt_noview_reset cnt_noview=', cnt_noview);

	//this.cnt_noview = cnt_noview;
	//if (cnt_noview > 0)
	//	$("#Function_Menu .bnt[rel='chatbox'] .axlabel_warning").html(cnt_noview).show();
	//else
	//	$("#Function_Menu .bnt[rel='chatbox'] .axlabel_warning").html(cnt_noview).hide();
}



function fn_reload()
{
	WRS_API_get_relation_list({
		funcOK: function(list, err){
			
			if (list) {
				// ACN To Info
				rs_con_acns2info(list, function(recs){
// console.log('fn_reload rs_con_acns2info recs=', recs);

					fn_items_reload(recs);
				});
			}
			else
				fn_items_reload();
		}
	});
}
function fn_items_reload(recs)
{
// console.log('fn_items_reload recs=', recs);
	
	var user_acn = gArg.acn;
	var $se = $(".se_lists .se_friend.items").empty();
	if (recs && recs.length) {
		for (var x=0; x<recs.length; x++) {
			var $ti = fn_item_append($se, recs[x]);
		}
	}
	else {
		//fn_item_append_nomsg($se);
	}
}
function fn_item_append($se, rec)
{
	if (!rec || !rec.acn || !rec.sun)
		return;
	var info = 'acn="'+rec.acn+'"';
	var u_thumb = rs_con_acn2thumbs(rec.acn);
	var u_title = B_HTMLEnCode(rec.sun);
	var $ti = $(
		'<li class="list-group-item item" '+info+'>'
			+'<div class="user_icon img_square"><img src="'+u_thumb+'"></div>'
			+'<div class="msg_content">'
				+'<div class="postbody">'
					+'<span class="title">'+u_title+'</span>'
					+'<span class="content">'+B_HTMLEnCode(rec.description)+'</span>'
				+'</div>'
			+'</div>'
		+'</li>'
	);
	$ti.appendTo($se);
	$ti.get(0).rec = rec;
	$ti.find(".img_square").f_img_square();
	// OnClick
	$ti.on("click", function(){
		fn_item_onClick($(this));
	});
// console.log('fn_item_append rec=', rec);
	return $ti;
}
function fn_item_onClick($ti)
{
	var rec = $ti.get(0).rec;
	var url = "/cb_chat.html"
				+"?nu_code="	+gArg.nu_code
				+"&acn="		+gArg.acn
				+"&sun="		+gArg.sun
				+"&server_acn="	+gArg.server_acn
				//+"&cid="		+cid
				+"&friend="		+rec.acn
				+"&pop=y"
	var specs = "";
	if (!sys_is_mobile) {
		specs = "toolbar=no, scrollbars=no, width=420, height=500"
			+",left="+((screen.width-420)/2)+",top="+((screen.height-500)/2)
	}
	open(url, "nuweb_chat", specs);
}



function _rtc_login(arg)
{
	if (arg.result == "ok"){
		rtc_init();
	}
	// 登入失敗
	else {
		alert(arg.error);
		//window.close();
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

