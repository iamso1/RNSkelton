

var gArg = {};
var sys_firefox = B_is_firefox();


//////////////////////////////////////////
$(document).ready(function() {

	var url = location.href;
	gArg.mid 		= B_URL_GetArg(url, "mid");
	gArg.server_acn = B_URL_GetArg(url, "server_acn");
	if ((gArg.mid||"") == "")
		close();

	getRec({
		mid: gArg.mid
		,funcOK: function(rec, err){
			
			if (rec) {
				gArg.rec = rec;
				items_reset();
				bnPlay();
			}
			else {
				alert("無法取得資料.");
				close();
			}
		}
	});
	//
	$(".bottom_bar #bnPlay").on("click", function(){
		if (sys_firefox)
			location.reload();
		else
			bnPlay();
	});
});

function getUserIcon(acn)
{
	return URL_USER_ICON+acn+"&server_acn="+gArg.server_acn;
}
function bnPlay()
{
console.log("~~~ bnPlay ~~~");
	if (gArg.bPlay == true)
		return;
	
	gArg.bPlay = true;
	$(".bottom_bar #bnPlay").addClass("disabled");
	for(var x=0; x<gArg.videos.length; x++) {
		gArg.videos[x].f_play();
	}
}
function item_play_ended()
{
console.log("~~~ item_play_ended ~~~");
	for(var x=0; x<gArg.videos.length; x++) {
		if (!gArg.videos[x].ended) {
			return;
		}
	}
	$(".bottom_bar #bnPlay").removeClass("disabled");
	gArg.bPlay = false;
}
function items_reset()
{
	gArg.videos = [];
	var $se = $("#se_rtc_talk");
	var users = gArg.rec.file_info.users;
	for(var acn in users) {
		var rec = users[acn];
		rec.acn = acn;
		item_append($se, rec);
	}
}
function item_append($se, rec)
{
	var $ti = $(
		'<div class="item" d_acn="'+rec.acn+'">'
			+'<div class="item_img">'
				+'<div class="user_icon img_square"><img src="'+getUserIcon(rec.acn)+'"></div>'
				+'<div class="name"></div>'
			+'</div>'
			+'<video></video>'
		+'</div>'
	).appendTo($se);
	var $video = $ti.find("video");
	$video.on("ended",item_play_ended);
	//
	rs_con_acn2info(rec.acn, function(uInfo){
		var sun = uInfo ? uInfo.sun : rec.acn;
		$ti.find(".name").html(sun);
	});
	//
	if (gArg.rec.file_info.type == "video") {
		$ti.find(".item_img").hide();
		$ti.find("video").show();
	}
	else {
		$ti.find(".item_img").show();
		$ti.find("video").hide();
		$ti.find(".img_square").f_img_square();
	}
	
	var video = $video.get(0);
	video.src = "/data/"+gArg.rec.cid+"/"+(rec.video||rec.audio);
	video.f_play = function(){
		var t = this;
console.log('~~~ t=', t);
console.log('~~~ rec=', rec);
		if (rec.time > 0) {
			setTimeout(function(){
				t.play();
			}, rec.time);
		}
		else {
			t.play();
		}
	}
	gArg.videos.push(video);
}
// arg => {mid, funcOK}
function getRec(arg)
{
	var argData = {
		mode: "getMsg"
		,mid: arg.mid
	}
	$.ajax({
		type: "POST"
	,	url: "/cb_tools"
	,	data: argData
	,	dataType: "json"
	,	success: function(data) {
console.log('~~~~~~~~~~~ data=', data);
			if (B_CheckError_SendResult(data))
				data = null;
			if (arg.funcOK) arg.funcOK(data);
		}
	,	error: function(xhr) {
console.log('~~~~~~~~~~~ xhr=', xhr);
			if (arg.funcOK) arg.funcOK();
		}
	});
}


