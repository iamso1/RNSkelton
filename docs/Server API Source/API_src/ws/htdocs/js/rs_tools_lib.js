

var URL_USER_ICON 	= "/UserProfile/user_image.php?acn=";
var URL_USER_ICON_MIN= "/UserProfile/user_image.php?mode=icon&acn=";
var URL_THUMBS 		= "/tools/api_get_thumbs.php?page_url="; // &type=[Video/Image] &size=[/640/1920/src]
var URL_NOT_THUMBS	= "/tools/OokonStorage/images/none150.gif"

var API_WNS_user_info_get 	= "/wns/user_info_get.php";
var API_WNS_user_search		= "/wns/user_search.php";
var API_WNS_get_site_data 	= "/CS_Site/get_site_data.php";
var API_WNS_member 			= "/tools/UserRegister/member.php";

var API_EXTERNAL 	= "/tools/api_external.php";
var API_TOOLS2 		= "/tools/api_tools.php";
var API_SHOWPAGE_ARG= "/tools/page/show_page.php?page_url=";


var WRS_PART_UPLOAD_SIZE = 30000000	// 檔案大於 30MB 改用片斷上傳
var WRS_PART_SIZE = 10000000		// 每個分斷大小 10MB


var sys_https = location.protocol == "https:";
var sys_url_ptc = location.protocol+"//";

// 檢查 Browser 是否為 NUBraim 
var sys_NUBraim = false;
try{external.B_GetVersion(); sys_NUBraim=true;} catch(e) {}

var sys_debug = sys_debug || false;

// Language
if (typeof(gLang) == "undefined" || !window.gLang) {
	gLang = {};
}

var sys_is_mobile = B_is_mobile();
var sys_body_scroll_top;



// Window 7, IE And NUBraim Cookie 不相容, 自動設定 IE Cookie.
function rs_Power_AutoSetCookie()
{
	if (sys_NUBraim && B_getWindowVersion() >= 6.1 && !B_getCookie("setCookie") && B_getCookie("ssn_acn")) {
		setTimeout(function(){
			B_Cookie_set_ByTime('setCookie', 'y', 3600*1000); // 一小時
			var u = "/tools/api_tools.php?mode=set_cookie&ssn_acn="+B_getCookie("ssn_acn");
			var local_port = "";
			try{local_port = external.B_GetLocalhostPort();} catch(e) {}
			if (local_port != "") u += "&local_port="+local_port;
			open(u, null, "width=1,height=1,left=0,top="+screen.height+",toolbar=no");
		}, 1000);
	}
}
function rs_Power_GetCookie()
{
	var cookie = [];
	var v = B_getCookie("ssn_acn");
	if (v) cookie.push("ssn_acn="+v);
	var v = B_getCookie("nu_code");
	if (v) cookie.push("nu_code="+v);
	return cookie.join("; ")
}
// 登入視窗; 
// bLogin: [true(沒登入, 就做登入動作)/faile]
function rs_isLogin(bLogin)
{
	if (B_getCookie("ssn_acn")) 
		return true;
		
	if (bLogin)
		rs_Login();
	return false;
}
function rs_Login(bAutoClose)
{
    $.ajax({
        type: "POST",
        url: "/tools/api_user_info.php?mode=is_login",
        success: function(data) {
			if (data == "y")
				location.reload();
			else
				do_work();
        }
 	,	error: function(XMLHttpRequest, textStatus, errorThrown) {
			do_work();
		}
	});

	function do_work() {
		if (isMobile.any()) {
			var url = "/Site_Prog/login.php?src_url="+encodeURIComponent(location.href);
			location.href = url;
		} else {
			B_Popup_Open_IFrame({
				u: "/Site_Prog/login.php"
				,style: "width:450px; height:330px;"
				,auto_close: (bAutoClose == false ? false : true)
				,bn_close: (bAutoClose == false ? false : true)
			});
		}
	}
}
function rs_LoginPwd(ufp, lang)
{
	// if (isMobile.any()) {
		// var url = "/Site_Prog/login.php?src_url="+encodeURIComponent(location.href);
		// location.href = url;
	// } else {
		B_Popup_Open_IFrame({
			u: "/tools/passwd.php?path_url="+ufp+"&lang="+(lang||"")
			,style: "width:450px; height:330px;"
		});
	// }
}

// 登出
function rs_Logout(funcOK)
{
	if (window.stop)
		window.stop();
	else
		document.execCommand("Stop");
	
	var url = "/Site_Prog/logout.php";
	$('<iframe src="'+url+'" style="display:none;"></iframe>')
		.load(function(){
			if (funcOK)
				funcOK();
			else
				location.href = "/";
		})
		.appendTo($("body"));
}
// 瀏覽次數加一
function rs_cnt_view_add(fp, funcOK)
{
    $.ajax({
        type: "POST",
        url: "/tools/api_tools.php",
		data: {
			mode: "file",
			act: "CntView_Increase",
			file_path: fp
		},
        success: function(data) {
			if (B_CheckError_SendResult(data, false))
				data = null;
			if (funcOK) funcOK(data);
        },
 		error: function(XMLHttpRequest) {
			if (funcOK) funcOK();
		}
	});
}
// 是否是網路硬碟, 是轉過去.
function rs_is_driver_location()
{
	if (!gArg || !gArg.file_path)
		return false;
	
	// 
	if (parent == window)
	{
		// NUWeb
		if (gArg.file_path.indexOf("Driver") == -1)
		{
			// 沒有套版, 轉為有套版
			if (gArg.not_frame) {
				if (B_URL_GetArg(location.href, "not_frame") != "n") {
					var url = B_URL_SetArg(location.href, "not_frame", "n");
					location.href = url;
					return true;
				}
			}
		}
		// NUDrive
		else
		{
			//不在 IFrame 內, 重新導向
			var fp = B_URL_MakePathFile(location.href, true, true).replace("/Site/","");
			//var url = "/tools/page/show_page.php?page_url=/Site/"+gArg.site_name+"/Driver/#file_path="+gArg.file_path;
			var url = "/tools/page/show_page.php?page_url=/Site/"+gArg.site_name+"/Driver/#file_path="+encodeURIComponent(fp);
			location.href = url;
			return true;
		}
	}
	//在 IFrame 內
	else
	{
		// 有套版, 轉為沒有套版
		if (!gArg.not_frame) {
			if (B_URL_GetArg(location.href, "not_frame") != "y") {
				var url = B_URL_SetArg(location.href, "not_frame", "y");
				location.href = url;
				return true;
			}
		}
	}
	return false;
}
function rs_is_sys_file(fn)
{
	if (!fn) return false;
	var fn = B_URL_MakeFileName(fn, true).toLowerCase();
	if (fn == "desktop.ini" 
		|| fn == "thumbs.db"
		|| fn.substr(-11) == ".thumbs.jpg"
		|| fn.substr(0,7) == ".nuweb_"
		|| fn.substr(0,4) == ".bak"
		|| fn.substr(0,4) == ".aco"
		)
		return true;
	return false;
}
function rs_is_sys_keep_dir(fn)
{
	return fn == "Forum"
			|| fn == "Events"
			|| fn == "Calendar"
			|| fn == "Friend"
			|| fn == "Note"			//  記事本
			|| fn == "Favorites"	// 我的收藏
			? true : false;
}
function rs_is_youtube_url(url)
{
	return url.toLowerCase().indexOf(".youtube.com/watch?") > -1;
}
// 成員目錄中的自己目錄
function rs_is_memberDirToMe_fp(fp, user)
{
	var reg = new RegExp("^[\\w\\-]+/Members/"+user+"($|\/)", "i");
	return reg.test(fp);
}
function rs_is_memberDirToMe_Root(fp, user)
{
	var reg = new RegExp("^[\\w\\-]+/Members/"+user+"($|\/$)", "i");
	return reg.test(fp);
}
function rs_is_friendDir(fp)
{
	var reg = new RegExp("^(/Site/)?[\\w\\-]+\\/Friend\\/?$", "i");
	return reg.test(fp);
}
function rs_is_friendDir_fp(fp)
{
	var reg = new RegExp("^(/Site/)?[\\w\\-]+\\/Friend\\/(\\w+)($|\/)", "i");
	return reg.test(fp);
}
function rs_is_messageDir_fp(fp)
{
	var reg = new RegExp("^(/Site/)?[\\w\\-]+\\/Driver\\/Message($|\/)", "i");
	return reg.test(fp);
}
function rs_is_rootDir(fp, site_name)
{
	if (site_name == null) site_name = "[\\w\\-]+";
	var reg = new RegExp("^(/Site/)?"+site_name+"\/?$", "i");
	return reg.test(fp);
}
function rs_is_QuickContactDir(fp)
{
	var reg = new RegExp("^(/Site/)?[\\w\\-]+\/QuickContact\/?$", "i");
	return reg.test(fp);
}
// NUDrive 下的檔案
function rs_is_driver_fp(url)
{
	return /\/Driver($|\/)/.test(url);
}



var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

// RS Tools
function rs_con_Url2LoginApi(url)
{
	var cs = rs_con_url2server_acn(url);
	var u_fp = B_URL_MakePathFile(url,true,true);

	return "http://"+cs+".nuweb.cc/Site_Prog/login.php"
		+"?nu_code="+B_getCookie("nu_code")
		+"&src_url="+encodeURIComponent(u_fp);
}
function rs_con_Url2UrlPath(u)
{
	return B_URL_MakePathFile(u, true, false);
}
function rs_con_Url2SiteName(u)
{
	var fp = rs_con_ufp2fp(u);
	return B_getField(fp, 0, '/');
}
function rs_con_Url2SiteAcn(u)
{
	var cs = rs_con_url2server_acn(u);
	if (cs == null) return null;
	var site = B_getField(u, 4, '/');
	return site+"."+cs;
}

function rs_con_UrlPath2FilePath(u, bArg)
{
	return rs_con_ufp2fp(u, bArg);
}
function rs_con_ufp2fp(u, bArg)
{
	var x;
	u = B_URL_MakePathFile(u, true, bArg == true);
	if (u.substr(0,6) == "/Site/") {
		u = u.substr(6);
	}
	else {
		x = u.indexOf("/Pages/");
		if (x > -1)
			u = u.substr(x+7);
		else
			u = u;
	}
	if (u.substr(u.length-1) == "/") u = u.substr(0,u.length-1);
	return u;
}
function rs_con_fp2ufp(fp)
{
	return fp.indexOf("/Site/") == -1 ? "/Site/"+fp : fp;
}
function rs_con_fp2uthumbs(fp, size)
{
	fp = fp.replace(/^\/Site\//i, "");
	var ext;
	size = size+"";
	switch(size){
		case "640":
			ext = ".640.thumbs.jpg";
			break;
		case "1024":
			ext = ".1024.thumbs.jpg";
			break;
		case "1920":
			ext = ".1920.thumbs.jpg";
			break;
		case "src":
			ext = ".src.thumbs.jpg";
			break;
		default:
			ext = ".thumbs.jpg";
			break;
	}
	return "/tools/page/show_page.php?page_url=/Site/"+fp+ext;
}
function rs_con_FilePath2UrlPath(site, file_path)
{
	if (site == "Site") {
		return "/Site/"+file_path;
	}
	else
		return "/"+Site+"/Pages/"+file_path;
}
function rs_con_FilePath2UrlThumbs(ufp, type, size, share_code, cs)
{
	if (!ufp || ufp == "") return null;
	var url;
	if (type == "Link")
		url = ufp+".thumbs.jpg";
	else
		url = URL_THUMBS+ufp+"&type="+type;
	if (size) url += "&size="+size;
	if (share_code) url += "&random_path="+share_code;
	if (cs) url += "&cs="+cs;
	return url;
}
function rs_con_mail2acn(m)
{
	if (!m) return "";
	if (!B_is_mail(m))
		return m;
	return m.replace(/\@/g, "-")
			.replace(/\./g, "_")
}
function rs_con_rec2pw(rec, patt)
{
	if (rec == null || rec.r_flag != "Y"
		|| patt == null || patt == "")
		return "N";
	var reg = new RegExp(patt, "i");
	var aPW = [];
	if (reg.test(rec.r_browse)) aPW.push("B");
	if (reg.test(rec.r_download)) aPW.push("L");
	if (reg.test(rec.r_upload)) aPW.push("U");
	if (reg.test(rec.r_edit)) aPW.push("E");
	if (reg.test(rec.r_del)) aPW.push("D");
	return aPW.join(",");
}
function rs_con_sacn2sn_host(site_acn, cs_acn)
{
	var a = site_acn.toLowerCase().split(".");
	return {sn:a[0], host:(a[1] == cs_acn ? "" : a[1]+".nuweb.cc")};
}


function rs_is_group_acn(acn)
{
	if (!acn) return false;
	return acn.indexOf(".") > -1;
}
function rs_is_acnMmail(acn)
{
	if (acn.length == 0) return false;
	x = acn.indexOf("-");
	if (x == -1) return false;
	x = acn.indexOf("_", x);
	if (x == -1) return false;
	return true;
}
function rs_con_acn2mail(acn)
{
	if (!acn) return "";
	if (!rs_is_acnMmail(acn))
		return acn;
	return acn.replace(/\-/g, "@")
			.replace(/\_/g, ".")
}
function rs_con_mail2name(mail)
{
	var x = mail.indexOf("@");
	if (x == -1)
		return mail;
	else
		return mail.substr(0,x);
}
// 一般目錄
function rs_dir_is_general(dir_type)
{
	return !rs_dir_is_func(dir_type);
	// return	dir_type == "" ? true : 
			// dir_type == "directory"		? true : 
			// dir_type == "page"			? true : 
			// dir_type == "blog"			? true : 
			// dir_type == "album"			? true : 
			// dir_type == "media"			? true : 
			// dir_type == "multimedia"	? true : 
			// dir_type == "OokonAlbum"	? true : 
			// dir_type == "OokonBlog"		? true : 
			// dir_type == "OokonVideo"	? true : 
			// dir_type == "OokonStorage"	? true : 
			// dir_type == "note"			? true : 
			// false;
}
// 功能目錄
function rs_dir_is_func(dir_type)
{
	return	dir_type == "forum"			? true : 
			dir_type == "vote"			? true : 
			dir_type == "table"			? true : 
			dir_type == "shop"			? true : 
			dir_type == "bookmark"		? true : 
			dir_type == "calendar"		? true : 
			//dir_type == "events"		? true : 
			false;
}
function rs_callback(host, arg)
{
	if (host.indexOf(".") == -1)
		host += ".nuweb.cc";
	if (host.substr(0,4) != "http") host = "http://"+host;
	var arg = JSON.stringify(arg);
	var u = host+"/tools/api_callback.php?cmd=gs_pp_cmd&cb_data="+encodeURIComponent(arg);
	$('<iframe id="se_test" src="'+u+'" style="width:300px; height:100px; border:0; display:none;"></iframe>')
		.load(function(){$(this).remove();})
		.appendTo($('body'));
}



function rec_con_Tag2EditInfo(tag)
{
	if (typeof(tag) != "string" || tag == "")
		return "";
	var a = tag.split(",");
	var v_tag=[], v_sys=[];
	for(var n in a) {
		s = $.trim(a[n]);
		if (s == "") continue;
		if (s.substr(0,4) == "SYS_")
			v_sys.push(s);
		else
			v_tag.push(s);
	}
	return {tag:v_tag.join(","), sys:v_sys.join(",")}
}
function rec_con_EditInfo2Tag(info)
{
	return (info.sys+","+info.tag)
				.replace(/[,\s]+/g, ",")
				.replace(/(^\s*,\s*|\s*,\s*$)/g, "")
}


// 標籤
function rec_tag_is_exists(tags, tag)
{
	if (!tags) return false;
	var re = new RegExp("(^|,)"+RegExp.quote(tag)+"(,|$)", "i");
	return re.test(tags);
}
function rec_tag_adds(tag, adds)
{
	if (tag == null) tag = "";
	if (adds == null || adds == "") return tag;
	adds = rec_tag_del_space(adds);
	return B_array_unique(tag.split(",").concat(adds.split(","))).join(",");
}
function rec_tag_add(tag, add)
{
	if (!tag) tag = "";
	add = $.trim(add);
	if (add == "")
		return tag;
	if (!rec_tag_is_exists(tag, add)) {
		tag += "," + add;
		return rec_tag_del_space(tag);
	}
	return tag;
}
function rec_tag_del(tag, del)
{
	if (!tag) return "";
	var re = new RegExp("(^|,)"+RegExp.quote(del)+"(,|$)", "i");
	return rec_tag_del_space(tag.replace(re, ","))
}
function rec_tag_del_space(tag)
{
	if (!tag) return "";
	return tag	.replace(/\s*,\s*/g, ",")
				.replace(/,+/g, ",")
				.replace(/^\s*,\s*|\s*,\s*$/g, "")
}
// 系統標籤
function rec_tag_del_sys(tag)
{
	if (!tag) return "";
	return rec_tag_del_space(tag.replace(/SYS_\w*/g, ""));
}
function rec_tag_get_sys(tag)
{
	if (!tag) return "";
	var a = tag.split(",");
	var a_out = [];
	for(var n in a) {
		if (a[n].substr(0,4) == "SYS_")
			a_out.push(a[n]);
	}
	return a_out.join(",");
}
// 標籤 轉 Html
function rec_tag_con_2html(tags)
{
	if (!tags) return "";
	var h="";
	var tag, a = tags.split(",");
	for(var n in a) {
		tag = $.trim(a[n]);
		if (tag == "") continue;
		if (tag.substr(0,4) == "SYS_") continue;
		h += '<span class="stag">'+B_STR_LimitSize(tag,20)+'</span>'
	}
	return h;
}


function rec_con_html2highlight(s, q)
{
	if (q == null || q == "") return s;
	var reg = new RegExp(RegExp.quote(q), "i");
	var m, lq=q.length;
	var out = "";
	while ((m=s.match(reg))){
		out += s.substr(0, m.index)+'<span class="highlight">'+s.substr(m.index,lq)+'</span>';
		s = s.substr(m.index+lq);
	}
	return out+s;
}
function rec_con_str2highlight(s, q)
{
	if (q == null || q == "") return s;
	var reg = new RegExp(RegExp.quote(q), "i");
	var m, lq=q.length;
	var out = "";
	while ((m=s.match(reg))){
		out += s.substr(0, m.index)+'[[[font color=red]]]'+s.substr(m.index,lq)+'[[[/font]]]';
		s = s.substr(m.index+lq);
	}
	return out+s;
}
// nPos => 將 highlight 字串移到前面.
function rec_con_highlight2html(s, nPos)
{
	if (!s) return "";
	s = B_HTMLEnCode(s, false).replace(/\[\[\[font color=red\]\]\]/g, '<span class="highlight">')
		 .replace(/\[\[\[\/font\]\]\]/g, '</span>')
		 .replace(/\<br\>/g,  "\n");
	if (nPos != null) {
		var x = s.indexOf('<span class="highlight">');
		if (x > nPos)
			s = s.substr(x-nPos);
	}
	return s;
}
function rec_con_highlight2del(s)
{
	if (!s) return "";
	return s.replace(/\[\[\[font color=red\]\]\]|\[\[\[\/font\]\]\]|\[\[\[/g, '');
}

function rec_con_RData2Str_s(rdata)
{
	return rdata.replace(/\n @/g, "\n@");
}
function rec_con_recs2obj(recs)
{
	if (!recs || recs == "" || typeof(recs) != "string") return null;
	var out = [];
	var aRecs = $.trim(recs.replace(/\r/g,"")).split("@\n");
	for (var x=0; x < aRecs.length; x++) {
		var sRec = $.trim(aRecs[x]);
		if (sRec == "") continue;
		var aRec = rec_con_rec2obj(aRecs[x]);
		if (aRec != null && B_getLength(aRec) > 0)
			out.push(aRec);
	}
	return out;
}
function rec_con_rec2obj(rec)
{
	if (!rec || rec == "" || typeof(rec) != "string") return null;
	var out = {};
	var up_k, rows = $.trim(rec.replace(/\r/g,"")).split("\n");
	for (var x=0; x < rows.length; x++) {
		var row = rows[x];
		if (row.substr(0,1) != "@") {
			if (up_k)
				out[up_k] += "\n"+row;
		}
		else {
			var x1 = row.indexOf(":");
			if (x1 < 2) continue;
			var k = row.substr(1,x1-1);
			var v = row.substr(x1+1);
			out[k] = v;
			up_k = k;
		}
	}
	return out;
}
function rec_con_obj2rec(obj)
{
	if (typeof(obj) != "object") return "";
	var out = "";
	for (var k in obj) {
		out += "@"+k+":"+obj[k]+"\n";
	}
	return out != "" ? "@\n"+out : "";
}

function rs_con_url2u_host(url, server_acn)
{
	var ip = B_URL_GetIP(url);
	if (ip == "" || ip == server_acn+".nuweb.cc")
		return "";
	return "http://"+ip;
}
function rs_con_url2server_acn(url)
{
	if (!url) return;
	var m = url.match(/http\:\/\/([^\\/]+)\.nuweb\.cc.*/i);
	if (m && m.length > 0 )
		return m[1];
}

function rs_con_url2NUDriveViewUrl(url, server_acn, type)
{
	if (type == "Directory" || type == "Site") 
		return rs_con_url2NUDriveViewUrl_dir(url, server_acn);
	else if (type == "Other")
		return rs_con_url2NUDriveViewUrl_down(url);
	else if (type == "Link")
		return url;
	else
		return rs_con_url2NUDriveViewUrl_view(url);
}
function rs_con_url2NUDriveViewUrl_dir(url, server_acn)
{
	var u_host = rs_con_url2u_host(url, server_acn);
	var random_path = B_URL_GetArg(url, "random_path");
	var u_fp = B_URL_MakePathFile(url, true, false);
	var x = u_fp.indexOf("/Driver/");
	if (x == -1) {
		url = u_host+"/tools/page/show_page.php?page_url="+u_fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	} else {
		var fp = rs_con_ufp2fp(u_fp);
		var afp = u_fp.split("/");
		var site_name = afp[2];
		url = u_host+"/tools/page/show_page.php?page_url=/Site/"+site_name+"/Driver";
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
		// 20160406 修正 Apple 瀏覽器不會附帶 #後面的參數 
		url += "&hash_arg="+encodeURIComponent("main_type=mydrive&file_path="+fp);
	}
	return url;
}
function rs_con_url2NUDriveViewUrl2(url, server_acn)
{
	var u_host = rs_con_url2u_host(url, server_acn);
	var random_path = B_URL_GetArg(url, "random_path");
	var u_fp = B_URL_MakePathFile(url, true, false);
	var x = u_fp.indexOf("/Driver/");
	if (x == -1) {
		url = u_host+"/tools/page/show_page.php?page_url="+u_fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	} else {
		var fp = rs_con_ufp2fp(u_fp);
		var afp = u_fp.split("/");
		var site_name = afp[2];
		url = u_host+"/tools/page/show_page.php?page_url=/Site/"+fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	}
	return url;
}
function rs_con_url2NUDriveViewUrl_down(url, server_acn)
{
	var u_host = rs_con_url2u_host(url, server_acn);
	var random_path = B_URL_GetArg(url, "random_path");
	var u_fp = B_URL_MakePathFile(url, true, false);
	var x = u_fp.indexOf("/Driver/");
	if (x == -1) {
		url = u_host+"/tools/page/show_page.php?mode=download&page_url="+u_fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	} else {
		var fp = rs_con_ufp2fp(u_fp);
		var afp = u_fp.split("/");
		var site_name = afp[2];
		url = u_host+"/tools/page/show_page.php?mode=download&page_url=/Site/"+fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	}
	return url;
}
function rs_con_url2NUDriveViewUrl_view(url, server_acn)
{
	var u_host = rs_con_url2u_host(url, server_acn);
	var random_path = B_URL_GetArg(url, "random_path");
	var u_fp = B_URL_MakePathFile(url, true, false);
	// if (u_fp.indexOf("/Driver/") == -1 && u_fp.indexOf("/.nuweb_trash/") == -1) {
		// url = u_host+"/tools/page/show_page.php?page_url="+u_fp;
		// if (random_path) url = B_URL_SetArg(url, "random_path", random_path)
	// } else {
		var fp = rs_con_ufp2fp(u_fp);
		var afp = u_fp.split("/");
		var site_name = afp[2];
		url = u_host+"/tools/OokonStorage/storage_view.php?mode=view&file_path="+fp;
		if (random_path) url = B_URL_SetArg(url, "random_path", random_path);
	//}
	return url;
}
function rs_con_url2short_url(url, funcOK)
{
	var ip = B_URL_GetIP(url);
	var ufp = B_URL_MakePathFile(url, true, true);
	var request_data =
		"mode=short_code"
		+"&act=get"
		+"&page_url="+encodeURIComponent(ufp)
	$.ajax({
		type: "POST"
	,	url: API_TOOLS
	,	data: request_data
	,	success: function(data, textStatus) {
if (sys_debug) console.log(API_TOOLS+"?"+request_data);
if (sys_debug) console.log(data)
			if (B_CheckError_SendResult(data, sys_debug, "rs_con_url2short_url"))
				data = null;
			//
			var u = null;
			if (data && data != "")
				u = 'http://'+ip+'/?link='+data
			if (funcOK) funcOK(u);
		}
	,	error: function(XMLHttpRequest, textStatus, errorThrown) {
if (sys_debug) console.log(API_TOOLS+"?"+request_data);
if (sys_debug) console.log(XMLHttpRequest)
			if (funcOK) funcOK();
		}
	});
}
function rs_con_url2u_mp3(url)
{
	if (/\.mp3$/i.test(url)) return url;
	var dir = B_URL_MakePath2(url, true, true);
	var fn = B_URL_MakeFileName(url, true);
	return dir+'.nuweb_media/'+fn+'.mp3';
}
var GDATA_EXT_AUDIO = ",mp3,wma,wav,ape,flac,acc,m4a,";
function rs_file_is_audio(url)
{
	var ext = B_URL_MakeExtension(url);
	var re = new RegExp(","+ext+",", "im");
	return re.test(GDATA_EXT_AUDIO);
}
var GDATA_EXT_VIDEO = ",avi,mpg,wmv,mpeg,mov,mp4,mts,m2ts,m2t,f4v,flv,mov,swf,";
function rs_file_is_video(url)
{
	var ext = B_URL_MakeExtension(url);
	var re = new RegExp(","+ext+",", "im");
	return re.test(GDATA_EXT_VIDEO);
}
var GDATA_EXT_IMAGE = ",jpg,gif,png,bmp,ico,jpeg,pcd,giif,tiff,psd,";
function rs_file_is_image(url)
{
	var ext = B_URL_MakeExtension(url);
	var re = new RegExp(","+ext+",", "im");
	return re.test(GDATA_EXT_IMAGE);
}


// 取得大圖片
function rs_img_getMaxImg(main_img, list, funcOK)
{
// console.log('過濾太小的圖片 main_img=', main_img, list);
	var lok = 0;
	var cur = -1, img_info = [];
	
	if (main_img != null && main_img != "") {
		funcOK(main_img);
		return;
	}
	if (list != null && list.length == 0) {
		funcOK();
		return;
	}
	//
	function do_chk(){
		if (lok >= list.length) {
			funcOK(cur > -1 ? img_info[cur].url : null);
			return;
		}
	}
	for(var x=0; x<list.length; x++) {
		var u_img = list[x];
		if (u_img == null && u_img == "") continue;
		$("<img>")
			.load(function(){
				var t = this;
				var url = this.src;
				var w = this.width;
				var h = this.height;
				if ( !w || !h )
					return;
					
				if ((w > 40 && h > 40) && (w == h || (w > h && w < h*3) || (h > w && h < w*3)) ) {
					img_info.push({
						url:url,
						w: 	w,
						h:	h
					});
					//
					var img_size = cur > -1 ? img_info[cur] : null;
					if (cur == -1 || w > img_size.w || h > img_size.h) {
						cur = img_info.length-1;
					}
// console.log('過濾太小的圖片 add url=', cur, list.length, url);
				}
				lok++;
// console.log('過濾太小的圖片 ok lok=', lok);
				do_chk();
			})
			.error(function(){
				lok++;
// console.log('過濾太小的圖片 error lok=', lok);
				do_chk();
			})
			.attr("src", u_img);
	}
}

var URLPATH_IMAGES 	= "/tools/OokonStorage/images/";
var URLPATH_ICON 	= "/tools/OokonStorage/icon/";
var URLPATH_ICON_MAX_ATTACH	= URLPATH_IMAGES+"file.png";
var GDATA_EXT_LIST = 
"7P	,7p,\n"
+"doc	,doc,docx,rtf,\n"
+"exe	,exe,\n"
+"jpg	,jpg,gif,png,bmp,ico,jpeg,pcd,giif,tiff,psd,\n"
+"pdf	,pdf,\n"
+"pptx	,ppt,pptx,\n"
+"rar	,cab,jar,gz,rar,tar,7z,\n"
+"txt	,txt,log,config,dic,mno,cfm,php,as,cs,shtm,aspx,xslt,ascx,resx,pkgdef,asax,ashx,asmx,disco,scp,ps1xml,\n"
+"video	,avi,mpg,wmv,mpeg,mov,mp4,mts,m2ts,m2t,f4v,rm,rmvb,flv,mov,swf,\n"
+"audio	,mp3,wma,wav,ape,flac,acc,m4a,amr,\n"
+"xlsx	,xls,xlsx,\n"
+"zip	,zip,\n"
function rs_con_ext2icon(ext, bMin)
{
	var re = new RegExp("^([\\w^\\t]+)\\t.*,"+ext+",", "im");
	var m = GDATA_EXT_LIST.match(re);
	if (m) return URLPATH_ICON+m[1]+(bMin ? "16" : "125")+".png";
	return URLPATH_ICON_MAX_ATTACH;
}
function rs_con_fn2icon_max(fn, type)
{
// Directory
	if (type == "Directory") {
		return URLPATH_IMAGES+"dir.png"
	}
	var ext = B_URL_MakeExtension(fn);
	var f_icon = rs_con_ext2icon(ext, false);
	if (f_icon != "")
		return f_icon;
	// 
	switch(type) {
		case "Image":
			return URLPATH_IMAGES+"photo.png"
		case "Video":
			return URLPATH_IMAGES+"video.png"
		case "Audio":
			return URLPATH_IMAGES+"audio.png"
		case "Html":
			return URLPATH_IMAGES+"html.png"
		case "Document":
			return URLPATH_IMAGES+"doc.png"
		// case "Other":
		default:
			return URLPATH_IMAGES+"file.png"
	}
}





//////////////////////////////////////
// tools
// val unique
function B_array_unique(arr)
{
	var out = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] && arr[i] != "" && arr.indexOf(arr[i]) == i)
            out.push(arr[i]);
    }
    return out;
}
function B_array_add(a, s)
{
	var a = a.slice();
	var id = a.indexOf(s);
	if (id == -1) a.push(s);
	return a;
}
function B_array_del(a, s)
{
	var a = a.slice();
	var id = a.indexOf(s);
	if (id > -1) a.splice(id,1);
	return a;
}
// val unique
function B_array_add_unique(a, s)
{
	if (s && s != "" && a.indexOf(s) == -1)
		a.push(s);
}
function B_array_index($a, elt)
{
	var len = $a.length;

	var from = Number(arguments[2]) || 0;
	from = (from < 0)
		? Math.ceil(from)
		: Math.floor(from);
	if (from < 0)
		from += len;

	for (; from < len; from++)
	{
		if (from in $a &&
			$a[from] === elt)
		return from;
	}
	return -1;
};
// 差異, a1 - a2
function B_array_diff(arr1)
{
// example 1: array_diff(['Kevin', 'van', 'Zonneveld'], ['van', 'Zonneveld']);
// returns 1: [{0:'Kevin'}
	var retArr = {},
		argl = arguments.length,
		k1 = '',
		i = 1,
		k = '',
		arr = {};

	arr1keys: for (k1 in arr1) {
		for (i = 1; i < argl; i++) {
			arr = arguments[i];
			for (k in arr) {
				if (arr[k] === arr1[k1]) {
					// If it reaches here, it was found in at least one array, so try next value
					continue arr1keys;
				}
			}
			retArr[k1] = arr1[k1];
		}
	}
	// object to array
	var out = []
	for (var n in retArr)
		out.push(retArr[n]);

	return out;
}
// 差異, 非交集
function B_array_diff2(a1, a2)
{
   var a = [], diff = [];
	if (a1 && a1.length) {
		for (var i = 0; i < a1.length; i++) {
			a[a1[i]] = true;
		}
	}
	if (a2 && a2.length) {
		for (var i = 0; i < a2.length; i++) {
			if (a[a2[i]]) {
				delete a[a2[i]];
			} else {
				a[a2[i]] = true;
			}
		}
	}
    for (var k in a) {
        diff.push(k);
    }

    return diff;
}
// obj 合併
function B_array_merge()
{
	var retArr = [];
	for(var n in arguments) {
		for(var n1 in arguments[n])
			retArr.push(arguments[n][n1]);
	}
	return retArr;
}
// 取交集
function B_array_intersect(a1, a2)
{
	var retArr = [];
	for(var n in a2) {
		if (B_array_index(a1, a2[n]) > -1)
			retArr.push(a2[n]);
	}
	return retArr;
}
function B_array_is_equal(a1, a2)
{
	if (a1.length != a2.length) return false;
	for(var x=0; x<a2.length; x++) {
		if (a1.indexOf(a2[x]) == -1)
			return false;
	}
	return true;
}
function B_array2array_obj(list, k) {
	var out = [];
	for(var x=0; x<list.length; x++){
		var obj = {};
		obj[k] = list[x];
		out.push(obj);
	}
	return out;
}



function B_con_Object2UrlArg(o) 
{
	var out = "";
	for (n in o) {
		type = typeof(o[n]);
		if (type == "function") continue;
		if (type == "object") continue;
		out += "&" + n + "=" + encodeURIComponent(o[n]||"");
	}
	if (out != "") out = out.substr(1);
	return out;
}
// 檢查 ajax 回傳的資料是否是錯誤訊息
// bShowErr: 顯示錯誤訊息
function B_CheckError_SendResult(r, bShowErr, name)
{
	if (!r) return true;
	var br = true;
	if (typeof(r) == "object") {
		br = r.error ? true : false;
		if (br && bShowErr == true) B_Message((name && name != "" ? "("+name+")" : "") + r.error);
	}
	else if ( typeof(r) == "string" ) {
		if (r.length > 64) r = r.substr(0,64);
		re = new RegExp("<b>Warning</b>:|<b>Fatal error</b>:|<b>Notice</b>:|<b>Parse error</b>:", "i");
		br = re.test(r);
		if (!br) br = /error\:/i.test(r.substr(0,10));
		if (br && bShowErr == true) B_Message((name && name != "" ? "("+name+")" : "") + r);
	}
	else {
		br = false;
	}
	return br;
}


// 將物件套上 Button 框
function button_init(os)
{
	os
		.addClass(
			'fv-button'
		+	' ui-state-default'
		+	' ui-corner-all'
		)
		.hover(
			function() {
				$(this).addClass('ui-state-hover');
			},
			function() {
				$(this).removeClass('ui-state-hover');
			}
		)
		.focus(function() {
			$(this).addClass('ui-state-focus');
		})
		.blur(function() {
			$(this).removeClass('ui-state-focus');
		});
}
function buttonset_icon_set($os, arg)
{
	$os.buttonset();
	var $bnts_lab = $os.find("label");
	if (arg.text == true)
	{
		$bnts_lab.removeClass("ui-button-text-only").addClass("ui-button-text-icon-primary")
		$os.find(".ui-button-text")
			.css({"padding":"2px 10px 2px 28px"})
	}
	else
	{
		$bnts_lab.removeClass("ui-button-text-only").addClass("ui-button-icon-only")
				.css({"width":"26px","height":"20px"})
		$os.find("[title]").tooltip();
	}
	// icon
	if (arg.icons) {
		for(var i=0; i<arg.icons.length; i++)
			$bnts_lab.eq(i).append('<span class="ui-button-icon-primary ui-icon '+arg.icons[i].primary+'"></span>')
	}
	// OnClick
	if (arg.click) {
		$os.find("input").click(arg.click);
	}
	return $os;
}
// Title, Msg, OnOK, OnCancel, OnClose, b_not_ok, b_not_cancel
function B_Dialog(obj)
{
	if (!$("#seDialog").length)	$("body").append('<div id="seDialog"></div>');

	if (!obj.Title) obj.Title = "Dialog";
	var h_icon = obj.icon == "info" ? "ui-icon-info"
				: obj.icon == "err" ? "ui-icon-circle-close"
				: "ui-icon-alert";
	$("#seDialog").html(
		'<div id="dialog" title="'+obj.Title+'" style="display:none;">'
			+'<p>'
				+'<span class="ui-icon '+h_icon+'" style="float:left; margin:0 7px 20px 0;"></span>'
				+'<span class="msg">'+obj.Msg+'</span>'
			+'</p>'
		+'</div>'
	);
						
	var oBnts = {}; 
	// 自定按鈕
	if (obj.buttons) {
		for(var n in obj.buttons) {
			oBnts[n] = obj.buttons[n];
		}
	}
	if (obj.b_not_ok != true && obj.OnOK != false) {
		bnName = gLang['BN_OK']||"OK";
		oBnts[bnName] = function() {
			$(this).dialog('close');
			if (obj.OnOK) obj.OnOK();
		}
	}
	if (obj.b_not_cancel != true && obj.OnCancel != false) {
		bnName = gLang['BN_CANCEL']||"Cancel";
		oBnts[bnName] = function() {
			$(this).dialog('close');
			if (obj.OnCancel) obj.OnCancel();
		}
	}
	$("#dialog").dialog({
		bgiframe: true,
		resizable: false,
		//height:140,
		width: (obj.width ? obj.width : 300),
		modal: true,
		overlay: {
			backgroundColor: '#000',
			opacity: 0.5
		},
		buttons: oBnts,
		close: function(){
			if (obj.OnClose)
				obj.OnClose();
		}
	});
}
//////////
//	iframe
//	var h = '<iframe id="B_PopupIFrame" style="width:100%; height:100%; border:0;" src="'+url+'"></iframe>'

/* 	
B_Dialog2({
	Title: "Test Dialog2"
	,Content: 'aaaaaaaaaaaaaaaaa'
	,modal: true
	,autoOpen: true
	,open: function(){
	}
	,buttons: {
		"Delete all items": function() {
		  $(this).dialog("close");
		}
		,Cancel: function() {
		  $(this).dialog("close");
		}
	}
});
 */	
// Title, Content, open, zIndex
// dialog attr => {resizable: false, modal: true }
function B_Dialog2(arg)
{
	if (!arg) return;
	
	var dlg_id = arg.id || "seDialog2";
	
	$("#"+dlg_id).remove();
	var $dlg_tc = $('<div id="'+dlg_id+'" style="display:none;"></div>')
		.appendTo($("body"))
		.attr("title", arg.Title||"Dialog")
	if (arg.Url) {
		arg.Url += "#dlg_id="+dlg_id;
		$dlg_tc.html('<iframe id="B_PopupIFrame" style="width:100%; height:100%; border:0;" src="'+arg.Url+'"></iframe>');
	}
	else
		$dlg_tc.html(arg.Content||"");
		
	var bTitle = arg.Title != false;
	arg.Title = null;
	arg.Content = null;
	arg.zIndex = arg.zIndex || (arg.modal == false ? arg.zIndex||400 : 1000);
	
	// 有設定 scrollbar 位置
	var bScrollbar = true;
	if (bScrollbar) {
		// CSS
		$dlg_tc.css({
			overflow:'hidden'
		});
		// Func
		arg.f_resize = arg.resize;
		arg.resize = function(){
			if (arg.f_resize) {
				if (arg.f_resize($dlg_tc) == false)
					return;
			}
			
			var top = $dlg_tc.offset().top;
			var h = $dlg_tc.height();
			$dlg_tc.find(".scrollbar").each(function(){
				var $t = $(this);
				$t.height(h - ($t.offset().top - top));
			});
		}
	}
	
	// Open
	var f_open = arg.open;
	arg.open = function(e){
		var $tc = $(this);
		var $box = $tc.parent();
		arg.$box = $box;
		$box.addClass("rsDlg")
			.css({
				padding:'0'
				,border:'solid 1px #ddd'
				,'-webkit-box-shadow':'rgba(0,0,0,.2) 0 4px 16px'
				,'box-shadow':'rgba(0,0,0,.2) 0 4px 16px'
			});
		// 高度是 %
		if (arg.height && (arg.height+"").indexOf("%") > -1) {
			$box.height(arg.height);
			//
			var top = ($box.parent().height() - $box.height()) / 2;
			$box.css({top:top});
		}
		$box.find(".ui-dialog-titlebar-close")
			.css({
				opacity:'0.3'
			});
		// 標籤, 不顯示
		if (bTitle == false) {
			$box.find("> .ui-dialog-titlebar").remove();
		}
		else {
			$box.find("> .ui-dialog-titlebar")
				.css({
					background:'0'
					,border:'0'
					,borderBottom:'solid 1px #ddd'
					,borderBottomLeftRadius:'0'
					,borderBottomRightRadius:'0'
					,fontSize:'16px'
					,fontWeight:'normal'
					,padding:'10px 20px'
				});
		}
		// 內容是 iframe
		if ($tc.find("> iframe").length) {
			$tc	.css({
					backgroundColor:'#f5f5f5'
					,padding:'0'
				});
		}
		else {
			$tc	.css({
					backgroundColor:'#f5f5f5'
				});
		}
		// buttons
		if (arg.buttons == false) {
			$box.find("> .ui-dialog-buttonpane").remove();
		} else {
			$box.find("> .ui-dialog-buttonpane")
				.css({
					border:'solid 1px #ddd'
					,margin:'0'
				});
		}
		//
		if (f_open) f_open(e,this);
		if (arg.f_open) arg.f_open(e);
		if (bScrollbar) arg.resize();
		
	}
	
	// call 原物件
	$dlg_tc.dialog(arg);
	$dlg_tc.get(0).arg = arg;

	return $dlg_tc;
}
// B_Dialog2_Wait("seDialog2Wait");
// B_Dialog2_Close("seDialog2Wait");
function B_Dialog2_Wait(id)
{
	var dlg_id = id || "seDialog2";
	
	var $dlg_tc = $("#"+dlg_id);
	if (!$dlg_tc.length)
		$dlg_tc = $('<div id="'+dlg_id+'" style="display:none;"></div>').appendTo($("body"));
	$dlg_tc.html('<img align="absmiddle" src="/tools/pv/images/lightbox-ico-loading.gif">')
		
	var arg = {};
	arg.modal = true;
	arg.width = 64;
	arg.height = 64;
	arg.resizable = false;
	
	// Open
	arg.open = function(e){
		var $tc = $(this);
		var $dlg = $tc.parent()
			.css({
				width:'32px'
				,height:'32px'
				,padding:'0'
				,border:'0'
				,backgroundColor:'transparent'
			});
		$dlg.find("> .ui-dialog-titlebar , .ui-dialog-titlebar-close")
			.remove();
		$tc	.css({
				height:'auto'
				,backgroundColor:'transparent'
				,padding:'0'
			});
	}

	// call 原物件
	$dlg_tc.dialog(arg);

	return $dlg_tc;
}
function B_Dialog2_Close(dlg_id, bMy)
{
	var dlg_id = dlg_id || "seDialog2";
	if (bMy == true) {
		if (window != window.parent && window.parent.B_Dialog2_Close)
			window.parent.B_Dialog2_Close(dlg_id);
	}
	else {
		$("#"+dlg_id).dialog("close");
	}
}
/////////


// 彈跳出等待 img, 會凍結網頁
// [opacity]
function B_Popup_Open_Wait(arg)
{
	arg = arg || {};
	var left = ($(window).width() - 32)/2;
	var top = ($(window).height() - 32)/2;
	var opacity = arg.opacity ? arg.opacity : 30;
	dlg =  '<div class="B_PopupMask" style="height:' + $(document).height() + 'px; position:fixed; z-index:500; left:0; top:0; width:100%; background:#000; opacity:'+(opacity/100)+'; -ms-filter:\'alpha(opacity='+opacity+')\'; filter:alpha(opacity='+opacity+');"></div>'
			+'<div class="B_PopupMask2" style="background-color:transparent; position:fixed; z-index:510; left:'+left+'px; top:'+top+'px;">'
				+'<img align="absmiddle" src="/css/images/progress.gif">'
			+ '</div>';
	$('body').append( dlg );
}
// 彈跳視窗(用 IFrame), 會凍結網頁
// u: url
// style: css
// arg => {onLoad($doc), onclose }
function B_Popup_Open_IFrame(u, style)
{
	var arg = {};
	if (typeof(u) == "object") {
		arg = u;
		u = arg.u;
	} else {
		arg.style = style
		arg.auto_close = true;
		arg.bn_close = true;
	}
	if (!arg.style) arg.style = "";
	arg.style += ";overflow: hidden;";
	if (arg.bn_close == null) arg.bn_close = true;
	
	arg.h = '<iframe id="B_PopupIFrame" style="width:100%; height:100%; border:0;" src="'+u+'"></iframe>';
	if (arg.title) arg.h = '<div class="B_PopupTitle" style="border-bottom:solid 1px rgb(221, 221, 221); font-size: 16px; padding:4px 12px; overflow: hidden;">'+arg.title+'</div>'+arg.h;
	if (arg.bn_close) {
		arg.h += '<img id="B_PopupIFrame_BnClose" align="absmiddle" src="/css/images/close1.gif" onmouseover="src=\'/css/images/close2.gif\'" onmouseout="src=\'/css/images/close1.gif\'" style="position:absolute; cursor:pointer; top:5px; right:5px;">';
	}
	if (B_Popup_Open(arg) == false) return false;
	
	$("#B_PopupIFrame_BnClose").click(function(){
		B_Popup_Close();
	});
	arg.$if = $("#B_PopupIFrame").load(function(){
		var oif= this;
		try {
			$doc = $(oif.contentDocument ? oif.contentDocument: oif.contentWindow.document);
			var h = $(oif.contentWindow).height() - $(oif.contentDocument || oif.contentWindow.document).height();
			if (h < 0) h = -h;
			if (h <= 20)
				$("#B_PopupIFrame_BnClose").css({"top":5, "right":5});
			else
				$("#B_PopupIFrame_BnClose").css({"top":5, "right":25});
			
		} catch(e){}
		if (arg.onLoad) arg.onLoad($doc);
	});
	return true;
}
// 彈跳視窗(用 Div), 會凍結網頁
// h: html 內容
// w_PM2: 陰影距離 // 停用
// style:
// zIndex: 
// arg.auto_close: 點外框 自動閉閉
// pop_scrollbar: 
function B_Popup_Open(h, w_PM2, style)
{
	var arg = {};
	if (typeof(h) == "object") {
		arg = h;
		h = arg.h;
		style = arg.style;
		if (arg.auto_close != false) arg.auto_close = true;
	} else {
		arg.auto_close = true;
	}

	if ($(".B_Popup").length > 0) 
		return false;
	if (!style) style = "";
	
	var h_dlg;
	var zIndex = arg.zIndex || 490;
	if (sys_is_mobile) {
		h_dlg =  '<div class="B_PopupMask" style="position:absolute; width:100%; height:'+$(document).height()+'px; z-index:'+zIndex+'; left:0; top:0; background:#000; opacity:0.3; filter:alpha(opacity=30);"></div>'
			+'<div class="B_Popup" style="border-radius:4px; -moz-border-radius:4px; -webkit-border-radius:4px; ebkit-box-shadow:rgba(0, 0, 0, 0.2) 0px 4px 16px; box-shadow:rgba(0, 0, 0, 0.2) 0px 4px 16px; border:1px solid rgb(221, 221, 221); background:#fff; position:absolute; overflow:hidden; z-index:'+(zIndex+2)+'; '+style+'">'
				+h
			+'</div>';
	} else {
		h_dlg =  '<div class="B_PopupMask" style="position:fixed; width:100%; height:'+$(document).height()+'px; z-index:'+zIndex+'; left:0; top:0; background:#000; opacity:0.3; filter:alpha(opacity=30);"></div>'
			+'<div id="B_Popup" class="B_Popup" style="border-radius:4px; -moz-border-radius:4px; -webkit-border-radius:4px; ebkit-box-shadow:rgba(0, 0, 0, 0.2) 0px 4px 16px; box-shadow:rgba(0, 0, 0, 0.2) 0px 4px 16px; border:1px solid rgb(221, 221, 221); background:#fff; position:fixed; overflow:hidden; overflow-y:auto; z-index:'+(zIndex+2)+'; '+style+'">'
				+h
			+'</div>';
	}
	var $body = $('body').append(h_dlg);
	//
	B_Popup_BodyLock();
	// sys_body_scroll_top = $body.scrollTop();
	// var $pdc = $(".popup_dialog_bg_content");
	// if ($pdc.length == 0) $pdc = $("body");
	// $pdc.css({top: (-sys_body_scroll_top)+"px"})
		// .addClass("popup_dialog_body");
	//
	var $dlg = arg.$dlg = $(".B_Popup");
	if ($dlg.width() > $(window).width()) $dlg.width("98%");
	$dlg[0]['d_arg'] = arg;
	$dlg.find(".pop_scrollbar").css({overflowY:'auto'});
	$dlg.resize(function(){
		setTimeout( B_Popup_resize, 10 );
	}).resize();
	// 點外框 自動閉閉
	if (arg.auto_close)
		$(".B_PopupMask").click(B_Popup_Close);
	// 關閉視窗
	$dlg.bind("f_close", function(){
		if (arg.onclose)
			arg.onclose();
	});
	return true;
}

/*
*** B_Popup_Open_IFrame ***

function main_window_adjust() {
	var h = $(window).height();
	var h_o = $("body").height();
	// 大於視窗
// console.log('h_o='+h_o+', h='+h);
	var $sob = $(".pop_scrollbar");
	if ($sob.length > 0) {
		$sob.css({overflowY:'auto'});
		$sob.each(function(){
			var $t = $(this);
			var h_t = $t.height();
			var h_diff = h_o - h_t;
// console.log('h_t='+h_t+', h_diff='+h_diff);
			$t.height(h - h_diff);
		});
	}
}

*/
function B_Popup_resize()
{
	var $o = $(".B_Popup");
	if ($o.length == 0)
		return;
		
	// Popup Height
	if (!sys_is_mobile) {
		// 高度是百分比
		var bScaleHeight = /height:\s?\d+\%\;?/.test($o.attr("style"));
		if (!bScaleHeight)
		{
			var h_win = $(window).height();
			var h_frame = $o.height();
			//
			var h_frame_set = parseInt($o.attr("d_height"));
			if (!h_frame_set) {
				$o.attr("d_height", h_frame);
				h_frame_set = h_frame;
			}
			// 大於視窗
			if (h_frame > h_win) {
				$o.height(h_win);
			}
			// 小於
			else if (h_frame_set > h_frame) {
				if (h_frame_set < h_win)
					$o.height(h_frame_set);
				else
					$o.height(h_win);
			}
			var $sob = $(".pop_scrollbar");
// console.log('h_frame='+h_frame+', h_win='+h_win, h_frame_set);
			if ($sob.length > 0) {
				$sob.css({overflowY:'auto'});
				$sob.each(function(){
					var $t = $(this);
					var wid = $t.attr("pop_window_id");	// 自訂
					var fid = $t.attr("pop_frame_id");	// 自訂
					var h_w = wid == null ? h_win : $(wid).height();
					var h_f = fid == null ? h_frame : $(fid).height();
					var h_t = $t.height();
					var h_diff = h_f - h_t;
					var h_set = h_w - h_diff;
					if (h_set > h_frame_set) h_set = h_frame_set;
// console.log('h_t='+h_t+', h_diff='+h_diff, h_set);
					$t.height(h_set-2);
				});
			}
		}
	}
	// Popup Pos
	var left = ($(window).width() - $o.width())/2;
	var top = sys_is_mobile ? 5 : ($(window).height() - $o.height())/2;
	if (left < 0) left = 0;
	if (top < 0) top = 0;
	$o.css({"left":left+"px", "top":top+"px"});
	//
	if (sys_is_mobile) {
		if ($(".popup_dialog_bg_content").length > 0)
			$(".B_PopupMask").height(max($(window).height(),$o.height()+10));
		else {
			$(".B_PopupMask").height($(document).height());
			$o.css({"left":left+"px", "top":(sys_body_scroll_top+5)+"px"});
		}
	}
	else {
		$(".B_PopupMask").height($(document).height());
	}
}
// 關閉彈跳視窗
function B_Popup_Close()
{
	//$(".B_Popup").find("#bnCancel").click();
	$(".B_PopupMask, .B_PopupMask2").remove();
	$(".B_Popup")
		.trigger("f_close")
		.remove();
	
	B_Popup_BodyUnlock();
	// var $pdc = $(".popup_dialog_bg_content");
	// if ($pdc.length == 0) $pdc = $("body");
	// $pdc.removeClass("popup_dialog_body");
	// $("body").scrollTop(sys_body_scroll_top);
	
}
function B_Popup_BodyLock()
{
	var h_win = $(window).height();
	var $body = $('body');
	var $pdc = $(".popup_dialog_bg_content");
	sys_body_scroll_top = $body.scrollTop();
	if ($pdc.length == 0) $pdc = $("body");
	$pdc.css({top: (-sys_body_scroll_top)+"px"})
		.addClass("popup_dialog_body");
}
function B_Popup_BodyUnlock()
{
	var $pdc = $(".popup_dialog_bg_content");
	if ($pdc.length == 0) $pdc = $("body");
	$pdc.removeClass("popup_dialog_body");
	$("body").scrollTop(sys_body_scroll_top);
}
// 限制圖片大小
// $os: 那些物件
// ls: {w:xx, h:xx}限制大小
function img_LimiSize_css($os, ls)
{
	$os.css({"max-width":ls.w, "max-height":ls.h});
}
function img_LimiSize($os, ls)
{
	$os	.load( function(){img_DoLimiSize($(this), ls);} )
		.each( function(){img_DoLimiSize($(this), ls);} );
}
function img_DoLimiSize($o, ls)
{
	var img=$o, ls_o;
	img.css({width:"auto", height:"auto"});
	if (ls.w > 0 && img.width() > 0) {
		ls_o = img_GetLimiSize(img.width(), img.height(), ls);
		if (ls_o.w > 0 || ls_o.h > 0)
			img.css({width:ls_o.w, height:ls_o.h});
	}
}
function img_GetLimiSize(w, h, ls)
{
	var nRate;
	if ( (ls.w > -1 && w > ls.w) || (ls.h > -1 && h > ls.h) ) {
		nRate = ( ls.h == -1 ? ls.w / w
				: ls.w == -1 ? ls.h / h
				: min(ls.w / w, ls.h / h) ); 
		w = w * nRate;
		h = h * nRate;
		if ( w < 1 ) w = 1;
		if ( h < 1 ) h = 1;
		return {w:w, h:h};
	}
	return {w:0, h:0};
}
// 轉換比較 m:[null(w<s,w<l) / 1(w<>s,w<l)]
function B_con_rate_size(w, h, ls, m)
{
	var nRate = ( ls.h == -1 ? ls.w / w
				: ls.w == -1 ? ls.h / h
				: min(ls.w / w, ls.h / h) ); 
	if (m == 1)
	{
		w = w * nRate;
		h = h * nRate;
		if ( w < 1 ) w = 1;
		if ( h < 1 ) h = 1;
		return {w:w, h:h};
	}
	else
	{
		if ( (ls.w > -1 && w > ls.w) || (ls.h > -1 && h > ls.h) ) {
			w = w * nRate;
			h = h * nRate;
			if ( w < 1 ) w = 1;
			if ( h < 1 ) h = 1;
			return {w:w, h:h};
		}
	}
	return {w:0, h:0};
}
function min(a,b)
{
	return a < b ? a : b;
}
function max(a,b)
{
	return a > b ? a : b;
}
// 取得 user os 版本
function B_getWindowVersion()
{
	var re = new RegExp('(\\(|;)\\s*Windows NT ([\\d.]*)(;|\\))', 'i');
	var a = re.exec(navigator.appVersion);
	var n = (a ? parseFloat(a[2]) : 0);
	return isNaN(n) ? 0 : n;
}
// 取得 瀏覽器 版本
function B_getBrowserName()
{
	var unknown = '-';
	
	var nVer = navigator.appVersion;
	var nAgt = navigator.userAgent;
	var browserName  = navigator.appName;
	var fullVersion  = ''+parseFloat(navigator.appVersion); 
	var majorVersion = parseInt(navigator.appVersion,10);
	var nameOffset,verOffset,ix;

	// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
	   browserName = "Opera";
	   fullVersion = nAgt.substring(verOffset+6);
	   if ((verOffset=nAgt.indexOf("Version"))!=-1) 
		 fullVersion = nAgt.substring(verOffset+8);
	}
	// In MSIE, the true version is after "MSIE" in userAgent
	else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
	   browserName = "IE";
	   fullVersion = nAgt.substring(verOffset+5);
	}
	else if ((verOffset=navigator.userAgent.match(/Trident.*rv\:([\d\.]+)/))) {
	   browserName = "IE";
	   fullVersion = verOffset[1];
	}
	// In Chrome, the true version is after "Chrome" 
	else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
	   browserName = "Chrome";
	   fullVersion = nAgt.substring(verOffset+7);
	}
	// In Safari, the true version is after "Safari" or after "Version" 
	else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
	   browserName = "Safari";
	   fullVersion = nAgt.substring(verOffset+7);
	   if ((verOffset=nAgt.indexOf("Version"))!=-1) 
		 fullVersion = nAgt.substring(verOffset+8);
	}
	// In Firefox, the true version is after "Firefox" 
	else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
		browserName = "Firefox";
		fullVersion = nAgt.substring(verOffset+8);
	}
	// In most other browsers, "name/version" is at the end of userAgent 
	else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < (verOffset=nAgt.lastIndexOf('/')) ) {
		browserName = nAgt.substring(nameOffset,verOffset);
		fullVersion = nAgt.substring(verOffset+1);
		if (browserName.toLowerCase()==browserName.toUpperCase()) {
		   browserName = navigator.appName;
		}
	}
	// trim the fullVersion string at semicolon/space if present
	if ((ix=fullVersion.indexOf(";"))!=-1)
		fullVersion=fullVersion.substring(0,ix);
	if ((ix=fullVersion.indexOf(" "))!=-1)
		fullVersion=fullVersion.substring(0,ix);

	majorVersion = parseInt(''+fullVersion,10);
	if (isNaN(majorVersion)) {
		fullVersion  = ''+parseFloat(navigator.appVersion); 
		majorVersion = parseInt(navigator.appVersion,10);
	}

    // mobile version
    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);
	
	// system
	var os = unknown;
	var clientStrings = [
		{s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
		{s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
		{s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
		{s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
		{s:'Windows Vista', r:/Windows NT 6.0/},
		{s:'Windows Server 2003', r:/Windows NT 5.2/},
		{s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
		{s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
		{s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
		{s:'Windows 98', r:/(Windows 98|Win98)/},
		{s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
		{s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
		{s:'Windows CE', r:/Windows CE/},
		{s:'Windows 3.11', r:/Win16/},
		{s:'Android', r:/Android/},
		{s:'Open BSD', r:/OpenBSD/},
		{s:'Sun OS', r:/SunOS/},
		{s:'Linux', r:/(Linux|X11)/},
		{s:'iOS', r:/(iPhone|iPad|iPod)/},
		{s:'Mac OS X', r:/Mac OS X/},
		{s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
		{s:'QNX', r:/QNX/},
		{s:'UNIX', r:/UNIX/},
		{s:'BeOS', r:/BeOS/},
		{s:'OS/2', r:/OS\/2/},
		{s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
	];
	for (var id in clientStrings) {
		var cs = clientStrings[id];
		if (cs.r.test(nAgt)) {
			os = cs.s;
			break;
		}
	}

	var osVersion = unknown;

	if (/Windows/.test(os)) {
		osVersion = /Windows (.*)/.exec(os)[1];
		os = 'Windows';
	}

	switch (os) {
		case 'Mac OS X':
			osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
			break;

		case 'Android':
			osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
			break;

		case 'iOS':
			osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
			osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
			break;
	}
	
	
	return {
		name: 	browserName
		,ver: 	fullVersion
		,mobile: mobile
        ,os: 	os
        ,osVer: osVersion
	}
}
function B_getCurrentTime()
{
	return (new Date()).getTime();
}
function B_getCurrentTimeSec()
{
	return parseInt((new Date()).getTime()/1000);
}
function B_getCurrentTimeStr(n, type)
{
	var t = n ? (new Date(n)) : (new Date());
	var Y = t.getFullYear();
	var M = t.getMonth()+1;
	var D = t.getDate();
	var h = t.getHours();
	var m = t.getMinutes();
	var s = t.getSeconds();
	
	// YYYYMMDDhhmmss
	if (type == 1) {
		return Y+(M<10?"0":"")+M+(D<10?"0":"")+D
				+(h<10?"0":"")+h+(m<10?"0":"")+m+(s<10?"0":"")+s;
	}
	// YYYY/MM/DD
	else if (type == 2) {
		return Y+"/"+(M<10?"0":"")+M+"/"+(D<10?"0":"")+D;
	}
	// YYYY-MM-DD
	else if (type == 3) {
		return Y+"-"+(M<10?"0":"")+M+"-"+(D<10?"0":"")+D;
	}
	// hh:mm
	else if (type == 4) {
		return (h<10?"0":"")+h+":"+(m<10?"0":"")+m;
	}
	// YYYY/MM/DD hh:mm:ss.xxx
	else if (type == 5) {
		return Y+"/"+(M<10?"0":"")+M+"/"+(D<10?"0":"")+D
				+" "+(h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s
				+"."+t.getMilliseconds();
	}
	// hh:mm:ss
	else if (type == 6) {
		return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
	}
	// YYYY/MM/DD hh:mm:ss
	else {
		return Y+"/"+(M<10?"0":"")+M+"/"+(D<10?"0":"")+D
				+" "+(h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
	}
}

function B_getHostIP()
{
	return location.hostname+(location.port != "" ? ":"+location.port : "");
}
function B_getField(s, n, sign)
{
	if (!s) return null;
	var a = s.split(sign);
	return n >= a.length ? null : a[n];
}


// 取得 Cookie
function B_getCookie(k)
{
	var re = new RegExp('(^|;)\\s*'+k+'=([^;]*)\\s*(;|$)', 'i');
	var a = re.exec(document.cookie);
	return (a ? unescape(a[2]) : null);
}
// 設定 Cookie, 以毫秒為單位
function B_Cookie_set_ByTime(k,v,milliseconds,path,domain)
{
	var exdate = new Date()                        	// 宣告 exdate
	exdate.setTime(exdate.getTime() + milliseconds);// 將 exdate 設成今天加上過期秒數
	document.cookie = k + "=" + escape(v)  			// 產生 cookie 內容  c_name=escape(value);expires=exdate
					+	((milliseconds==null) 	? "" : "; expires=" + B_Date_ToStandardGMT(exdate))
					+	((path==null) 			? "" : "; path=" 	+ path)
					+	((domain==null) 		? "" : "; domain=" 	+ domain)
					;
}
// 設定 Cookie, 以天為單位
function B_Cookie_set_ByDay(k,v,expire_days,path,domain)
{
	var exdate = new Date()                        	// 宣告 exdate
	exdate.setDate(exdate.getDate() + expire_days);  // 將 exdate 設成今天加上過期天數
	document.cookie = k + "=" + escape(v) 	 		// 產生 cookie 內容  c_name=escape(value);expires=exdate
					+	((expire_days==null) ? "" : "; expires=" + B_Date_ToStandardGMT(exdate))
					+	((path==null) 		? "" : "; path=" 	+ path)
					+	((domain==null) 	? "" : "; domain=" 	+ domain)
					;
}
// 將日期物件轉成 格林威治時間
function B_Date_ToStandardGMT(t)
{
	return 	B_Date_Num2Word_Week(t.getUTCDay()) + "," + 
			" " + t.getUTCDate() + " " + B_Date_Num2Word_Month(t.getUTCMonth()+1) + " " + t.getUTCFullYear() + 
			" " + t.getUTCHours() + ":" + t.getUTCMinutes() + ":" + t.getUTCSeconds() + 
			" GMT";
}
// 將數字 轉成 英文月份
function B_Date_Num2Word_Month(n)
{
	switch ( n ) {
		case 1:
			return "Jan";
		case 2:
			return "Feb";
		case 3:
			return "Mar";
		case 4:
			return "Apr";
		case 5:
			return "May";
		case 6:
			return "Jun";
		case 7:
			return "Jul";
		case 8:
			return "Aug";
		case 9:
			return "Sep";
		case 10:
			return "Oct";
		case 11:
			return "Nov";
		case 12:
			return "Dec";
	}
	return "";
}
// 將數字 轉成 英文星期
function B_Date_Num2Word_Week(n)
{
	switch ( n ) {
		case 1:
			return "Mon";
		case 2:
			return "Tue";
		case 3:
			return "Wed";
		case 4:
			return "Thu";
		case 5:
			return "Fri";
		case 6:
			return "Sat";
		case 7:
			return "Sun";
	}
	return "";
}
// 取得物件長度
function B_getLength(o)
{
	var l=0;
	for (var n in o) l++;
	return l;
}
// object 和並, 以 object2 為主
function B_obj_merge(obj1, obj2)
{
	var out = {};
	for (var n in obj1)
		out[n] = obj1[n];
	if (obj2) {
		for (var n in obj2)
			out[n] = obj2[n];
	}
	return out;
}
// 
function B_obj_indexOf(obj, k, v)
{
	for (var n in obj) {
		if (obj[n][k] == v)
			return n;
	}
}
function B_obj_getCols(obj, k)
{
	var out = [], v;
	for (var n in obj) {
		v = obj[n][k];
		if (v) out.push(v);
	}
	return out;
}
function B_obj_getKeys(obj)
{
	var out = [];
	for (var n in obj)
		out.push(n);
	return out;
}


// 物件 轉成 字串
function B_Object2String(o, type)
{
	return con_Object2String(o, type);
}
function con_Object2String(o, bH, limi, level) 
{
	var BSign, l, marN, marT;
	if (!limi) limi = -1;
	if (typeof(level) != "number") level = 0;
	l = level++;
	if (bH) {
		marN = "<br>";
		marT = "&nbsp;&nbsp;&nbsp;&nbsp;";
	} else {
		marN = "\r\n";
		marT = "\t";
	}
	BSign = marN;
	while(l-- > 0) {
		BSign += marT;
	}
	
	var x = 0;
	var ss = "";
	for (var n in o) {
		x++;
		if (n.indexOf("-") > -1)
			k = "\"" + n + "\"";
		else
			k = n;
		
		switch(typeof(o[n])) {
		case "object":
			if (limi == -1 || level <= limi)
				ss += BSign + x+". "+ k+"("+B_getLength(o[n])+")" + ":{" + con_Object2String(o[n], bH, limi, level) + BSign + "},";
			else 
				ss += BSign + x+". "+ k+"("+B_getLength(o[n])+")" + ":{limitation},";
			break;
			
		case "number":
		case "boolean":
			ss += BSign + x+". "+ k + ':' + o[n] + ',';
			break;
		
		case "string":
			ss += BSign + x+". "+ k + ':"' + B_HTMLEnCode(o[n]) + '",';
			break;
		}
	}
	
	if (ss.length) ss = ss.substr(0,ss.length-1);
	return ss;
}
// 特殊碼轉成 html碼
function B_HTMLEnCode(str, bEnter)
{   
	if (!str) return "";
	var	s    =    "";   
	if	(str.length == 0) return "";
	s	= str.replace(/&/g,	"&amp;");
	s	= s.replace(/</g,   "&lt;");
	s	= s.replace(/>/g,   "&gt;");
	s	= s.replace(/    /g,"&nbsp;");
	s	= s.replace(/\'/g,  "&#39;");
	s	= s.replace(/\"/g,  "&quot;");
	if (bEnter != false) s = s.replace(/\r*\n/g, "<br>");
	return s;   
}
function B_HTMLDecode(str)
{
	return $('<div/>').html(str).text();
}
// 名稱不允許的特殊符號
//var sys_fn_SpecialSymbols = "[\/:*?\"<>|\t]";
function B_is_Name_SpecialSymbols(fn)
{
	return /[\\\/\*\|\t\,\;]/.test(fn);
}
// 檔名不允許的特殊符號
//var sys_fn_SpecialSymbols = "[\/:*?\"<>|\t]";
function B_is_FileName_SpecialSymbols(fn)
{
	return /[\\\/\:\*\?\"<>\|\t]/.test(fn);
}
function B_FileName_Filter(fn)
{
	return fn.replace(/[\\\/\:\*\?\"<>\|\t]/g ,"_");
}

function B_IsUrl(url) 
{
	return /^https?\:\/\//i.test(url);
}
function B_is_mail(m)
{
	if (!m || m.length == 0) return false;
	x = m.indexOf("@");
	if (x == -1) return false;
	x = m.indexOf(".", x);
	if (x == -1) return false;
	return true;
}
function B_is_ie11()
{
	var m = navigator.userAgent.match(/rv:(11.0)/i);
	return m ? (m[1] == "11.0" && B_is_windows()) : false;
}
function B_is_ie()
{
	var m = navigator.userAgent.match(/(msie) ([\w.]+)/i);
	if (m) return m[2];
	m = navigator.userAgent.match(/Trident\/7.0;(.*)rv:([\w.]+)/i);
	if (m) return m[2];
	return false;
}
function B_is_windows()
{
	var m = navigator.userAgent.match(/(Windows NT)\s?([\d.]+)/i);
	return m ? parseFloat(m[2]) : false;
}
// IE 8 以下
function B_is_ie_8f()
{
	var n = B_is_ie();
	if (!n) return false;
	return parseInt(n) <= 8;
}
// var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
// var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
// var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
// var is_safari = navigator.userAgent.indexOf("Safari") > -1;
// var is_Opera = navigator.userAgent.indexOf("Presto") > -1;
// if ((is_chrome)&&(is_safari)) {is_safari=false;}
function B_is_chrome()
{
	var m = navigator.userAgent.match(/Chrome\/([\d]+)/i);
	return m ? parseInt(m[1]) : false;
	//return navigator.userAgent.indexOf('Chrome') > -1;
}
function B_is_safari()
{
	var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
	var is_safari = navigator.userAgent.indexOf("Safari") > -1;
	if ((is_chrome)&&(is_safari)) {is_safari=false;}
	return is_safari;
}
function B_is_console()
{
	return typeof(console) == "object";
}
function B_is_firefox()
{
	// Firefox/20.0
	var m = navigator.userAgent.match(/(firefox)\/([\w.]+)/i);
	return m ? m[2] : false;
}
function B_is_mobile()
{
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
}
function B_is_android()
{
	return /Android/i.test(navigator.userAgent);
}
function B_is_apple()
{
	return /mac|ipad|iphone|ipod/i.test(navigator.userAgent);
}
function B_is_apple_mobile()
{
	return /ipad|iphone|ipod/i.test(navigator.userAgent);
}
function B_is_html5()
{
	return B_is_mobile() || B_is_apple();
}
function B_is_exists_script(url) {
	var elements = document.getElementsByTagName('script');
	for (var i=0; i<elements.length; i++) {
		if (elements[i].src && (elements[i].src.indexOf(url) != -1)) {
			return true;
		}
	}
	return false;
}


function B_LoadScrip(url)
{
	var elm = tinyMCE.DOM.create('script', {
		type : 'text/javascript',
		src : url
	});
	(document.getElementsByTagName('head')[0] || document.body).appendChild(elm);
}
function B_GetBaseURL(JSFileName)
{
	var elements = document.getElementsByTagName('script');
	var baseURL = "";
	var baseHREF = "";

	// If base element found, add that infront of baseURL
	nl = document.getElementsByTagName('base');
	for (i=0; i<nl.length; i++) {
		if (nl[i].href)
			baseHREF = nl[i].href;
	}

	for (var i=0; i<elements.length; i++) {
		if (elements[i].src && elements[i].src.indexOf(JSFileName) != -1) {
			var src = elements[i].src;
			src = src.substring(0, src.lastIndexOf('/')+1);

			// Force it absolute if page has a base href
			if (baseHREF != "" && src.indexOf('://') == -1)
				baseURL = baseHREF + src;
			else
				baseURL = src;
			break;
		}
	}
	return baseURL;
}
function B_ScriptIsExists(fn)
{
	var elements = document.getElementsByTagName('script');
	for (var i=0; i<elements.length; i++) {
		if (elements[i].src.indexOf(fn) > -1)
			return true;
	}
	return false;
}
function B_LinkIsExists(fn)
{
	var elements = document.getElementsByTagName('link');
	for (var i=0; i<elements.length; i++) {
		if (elements[i].href.indexOf(fn) > -1)
			return true;
	}
	return false;
}



// 取檔名
function B_URL_MakeFileName(u, bExt)
{
	if (!u) return "";
	if (u.indexOf("[") > -1) {
		x = u.lastIndexOf(".");
		if (x > -1) u = u.substr(0, x);
	}
	else {
		x = u.indexOf("?");
		if (x > -1) u = u.substr(0,x);
		x = u.lastIndexOf("/");
		if (x > -1) u = u.substring(x+1,u.length);
		x = u.lastIndexOf("\\");
		if (x > -1) u = u.substring(x+1,u.length);
		if (typeof(bExt) == "undefined" || !bExt ) {
			x = u.lastIndexOf(".");
			if (x > -1) u = u.substr(0, x);
		}
	}
	return u;
}
// 取副檔名
function B_URL_MakeExtension(u)
{
	if (!u) return "";
	x = u.indexOf("?");
	if (x > -1) u = u.substr(0,x);
	x = u.lastIndexOf("/");
	if (x > -1) u = u.substr(x+1);
	x = u.lastIndexOf(".");
	if (x > -1) return u.substring(x+1, u.length);
	return "";
}

// del IP and FileName; is del '/'
function B_URL_MakePath(u, bH, bRR)
{
	if (!u) return "";
	u = B_URL_MakePathFile(u, bH, false);
	var x = u.lastIndexOf("/");
	if (x > -1)
		return u.substr(0, (bRR ? x+1 : x));
	else
		return "";
}
// del FileName; is del IP or '/'
function B_URL_MakePath2(u, bHttp, bRR)
{
	if (u == null || u == "") return "";
	if (bHttp != true)
		u = u.replace(/https?\:\/\/[^\/]+/i, "");
	
	var x = u.indexOf("?");
	if (x > -1)
		x = u.lastIndexOf("/", x);
	else
		x = u.lastIndexOf("/");
	if (bRR == true) x++;
	return x > -1 ? u.substring(0, x) : u;
}

// del IP, del Arg
function B_URL_MakePathFile(u, bRoot, bArg)
{
	if (!u) return "";
	var x=-1;
	if (u.substr(0,7).toLowerCase() == "http://") x = 7;
	if (u.substr(0,8).toLowerCase() == "https://") x = 8;
	if (x > -1) {
		x = u.indexOf("/", x);
		if (x > -1) {
			if (!bRoot) x++;
			u = u.substr(x);
		}
	}
	if ( !bArg ) {
		x = u.indexOf("?");
		if (x > -1) u = u.substr(0,x);
	}
	return u;
}
function B_URL_MakeIPPort(u, bHttp, bRootR)
{
	if (!u) return "";
	if (!B_IsUrl(u)) return "";
		
	var x = 0;
	if (bHttp)
		x = 7;
	else
		u = u.substring(7,u.length);
	
	x = u.indexOf('/',x);
	if (x > -1) {
		if (bRootR) x++;
		u = u.substring(0,x);
	}
	return u;
}



function B_ReplaceExtension(fp, ext)
{
	var re = new RegExp('\\.[^\\/\\.]*$', 'i');
	if (re.test(fp))
		return fp.replace(re, '.'+ext);
	else
		return fp+"."+ext;
}

function B_Reg_Quote(s)
{
	if (!s) return "";
	var sz = "\\/*?|{}[]()+^$.-:";
	var c, out = "";
	for(var x=0; x<s.length; x++) {
		c = s[x];
		if (sz.indexOf(c) > -1)
			out += '\\';
		out += c;
	}
	return out;
}

function B_URL_GetIPPort(u, bH)
{
	if (!u || u == "") return "";
	if (typeof(bH) == "undefined") bH = false;
	
	var x=-1;
	if (u.substr(0,7).toLowerCase() == "http://") x = 7;
	if (u.substr(0,8).toLowerCase() == "https://") x = 8;
	if (x == -1) return "";
	
	if (bH == false) {
		u = u.substr(x);
		x = 0;
	}
	var y  = u.indexOf("/", x);
	if (y > -1) u = u.substr(0, y);
	return u;
}
function B_URL_GetIP(u,arg)
{
	var ip = B_URL_GetIPPort(u);
	if (ip == "") return "";
	x = ip.indexOf(":");
	if (x > -1) ip = ip.substr(0, x);
	return ip;
}
function B_URL_AddFileName(u,fn)
{
	return (u+"/"+fn).replace(/[\/\\]{2,}/g, "/");
}
function B_URL_AddArg(u,arg) 
{
	u += (u.indexOf("?") == -1 ? "?" : "&");
	return u += arg;
}
// url 取得參數
function B_URL_GetArg(u,k) 
{
	if (!u) return null;
	var x = u.indexOf('?');
	if ( x > -1 ) u = u.substr(x+1);
	if (!k || k == "") return u;
	var re = new RegExp('(^|&)'+k+'=([^&#]*)(&|$|#)', 'i');
	var a = re.exec(u);
	return (a ? a[2] : null);
}
// url 設定參數
function B_URL_SetArg(u,k,v) 
{
	var x = u.indexOf('?')+1;
	var n = k + "=";
	if (u.substring(x,x+n.length) != n) {
		n = "&"+n;
		x = u.indexOf(n,x);
	}
	if (x == -1) {
		x = u.indexOf("#");
		if (x > -1)
			return u.substr(0,x) +"&"+k+"="+encodeURIComponent(v) +u.substr(x);
		else
			return B_URL_AddArg(u,k+"="+encodeURIComponent(v));
	}
	
	x += n.length;
	var y = u.indexOf('&',x);
	return u.substr(0,x) + v + (y > -1 ? u.substr(y) : "");
}
function B_URL_DelArg(u,k)
{
	var x = u.indexOf('?')+1;
	var y1 = u.indexOf('#',x);
	var n = k + "=";
	if (u.substring(x,x+n.length) != n) {
		n = "&"+n;
		x = u.indexOf(n,x);
	}
	if (x == -1 || (y1 > -1 && x > y1)) {
		return u;
	}
	
	var ln = n.length;
	var y = u.indexOf('&',x+ln);
	var y1 = u.indexOf('#',x+ln);
	if (y1 > -1 && (y == -1 ||y1 < y)) y = y1-1;
	return u.substr(0,x) + (y > -1 ? u.substr(y+1) : "");
}
function B_URL_GetHash(u)
{
	var x = u.lastIndexOf('#',x);
	if (x > -1)
		return u.substr(x+1);
	return "";
}
function B_URL_DelHash(u)
{
	var x = u.lastIndexOf('#',x);
	if (x > -1) {
		var y = u.indexOf('?');
		if (x > y) return u.substr(0,x);
	}
	return u;
}
// 限制字串長度.
function B_URL_PathLimitSize(u,l,bHtml)
{
	if (!u || u == "") return "";
	if (B_STR_GetLengthCht(u) <= l) return u;
	a = u.split("/");
	l -= (a.length-1)*3;
	l_l = parseInt(l/3);
	l_r = parseInt(l/3*2);
	n = $.trim(a[a.length-1]);
	if (B_STR_GetLengthCht(n) > l_r) {
		l = parseInt(l/2);
		if (bHtml)
			n = '<span title="'+n+'">'+B_STR_Substr(n,l_r,true)+"</span>";
		else
			n = B_STR_Substr(n,l_r,true)
	}
	//
	cnt = a.length-1;
	out = "";
	for (var x=0; x<cnt; x++) {
		n1 = $.trim(a[x]);
		l1 = B_STR_GetLengthCht(n1);
		if (l_l <= 0) {
			if (bHtml)
				out += '/<span title="'+n1+'">...</span>';
			else
				out += "/...";
		}
		else if (l1 > l_l) {
			if (bHtml)
				out += '/<span title="'+n1+'">'+B_STR_Substr(n1,l_l,true)+"</span>";
			else
				out += "/"+B_STR_Substr(n1,l_l,true);
			l_l = 0;
		}
		else {
			out += "/"+n1;
			l_l -= l1;
		}
	}
	out += "/"+n;
	return out.substr(1);
}
function B_URL_Parse(str)
{
	// 0:all, 1:httpx, 2:host, 3:.com, 4:ufp
	var regexp = /(http|ftp|https):\/\/([\w-]+(\.[\w-]+)+)([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
	return str.match(regexp);
}
function B_URL_Parse_Html(str)
{
	// 0:all, 1:url-left, 2:label, 3:[href/src], 4:url, 5:httpx, 6:host, 7:.com, 8:ufp, 9:utl-right
	var regexp = /(\<(a|img) [^>]*(href|src)=["']?)?((http|ftp|https):\/\/([\w-]+(\.[\w-]+)+)([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)([^<>]*>)?/;
	return str.match(regexp);
}
function B_URL_InsertPath(path, urlMain) 
{
	if (path == null || path == "" || B_IsUrl(path)) return path;
	if (path.substr(0,2) == '//') {
		return "http:"+path;
	}
	else if (path.substr(0,1) == '/') {
		return B_URL_MakeIPPort(urlMain, true, false)+path;
	}
	else if (path.substr(path,0,1) == '#') {
		return urlMain+path;
	}
	// else if (path.substr(path,0,1) == '?') {
		// return B_URL_DelArg(urlMain)+path;
	// }
	else {
		urlMain = B_URL_MakePath2(urlMain, true, true);
		if (urlMain.substr(-1) != '/') urlMain += '/';
		return urlMain+path;
	}
}


// 暫停一段時間
function B_Sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// 限制字串長度.
function B_STR_LimitSize(s,l) 
{
	if (s.length <= l) return s;
	return $.trim(s.substr(0,l))+"...";
}
// 英1 中2 計算
function B_STR_Substr(str,l,b)
{
	if (B_STR_GetLengthCht(str) <= l)
		return str;
		
	var out = "";
	var ll = 0;
	for(var i=0; ll<l && i<str.length; i++) {
		ll++;
		out += str[i];
		if (/[^\x00-\xff]/i.test(str[i]))
			ll++;
	}
	return out+(b == true ? "..." : "");
}
// 計算中文字長度
function B_STR_GetLengthCht(str)  
{ 
	if (!str) return 0;
	//計算有幾個全型字、中文字...  
	var c = str.match(/[^ -~]/g);  
	return str.length + (c ? c.length : 0);  
}
// html 的標籤不計算長度
function B_STR_Substr_html(str,l,b)
{
	if (B_STR_GetLengthCht_html(str) <= l)
		return str;
		
	var out = "", ss, j, m;
	var ll = 0;
	for(var i=0; ll<l && i<str.length; i++) {
		// Html
		if (str[i] == "<") {
			ss = str.substr(i+1,5).toLowerCase();
			if ((m=ss.match(/a |\/a|span[ \>]/i))) {
				j = i; i += m[0].length;
				while (i < str.length && str[i] != ">")
					i++;
				out += str.substr(j, i-j+1)
				continue;
			}
			ss = str.substr(i,7).toLowerCase();
			if ((m=ss.match(/\<br\>|\<\/a\>|\<\/span\>/i))) {
				i += m[0].length;
				out += m[0];
				continue;
			}
		}
		//
		ll++;
		out += str[i];
		if (/[^\x00-\xff]/i.test(str[i]))
			ll++;
	}
	return out+(b == true ? "..." : "");
}
function B_STR_GetLengthCht_html(str)
{ 
	var ss, j;
	var ll = 0;
	for(var i=0; i<str.length; i++) {
		// Html
		if (str[i] == "<") {
			ss = str.substr(i+1,5).toLowerCase();
			if ((m=ss.match(/a |\/a|span[ \>]/i))) {
				j = i; i += m[0].length;
				while (i < str.length && str[i] != ">")
					i++;
				continue;
			}
			ss = str.substr(i,7).toLowerCase();
			if ((m=ss.match(/\<br\>|\<\/a\>|\<\/span\>/i))) {
				i += m[0].length;
				continue;
			}
		}
		//
		ll++;
		if (/[^\x00-\xff]/i.test(str[i]))
			ll++;
	}
	return ll;
}

function B_Iframe_doc($if)
{
	var oif = $if.get(0);
	return $(oif.contentDocument ? oif.contentDocument : oif.contentWindow.document);
}
// Iframe, 重設高度為內部的高度
function B_Iframe_ResetHeight($ifs, bAuto)
{
	if (typeof(bAuto) == "undefined") bAuto = true;
	$ifs.load( if_onload )
		.each( if_onload );

	function if_onload() {
		var iframe=this, $doc, h;
		try {
			if (bAuto) {
				$(iframe.contentDocument ? iframe.contentDocument.parentWindow : iframe.contentWindow).resize(function(){
					adjust_height(iframe);
				}).resize();
			}
			else 
				adjust_height(iframe);
		} catch(e){}
	}
	function adjust_height(iframe) {
		var $doc, h;
		try {
			$doc = $(iframe.contentDocument ? iframe.contentDocument: iframe.contentWindow.document);
			if ($doc.length == 1) {
				h = $doc.find("body").height();
				if (h > 0) {
//					if (h > 500) h = 500; if (h < 100) h = 100;
					if (h < 100) h = 100;
					$(iframe).height(h);
				}
			}
		} catch(e){}
	}
}

function B_goFullscreen(id, doc)
{
	if (!doc) doc = document;
	var element = id && id != "" ? doc.getElementById(id) : doc.body;
	
	if (element) {
		if (element.requestFullscreen) {
			element.requestFullscreen();
		}
		else if (element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
		else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		}
		else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else {
			return false;
		}
	} else {
		return false;
	}
	return true;
}
function B_cancelFullscreen(doc)
{
	if (!doc) doc = document;
    if (doc.cancelFullScreen) {
		doc.cancelFullScreen();
    } else if (doc.mozCancelFullScreen) {
		doc.mozCancelFullScreen();
    } else if (doc.webkitCancelFullScreen) {
		doc.webkitCancelFullScreen();
    }
}
// 是否有全銀幕功能
function B_hasFullscreen(doc)
{
	if (!doc) doc = document;
	var obj = doc.createElement('span')
	
	return obj.webkitRequestFullScreen
			|| obj.requestFullScreen
			|| obj.mozRequestFullScreen
}
// 是不在全銀幕
function B_isFullscreen(doc)
{
	if (!doc) doc = document;
	return doc.fullscreenElement 
			|| doc.mozFullScreenElement
			|| doc.webkitFullscreenElement
			|| B_isFullscreen_win();
}
function B_isFullscreen_win()
{
	return $(window).height() == screen.height;
}

function B_con_filesize2html(n)
{
	var s, l, x, out="";
	s = n+"";
	if (s.length <= 3) 
		return s;
		
	l1 = parseInt((s.length-1)/3);
	l2 = s.length%3;
	out = (l2 == 0 ? s.substr(0,3) 
					: s.substr(0,l2)+"."+s.substr(l2,3-l2))
	if (l2 == 1 && out.substr(-1) == "0") out = out.substr(0, 3);
	out += l1 == 1 ? "K" : l1 == 2 ? "M" : l1 == 3 ? "G" : l1 == 4 ? "T" : "?";
	return out;
}
// type: [null(0:00) / 2(00:00:00)]
function B_con_duration2html(n, type)
{
	if (isNaN((n=parseInt(n)))) return "";
	var h, m, s;
	h = parseInt(n/3600);
	m = parseInt((n%3600)/60);
	s = parseInt(n%60);
	if (type == 2) {
		return (h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
	} else {
		m = parseInt(n/60);
		return ""+m+":"+(s<10?"0":"")+s;
	}
}
function B_con_number2weekchar(n)
{
	switch(n){
		case 0:
			return getLang('s_Week0'); // "星期日";
		case 1:
			return getLang('s_Week1'); // "星期一";
		case 2:
			return getLang('s_Week2'); // "星期二";
		case 3:
			return getLang('s_Week3'); // "星期三";
		case 4:
			return getLang('s_Week4'); // "星期四";
		case 5:
			return getLang('s_Week5'); // "星期五";
		case 6:
			return getLang('s_Week6'); // "星期六";
	}
}
//
function B_con_rectime2timeobj(n)
{
	return new Date(n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2)
				+" "+n.substr(8,2)+":"+n.substr(10,2)+":"+n.substr(12,2));
}
function B_con_rectime2second(n)
{
	if (typeof(n) != "string" || n.length != 14)
		return 0;
	return B_con_rectime2timeobj(n).getTime()/1000;
}
function B_con_rectime2html(n, type, symbol)
{
	n = n+"";
	if (typeof(n) == "string" && n.length == 14)
	{
		if (symbol == null) symbol = "/";
		
		// yyy/mm/dd hh:mm:ss
		if (type == 1)
		{
			return n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2)
					+" "+n.substr(8,2)+":"+n.substr(10,2)+":"+n.substr(12,2);
		}
		// xx前
		else if (type == 2)
		{
			var out;
			var t = B_con_rectime2timeobj(n);
			var tCur = new Date();
			var tDiff = parseInt((tCur.getTime()-t.getTime())/1000);
			if (tDiff < 0) tDiff = 0;
			if (tDiff < 60)
				out = tDiff+" "+getLang('s_SecondsAgo'); // 秒前
			else if (tDiff < 3600)		// 1小時
				out = parseInt(tDiff/60)+" "+getLang('s_MinutesAgo'); // 分鐘前
			else if (tDiff < 86400)		// 1天
				out = parseInt(tDiff/3600)+" "+getLang('s_HoursAgo'); // 小時前
			else if (tDiff < 604800)	// 7天
				out = parseInt(tDiff/86400)+" "+getLang('s_DaysAgo'); // 天前
			else if (t.getFullYear() == tCur.getFullYear())
				out = (t.getMonth()+1)+"/"+n.substr(6,2);
			else
				out = n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2);
			return out;
		}
		// 1. hh:mm
		// 2. mm/dd 
		// 3. yyy/mm/dd 
		else if (type == 3)
		{
			var t = B_con_rectime2timeobj(n);
			var tCur = new Date();
			// 同一天
			if (t.getFullYear() == tCur.getFullYear()
				&& t.getMonth() == tCur.getMonth()
				&& t.getDate() == tCur.getDate())
				return n.substr(8,2)+":"+n.substr(10,2)
			// 同一年
			else if (t.getFullYear() == tCur.getFullYear())
				return n.substr(4,2)+"/"+n.substr(6,2);
			else
				return n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2);
		}
		// hh:mm
		else if (type == 4)
		{
			return n.substr(8,2)+":"+n.substr(10,2)
		}
		// mm/dd 
		else if (type == 5)
		{
			return n.substr(4,2)+symbol+n.substr(6,2);
		}
		// yyy/mm/dd 
		else if (type == 6)
		{
			return n.substr(0,4)+symbol+n.substr(4,2)+symbol+n.substr(6,2);
		}
		// yyy/mm/dd (週)
		else if (type == 7)
		{
			var t = B_con_rectime2timeobj(n);
			return n.substr(0,4)+symbol+n.substr(4,2)+symbol+n.substr(6,2)+" "+B_con_number2weekchar(t.getDay());
		}
		// yyy/mm/dd hh:mm
		else if (type == 8)
		{
			return n.substr(0,4)+symbol+n.substr(4,2)+symbol+n.substr(6,2)+" "+n.substr(8,2)+":"+n.substr(10,2)
		}
		// dd 
		else if (type == 11)
		{
			return n.substr(6,2);
		}
		// mm 
		else if (type == 12)
		{
			return n.substr(4,2);
		}
		// 1. hh:mm:ss
		// 2. yyy/mm/dd 
		else
		{
			var t = new Date(n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2)
					+" "+n.substr(8,2)+":"+n.substr(10,2)+":"+n.substr(12,2));
			var tCur = new Date();
			if (t.getFullYear() == tCur.getFullYear()
				&& t.getMonth() == tCur.getMonth()
				&& t.getDate() == tCur.getDate())
				//return n.substr(8,2)+":"+n.substr(10,2)+":"+n.substr(12,2);
				return n.substr(8,2)+":"+n.substr(10,2)+":"+n.substr(12,2);
			else
				return n.substr(0,4)+"/"+n.substr(4,2)+"/"+n.substr(6,2);
		}
	}
	else
		return n || "";
}
function B_con_second2html(n)
{
	var dd, hh, mm, ss;
	n = parseInt(n/1000);
	ss = n%60;
	mm = parseInt(n/60);
	if (mm > 60) {
		n = mm;
		mm = n%60
		hh = parseInt(n/60);
	}
	if (hh > 24) {
		n = hh;
		hh = n%24;
		dd = parseInt(n/24);
	}
	return (dd?dd+'Day ':'')
			+(hh?(hh<10?'0':'')+hh+':':'')
			+(mm<10?'0':'')+mm+':'
			+(ss<10?'0':'')+ss
}
function B_con_number2css(n)
{
	if (n.indexOf("%") > -1)
		return n;
	else if (n == "auto")
		return n;
	var n = parseInt(n);
	return n > 0 ? n+"px" : n;
}
function B_con_number2html(n)
{
	var s, l, x, out="";
	s = n+"";
	l = s.length;
	if (l <= 3) return s;
	
	x = l % 3;
	if (x > 0) out = s.substr(0,x)+",";
	while(x < l) {
		out += s.substr(x,3)+",";
		x += 3;
	}
	return out.substr(0, out.length-1);
}
function B_con_desc2html(s)
{
	if (s == null) return "";
	var regA = /\<a .*\<\/a\>/ig;
	var m = s.match(regA);
	var aH = [], key;
	if (m) {
		for(var x=0; x<m.length; x++) {
			key = "##TEMP_Html_"+x;
			aH.push({
				k: key,
				v: m[x]
			});
			s = s.replace(m[x], key);
		}
	}
	s = B_HTMLEnCode(s);
	if (aH.length > 0) {
		for(var x=0; x<aH.length; x++)
			s = s.replace(aH[x]['k'], aH[x]['v']);
	}
	return s;
}
function B_con_content2html(s)
{
	return $.trim(s
			.replace(/<title>.*<\/title>/ig,"")
			.replace(/<p><\/p>/ig,"<p>&nbsp;<\/p>")
			.replace(/<div><\/div>/ig,"<div>&nbsp;<\/div>")
		);
}
function B_con_profile2obj(str)
{
	var out = {};
	var x, k, v;
	if (str) {
		var arow = str.split("\n");
		for (nrow in arow) {
			col = $.trim(arow[nrow]);
			if (col == "") continue;
			x = col.indexOf("=");
			if (x == -1) continue;
			k = col.substr(0, x);
			v = col.substr(x+1);
			if (k == "") continue;
			out[k] = $.trim(v);
		}
	}
	return out;
}
function B_con_obj2profile(obj)
{
	var str = "";
	for(n in obj)
		str += n + "=" + obj[n] + "\r\n";
	return str;
}
function B_con_String2Mails(str)
{
	var a = str.split(/[,\n]/);
	var out = [];
	for(var n in a) {
		s = $.trim(a[n]);
		if (s == "") continue;
		m = B_con_String2Mail(s);
		if (m != false)
			out.push(m);
	}
	return out;
}
function B_con_String2Mail(str)
{
	var re, re2, aa, dn, dm;
	re = /\s*([^\t<]*)(\t| )([\w.]*@[\w.\-]*)\s*|\s*\"?([^\"<]*)\"?\s*<([\w.]*@[\w.\-]*)>\s*|\s*([\w.]*@[\w.\-]*)\s*/i;
	re2 = /[\"<>]/g;
	dn=""; dm="";
	if ( str.length > 0 ) {
		aa = str.match(re);
		if (aa) {
			if (aa[1]) {
				dn = aa[1];
				dm = aa[3];
			}
			else if (aa[4]) {
				dn = aa[4];
				dm = aa[5];
			}
			else {
				dn = '';
				dm = aa[6];
			}
			if (dn.indexOf('@') > -1) dn = dn.split('@')[0];
			if (!dn.length) dn = dm.split('@')[0];
			dn = $.trim(dn.replace(re2, ''));
			dm = $.trim(dm.replace(re2, ''));
			return {n:dn, m:dm};
		}
	}
	return false;
}
function B_con_bytesToSize(bytes)
{
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}
function B_con_Blob2File(blob, filename, lastModifiedDate)
{
	var file = new File([blob], filename||"blob");
	if (lastModifiedDate)
		file.lastModifiedDate = lastModifiedDate;
	else
		file.lastModifiedDate = new Date();
	return file;
}



function B_Rand(min, max) 
{
	var argc = arguments.length;
	if (argc == 0) {
		min = 0;
		max = 2147483647;
	} else if (argc == 1) {        
		throw new Error('Warning: B_Rand() expects exactly 2 parameters, 1 given');
	}
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function B_addLang(o)
{
	if (typeof(o) == "object") {
		for (n in o) gLang[n] = o[n];
	}
}
function B_addLangs(o)
{
	if (typeof(o) == "object") {
		for(var s in o) {
			var o1 = o[s];
			for(var s1 in o1) {
				var o2 = o1[s1];
				gLang[s+'.'+s1] = o2;
			}
		}
	}
}
function getLang(n)
{
	return gLang[n] || n;
}


// 關閉視窗 - 會 Reload 上一層視窗
function B_win_close_ParReload()
{
	// 內部視窗 IFrame
	if (parent != window) {
		try {
			if (parent.api_content_reload)
				parent.api_content_reload();
			else
				parent.location.reload();
		}
		catch(e){
			var main_host = B_URL_GetArg(location.href, "main_host")||"";
			if (main_host != "") {
				var url = "http://"+main_host+"/tools/api_callback.php?cmd=reload";
				location.href = url;
			}
		}
	} else {
		try {
			// 外部視窗 Popup Window
			if (opener != window && !opener.bOokiEdit) {
				if (opener.api_content_reload)
					opener.api_content_reload();
				else
					opener.location.reload();
			}
		} catch(e){}
		window.close();
	}
}
function B_win_close()
{
	// 內部視窗 IFrame
	if (parent != window) {
		try {
			if (parent.B_Popup_Close)
				parent.B_Popup_Close();
			else
				parent.location.reload();
		}
		catch(e){
			var main_host = B_URL_GetArg(location.href, "main_host")||"";
			if (main_host != "") {
				var url = "http://"+main_host+"/tools/api_callback.php?cmd=reload";
				location.href = url;
			}
		}
	} else {
		window.close();
	}
}



var sys_wav_list = 
	["/tools/wav/Bell.wav","/tools/wav/beep.wav",
	"/tools/wav/VoipRing.wav","/tools/wav/Ringout.wav"];
// arg => {volume}
function B_wav_play(id, arg)
{
	if (id < 0) id = 0;
	if (!arg) arg = {};
	if (!arg.volume) arg.volume = 0.5;
	var $player = $(
		'<audio style="width:250px; display:none;" controls autoplay>'
			+'<source src="'+sys_wav_list[id]+'" type="audio/x-wav">'
		+'</audio>'
	)	.appendTo($("body"))
		.on("ended",function(){
			$(this).remove();
		});
	$player.get(0).volume = arg.volume;
}
// arg => {interval(間隔), volume}
function B_wav_replay(id, arg)
{
	if (id < 0) id = 0;
	if (!arg) arg = {};
	if (!arg.interval) arg.interval = 2000;
	if (!arg.volume) arg.volume = 0.5;
	var player;
	var $player = $(
		'<audio style="width:250px; display:none;" controls autoplay>'
			+'<source src="'+sys_wav_list[id]+'" type="audio/x-wav">'
		+'</audio>'
	)	.appendTo($("body"))
		.on("ended",function(){
			player.timeid =  setTimeout(function(){
				try{
					$player.get(0).play();
				} catch(e){}
			}, arg.interval)
		});
	player = $player.get(0);
	player.volume = arg.volume;
	player.remove = function(){
		if (player.timeid) 
			clearTimeout(player.timeid);
		$player.remove();
	}
	return player;
}



function hash_set(s)
{
	location.hash = "#" + s;
}
function hash_get(bDecode)
{
	if (bDecode == false) {
		var x = location.href.indexOf("#");
		return x == -1 ? "" : location.href.substr(x+1);
	}
	else
		return location.hash.substr(1);
}
function hash_getArg(key)
{
	var hash = hash_get();
	if (!hash || hash == "")
		return null;
	return B_URL_GetArg(hash, key);
}
function hash_init()
{
	var args = location.hash.substr(1).split("&");
	var a, bRes=false;
	for (var x=0; x<args.length; x++) {
		a = args[x].split("=");
		if (!a[1] || a[1] == "") continue;
		//if (gArg[a[0]] == a[1]) continue;
		if (a[0] == "q")
			$(".search_bar .sb_input").val(a[1]);
		else
			gArg[a[0]] = a[1];
		bRes = true;
	}
	return bRes;
}

function sprintf()
{
    var i = 0, a, f = arguments[i++], o = [], m, p, c, x, s = '';
    while (f) {
        if (m = /^[^\x25]+/.exec(f)) {
            o.push(m[0]);
        }
        else if (m = /^\x25{2}/.exec(f)) {
            o.push('%');
        }
        else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
            if (((a = arguments[m[1] || i++]) == null) || (a == undefined)) {
                throw('Too few arguments.');
            }
            if (/[^s]/.test(m[7]) && (typeof(a) != 'number')) {
                throw('Expecting number but found ' + typeof(a));
            }
            switch (m[7]) {
                case 'b': a = a.toString(2); break;
                case 'c': a = String.fromCharCode(a); break;
                case 'd': a = parseInt(a); break;
                case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
                case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
                case 'o': a = a.toString(8); break;
                case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
                case 'u': a = Math.abs(a); break;
                case 'x': a = a.toString(16); break;
                case 'X': a = a.toString(16).toUpperCase(); break;
            }
            a = (/[def]/.test(m[7]) && m[2] && a >= 0 ? '+'+ a : a);
            c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
            x = m[5] - String(a).length - s.length;
            p = m[5] ? str_repeat(c, x) : '';
            o.push(s + (m[4] ? a + p : p + a));
        }
        else {
            throw('Huh ?!');
        }
        f = f.substring(m[0].length);
    }
    return o.join('');
}


var DLG_VIDEO_OBG = null;
var DLG_ALBUM_OBG = null;
function dlg_video_open(url,features)
{
	try {
		DLG_VIDEO_OBG.location.href = url;
		DLG_VIDEO_OBG.focus();
	} catch(e) {
		DLG_VIDEO_OBG = open(url,"NUVideo",features||"");
	}
	return DLG_VIDEO_OBG;
}
function dlg_album_open(url,features)
{
	try {
		DLG_ALBUM_OBG.location.href = url;
		DLG_ALBUM_OBG.focus();
	} catch(e) {
		DLG_ALBUM_OBG = open(url,"NUAlbum",features||"");
	}
	return DLG_ALBUM_OBG;
}



function PHP_stripslashes(str)
{
	return str.replace(/\\[\"\'\\]/g, "\"");
}



// JQuery Function [outerHTML]
$.fn.outerHTML = function() {
	return $(this).clone().wrap('<div></div>').parent().html();
}
// 圖片 - 正方形的框
// arg => {too-small(過小處理), too-large(過大處理), }
$.fn.f_img_square = function(arg) {
	// 太小轉為浮動
	var arg = arg || {};
	var bTM = arg['too-small'] ? true : false;
	var wTM, hTM;
	if (bTM) {
		wTM = arg['too-small'].w;
		hTM = arg['too-small'].h;
		if (wTM < 5 || hTM < 5)
			bTM = false; // 太小, 取消限制
	}
	
	//
	$(this)//.css({position:'relative',overflow:'hidden'})
		.find("img")
			.css({position:'absolute'})
			.load(do_square)
			.each(do_square);
		
	function do_square() {
		var $tImg = $(this);
		var $t = $tImg.parents(".img_square:first");
		
		var w = $tImg.width();
		var h = $tImg.height();
		if (bTM && w < wTM && h < hTM) {
			// 自訂處理
			if (arg['too-small']['func'] != null) {
				arg['too-small'].func($t);
			}
			else {
				$t.removeClass("img_square");
				if (arg['too-small']['css'] != null)
					$t.css(arg['too-small']['css']);
				else
					$t.css({position:'initial', display:'inline-block', verticalAlign:'middle', margin:'0 4px 4px 0'});
				if (arg['too-small']['img_css'] != null)
					$tImg.css(arg['too-small']['img_css']);
				else
					$tImg.css({position:'initial', maxWidth:'120px', maxHeight:'120px'});
			}
		}
		else if (w > 0 || h > 0) {
			var ls_w = $t.width();
			var ls_h = $t.height();
			// 圖片過大要縮小
			if (w > ls_w || h > ls_h) {
				var nRate = max(ls_w / w, ls_h / h);
				w = w * nRate;
				h = h * nRate;
				if ( w < 1 ) w = 1;
				if ( h < 1 ) h = 1;
				$tImg.css({width:w+"px", height:h+"px"});
			}
// console.log('圖片過大要縮小 w=', (ls_w-w)/2, ls_w, w);
			w = (ls_w-w)/2;
			// 小圖
			if (ls_h > h)
				h = (ls_h-h)/2
			// 大圖
			else {
				// 指定位置
				if (arg['too-large'] && arg['too-large']['top'] != null){
					h = parseFloat(arg['too-large']['top']) || -((h-ls_h)/3);
				}
				// 比率
				else if (arg['too-large'] && arg['too-large']['ratio'] != null){
					var n = parseFloat(arg['too-large']['ratio'])||0;
					h = -((h-ls_h)/n);
				}
				else
					h = -((h-ls_h)/3);
			}
			$tImg.css({left:w+"px", top:h+"px"});
			$tImg.addClass("img_square_ok");
		}
	}
	return this;
}
// 提示 .tooltip("close");
$.fn.f_tooltip = function(arg) {

/*	arg.position = ['center','right'];
	arg.offset = [-2,10];
	arg.effect = 'fade';
	arg.fadeInSpeed = 300;//此屬性只有在effect為fade時有效 
	arg.delay = 0;
	arg.opacity = 1;
	arg.tip = "";
	arg.api = false;
*/
	if (!B_is_mobile()) {
		try {
			var arg = arg||{};
			if (arg.items == null) arg.items = "[title]";
			if (arg.track == null) arg.track = true;
			arg.content = function(){
				var $t = $(this);
				if ($t.is("[title]")) {
					return $t.attr("title");
				}
			}
			$(this).tooltip(arg);
		} catch(e){}
	}
	return $(this);
}
//
$.fn.f_button_s = function(arg) {
	var $t = $(this).button(arg);
	var bInput = false;
	if ($t.is("input")) {
		$bInput = true;
		$t = $t.next();
	}
	if (arg && arg.text == false) {
		if ($t.find(".ui-button-icon-secondary").length) {
			// $t.css({width:"38px", height:"23px"});
			// $t.find(".ui-button-icon-primary").css({"margin-top":"-11px", "margin-left":"-4px"});
			// $t.find(".ui-button-icon-secondary").css({"right":"-1px"});
		} else {
			if (bInput) {
				// $t.css({width:"25px", height:"21px"});
				// $t.find(".ui-button-icon-primary").css({"margin-top":"-11px", "margin-left":"-10px"});
			}
			else {
				$t.css({width:"22px", height:"22px"});
				$t.find(".ui-button-icon-primary").css({"margin-top":"-8px", "margin-left":"-8px"});
			}
		}
	}
	//
	else {
		$t.find(".ui-button-text").css({padding:'2px 6px', lineHeight:'15px', fontSize:'13px'});
		//$t.find(".ui-button-text").css({padding:'0.1em 0.5em', lineHeight:'1.5em'});
		if ($t.find(".ui-button-icon-primary").length) {
			$t.find(".ui-button-icon-primary").css({left:'0px'});
			$t.find(".ui-button-text").css({paddingLeft:'18px'});
		}
		if ($t.find(".ui-button-icon-secondary").length) {
			$t.find(".ui-button-icon-secondary").css({right:'0px'});
			$t.find(".ui-button-text").css({paddingRight:'15px'});
		}
	}
	return $(this);
}
$.fn.f_button_l = function(arg) {
	var $t = $(this).button(arg);
	var bInput = false;
	if ($t.is("input")) {
		$bInput = true;
		$t = $t.next();
	}
	if (arg.text == false) {
		if ($t.find(".ui-button-icon-secondary").length) {
			$t.css({width:"38px", height:"23px"});
			$t.find(".ui-button-icon-primary").css({"margin-top":"-11px", "margin-left":"-4px"});
			$t.find(".ui-button-icon-secondary").css({"right":"-1px"});
		} else {
			if (bInput) {
				$t.css({width:"25px", height:"21px"});
				$t.find(".ui-button-icon-primary").css({"margin-top":"-11px", "margin-left":"-10px"});
			}
			else {
				$t.css({width:"27px", height:"23px"});
				var $ico = $t.find(".ui-button-icon-primary");
				if ($ico.width() == 16)
					$t.find(".ui-button-icon-primary").css({"margin-top":"-8px", "margin-left":"-8px"});
				else
					$t.find(".ui-button-icon-primary").css({"margin-top":"-11px", "margin-left":"-10px"});
				$t.find(".ui-button-text").css({padding:'2px'});
			}
		}
	} 
	else {
		$t.find(".ui-button-text").css({padding:'2px 8px', lineHeight:'19px', fontSize:'13px'});
		if ($t.find(".ui-button-icon-primary").length) {
			$t.find(".ui-button-icon-primary").css({top:'2px',left:'2px',margin:'0'});
			$t.find(".ui-button-text").css({paddingLeft:'26px'});
		}
	}
	return $(this);
}

// arg => {reg}
$.fn.f_input_filter_key = function(arg) {
	$(this).live("keypress", function(e){
		var charCode = e.keyCode ? e.keyCode : e.charCode;
		var charStr = String.fromCharCode(charCode);
		if (arg && arg.reg)
			return arg.reg.test(charStr);
		else 
			return /[a-z0-9_ ]/i.test(charStr);
	});
}
$.fn.hasScrollBar = function() {
    return this.get(0).scrollHeight > this.outerHeight();
}
// label auto hide
$.fn.labelAutoHide = function() {
	this.keyup(function(){
		var $t = $(this);
		var $label = $t.siblings('label');
		var str = $.trim($t.val());
		if (str.length > 0) {
			if (!$label.is(":hidden"))
				$label.hide();
		} else {
			if ($label.is(":hidden"))
				$label.show();
		}
	});
}
// 修正 1.8 版以後就廢棄的功能
jQuery.curCSS = jQuery.css;

//
RegExp.quote = function(str) {
    return (str+'').replace(/([\/.?*+^$[\]\\(){}|-])/g, "\\$1");
};

// IFrame 視窗
if (window != window.parent)
{
	// 使用上一層的 Function
	try {
		window.rs_con_acn2info = window.parent.rs_con_acn2info;
		window.SYS_ACN_INFO = window.parent.SYS_ACN_INFO;
	} catch(e){}
}
// Main 視窗
if (!window.rs_con_acn2info)
{
	// key => acn or mail
	window.SYS_ACN_INFO = {};
	// return {ssn, sun, acn, mail, alias1, alias2, description, status}
	window.rs_con_acn2info = function(acn, funcOK)
	{
		if (acn == null)
			return;
			
		var l_acn = acn.toLowerCase();
		var rec = SYS_ACN_INFO[l_acn];
		if (rec) {
			try { rec.cnt_view++; }
			catch(e){ rec.cnt_view = 1; };
			funcOK(rec);
			return rec;
		}

		// 社群帳號 - 暫時的
		if (acn.indexOf(".") > -1 && !B_is_mail(acn))
		{
			//{"site_acn":"wheechen-g","name":"WheeChen Group","cs":"ookon_test001"}
			// return {site_acn, name, cs}
			var arg = {
					method: "GET"
					,host: 	"wns"
					,url:	API_WNS_get_site_data+"?site="+encodeURIComponent(l_acn)
					//,arg:	"site="+encodeURIComponent(acn)
					,cache:	600 // 有效秒數
				}
			$.ajax({
				type: "GET"
			,	url: API_EXTERNAL+"?"+B_con_Object2UrlArg(arg)
			,	dataType: "json"
			,	success: function(data, textStatus) {
// console.log("### "+API_EXTERNAL+"?"+B_con_Object2UrlArg(arg));
// console.log(data);
					var rec = null;
					if (B_CheckError_SendResult(data, sys_debug||false))
						data = null;
					if (data) {
						rec = {
							acn:l_acn
							,sun:data.name
						}
						//
						rec.cnt_view = 1;
						SYS_ACN_INFO[l_acn] = rec;
					}
					funcOK(rec);
				}
			,	error: function(XMLHttpRequest, textStatus, errorThrown) {
// console.log("### "+API_EXTERNAL+"?"+B_con_Object2UrlArg(arg));
// console.log(XMLHttpRequest);
					if (funcOK) funcOK(null);
				}
			});
		}
		else
		{
			// return {ssn, sun, acn, mail, alias1, alias2, description, status}
			var arg = {
				mode: "wns_acn2info"
				,keyword: l_acn
			}
			var t = B_getCurrentTime();
			$.ajax({
				type: "POST"
			,	dataType: "json"
			,	url: API_TOOLS2
			,	data: arg
			,	success: function(data, textStatus) {
// console.log("### "+API_TOOLS2+"?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(data);
					if (B_CheckError_SendResult(data, sys_debug||false))
						data = null;
					if (data) {
						var acn = data.acn.toLowerCase();
						data.acn = acn;
						data.cnt_view = 1;
						if (!SYS_ACN_INFO[acn]) SYS_ACN_INFO[acn] = data;
						var mail = data.mail.toLowerCase();
						if (!SYS_ACN_INFO[mail]) SYS_ACN_INFO[mail] = data;
					}
					funcOK(data);
				}
			,	error: function(XMLHttpRequest, textStatus, errorThrown) {
// console.log("### "+API_TOOLS2+"?"+B_con_Object2UrlArg(arg));
// console.log(XMLHttpRequest);
					if (funcOK) funcOK(null);
				}
			});
		}
	}
}
function rs_con_acns2info(list, funcOK)
{
	if (!list) { funcOK(); return; }
	if (list.length == 1) return rs_con_acn2info(list[0], funcOK);
	
	var recs = [], acns = [];
	for (var x=0; x<list.length; x++) {
		var acn = list[x];
		if (SYS_ACN_INFO[acn])
			recs.push(SYS_ACN_INFO[acn]);
		else
			acns.push(acn);
	}
	if (!acns.length) {
// console.log('~~~ rs_con_acns2info 1 acns=', acns);
		funcOK(recs); 
		return;
	} 
	else {
		recs = [];
	}
	
	
	var arg = {
		mode: "wns_acn2info"
		,keyword: list.join(",")
	}
var t = B_getCurrentTime();
	$.ajax({
		type: "POST"
	,	dataType: "json"
	,	url: API_TOOLS2
	,	data: arg
	,	success: function(data, textStatus) {
// console.log("### "+API_TOOLS2+"?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(data);

			if (B_CheckError_SendResult(data, sys_debug||false))
				data = null;
			if (data) {
				for (var x=0; x<data.length; x++) {
					var rec = data[x];
					if (!rec || !rec.acn) continue;
// console.log('~~~ rec=', x, rec);
					var acn = rec.acn.toLowerCase();
					if (SYS_ACN_INFO[acn]) {
						rec = SYS_ACN_INFO[acn];
						rec.cnt_view++;
					} else {
						rec.acn = acn;
						rec.cnt_view = 1;
						SYS_ACN_INFO[acn] = rec;
						if (rec.mail) {
							var mail = rec.mail.toLowerCase();
							if (!SYS_ACN_INFO[mail]) SYS_ACN_INFO[mail] = rec;
						}
					}
					recs.push(rec);
				}
			}
			funcOK(recs);
		}
	,	error: function(XMLHttpRequest, textStatus, errorThrown) {
// console.log("### "+API_TOOLS2+"?"+B_con_Object2UrlArg(arg));
// console.log(XMLHttpRequest);
			if (funcOK) funcOK(null);
		}
	});
	
	
	
	
	
/*	
	var xID = 0;
	var recs = [];
	function do_con(){
		// OK
		if (xID >= list.length) {
			funcOK(recs);
			return;
		}
		
		var acn = list[xID++];
		rs_con_acn2info(acn, function(rec){
			if (rec) recs.push(rec);
			// 下一個
			do_con();
		});
	}
	do_con();
*/
}
function rs_con_acns2info2(list, keys, funcOK)
{
	var out = {}, rec, rec2, l, k;
	rs_con_acns2info(list, function(recs){
		for(var x=0; x<recs.length; x++) {
			rec = recs[x];
			if (keys) {
				rec2 = {}; l = 0;
				for (var y=0; y<keys.length; y++) {
					k = keys[y];
					if (rec[k]) {
						l++;
						rec2[k] = rec[k];
					}
				}
				if (l) out[rec.acn] = rec2;
			}
			else
				out[rec.acn] = rec;
		}
		if (funcOK) funcOK(out);
	});
}
function rs_con_acns2suns(list, key, funcOK)
{
	if (!key) key = "sun";
	rs_con_acns2info(list, function(recs){
		var suns = [];
		if (recs && recs.length) {
			for(var x=0; x<recs.length; x++)
				suns.push(recs[x][key]);
		}
		if (funcOK) funcOK(suns);
	});
}
// return {ssn, sun, acn, mail, alias1, alias2, description, status}
// arg => {bNotGroup, filter}
function rs_find_userInfo(key, arg, funcOK)
{
	var arg = arg||{};
	var out = [], a = {}, rec, r;
	var re = new RegExp(RegExp.quote(key).replace(/ /g,".*"), "i");
	for(var n in SYS_ACN_INFO) {
		rec = SYS_ACN_INFO[n];
		// 過濾掉群組帳號
		if (arg) {
			if (arg.bNotGroup == true && rec.acn.indexOf(".") > -1) continue;
			if (arg.filter && arg.filter.indexOf(rec.acn) > -1) continue;
		}
		if (a[rec.acn]) continue;
		a[rec.acn] = 1;
		
		if ((r=rec.sun.match(re))) {
			rec.score = r.input == key ? 100 
						: r.index == 0 ? 70
						: 40
			rec.score += rec.cnt_view;
			out.push(rec);
		}
		else if ((r=rec.acn.match(re)) || (r=(rec.mail||"").match(re)) 
				|| (r=(rec.description||"").match(re))) {
			rec.score = r.input == key ? 90 
						: r.index == 0 ? 60
						: 30
			rec.score += rec.cnt_view;
			out.push(rec);
		}
	}
	if (out.length > 0) {
		out.sort(function(a,b){
			if (a.score == b.score) return 0;
			return a.score > b.score ? -1 : 1;
		});
	}
	if (funcOK) funcOK(out);
}
// return {ssn, sun, acn, mail, alias1, alias2, description, status}
// arg => {bNotGroup, filter}
function rs_find_userInfo2(key, arg, funcOK)
{
	var mode = arg && arg.bNotGroup == true ? "user" : "";
	var argData = {
		mode: "user_search"
		,sub_mode:	mode
		,q:	key
		,p:	1
		,ps: 200
	}
	$.ajax({
		type: "POST"
	,	url: API_TOOLS
	,	data: argData
	,	dataType: "json"
	,	success: function(data, textStatus) {
// console.log(API_TOOLS+"?"+B_con_Object2UrlArg(argData));
// console.log((data||"").length, data);
			if (B_CheckError_SendResult(data, sys_debug))
				data = null;
			if (funcOK) {
				// 過濾
				if (arg.filter) {
					var list = data;
					data = [];
					for(var x=0; x<list.length; x++){
						var rec = list[x].acn
						if (arg.filter.indexOf(list[x].acn) > -1) continue;
						data.push(list[x]);
					}
				}
				funcOK(data);
			}
		}
	,	error: function(XMLHttpRequest, textStatus, errorThrown) {
// console.log(API_TOOLS+"?"+B_con_Object2UrlArg(argData));
// console.log('XMLHttpRequest=', XMLHttpRequest);
			if (sys_debug) B_Message( "Error: (rs_find_userInfo2)" + XMLHttpRequest.status + ", " + XMLHttpRequest.responseText );
			if (funcOK) funcOK();
		}
	});
}
// 
if (window != window.parent)
{
	// 使用上一層的 Function
	try {
		window.B_Message = window.parent.B_Message;
	} catch(e){}
}
if (!window.B_Message)
{
	window.TIMEID_Message = null;
	window.B_Message = function(s)
	{
		var h, $msg;
		if (TIMEID_Message) close_Message();
		$msg = $("#B_Message");
		if ($msg.length)
			$msg.html( s );
		else {
			$('body').append( '<div id="B_Message" style="position:fixed; top:0; text-align:center; margin-top:0; padding:3px 0.5em; font-size:22px; background-color:#069; color:#fff; overflow:hidden; z-index:999999999;">' + s + '</div>' );
			$msg = $("#B_Message");
		}
		if ($msg.length) {
			var x = ($(window).width() - $msg.width())/2;
			if (x < 0) x = 0;
			$msg.css({left:x});
			
			TIMEID_Message = setTimeout(function(){
				$msg.remove();
				close_Message();
			}, 3000);
		}
		
		function close_Message() {
			if (TIMEID_Message) clearTimeout(TIMEID_Message);
			TIMEID_Message = null;
		}
	}
}






var lang = window.PAGE_LANG||"cht";
var f = "/tools/Language/tools_lang_"+lang+".js";
if (!B_ScriptIsExists(f))
	document.write('<script type="text/javascript" src="'+f+'"></script>');

