


// 監控留言版，user 是否有輸入推薦網址
function OBJ_PushUrl()
{
	this.m_arg = null;
	this.m_sid = "#share_wrapper";
	this.m_bPush = false;
	this.m_bGet = false;
	
}
OBJ_PushUrl.prototype = {
	
nudrive_init: function()
{
	var This = this;
	$(this.m_sid+" textarea#txt_cmn")
		.die('paste').die('keydown')
		.live({
			paste: function(e){
				if (This.is_push())
					return;
					
				var $t = $(this);
				setTimeout(function(){
					This.chk_url($t);
				},100);
			},
			keydown: function(e){
				if (This.is_push())
					return;
					
				var $t = $(this);
				if (!e) e = event;
				var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
				if (key == 13) {
					This.chk_url($t);
				}
			}
		});
},
// arg => {sid, bn, fPush(有推薦), fClose }
start_watch: function(arg)
{
	var This = this;
	this.m_arg = arg;
	this.m_sid = arg.sid;
	arg.bn.on("paste", function(e){
		if (This.is_push())
			return;
			
		var $t = $(this);
		setTimeout(function(){
			This.chk_url($t, function(b){
				if (b == true && arg.fPush)
					arg.fPush(true);
			});
		},100);
	})
	arg.bn.on("keydown", function(e){
		if (This.is_push())
			return;
			
		var $t = $(this);
		if (!e) e = event;
		var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		if (key == 13) {
			This.chk_url($t, function(b){
				if (b == true && arg.fPush)
					arg.fPush(true);
			});
		}
	})
},
close: function(bClear)
{
	this.m_bPush = false;
	this.m_bGet = false;
	if (bClear != false)
		this.push_url = null;
	
	var $se = $(this.m_sid+" div.attach");
	$se.empty();
	$se.hide();
	
	if (this.m_arg && this.m_arg.fClose)
		this.m_arg.fClose();
},
is_push: function()
{
	if (this.m_bPush) return true;
	
	if ($(this.m_sid+" div.attach_files").length > 0) {
		return true; // 有啟用檔案上傳就關閉推薦網址功能。
	}
	return false;
},
chk_url: function($t, funcOK)
{
	var This = this;
	var c = $t.val();
	var m = B_URL_Parse(c);
	if (!m || This.push_url == m[0]) {
		if (funcOK) funcOK(false);
		return;
	}
	
	This.push_url = m[0];
	var host = m[2];
	WRS_API_url_cache({
		mode:	"getUrlParse"
		,url:	This.push_url
		,funcOK: function(data){
			if (data) {
				var $se = $(This.m_sid+" div.attach");
				$se.html(
					'<div class="se_push_url push_url edit">'+
						'<span class="img img_square">'+
							'<img src="'+data.img_main+'">'+
							'<span id="bnPrev" class="bnPrev" title="'+gLang['BN_Prev']+'"></span>'+ // 上一個
							'<span id="bnNext" class="bnNext" title="'+gLang['BN_Next']+'"></span>'+ // 下一個
						'</span>'+
						'<div class="content">'+
							'<div class="title"><a href="#">'+data.title+'</a></div>'+
							'<div class="desc"><a href="#">'+B_STR_Substr(data.desc,220,true)+'</a></div>'+
							'<span class="host">'+host+'</span>'+
						'</div>'+
						'<span id="bnClose" class="gray_icon ui-icon-closethick"></span>'+
					'</div>'
				).show();
				// 有主要圖片
				if (data.img_main && data.img_main != "")
				{
					$se.find("#bnPrev , #bnNext").remove();
					$se.find(".img_square").f_img_square();
				}
				// 網頁有一些圖片
				else if (data.imgs && data.imgs.length > 0)
				{
					var img_list = [], img_cur = -1, img_init = false;
					
					function do_init(){
						img_init = true;
						$se.find("#bnPrev , #bnNext").show();
						do_next(true);
					}
					function do_next(bNext) {
						if (bNext)
							img_cur++;
						else
							img_cur--;
						$se.find(".img_square img").attr("style","").attr("src",img_list[img_cur]);
						$se.find(".img_square").f_img_square();
						do_upd_button();
					}
					function do_upd_button() {
						if (img_cur > 0)
							$se.find("#bnPrev").show();
						else 
							$se.find("#bnPrev").hide();
						if (img_cur < img_list.length-1)
							$se.find("#bnNext").show();
						else 
							$se.find("#bnNext").hide();
					}
					$se.find("#bnPrev").click(function(){
						do_next(false);
					});
					$se.find("#bnNext").click(function(){
						do_next(true);
					});
				
					$se.find("#bnPrev , #bnNext").hide();
					// 過濾太小的圖片
					for(var x=0; x<data.imgs.length; x++) {
						var u_img = data.imgs[x];
						$("<img>")
							.load(function(){
								var t = this;
								var w = this.width;
								var h = this.height;
								if ( !w || !h )
									return;
								if ((w > 40 && h > 40) && (w == h || (w > h && w < h*3) || (h > w && h < w*3)) ) {
									img_list.push(t.src);
									if (!img_init) do_init();
									do_upd_button();
								}
							})
							.error(function(){
							})
							.attr("src", u_img);
					}
				}
				else
				{
					$se.find(".img_square").hide();
				}
				
				// 標題及描述 編輯
				$se.find("div.title a , div.desc a").click(function(){
					This.edit_content($(this));
					return false;
				})
				//
				$se.find("#bnClose").click(function(){
					This.close(false);
				})
				//
				This.m_bPush = true;
				This.m_bGet = true;
				
				if (funcOK) funcOK(true);
			}
			else {
				if (funcOK) funcOK(false);
			}
		}
	})
},
edit_content: function($a)
{
	var This = this;
	var c = $a.text();
	var $t = $a.parent();
	var bTitle = $t.is(".title");
	if (!bTitle) c = c.replace(/\<br\>/g, "\r\n");
	$t.html(
		bTitle
			? '<input type="text" value="'+c+'" style="width:90%; font-size:16px; border:solid 1px; margin:0;">'
			: '<textarea rows="4" style="width:90%; border:solid 1px; margin:0; padding:0; height:auto;">'+c+'</textarea>'
	);
	$t.find("input , textarea")
		.keydown(function(e){
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
		})
		.blur(function(){
			var c = $(this).val();
			if (!bTitle) c = c.replace(/\r\n/g, "<br>");
			$t.html(
				'<a href="#">'+c+'</a>'
			).find("a").click(function(){
				This.edit_content($(this));
				return false;
			});
		})
		.focus()
	return false;
},
getContent: function()
{
	if (!this.m_bPush || !this.m_bGet)
		return false;
	var $se = $(this.m_sid+" div.attach");
	
	return {
		url:	this.push_url
		,host:	$se.find(".host").text()
		,img:	$se.find(".img img").attr("src")||""
		,title:	$se.find("div.title").text()
		,desc:	$se.find("div.desc").text()
	};
},
getContent_bbs: function()
{
	if (!this.m_bPush || !this.m_bGet)
		return false;
	var $se = $(this.m_sid+" div.attach");
	var out = [
		this.push_url
		,$se.find(".host").text()
		,$se.find(".img img").attr("src")||""
		,$se.find("div.title").text()
		,$se.find("div.desc").text()
	];
	return out.join("<br>")
}
	
}

var oPU = new OBJ_PushUrl();
