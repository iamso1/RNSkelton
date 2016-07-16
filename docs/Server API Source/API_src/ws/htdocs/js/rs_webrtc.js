//
// the below code is a copy of the standard polyfill adapter.js
//
var getUserMedia = null;
var webrtcDetectedBrowser = null;
var webrtcDetectedVersion = null;
if (navigator.mozGetUserMedia) {
	
    webrtcDetectedBrowser = "firefox";
    var matches = navigator.userAgent.match(/\srv:([0-9]+)\./);
    if (matches !== null && matches.length > 1) {
        webrtcDetectedVersion = parseInt(matches[1]);
    }
    window.RTCPeerConnection = mozRTCPeerConnection;
    window.RTCSessionDescription = mozRTCSessionDescription;
    window.RTCIceCandidate = mozRTCIceCandidate;
    window.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    if (webrtcDetectedVersion < 23) {
        MediaStream.prototype.getVideoTracks = function() {
            return [];
        };
        MediaStream.prototype.getAudioTracks = function() {
            return [];
        };
    }
} else if (navigator.webkitGetUserMedia) {

    webrtcDetectedBrowser = "chrome";
	try {
		webrtcDetectedVersion =
				parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
	} catch(e){}
    window.RTCPeerConnection = webkitRTCPeerConnection;
    window.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };
    }
} else {
    console.log("Browser does not appear to be WebRTC-capable");
}



var sys_is_mobile = B_is_mobile();
var sys_is_firefox = webrtcDetectedBrowser == "firefox";
var sys_upload_file_id = 0;

// Android App
var sys_is_app = sys_is_app || typeof window.jsChat == "object";

var HOST_NUNotice = HOST_NUNotice||(sys_https ? "nuweb.ddns.net:5702" : "nuweb.ddns.net:5701");
var HOST_RTC = "nuweb.ddns.net:5701";
var HOST_RTCs = "nuweb.ddns.net:5702";
var API_NUNotice = sys_url_ptc+HOST_NUNotice+"/nunotice";

// Debug
if (location.href.indexOf("10.0.0.120") > -1 || location.href.indexOf("10.0.0.28") > -1) {
	HOST_RTC = "10.0.0.120:5701";
	HOST_RTCs = "10.0.0.120:5702";
}


//////////////////////////////////////////////////////////////////////
function OBJ_WebRTC()
{
	//var url = "https://www.webrtc-experiment.com/RecordRTC.js";
	var url = sys_url_ptc+HOST_NUNotice+"/js/RecordRTC.js";
	if (!B_LinkIsExists(url))
		$('head').append('<script type="text/javascript" src="'+url+'" />');
	
	this.configuration = {
		"iceServers":[
			{url: "stun:stun.l.google.com:19302"},
			{url: "stun:stun.sipgate.net"},
			{url: "stun:217.10.68.152"},
			{url: "stun:stun.sipgate.net:10000"},
			{url: "stun:217.10.68.152:10000"}
		]
	};
	
	this.m_arg = null;
	this.$dlg = null;
	this.bPopup = false;
	this.sys_available = false; // 是否可使用
	this.sys_available_msg = "";
	this.sys_chrome = false;
	this.timeid_selfView = null;
	// 
	this.err = null;
	this.mode = null;
	this.peerConns = {};
	this.recCB = null;
	this.cid = null;
	this.type = null;
	this.allow = null;
	this.call_acn = null;
	this.player = null;
	this.bStopVideo = true;
	this.bStopAudio = true;
	this.localStream = null;
	this.localStream_2 = null;
	this.localStream_a = null;
	
	this._desiredVideoProperties = {};
	this._desiredVideoProperties.screenCapture = false;
	
	this._records = {};
	
}
OBJ_WebRTC.prototype = {

getUploadFileID: function()
{
	return "rtc-"+(++sys_upload_file_id);
},
// arg => {dlg, bPopup, onClose}
init: function(arg)
{
	this.m_arg = arg;
	var $dlg = arg && arg.dlg ? arg.dlg : null;
	if (arg && arg.bPopup) this.bPopup = arg.bPopup;

	if (webrtcDetectedBrowser == "chrome") {
		this.sys_chrome = true;
		if (location.protocol == "https:")
			this.sys_available = true;
		else {
			this.sys_available = true;
			//this.sys_available_msg = "Chrome 瀏覽器在 Http:// 下不支援 視訊通話，請改用 Https://";
		}
		
	} else if (webrtcDetectedBrowser == "firefox") {
		this.sys_chrome = false;
		this.sys_available = true;
	} else {
		this.sys_chrome = false;
		this.sys_available_msg = "瀏覽器不支援 視訊通話";
	}
	
	var h = 
		'<div class="se_webrtc scrollbar">'
			+'<div class="se_callin">'
				+'<div class="user_icon img_square"><img></div>'
				+'<div class="name"></div>'
				+'<div>視訊通話來電中...</div>'
			+'</div>'
			+'<div id="se_rtc_talk" class="se_talk scrollbar">'
				+'<div class="item">'
					+'<div class="user_icon img_square"><img></div>'
					+'<div class="name"></div>'
				+'</div>'
				+'<div class="item">'
					+'<div class="user_icon img_square"><img></div>'
					+'<div class="name"></div>'
				+'</div>'
				+'<video class="item" id="remoteView" autoplay></video>'
				+'<video id="selfView" autoplay muted></video>'
				+'<div class="se_status">'
					+'<span class="msg">視訊通話正在撥出中...</span>'
				+'</div>'
			+'</div>'
			
			+'<div class="callin bottom_bar">'
				+'<a href="#" id="bnAccept" class="btn btn-success btn-xs" >'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-phone fa-stack-1x"></i>'
					+'</span>'
				+'</a>'
				+'<a href="#" id="bnDeny" class="btn btn-danger btn-xs" >'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-phone fa-rotate-135 fa-stack-1x"></i>'
					+'</span>'
				+'</a>'
			+'</div>'
			+'<div class="talk bottom_bar">'
				+'<a href="#" id="bnMuteVideo" class="btn btn-info btn-xs" >'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-video-camera fa-stack-1x"></i>'
						+'<i class="fa fa-ban fa-stack-2x text-danger"></i>'
					+'</span>'
				+'</a>'
				+'<a href="#" id="bnMuteAudio" class="btn btn-info btn-xs" >'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-microphone fa-stack-1x"></i>'
						+'<i class="fa fa-ban fa-stack-2x text-danger"></i>'
					+'</span>'
				+'</a>'
				+'<a href="#" id="bnOpt" class="btn btn-info btn-xs">'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-ellipsis-h fa-stack-1x"></i>'
						+'<i class="fa fa-ban fa-stack-2x text-danger"></i>'
					+'</span>'
				+'</a>'
				+'<a href="#" id="bnClose" class="btn btn-danger btn-xs" >'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-phone fa-rotate-135 fa-stack-1x"></i>'
					+'</span>'
				+'</a>'
				+'<a href="#" id="bnRecord" class="btn btn-default btn-xs float-right" title="視訊記錄">'
					+'<span class="fa-stack fa-lg">'
						+'<i class="fa fa-circle fa-stack-1x"></i>'
					+'</span>'
				+'</a>'
			+'</div>'
			+'<a href="#" id="bnFullscreen" class="btn btn-default btn-xs" title="全螢幕">'
				+'<span class="fa-stack fa-lg">'
					+'<i class="fa fa-expand fa-stack-1x"></i>'
				+'</span>'
			+'</a>'
		+'</div>'
	var This = this;
	if ($dlg)
	{
		$dlg.html(h);
	}
	else
	{
		$dlg = B_Dialog2({
			id: 		"webrtc_dlg"
			,Title:		"視訊通話"
			,Content: 	h
			,autoOpen:	false
			,width: 	460
			,height: 	400
			,modal: 	false
			,resizable:	true
			,position: {at:"right bottom"}
			,resize:	function($dlg){
				return false;
			}
			,open: function(e, tc){
				var $dlg2 = $(tc);
				$dlg2.parent().css({position:"fixed"});
				$dlg2.get(0).arg.resize();
				
				
				var $win = $(window);
				var w_win = $win.width();
				var h_win = $win.height();
				var $dlgZ = $dlg2.parent();
				$dlgZ.css({
					top: (h_win-$dlgZ.height())/2
					,left: (w_win-$dlgZ.width())/2
				});
			}
			,close: function(){
				return false;
			}
			,hide: function(){
				return false;
			}
		});
		$dlg.prev().find(".ui-dialog-titlebar-close").remove(); // 拿掉關閉按鈕
	}
	this.$dlg = $dlg;
	$dlg.find("[title]").f_tooltip();
	
// 來電中...
	// 接受
	$dlg.find(".callin.bottom_bar #bnAccept").on("click", function(){
		// Android App
		if (sys_is_app) {
			var url = (sys_is_firefox 
						? "https://"+HOST_RTCs+"/cb_rtc.html"
						: "https://"+HOST_RTCs+"/cb_rtc.html")
					+"?mode="+"accept"
					+"&type="+This.type
					
					+"&cid="		+This.cid
					+"&acn="		+oWS.m_arg.acn
					+"&sun="		+oWS.m_arg.sun
					+"&server_acn="	+oWS.m_arg.server_acn
					+"&nu_code="	+oWS.m_arg.nu_code
			window.jsChat.rtcAccept(url);
		}
		else {
			This.do_accept();
		}
		return false;
	});
	// 拒絕
	$dlg.find(".callin.bottom_bar #bnDeny").on("click", function(){
		This.do_deny();
		return false;
	});
// 撥出中... / 通話中...
	// 停用影像
	$dlg.find(".talk.bottom_bar #bnMuteVideo").on("click", function(){
		This.bnStopVideo(!This.bStopVideo);
		return false;
	});
	// 靜音
	$dlg.find(".talk.bottom_bar #bnMuteAudio").on("click", function(){
		This.bnStopAudio(!This.bStopAudio);
		return false;
	});
	// 關閉
	$dlg.find(".talk.bottom_bar #bnClose").on("click", function(){
		oWS.send_arg({
			mode: 	"cb_rtc_call"
			,act:	(This.mode == "talk" ? "talk_close" : "call_close")
			,cid: 	This.cid
		});
		This.setMode("close");
		return false;
	});
	// 錄影
	if (sys_is_firefox) {
		$dlg.find(".talk.bottom_bar #bnRecord").on("click", function(){
			This.do_record(!This.is_record());
			return false;
		});
	}
	else {
		$dlg.find(".talk.bottom_bar #bnRecord")
			.attr("data-original-title", "記錄功能目前只支援 Firefox，請改用 Firefox")
	}
	// 全螢幕
	This.bFullscreen = false;
	$dlg.find("#bnFullscreen").on("click", function(){
		This.bnFullscreen(!This.bFullscreen);
		return false;
	});
// 選項
	this.bnOpt_init();
	
//	
	oWS.msg_mode_set("cb_rtc_call", function(arg){
		This._do_call(arg);
	});
	oWS.msg_mode_set("cb_rtc_candidate", function(arg){
		This._cb_rtc_candidate(arg);
	});
	oWS.msg_mode_set("cb_rtc_sdp", function(arg){
		This._cb_rtc_sdp(arg);
	});
	
},
getUserIcon: function(acn)
{
	return URL_USER_ICON+acn+"&server_acn="+oWS.m_arg.server_acn;
},
// sourceType => [video / audio]
getSourceList: function(sourceType, funcOK)
{
	if (window.MediaStreamTrack && MediaStreamTrack.getSources) {
		try {
			MediaStreamTrack.getSources(function(sources) {
				var results = [];
				for (var i = 0; i < sources.length; i++) {
					var source = sources[i];
					if (source.kind == sourceType) {
						results.push(source);
					}
				}
				funcOK(results);
			});
		}
		catch(e){
			funcOK([]);
		}
	}
	else {
		funcOK([]);
	}
},
getLocalStream: function(funcOK)
{
	var This = this;
	if (this.localStream)
		do_ok();
	else if (this._desiredVideoProperties.screenCapture && !this._presetMediaConstraints) {
		this.screenCapture_getConstraints(function(bOK, err){
			if (This._presetMediaConstraints)
				This.getLocalStream(funcOK);
			else {
				if (funcOK) funcOK(null, err);
			}
		})
	}
	else {
		var opt = this.getUserMediaConstraints();
		getUserMedia(opt, function(stream) {
			This.localStream = stream;
			do_ok();
		}, function(error){
			if (funcOK) funcOK(null, error);
		});
	}
	function do_ok(){
		var $selfView = This.$dlg.find("#selfView");
		$selfView.get(0).src = URL.createObjectURL(This.localStream );
		if (funcOK) funcOK(This.localStream);
	}
},
getLocalStream_a: function(funcOK)
{
	var This = this;
	if (this.localStream_a)
		funcOK(this.localStream_a)
	else {
		//var $selfView = this.$dlg.find("#selfView");
		//var opt = this.getUserMediaConstraints();
		var opt = {video:false, audio:true};
		getUserMedia(opt, function (stream) {
			This.localStream_a = stream;
			//$selfView.get(0).src = URL.createObjectURL(stream);
			if (funcOK) funcOK(stream);
		}, function(error){
			if (funcOK) funcOK(null, error);
		});
	}
},
screenCapture_init: function()
{
	window.rtc_ds_iframe = document.createElement('iframe');
    var iframeUrl =  'https://www.webrtc-experiment.com/getSourceId/';
    var iframe = window.rtc_ds_iframe;
    iframe.onload = function() {
		iframe.isLoaded = true;
    };
    iframe.src = iframeUrl;
    iframe.style.display = 'none';
    (document.body || document.documentElement).appendChild(iframe);
},
screenCapture_postMessage: function()
{
	if (!window.rtc_ds_iframe)
		this.screenCapture_init();
	var This = this;
	var iframe = window.rtc_ds_iframe;
	if (!iframe.isLoaded) {
		setTimeout(function(){
			This.screenCapture_postMessage();
		},100);
		return;
	}
	iframe.contentWindow.postMessage({
		captureSourceId: true
	}, '*');
},
screenCapture_getConstraints: function(funcOK, bMsg)
{
	var This = this;
	if (sys_is_firefox) {
		This._presetMediaConstraints = {
			video: {
				mozMediaSource: 'window',
				mediaSource: 'window',
				maxWidth: 1920,
				maxHeight: 1080,
				minAspectRatio: 1.77
			},
			audio: true
		};
		
// console.log('~~~ This._presetMediaConstraints=', This._presetMediaConstraints);
		getUserMedia(This._presetMediaConstraints, function (stream) {
// console.log('~~~ getUserMedia stream=', stream);
			This.localStream_2 = stream;
			if (funcOK) funcOK(true);
		}, function(error){
// console.log('~~~ getUserMedia error=', error);
			if (funcOK) funcOK(null, "Error:"+error.message);
			
			// The operation is insecure.
			if (bMsg) {
				var buttons = {
					"前往安裝": function(){
						$(this).dialog('close');
						//
						InstallTrigger.install({
							'Foo': {
								// URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
								URL: 'https://addons.mozilla.org/firefox/downloads/file/355418/enable_screen_capturing_in_firefox-1.0.006-fx.xpi?src=cb-dl-hotness',
								toString: function() {
// console.log('~~~ URL=', this.URL);
									return this.URL;
								}
							}
						});
					}
				}
				B_Dialog({
					Title:"視訊通話"
					,Msg:"桌面分享須要安裝擴充套件，才能捕捉到桌面"
					,buttons:buttons
					,OnOK: false
				});
			}
		})
		return;
	}

	this.screenCapture_postMessage();
	
	var cb = function(event) {
		if (!event.data) return;

		if (event.data.chromeMediaSourceId) {
			window.removeEventListener("message", cb);
			if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
				funcOK(null, 'MEDIA_ERR: permission-denied');
			} else {
				This._presetMediaConstraints = {
					video: {
						mandatory: {
							chromeMediaSource:'desktop',
							chromeMediaSourceId: event.data.chromeMediaSourceId,
							maxWidth: 1920,
							maxHeight: 1080,
							minAspectRatio: 1.77
						}
					},
					audio: false
				}
				//if (funcOK) This.getUserStream(funcOK);
				if (funcOK) funcOK(true);
			}
		}
		if (event.data.chromeExtensionStatus) {
			console.log("extension status is ", event.data.chromeExtensionStatus);
			if (funcOK) funcOK(null, 'MEDIA_ERR: '+event.data.chromeExtensionStatus);
			
			if (bMsg) {
				// 沒有安裝
				if (event.data.chromeExtensionStatus.indexOf("not-installed") > -1){
					var url = "https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk";
					var buttons = {
						"前往安裝": function(){
							$(this).dialog('close');
							open(url);
						}
					}
					B_Dialog({
						Title:"視訊通話"
						,Msg:"桌面分享須要安裝 Screen Capturing 擴充功能，才能捕捉到桌面"
						,buttons:buttons
						,OnOK: false
					});
				}
				// 沒有啟動
				if (event.data.chromeExtensionStatus.indexOf("installed-disabled") > -1){
					var url = "chrome://extensions/"
					var buttons = {
						"前往啟動": function(){
							$(this).dialog('close');
							open(url);
						}
					}
					B_Dialog({
						Title:"視訊通話"
						,Msg:"桌面分享須要啟動 Screen Capturing 擴充功能"
						,buttons:buttons
						,OnOK: false
					});
				}
			}
		}
	};
	window.addEventListener('message', cb);
},
bnStopVideo: function(b)
{
	if (!this.localStream) return;
	this.bStopVideo = b;
	var tracks = this.localStream.getVideoTracks();
	if (tracks[0]) {
		tracks[0].enabled = !b;
	}
	if (b)
		this.$dlg.find(".talk.bottom_bar #bnMuteVideo .fa-ban").show();
	else
		this.$dlg.find(".talk.bottom_bar #bnMuteVideo .fa-ban").hide();
},
bnStopAudio: function(b)
{
	if (!this.localStream) return;
	this.bStopAudio = b;
	var tracks = this.localStream.getAudioTracks();
	if (tracks[0]) {
		tracks[0].enabled = !b;
	}
	if (b)
		this.$dlg.find(".talk.bottom_bar #bnMuteAudio .fa-ban").show();
	else
		this.$dlg.find(".talk.bottom_bar #bnMuteAudio .fa-ban").hide();
},
bnFullscreen: function(b)
{
	this.bFullscreen = b;
	if (b) {
		B_goFullscreen("se_rtc_talk");
		this.$dlg.find("#bnFullscreen i.fa")
			.removeClass("fa-expand")
			.addClass("fa-compress");
			
		$("#rtc_opt_menu").appendTo(this.$dlg.find(".se_talk"));
	} else {
		B_cancelFullscreen(document);
		this.$dlg.find("#bnFullscreen i.fa")
			.removeClass("fa-compress")
			.addClass("fa-expand");
		
		$("#rtc_opt_menu").appendTo($("body"));
	}
},
bnOpt_init: function()
{
	var This = this;
	var $dlg = this.$dlg;
	var $menuOpt = $(
		'<ul id="rtc_opt_menu">'
			+'<li><a href="#">影像來源</a>'
				+'<ul class="rom_src_items"></ul>'
			+'</li>'
		+'</ul>'
	).appendTo($("body")).hide();
	$menuOpt.on("click", function(){
		return false;
	})
	//
	function opt_items_reset(list){
		var $se = $menuOpt.find(".rom_src_items");
		for (var x=0; x<list.length; x++) {
			var info = list[x]; // SourceInfo{facing, id, kind, label}
			var $ti = $(
				'<li><a href="#" d_id="'+info.id+'">'
					+'<span class="menu-icon ui-icon"></span>'
					+info.label
				+'</a></li>')
					.appendTo($se);
			$ti.get(0).info = info;
		}
		
		$menuOpt.menu();
		// Source Onclick
		$menuOpt.find(".rom_src_items a")
			.on("click", function(){
				$menuOpt.hide();
				var info = $(this).parent().get(0).info;
				var bScreenCapture = info.id == "screenCapture";
				if (bScreenCapture && !This._desiredVideoProperties.screenCapture) {
					This.screenCapture_getConstraints(function(bOK, err){
// console.log('~~~ screenCapture_getConstraints result=', bOK, err);
						if (bOK) {
							This._desiredVideoProperties.screenCapture = true;
							This.do_source_chage();
						} else {
							if (err) B_Message(err);
						}
					}, true)
				}
				else if (info.id != This._desiredVideoProperties.videoSrcId 
					|| This._desiredVideoProperties.screenCapture) {
					This._desiredVideoProperties.screenCapture = false;
					This._desiredVideoProperties.videoSrcId = info.id;
					This.do_source_chage();
				}
				return false;
			});
	}
	//
	if (sys_is_firefox) {
		var list = [];
		list.push({
			id: "camera"
			,kind: "video"
			,label: "攝影機"
		})
		list.push({
			id: "screenCapture"
			,kind: "video"
			,label: "桌面分享"
		})
		//
		opt_items_reset(list);
	}
	else {
		this.getSourceList("video", function(list){
			var list = list||[];
			// 增加 "桌面分享" 項目
			if (!sys_is_mobile) {
				list.push({
					id: "screenCapture"
					,kind: "video"
					,label: "桌面分享"
				})
			}
			// 第一個裝置設為預設值
			if (list.length && list[0].id) 
				This._desiredVideoProperties.videoSrcId = list[0].id;
			//
			opt_items_reset(list);
		});
	}
	//
	$dlg.find(".talk.bottom_bar #bnOpt").on("click", function(){
		$menuOpt
			.show()
			.position({
				my: "center bottom",
				at: "center top-4",
				of: this
			});
		
		var id;
		if (sys_is_firefox)
			id = This._desiredVideoProperties.screenCapture ? "screenCapture" : "camera";
		else
			id = This._desiredVideoProperties.screenCapture ? "screenCapture" : This._desiredVideoProperties.videoSrcId;
		$menuOpt.find(".rom_src_items .menu-icon.menu-icon-sel").removeClass("menu-icon-sel");
		if (id) $menuOpt.find(".rom_src_items a[d_id="+id+"] .menu-icon").addClass("menu-icon-sel");
		
		$(document).one("click", function(){
			$menuOpt.hide();
		});
		return false;
	});
},
getUserMediaConstraints: function()
{
	var constraints = {};
	if (this._presetMediaConstraints) {
		constraints = this._presetMediaConstraints;
		delete this._presetMediaConstraints;
		return constraints;
	}
	else if (this.type != "video") {
		constraints.video = false;
	}
	else {
		constraints.video = {mandatory: {}, optional: []};
		if (this._desiredVideoProperties.width) {
			constraints.video.mandatory.maxWidth = this._desiredVideoProperties.width;
			//constraints.video.mandatory.minWidth = this._desiredVideoProperties.width;
		}
		if (this._desiredVideoProperties.height) {
			constraints.video.mandatory.maxHeight = this._desiredVideoProperties.height;
			//constraints.video.mandatory.minHeight = this._desiredVideoProperties.height;
		}
		if (this._desiredVideoProperties.frameRate) {
			constraints.video.mandatory.maxFrameRate = this._desiredVideoProperties.frameRate;
		}
		if (this._desiredVideoProperties.videoSrcId) {
			constraints.video.optional.push({sourceId: this._desiredVideoProperties.videoSrcId});
		}
		// hack for opera
		if (B_getLength(constraints.video.mandatory) === 0 && B_getLength(constraints.video.optional) === 0) {
			constraints.video = true;
		}
	}
	constraints.audio = true;
	return constraints;
},


// arg => {mode, act, acn, cid, type, rec, allow, call_acn, talk_list}
// act -> [call, talk(連線), busy(忙), accept(接收), deny(拒絕), call_close, talk_close]
_do_call: function(arg)
{
console.log('rtc::_do_call mode='+arg.mode+', act='+arg.act);
	var This = this;
	this.err = null;
	if (arg.error)
	{
		if (window.B_Message)
			window.B_Message(arg.error);
		
		this.setMode("close");
	}
	else if (arg.act == "call")
	{
		// My Call
		if (arg.call_acn == oWS.m_arg.acn) {
			if (!this.cid)
				return; // 不是這裡 call
			
			this.allow = arg.allow;
			this.call_acn = arg.call_acn;
			this.do_talk_items_reload();
		}
		// 忙線中...
		else if (this.cid) {
			oWS.send_arg({
				mode: 	"cb_rtc_call"
				,act:	"busy"
				,cid: 	arg.cid
				,type: 	arg.type
			});
		}
		// Call In
		else {
			this.do_callin(arg);
		}
	}
	else if (arg.act == "callin")
	{
		this.do_callin(arg);
	}
	else if (arg.act == "talk")
	{
		if (arg.talk_list && arg.talk_list.length) {
			for (var x=0; x<arg.talk_list.length; x++)
				this.do_talk(arg.talk_list[x], "video");
		}
	}
	else if (arg.act == "acn_close")
	{
		if (this.mode == "call") {
			if (arg.allow && arg.allow.length <= 1)
				this.setMode("close"); // 剩下一人，結束
			else 
				this.allow = arg.allow;
		}
		else
			this.do_talk_item_del(arg.acn);
	}
	else if (arg.act == "acn_stop")
	{
		this.do_talk_item_stop(arg.acn);
	}
	else if (arg.act == "call_close")
	{
		if (arg.msg && arg.msg != "")
			this.err = arg.msg;
		this.setMode("close");
	}
	else if (arg.act == "talk_close")
	{
		this.setMode("close");
	}
},
do_call_test: function(recCB, type)
{
	this.type = "video";
	this.setMode("talk");
},
do_call: function(recCB, type)
{
	// Chorme 不在 Https:// 改用 Popup Window
	if (!this.bPopup || this.sys_chrome && location.protocol != "https:")
	{
		this.do_popup("call", type, recCB._id);
		return;
	}



	this.recCB = recCB;
	this.cid = recCB._id;
	this.type = type;
	this.bStopVideo = true;
	this.bStopAudio = true;
	
	var This = this;
	this.setMode("call");
	this.getLocalStream(function(localStream, error){
	
		if (localStream) {
			oWS.send_arg({
				mode: 	"cb_rtc_call"
				,act:	"call"
				,cid: 	This.cid
				,type: 	This.type
				,mbs_info: recCB.mbs_info
			});
		}
		else {
			if (!error) error = "Error: 無法取得"+(type=="video"?"視訊":"通訊")+"裝置";
			B_Message(error);
			This.err = error;
			This.setMode("close");
		}
	});
},
do_call_callin: function(cid, type)
{
	oWS.send_arg({
		mode: 	"cb_rtc_call"
		,act:	"callin"
		,cid: 	cid
	});
},
do_callin: function(arg)
{
	var This = this;
	this.cid = arg.cid;
	this.recCB = oWS.cb_dlg_rec_init(arg.rec);
	this.type = arg.type;
	this.allow = arg.allow;
	this.call_acn = arg.call_acn;
	this.setMode("callin");

	// Android App
	if (sys_is_app)
	{
	}
	else
	{
		if (!(this.sys_chrome && location.protocol != "https:")) {
			this.getLocalStream(function(localStream, error){
				if (!localStream) {
					B_Dialog({
						Title:"視訊通話"
						,Msg:"無法啟動視訊"
						,OnCancel: false
						,OnOK: function(){
						}
						,OnClose: function(){
							oWS.send_arg({
								mode: 	"cb_rtc_call"
								,act:	"fail"
								,cid: 	arg.cid
							});
							This.setMode("close");
						}
					});
				}
			});
		}
	}
},
// name => [video / audio]
do_talk: function(acn, name)
{
	var This = this;
	var $dlg = this.$dlg;
	
	if (this.mode != "talk") {
		this.setMode("talk");
		this.do_talk_items_reload();
	}
	
	if (this.peerConns[acn] && this.peerConns[acn][name]) {
// console.log('~~~ rtc::do_talk 已經在通話中 acn=', acn, name);
		return; // 已經在通話中...
	}
	
	var stream = name == "video" ? This.localStream : (This.localStream_a||This.localStream);
	var pc = new RTCPeerConnection(this.configuration);
	if (!this.peerConns[acn]) this.peerConns[acn] = {};
	this.peerConns[acn][name] = pc;
	pc.acn = acn;
	pc.name = name;
	pc.candidate_list = [];
	pc.flushCachedCandidates = function(){
		if (pc.candidate_list) {
			var list = pc.candidate_list;
			pc.candidate_list = null;
			for (var x=0; x<list.length; x++)
				pc.processCandidateBody(list[x]);
		}
	}
	pc.processCandidateBody = function(cdd){
		var candidate = null;
		if (window.mozRTCIceCandidate) {
			candidate = new mozRTCIceCandidate({
				sdpMLineIndex: cdd.sdpMLineIndex,
				candidate: cdd.candidate
			});
		}
		else {
			candidate = new RTCIceCandidate({
				sdpMLineIndex: cdd.sdpMLineIndex,
				candidate: cdd.candidate
			});
		}
		pc.addIceCandidate(candidate);
	}
	pc.addStream(stream);
	// 當有任何 ICE candidates 可用時，
	// 透過 signalingChannel 將 candidate 傳送給對方
	pc.onicecandidate = function (evt) {
		if (evt.candidate) {
			oWS.send_arg({
				mode: "cb_rtc_candidate"
				,cid: This.cid
				,acn: acn
				,name: name
				,candidate: evt.candidate
			});
		}
	};
	// let the "negotiationneeded" event trigger offer generation
	pc.onnegotiationneeded = function () {
		pc.createOffer(function(desc){
			This.pc_localDescCreated(pc, desc);
		}, logError);
	}
	// once remote stream arrives, show it in the remote video element
	pc.onaddstream = function (evt) {
		This.do_talk_item_2video(pc, evt.stream);
	};
	return pc;
},
do_source_chage: function()
{
	oWS.send_arg({
		mode: 	"cb_rtc_call"
		,act:	"acn_stop"
		,cid: 	this.cid
	});
	//
	var talk_list = [];
	for (var acn in this.peerConns) {
		talk_list.push(acn);
		this.do_talk_item_stop(acn);
	}
	if (this.localStream) {
		this.pc_stopStream(this.localStream);
		this.localStream = null;
	}
	if (this.localStream_a) {
		this.pc_stopStream(this.localStream_a);
		this.localStream_a = null;
	}
	// 重新連線
	var This = this;
	this.getLocalStream(function(localStream, error){
		for (var x=0; x<talk_list.length; x++)
			This.do_talk(talk_list[x], "video");
	});
	// 桌面分享須要增加 audio
	if (this._desiredVideoProperties.screenCapture) {
		this.getLocalStream_a(function(localStream, error){
			for (var x=0; x<talk_list.length; x++)
				This.do_talk(talk_list[x], "audio");
		});
	}
},
is_record: function()
{
	return this.$dlg.find(".se_talk #bnRecord").is(".color-red");
},
do_record: function(b, funcOK)
{
// console.log('~~~ do_record b=', b);
	var This = this;
	var records = this._records;
	var $dlg = this.$dlg;
	var $bnt = $dlg.find(".se_talk #bnRecord");
	var time = new Date().getTime();
	if (b)
	{
		$bnt.addClass("color-red");
		if (this._records.b != true) {
			records.b = true;
			records.time = time;
			records.users = {};
			do_add(oWS.m_arg.acn, this.localStream);
			for (var acn in this.peerConns)
				do_add(acn, this.peerConns[acn]["video"].stream);
		}
	}
	else
	{
		$bnt.removeClass("color-red");
		do_stop(function(){
// console.log('~~~ do_record do_stop @@@@@@ records=', records);

			records.timeTotal = time - records.time;
			records.bFirefox = sys_is_firefox;
			records.fid = This.getUploadFileID();
			records.cid = This.cid;
			records.type = This.type;
			records.nu_code = oWS.m_arg.nu_code;
			do_upload(records, function(res, err) {
				
// console.log('~~~ do_record xhr @@@@@@ res=', res);
// console.log('~~~ do_record xhr @@@@@@ err=', err);
				this._records = {};
				
			});
		});
	}
	
	function do_add(acn, stream){
// console.log('~~~ do_record do_add acn=', acn, stream);
		var recordAudio, recordVideo;
		var bDisableLogs = true; 
		
		records.users[acn] = {};
		records.users[acn]['time'] = time - records.time;
		
		if (This.type == "phone") {
			recordAudio = RecordRTC(stream, {
				//type: 'audio'
				//,mimeType: 'video/webm'
				bufferSize: 16384
				,sampleRate: 44100
				,disableLogs: bDisableLogs
			});
		}
		else {
			if (sys_is_firefox) {
				recordVideo = RecordRTC(stream, {
					bufferSize: 16384
					,sampleRate: 44100
					,disableLogs: bDisableLogs
					,canvas: {
						width: 1280
						,height: 720
					}
				});
			}
			else {
				recordAudio = RecordRTC(stream, {
					type: 'audio'
					,bufferSize: 16384
					,sampleRate: 44100
					,disableLogs: bDisableLogs
				});
				recordVideo = RecordRTC(stream, {
					type: 'video'
					,disableLogs: bDisableLogs
					,canvas: {
						width: 1280
						,height: 720
					}
				});
			}
		}
		
		if (recordVideo && recordAudio) {
			try {
				recordVideo.initRecorder(function() {
					try {
						recordAudio.initRecorder(function() {
							recordAudio.startRecording();
							recordVideo.startRecording();
							records.users[acn]['audio'] = recordAudio;
							records.users[acn]['video'] = recordVideo;
						});
					} catch(e) {
						recordVideo.startRecording();
						records.users[acn]['video'] = recordVideo;
					}
				});
			} catch(e) {
				try {
					recordAudio.startRecording();
					records.users[acn]['audio'] = recordAudio;
				} catch(e){}
			}
		}
		else {
			if (recordAudio) {
// console.log('~~~ do_record do_add recordAudio ~~~ acn=', acn);
				try {
					recordAudio.startRecording();
					records.users[acn]['audio'] = recordAudio;
// console.log('~~~ do_record do_add recordAudio ~~~ startRecording acn=', acn);
				} catch(e){
// console.log('~~~ do_record do_add recordAudio ~~~ startRecording e=', acn, e);
				}
			}
			if (recordVideo) {
				try {
					recordVideo.startRecording();
					records.users[acn]['video'] = recordVideo;
				} catch(e){}
			}
		}
// console.log('~~~ do_record do_add end ~~~~~~~~~~~ acn=', acn);
	}
	function do_stop(funcOK){
// console.log('~~~ do_record do_stop ~~~');
		var acns = B_obj_getKeys(records.users);
		var x = 0;
		
		for (var acn in records.users) {
			var user = records.users[acn];
			if (user.audio) user.audio.stopRecording();
			if (user.video) user.video.stopRecording();
		}
		
		function do_getDataUrl() {
// console.log('~~~ do_record do_stop do_getDataUrl x=', x);
			if (x >= acns.length) {
				funcOK();
				return;
			}
			
			var acn = acns[x++];
			var user = records.users[acn];
			if (user.audio) {
				user.audio.getDataURL(function(audioDataURL) {
// console.log('~~~ do_record do_stop do_getDataUrl audio.getBlob=', acn, user.audio.getBlob());
					user.audio = new File([user.audio.getBlob()], acn+"-audio");
					if (user.video) {
						user.video.getDataURL(function(videoDataURL) {
// console.log('~~~ do_record do_stop do_getDataUrl video.getBlob=', user.video.getBlob());
							user.video = new File([user.video.getBlob()], acn+"-video");
							do_getDataUrl();
						});
					} else 
						do_getDataUrl();
				});
			}
			else if (user.video) {
				user.video.getDataURL(function(videoDataURL) {
// console.log('~~~ do_record do_stop do_getDataUrl video.getBlob=', acn, user.video.getBlob());
					user.video = new File([user.video.getBlob()], acn+"-video");
					do_getDataUrl();
				});
			}
		}
		do_getDataUrl();
	}
	function do_upload(arg, funcOK) {
		var data = new FormData();
		for (var acn in arg.users) {
			var user = arg.users[acn];
			if (user.audio) {
				data.append("file", user.audio);
				delete user.audio;
			}
			if (user.video) {
				data.append("file", user.video);
				delete user.video;
			}
		}
		data.append("data", JSON.stringify(arg));
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if (xhr.readyState == 4) {
// console.log('~~~~~~~~~~~~~~~ readyState=4 xhr=', xhr);
				if (xhr.status == 200 && !B_CheckError_SendResult(xhr.responseText, true))
				{
				}
				if (funcOK) funcOK();
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
			"/cb_upload_record"
		);
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.send(data);
// console.log('~~~~~~~~~~~~~~~ send data=', data);
	}
	function do_upload2(data, funcOK) {
		var url = "/cb_upload_record";
		$.ajax({
			type: "POST"
		,	url: url
		,	data: "data="+JSON.stringify(data)
		,	dataType: "json"
		,	success: function(data, textStatus) {
// console.log('~~~~~~~~~~~~~~~ data=', data);
				if (B_CheckError_SendResult(data))
					data = null;
				if (funcOK) funcOK(data);
			}
		,	error: function(xhr) {
// console.log('~~~~~~~~~~~~~~~ xhr=', xhr);
				if (funcOK) funcOK(null, xhr.responseText);
			}
		});
	}
},
pc_localDescCreated: function(pc, desc)
{
	var This = this;
	pc.setLocalDescription(desc, function () {
		oWS.send_arg({
			mode: 	"cb_rtc_sdp"
			,cid: 	This.cid
			,acn:	pc.acn
			,name:	pc.name
			,sdp: 	desc
		});
	}, logError);
},
do_talk_items_reload: function()
{
	var $se = this.$dlg.find(".se_talk");
	$se.find(".item").remove();
	if (this.allow && this.allow.length) {
		var allow = B_array_del(this.allow, oWS.m_arg.acn);
		for (var x=0; x<allow.length; x++)
			this.do_talk_item_append($se, allow[x]);
		//
		this.do_talk_items_adjust();
	}
},
do_talk_items_adjust: function()
{
	var $tis = this.$dlg.find(".se_talk .item");
	if ($tis.length > 1)
		$tis.css({width:"50%"});
	else
		$tis.css({width:"100%"});
},
do_talk_item_append: function($se, acn)
{
	var $ti = $(
		'<div class="item" d_acn="'+acn+'">'
			+'<div class="item_img">'
				+'<div class="user_icon img_square"><img src="'+this.getUserIcon(acn)+'"></div>'
				+'<div class="name"></div>'
			+'</div>'
			+'<video class="video" autoplay></video>'
			+'<video class="audio" autoplay></video>'
		+'</div>'
	);
	$ti.prependTo($se);
	$ti.find(".img_square").f_img_square();
	//
	rs_con_acn2info(acn, function(rec){
		var sun = rec ? rec.sun : acn;
		$ti.find(".name").html(sun);
	});
	return $ti;
},
do_talk_item_2video: function(pc, stream)
{
	var $ti = this.$dlg.find(".se_talk .item[d_acn="+pc.acn+"]");
	if (!$ti.length) {
		var $se = this.$dlg.find(".se_talk");
		$ti = this.do_talk_item_append($se, pc.acn);
		this.do_talk_items_adjust();
	}
	//
	if (this.type == "video") {
		$ti.find(".item_img").hide();
		$ti.find(".video").show();
		if (pc.name == "video")
			$ti.find(".video").get(0).src = URL.createObjectURL(stream);
		else
			$ti.find(".audio").get(0).src = URL.createObjectURL(stream);
	}
	else 
		$ti.find(".video").get(0).src = URL.createObjectURL(stream);
	this.peerConns[pc.acn][pc.name].stream = stream;
},
do_talk_item_stop: function(acn)
{
	var $ti = this.$dlg.find(".se_talk .item[d_acn="+acn+"]");
	if ($ti.length) {
		$ti.find(".item_img").show();
		$ti.find("video").attr("src",null).hide();
	}
	for (var name in this.peerConns[acn]) {
		try{
			var pc = this.peerConns[acn][name];
			if (pc) {
				this.pc_stopRemoteStreams(pc);
				delete this.peerConns[acn];
			}
		} catch(e){}
	}
},
do_talk_item_del: function(acn)
{
	var $ti = this.$dlg.find(".se_talk .item[d_acn="+acn+"]");
	if ($ti.length) {
		$ti.remove();
		this.do_talk_items_adjust();
	}
	if (this.peerConns[acn]) {
		for (var name in this.peerConns[acn]) {
			var pc = this.peerConns[acn][name];
			if (pc) {
				this.pc_stopRemoteStreams(pc);
				delete this.peerConns[acn][name];
			}
		}
		delete this.peerConns[acn];
	}
},
do_talk_item_del_all: function(acn)
{
	for (var acn in this.peerConns)
		this.do_talk_item_del(acn);
	//
	if (this.localStream) {
		this.pc_stopStream(this.localStream);
		this.localStream = null;
	}
	if (this.localStream_a) {
		this.pc_stopStream(this.localStream_a);
		this.localStream_a = null;
	}
},
do_accept: function(recCB, type)
{
	if (recCB) {
		this.recCB = recCB
		this.cid = recCB._id;
		this.type = type;
		this.bStopVideo = true;
		this.bStopAudio = true;
	}
	
	// 開啟聊天室
/*	if (!this.bPopup) {
		// oWS._cb_openBox({
			// mode: "cb_openBox"
			// ,rec: this.recCB
		// });
		oWS.do_openChat(this.cid);
	}*/
	// 改用 Popup Window
	if (!this.bPopup || this.sys_chrome && location.protocol != "https:" // Chorme 不在 Https:
			|| sys_is_app	// Android App
		)
	{
		this.do_popup("accept", this.type, this.cid);
	}
	else
	{
		var This = this;
		This.getLocalStream(function(localStream, error){
			oWS.send_arg({
				mode: 	"cb_rtc_call"
				,act:	"accept"
				,cid: 	This.cid
			});
		});
	}
},
do_deny: function()
{
	oWS.send_arg({
		mode: 	"cb_rtc_call"
		,act:	"deny"
		,cid: 	this.cid
	});
	this.setMode("close");
},
// mode => [call / accept]
do_popup: function(mode, type, cid)
{
	var $win = $(window);
	var h_pos = ",left="+((screen.width-600)/2)+",top="+((screen.height-480)/2);
	var url = (sys_is_firefox 
				? "https://"+HOST_RTCs+"/cb_rtc.html"
				: "https://"+HOST_RTCs+"/cb_rtc.html")
			+"?mode="+mode
			+"&type="+type
			
			+"&cid="+cid
			+"&nu_code="+oWS.m_arg.nu_code
			+"&acn="+oWS.m_arg.acn
			+"&sun="+oWS.m_arg.sun
			+"&server_acn="+oWS.m_arg.server_acn
	var win = open(url, null, "scrollbars=no,width=600,height=480"+h_pos);
	
	this.setMode("close");
},
do_open: function()
{
	var allow = ["wheechen","nu12389","nu13071"];
	
	this.setMode("talk");
	
	var $se = this.$dlg.find(".se_talk");
	$se.find(".item").remove();
	
	for (var x=0; x<allow.length; x++)
		this.do_talk_item_append($se, allow[x]);
	
	
},
pc_stopRemoteStreams: function(pc)
{
	var remoteStreams = pc.getRemoteStreams();
	if (remoteStreams) {
		for (var i = 0; i < remoteStreams.length; i++) {
			try {
				this.pc_stopStream(remoteStreams[i]);
			} catch (err) {
			}
		}
	}
},
pc_stopStream: function(stream)
{
	var i;
	var tracks;
	tracks = stream.getAudioTracks();
	for( i = 0; i < tracks.length; i++ ) {
		try {
			tracks[i].stop();
		} catch(err){}
	}
	tracks = stream.getVideoTracks();
	for( i = 0; i < tracks.length; i++ ) {
		try {
			tracks[i].stop();
		} catch(err){}
	}
},

setMode: function(m)
{
	var $dlg = this.$dlg;
	var recCB = this.recCB;
	this.mode = m;
	if (m == "call") // 撥出中...
	{
		this.player = B_wav_replay(3);
		$dlg.dialog("open");
		$dlg.find(".se_callin, .callin.bottom_bar").hide();
		$dlg.find(".se_talk, .talk.bottom_bar").show();
		$dlg.find(".se_talk .se_status").show();
		$dlg.find(".se_talk .se_status .msg").html("視訊通話正在撥出中...");
		$dlg.find("#bnFullscreen").hide();
		if (this.type == "video") {
			$dlg.find(".se_talk #selfView").show();
		} else {
			$dlg.find(".se_talk #selfView").hide();
		}
		$dlg.find(".talk.bottom_bar")
			.find("#bnMuteVideo, #bnMuteAudio, #bnOpt, #bnRecord").hide();
	}
	else if (m == "callin") // 來電中...
	{
		this.player = B_wav_replay(2);
		$dlg.dialog("open");
		$dlg.find(".se_callin, .callin.bottom_bar").show();
		$dlg.find(".se_talk, .talk.bottom_bar, #bnFullscreen").hide();
		
		var acn = this.call_acn;
		$dlg.find(".se_callin .user_icon img").attr("src", this.getUserIcon(acn));
		$dlg.find(".se_callin .img_square").f_img_square();
		rs_con_acn2info(acn, function(rec){
			var sun = rec ? rec.sun : acn;
			$dlg.find(".se_callin .name").html(sun);
		});
	}
	else if (m == "talk") // 通話中...
	{
		if (this.player) {
			this.player.remove();
			this.player = null;
		}
		$dlg.dialog("open");
		
		$dlg.find(".se_callin, .callin.bottom_bar").hide();
		$dlg.find(".se_talk, .talk.bottom_bar").show();
		if (!sys_is_mobile) $dlg.find("#bnFullscreen").show();
		if (this.type == "video") {
			$dlg.find(".se_talk .se_status").hide();
			$dlg.find(".se_talk #bnMuteVideo").show();
			$dlg.find(".se_talk #selfView").show();
			//if (this.timeid_selfView) clearTimeout(this.timeid_selfView);
			//setTimeout(function(){
			//	$dlg.find(".se_talk #selfView").fadeOut();
			//},5000);
		} else {
			$dlg.find(".se_talk .se_status").show();
			$dlg.find(".se_talk .se_status .msg").html("通話中...");
			$dlg.find(".se_talk #bnMuteVideo").hide();
			$dlg.find(".se_talk #selfView").hide();
		}
		if (this.sys_chrome)
			$dlg.find(".talk.bottom_bar #bnOpt").show();
		$dlg.find(".se_talk #bnMuteAudio").show();
		$dlg.find(".se_talk #bnMuteVideo .fa-ban").hide();
		$dlg.find(".se_talk #bnMuteAudio .fa-ban").hide();
		if (!sys_is_mobile && (oWS.m_arg.server_acn == "tw1f7" || oWS.m_arg.server_acn == "WheeRegion"))
			$dlg.find(".se_talk #bnRecord").show();
		else
			$dlg.find(".se_talk #bnRecord").hide();
	}
	else if (m == "close") // 關閉
	{
		if (this.player) {
			this.player.remove();
			this.player = null;
		}
		if (this.is_record())
			this.do_record(false);
		if (this.bFullscreen)
			this.bnFullscreen(false);
		$("#rtc_opt_menu").hide();
		$dlg.dialog("close");
		
		this.do_talk_item_del_all();
		
		//
		if (this.m_arg && this.m_arg.onClose) {
			this.m_arg.onClose(this.err);
		}
		else if (this.bPopup) {
			window.close();
		}
		else {
			this.mode = null;
			this.peerConns = {};
			this.recCB = null;
			this.cid = null;
			this.type = null;
			this.allow = null;
			this.call_acn = null;
			this.localStream = null;
			this.bStopVideo = true;
			this.bStopAudio = true;
			
			this._desiredVideoProperties.screenCapture = false;
		}
	}
},
// arg => {cid, acn, name, sdp}
_cb_rtc_sdp: function(arg)
{
	var cid = arg.cid||"";
	var acn = arg.acn||"";
	var name = arg.name||"";
	if (cid == "" || cid != this.cid) {
		logError({name:"_cb_rtc_sdp", message:"not match cid"});
	} else if (acn == "") {
		logError({name:"_cb_rtc_sdp", message:"empty acn"});
	} else if (name == "") {
		logError({name:"_cb_rtc_sdp", message:"empty name"});
	}
	else {
		var This = this;
		var pc;
		if (!this.peerConns[acn] || !this.peerConns[acn][name])
			pc = this.do_talk(acn, name);
		else
			pc = this.peerConns[acn][name];

		if (pc) {
			pc.setRemoteDescription(new RTCSessionDescription(arg.sdp), function() {
				// 當接收到 offer 時，要回應一個 answer
				if (pc.remoteDescription.type == "offer")
					pc.createAnswer(function(desc){
						This.pc_localDescCreated(pc, desc);
					}, logError);
			}, logError);
			// flushCachedCandidates
			pc.flushCachedCandidates();
		}
	}
},
// arg => {cid, acn, name, candidate}
_cb_rtc_candidate: function(arg)
{
	if (arg.cid != this.cid) {
		logError({name:"_cb_rtc_candidate", message:"not match cid"});
	} else if (!this.peerConns[arg.acn]) {
		logError({name:"_cb_rtc_candidate", message:"Connection does not exist"});
	}
	else {
		if (this.peerConns[arg.acn] && this.peerConns[arg.acn][arg.name]) {
			var pc = this.peerConns[arg.acn][arg.name];
			if (pc.candidate_list)
				pc.candidate_list.push(arg.candidate);
			else
				pc.processCandidateBody(arg.candidate);
		}
	}
}	


}
var oWRTC = new OBJ_WebRTC();




function logError(error) {
	console.log("logError: "+error.name + ": " + error.message);
}




