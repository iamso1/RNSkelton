
var sys_https = location.protocol == "https:";
var sys_url_ptc = location.protocol+"//";


// Android App
var sys_is_app = sys_is_app || typeof window.jsChat == "object";



function OBJ_WebChat()
{
	this._mode = "c"; // [c / v / cv]
	this._upload_file_id = 0;
	
	this.bNUDrive = false;
	this.cb_bLoad = false;
	this.cb_bNext = true;
	this.cb_ps = 20;
	
	this.cb_menu = null;
	this.cb_ud_cid = null;
	this.cb_ud_$dlg = null;
	
	
}
OBJ_WebChat.prototype = {

getUploadFileID: function()
{
	return "ws-"+(++this._upload_file_id);
},

// arg => {acn, sun, server_acn, nu_code, 
//			cid, friend,
//			mode, type,
// 			onWindowAdjust
// }
init: function(arg)
{
	var This = this;
	this.m_arg = arg;
	
	// 視訊通話
	var $dlg = $("#webrtc_dlg");
	$dlg.dialog = function(m) {
		console.log('~~~ $dlg.dialog m=', m);
	}
/*	oWRTC.init({
		dlg:	$dlg
		,bPopup:true
		
		,onClose: function(err){
	console.log('wc::init onClose err=', err);
			//if (This._mode != "cv")
				//window.close();
		}
	});
*/	
	
	if (this.m_arg.mode != "")
		this.setMode("v");
	else
		this.setMode("c");
},
onMessage: function(arg) 
{
// console.log('wc::onMessage arg=', arg);
	switch(arg.mode){
		// ChatBox
		case "cb_getList":
			this._cb_getList(arg);
			break;
		case "cb_friend_add":
			this._cb_friend_add(arg);
			break;
		case "cb_openBox":
			arg.bSound = false;
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
			
			
		case "login":
			this._login(arg);
			break;
	}
},
do_call: function(m, type)
{
	if (gArg.mode == "call")
	{
		this.setMode(v);
		//oWRTC.do_call(gArg.recCB, type);
	}
	else if (gArg.mode == "accept")
	{
		this.setMode(v);
		//oWRTC.do_accept(gArg.recCB, type);
	}
	else
	{
		this.setMode(c);
	}
},
// [c / v / cv]
setMode: function(m)
{
// console.log('wc::setMode m=', m);
	this._mode = m;
	switch(m) {
		case "c":
			$(".webrtc_dlg").hide();
			$(".cb_dlg").show();
			break;
			
		case "v":
			$(".webrtc_dlg").show();
			$(".cb_dlg").hide();
			break;
			
		case "cv":
			$(".webrtc_dlg").show();
			$(".cb_dlg").show();
			break;
		
	}
	this.m_arg.onWindowAdjust();
},
_login: function(arg)
{
	// Android App
	if (sys_is_app) {
		if (window.jsChat) window.jsChat.init();
	}
	
	// 
/*	oWS.send_arg({
		mode: 	"cb_openBox"
		,cid:	this.m_arg.cid
		,users:	((this.m_arg.friend||"") != "" ? [this.m_arg.friend] : "")
	});
*/	
	
	var This = this;
	oWS.api_getMsg({
		msg:{
			mode: "cb_openBox"
			,cid:	this.m_arg.cid
			,users:	((this.m_arg.friend||"") != "" ? [this.m_arg.friend] : "")
		}
		,funcOK: function(data, err) {

			if (data && data.rec)
			{
				var recCB = data.rec;
				if (This.m_arg.mode == "call")
				{
					//oWRTC.do_call(recCB, This.m_arg.type);
				}
				else if (This.m_arg.mode == "accept")
				{
					//oWRTC.do_accept(recCB, This.m_arg.type);
				}
				else
				{
					This._cb_openBox(data);
					This.cb_dlg_view_OnClick(This.cb_ud_$dlg);
				}
			}
			else
			{
				B_Message(err||"Error: 無法取得聊天室訊息");
				setTimeout(function(){
					window.close();
				},1000);
			}
		}
	});
},
// arg => {mode, cid, rec,  ,[bSound]}
_cb_upd: function(arg)
{
// console.log('~~~ _cb_upd arg=', arg);
	var This = this;
	var user_acn = this.m_arg.acn;
	var recCB = arg.rec;
	var $dlg = $(".cb_chatbox_dlg .cb_dlg");
	
	// 已經退出
	var bMyExis = arg.rec.allow.indexOf(this.m_arg.acn) > -1;
	if (!bMyExis)
	{
		// Android App
		if (sys_is_app) {
			if (window.jsChat)
				window.jsChat.onClose();
		}
		else {
			window.close();
		}
	}
	else
	{
		var bNewMsg = false;
		var rec = $dlg.get(0).rec;
		var cntOld = !rec || !rec.users || !rec.users[user_acn] ? 0
					: (rec.users[user_acn].cnt_noview||0);
		var cntNew = !recCB.users || !recCB.users[user_acn] ? 0
					: (recCB.users[user_acn].cnt_noview||0);
		bNewMsg = cntNew > cntOld;
// console.log('~~~ _cb_upd cntNew/cntOld ='+cntNew+'/'+cntOld+', bNewMsg='+bNewMsg);
		// 有新訊息進來
		if (bNewMsg) {
			//*** 沒有設定靜音 - 叫一聲
			if (arg.bSound != false) {
				if (window.B_wav_play)
					B_wav_play();
			}
		}
		
		$dlg.get(0).rec = recCB;
		this.cb_dlg_data_upd($dlg);
		this.cb_dlg_data_read($dlg);
	}
},
// arg => {mode, rec{_id, allow, ...}}
_cb_openBox: function(arg)
{
// console.log('~~~ _cb_openBox arg=', arg);
	
	var This = this;
	var recCB = arg.rec;
	var cid = recCB._id;
	var id_dlg = "cb_"+cid;
	var $dlg;


	var $se_ud = $("#chatbox_dlg");
	$dlg = $se_ud.find(".cb_dlg");
	$dlg.attr("id", id_dlg);
	$dlg.get(0).arg = {
		resize: function(){
			//This.cb_ud_dlg_resize();
		}
	}
	this.cb_ud_$dlg = $dlg;
// Debug
// if (this.m_arg.server_acn != "tw1f7" // 10.0.0.112 ookonweb
		// && this.m_arg.server_acn != "tw21b" // green-cloud.green-computing.com
		// && this.m_arg.server_acn != "WheeRegion") {
	// $dlg.find(".cb_toolbar").find("#bnVideo, #bnPhone").remove();
// }
	
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
	var $dlgT = $dlg.parent().find(".ui-dialog-titlebar").addClass("cb_dlg_title");
	// 加朋友進來
	$('<a href="#" id="bnUserAdd"><i class="fa fa-user-plus transparent" title="加朋友進來"></i></a>')
		.prependTo($dlgT);
	// 選項
	$('<a href="#" id="bnSel"><i class="fa fa-cog transparent" title="選項"></i></a>')
		.prependTo($dlgT);
	
	// 監控 ScrollBar 
	if (true) {
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
				+'<span class="img img_square"><img src="'+rs_con_acn2thumbs(rec.acn)+'"></span>'
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
	
	
	$dlg.find(".se_select_bar").hide();
	
	this.cb_dlg_top_bar_init($dlg);
	// 留言輸入
	this.cb_dlg_input_init($dlg);
	// 拖曳檔案上傳
	this.cb_drag_file_init($dlg);
	// 檔案上傳
	this.cb_upload_file_init($dlg);
	// 貼圖上傳
	this.cb_paste_init($dlg);
	// 視訊通話
	this.cb_dlg_rtc_init($dlg);
	//
	this.cb_msg_getList($dlg);
	this.cb_dlg_resize($dlg);
},
cb_dlg_resize: function($dlg)
{
// console.log('cb_dlg_resize ~~~');
	if ($dlg && $dlg.length)
		$dlg.get(0).arg.resize();
	
	this.m_arg.onWindowAdjust();
},
cb_dlg_top_bar_init: function($dlg)
{
	// Android App
	if (sys_is_app) {
		$dlg.parent().find(".cb_dlg_title").hide();
		this.cb_dlg_resize();
	}
	
	var This = this;
	$dlg.parent().find(".cb_dlg_title").find("#bnUserAdd")
		.on("click", function(){
			This.cb_dlg_in_show($dlg, "af");
		});
		
	this.cb_dlg_bnSel_init($dlg);
	this.cb_dlg_data_upd($dlg);
},
cb_dlg_openSelMenu: function()
{
	$("#se_chatbox .cb_dlg_title #bnSel").click();
},
// 視訊通話
cb_dlg_rtc_init: function($dlg)
{
/*	var This = this;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	var id_dlg = "cb_"+cid;
	var bShowTitle = recCB.type != DB_TYPE_FRIEND && (recCB.title||"") != "";
	
	if (false oWRTC.sys_available) {
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
*/
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
	
	var $dlgT = $dlg.parent().find(".cb_dlg_title");
	function doSetTitle(T, tip){
// console.log('cb_dlg_data_upd doSetTitle T=', T);
		if (tip) $dlgT.find(".ui-dialog-title").attr("title", tip).f_tooltip();
		if (T) {
			if (sys_is_app) {
				try {
					window.jsChat.setTitle(T);
				} catch(e){}
			}
			else
				$dlgT.find(".ui-dialog-title").html(T);
		}
	}
	// Arg
	if (!bTypeComm && (bUserAdmin || arg.friend_add)) {
		$dlgT.find("#bnUserAdd").show();
	} else {
		$dlgT.find("#bnUserAdd").hide();
	}
	// Title
	if (bShowTitle) {
		doSetTitle( B_HTMLEnCode(recCB.title, false) );
	}
	
	rs_con_acns2info2(recCB.allow, ["acn", "sun", "mail"], function(list){
		recCB['mbs_info'] = list;
		var suns = B_obj_getCols(list, "sun");
		var T = (bTypeFriend ? B_array_del(suns, This.m_arg.sun) : suns).join("、");
		var tip = suns.join("<br>");
		doSetTitle((!bShowTitle ? T : null), tip);
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
							'<div class="item_center item_msg item_read">'
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
// console.log('cb_dlg_in_show m=', m);
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
				This.cb_dlg_resize($dlg);
			});
		}
		else if (m == "et") {
			dlg.f_edit_title_show();
			$se.slideDown(function(){
				$se_et.find("input").focus();
				This.cb_dlg_resize($dlg);
			});
		}
		else {
			This.cb_dlg_resize($dlg);
		}
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
				//This.cb_msg_add($dlg);
				//return false;
			}
			else if (key == 27) {
			}
			else {
				This.cb_dlg_view_OnClick($dlg);
			}
		})
		.on('focus', function(e){
			$(this).css({minHeight:"34px"});
			doAdjustHeight($(this));
			This.cb_dlg_resize();
		})
		.on('blur', function(e){
			$(this).css({minHeight:"auto"});
			This.cb_dlg_resize();
		})
		.on('paste', function(e){
			doAdjustHeight($(this));
		})
	//
	$dlg.find(".cb_bottom_bar .cb_input #bnSend")
		.on("click", function(){
			This.cb_msg_add($dlg);
		});
	
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
cb_dlg_bnSel_init: function($dlg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	var bTypeFriend = recCB.type == DB_TYPE_FRIEND;
	var bTypeComm = recCB.type == DB_TYPE_COMM;
	var bUserOwner = This.m_arg.acn == recCB.owner
	var bUserAdmin = bUserOwner || (recCB.admin && recCB.admin.indexOf(This.m_arg.acn) > -1) ? true : false;
	var $bnSel = $dlg.parent().find(".cb_dlg_title #bnSel");
	var server_acn = This.m_arg.server_acn;
	$bnSel.on("click", function(){
		This.osel_bar_show("#se_sel_bar", true);
		
			var arg = recCB.arg||{};
			var friend_add = arg.friend_add != false;
			
			$se = $dlg.find("#se_sel_bar");
			$se.find(".btn").show();
			if (!bUserAdmin) {
				$se.find(".set, .edit_title").hide();
				
				if (!friend_add) {
					$se.find(".add_friend").hide();
				}
			}
			if (bTypeFriend)
				$se.find(".set, .edit_title, .edit_friend, .quit").hide();
			else if (bTypeComm)
				$se.find(".set, .add_friend, .edit_title, .quit").hide();
			
			
// Debug Server
			if (server_acn != "tw1f7" // 10.0.0.112 ookonweb
					&& server_acn != "tw21b" // green-cloud.green-computing.com
					&& server_acn != "WheeRegion"	// 10.0.0.120
					&& server_acn != "ookon_test001"	// 10.0.0.28
					) {
				
				$se.find(".video_bar").hide();
			}
		
	});
	$dlg.find("#se_sel_bar .btn").on("click", function(){
		This.osel_bar_show("#se_sel_bar", true);
		
		var rel = $(this).attr("rel");
// console.log('cb_dlg_bnSel_init se_sel_bar rel=', rel);
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
				
			case "callPhone":
				This.cb_rtc_do_call($dlg, "phone");
				break;
			case "callVideo":
				This.cb_rtc_do_call($dlg, "video");
				break;
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
				+'<div id="tabs-1">'
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
				+'<div id="tabs-2">'
					+'<ul id="members" class="cb_users"></ul>'
				+'</div>'
			+'</div>'
			+'<div class="main_bottom">'
				+'<a href="#" class="btn btn-success btn-xs" id="bnOK">儲存</a>&nbsp;&nbsp;&nbsp;'
				+'<a href="#" class="btn btn-default btn-xs" id="bnCancel">離開</a>'
			+'</div>'
		+'</div>'
// console.log('~~~ width=', min(400, $(window).width()));
	var $dlg = B_Dialog2({
		id: 		"cb_dlg_set"
		,Title:		"設定"
		,Content: 	h
		,autoOpen:	true
		,width: 	min(400, $(window).width())
		,height: 	400
		,modal: 	true
//		,position: {at:"right bottom"}
		,resize:	function($dlg){
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
		var u_thumb = rs_con_acn2thumbs(rec.acn);
		var $ti = $(
			'<li class="item">'
				+'<span class="user_icon img_square"><img src="'+u_thumb+'"></span>'
				+'<div class="content">'
					+'<div class="name">'
						+B_HTMLEnCode(rec.sun,false)
					+'</div>'
					+'<div class="info"></div>'
				+'</div>'
				+'<a id="bnMenu" href="#" class="btn btn-default btn-xs">'
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
cb_rtc_do_call: function($dlg, type)
{
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	var url = (sys_https ? "" : "https://"+location.hostname+":5702")
			+"/cb_rtc.html"
			+"?mode=call"
			+"&type="+type
			
			+"&cid="+cid
			+"&acn="+this.m_arg.acn
			+"&sun="+this.m_arg.sun
			+"&server_acn="+this.m_arg.server_acn
			+"&nu_code="+this.m_arg.nu_code
// console.log('~~~~~ url=', url);
	if (sys_is_mobile)
		open(url);
	else {
		var h_pos = ",left="+((screen.width-600)/2)+",top="+((screen.height-480)/2);
		var win = open(url, null, "scrollbars=no,width=600,height=480"+h_pos);
	}
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
// console.log('@@@ cb_dlg_view_OnClick ~~~~~~~~~~~~~~~~~~~~~');
	if (!$dlg || !$dlg.length) return;
	var This = this;
	var user_acn = this.m_arg.acn;
	var dlg = $dlg.get(0);
	var recCB = dlg.rec;
	var cid = recCB._id;
	var cnt_noview = !recCB.users || !recCB.users[user_acn] ? 0
				: (recCB.users[user_acn].cnt_noview||0);
// console.log('@@@ cb_dlg_view_OnClick recCB=', recCB);
// console.log('@@@ cb_dlg_view_OnClick cnt_noview='+cnt_noview+'/'+dlg.cnt_noview_update);
	if (cnt_noview == 0 || dlg.cnt_noview_update == true)
		return;
	
// console.log('@@@ cb_dlg_view_OnClick ~~~ Send cb_user_view ~~~~~~~~~~~~~~~~~~');
	this.api_getMsg({
		msg:{
			mode: "cb_user_view"
			,cid: cid
		}
		,return_mode: "cb_upd"
		,funcOK: function(data, err) {
// console.log('@@@ cb_dlg_view_OnClick ~~~ cb_user_view data=', data);
			
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
// console.log('cb_msg_add $dlg=', $dlg);
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
	if (sys_is_app)
	{
		$dlg.find(".cb_bottom_bar #bnAddFile input").remove();
		$dlg.find(".cb_bottom_bar #bnAddFile").on("click", function(){
			This.osel_bar_show("#se_upload_bar", true);
		});
		//
		$("#se_upload_bar .btn").on("click", function(){
			var rel = $(this).attr("rel");
			var arg = {
				cid: 	 recCB._id
				,fid:	 This.getUploadFileID()
				,nu_code:This.m_arg.nu_code
			}
			window.jsChat.onUpload(rel, JSON.stringify(arg));
		});
	}
	else
	{
		$dlg.find(".cb_bottom_bar #bnAddFile input").on('change', function(){
			
			var evt = arguments[0].originalEvent;
			if (!evt.target || !evt.target.files)
				return;
			
			var files = evt.target.files;
			for(var x = 0; files[x]; x++) {
				file = files[x];
				This.cb_upload_file_do_file($dlg, file);
			};
		});
	}
},
cb_upload_file_do_file: function($dlg, file, arg)
{
	var This = this;
	var recCB = $dlg.get(0).rec;
	var cid = recCB._id;
	var fid = this.getUploadFileID();
	// NUWebCS 檔案上傳
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
			,url: 	arg.url	// NUWebCS 檔案
		});
	}
	// PC 檔案上傳
	else
	{
		// 檔案限制在 300MB 以內
		if (file.size > 300000000) {
			B_Dialog({
				Title:	"錯誤"
				,Msg:	"檔案大小不可超過 300MB 以上"
				,OnCancel: false
			});
		}
		else {
			// 顯示上傳區塊
			this.cb_msg_item_append_UpFile($dlg, fid, file.name);
			//
	/*		var reader = new FileReader();
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
			reader.readAsBinaryString(file/*, "UTF-8");
	*/		
		
		
		
			this.cb_upload_file_do_file_f({
					nu_code:This.m_arg.nu_code
					,cid: 	cid
					,fid:	fid
					,fn: 	file.name
					,fs: 	file.size
					,mtime:	B_getCurrentTimeStr((file.lastModifiedDate ? file.lastModifiedDate : new Date(n)).getTime(), 1)
				}
				,file
				,function(res, err){
				}
			);
		}
	}
},
// arg => {nu_code, cid, fid, fn, fs, mtime}
cb_upload_file_do_file_f: function(arg, file, funcOK)
{
// console.log('@@@ cb_upload_file_do_file_f arg=', arg);
	function do_send(file, ufid) {
		if (ufid) arg.ufid = ufid;
		var data = new FormData();
		if (file) data.append("file", file);
		data.append("data", JSON.stringify(arg));
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4) {
// console.log('~~~~~~~~~~~~~~~ readyState=4 xhr=', xhr);
				var data, err;
				if (xhr.status == 200 && !B_CheckError_SendResult(xhr.responseText))
					data = xhr.responseText;
				else
					err = "Error: "+xhr.status+", "+xhr.responseText;
				if (funcOK) funcOK(data, err);
			};
		}
		xhr.upload.addEventListener("progress", function(ev) {
// console.log('~~~~~~~~~~~~~~~ progress ev=', ((ev.loaded/ev.total)*100).toFixed(1)+"%");
			// if (ev.lengthComputable) {
				// if (obj_arg.$proBar)
					// obj_arg.$proBar.width((ev.loaded/ev.total) *100 +"%");
			// }
		}, false);
		xhr.open(
			"POST",
			"/cb_upload_file"
		);
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(data);
	}
	
	// 大於 10MB 檔案
	if (file.size > UF_PART_UPLOAD_SIZE) {
		cb_upload_file_part({
			nu_code:arg.nu_code
			,path: 	arg.cid
			,mtime:	arg.mtime
			,fn: 	arg.fn
			,fs: 	arg.fs
			,file:	file
			,funcOK:function(ufid, err) {
			if (ufid)
				do_send(null, ufid);
			else
				alert(err);
			}
		})
	}
	else {
		do_send(file);
	}
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


// 加朋友進來
// arg => {mode, [fid(friend id)], cid, rec}
_cb_friend_add: function(arg)
{
	var $dlg = $(".cb_chatbox_dlg .cb_dlg");
	var recCB = $dlg.get(0).rec;
	if (recCB._id == arg.rec._id)
	{
		this._cb_upd(arg);
	}
	else
	{
		// recCB = arg.rec;
		// this._cb_upd(arg);
		// this.cb_msg_getList($dlg);
		// this.cb_dlg_resize($dlg);
		
		
		var recCB = arg.rec;
		var cid = recCB._id;
		var url = "/cb_chat.html"
					+"?nu_code="	+this.m_arg.nu_code
					+"&acn="		+this.m_arg.acn
					+"&sun="		+this.m_arg.sun
					+"&server_acn="	+this.m_arg.server_acn
					+"&cid="		+cid
					+"&pop=y"
		// var specs = "";
		// if (!sys_is_mobile) {
			// specs = "toolbar=no, scrollbars=no, width=420, height=500"
				// +",left="+((screen.width-420)/2)+",top="+((screen.height-500)/2)
		// }
		// open(url, null, specs);
		location.href = url;
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
		$ti_first = $dlg.find(".cb_main_zone .items > div:first");
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
		var $tiFirst = $se.find(" > div:first");
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
				//$ti = $se.find(".item, .item_msg").filter(":last");
				$ti = $se.find(" > div:last");
				if ($ti.length) {
					setTimeout(function(){
						$ti.get(0).scrollIntoView();
					},600);
				}
				// 標示已讀
				this.cb_dlg_data_read($dlg);
			}
			else {
				if ($tiFirst.length) {
					setTimeout(function(){
						$tiFirst.get(0).scrollIntoView(true);
					},600);
				}
			}
		}
		else {
			this.cb_bNext = false;
		}
		
	} while(false);
	this.cb_bLoad = false;
	
	this.cb_dlg_resize();
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
	//var $ti_last = (pos == 0 ? $se.find(".item:last") : $se.find(".item:first")).not(".item_upload");
	var $ti_last;
	if (pos == 0) {
		$ti_last = $se.find("> div:last");
		while($ti_last.length && !$ti_last.get(0).rec)
			$ti_last.prev();
	}
	else {
		$ti_last = $se.find("> div:first");
		while($ti_last.length && !$ti_last.get(0).rec)
			$ti_last.next();
	}
	
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
			'<div class="item_center item_time">'
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
			'<div class="item_center item_msg">'
				+'<div class="f2">'
					+'<div class="time">'+B_con_rectime2html(rec.time,4)+'</div>'
				+'</div>'
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
	var u_thumb = rs_con_acn2thumbs(rec.owner);
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
// console.log('~~~ 顥示 - 已讀 recCB=', recCB);
	if (bMy && recCB && recCB.type == DB_TYPE_FRIEND) {
		try {
			var friend_acn = recCB.friends[0];
			var friend_info = recCB.users[friend_acn];
			var t = friend_info.tLast;
			if (t && t.length && t >= rec.time) {
// console.log('~~~ 顥示 - 已讀 ~~~~~~~~~~~~~');
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



osel_bar_show: function(sid, b)
{
	var This = this;
	var $t = $(sid);
	var bHide = $t.is(":hidden");
	if (b) {
		if (bHide) {
			$t.slideDown();
			
			setTimeout(function(){
				$(document).one("click", function(){
					This.osel_bar_show(sid, false);
				});
			},1);
		}
	}
	else {
		if (!bHide)
			$t.slideUp();
	}
},



send_arg: function(arg)
{
// console.log('send_arg arg=', arg);
	oWS.send_arg(arg);
},
api_getMsg: function(arg)
{
// console.log('api_getMsg arg=', arg);
	oWS.api_getMsg(arg);
}

}
var oWC = new OBJ_WebChat();
