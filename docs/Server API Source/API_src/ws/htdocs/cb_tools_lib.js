
var API_TOOLS 				= "/tools/api_tools.php";


var sys_u_srv = "";
var sys_nu_code = "";

// Android App
var sys_is_app = typeof window.jsChat == "object";



// rs_tools_lib.js #906
var URLPATH_IMAGES 	= "/images/";
var URLPATH_ICON 	= "/icon/";
var URLPATH_ICON_MAX_ATTACH	= URLPATH_IMAGES+"file.png";

var UF_PART_UPLOAD_SIZE = 0xA00000;		// 檔案大於 10MB 改用片斷上傳
var UF_PART_SIZE = 0x500000;			// 每個分斷大小 5MB
//var UF_PART_UPLOAD_SIZE = 1000000;	// 檔案大於 1MB 改用片斷上傳
//var UF_PART_SIZE = 50000;				// 每個分斷大小 50kB


////////////////////////////////////////////////////
// arg => {u_srv, nu_code}
function rs_cb_init(arg)
{
	sys_u_srv = arg.u_srv;
	sys_nu_code = arg.nu_code||"";
}
function rs_con_acn2thumbs(acn)
{
	return "/UserProfile/user_image.php?acn="+acn+"&u_srv="+sys_u_srv;
}
function rs_con_acns2info(list, funcOK)
{
	if (!list) { funcOK(); return; }
	if (list.length == 1) {
		rs_con_acn2info(list[0], function(rec, err){
			if (rec)
				funcOK([rec]);
			else
				funcOK(null, err);
		});
		return;
	}
	
	var recs = [], acns = [];
	for (var x=0; x<list.length; x++) {
		var acn = list[x];
		if (SYS_ACN_INFO[acn])
			recs.push(SYS_ACN_INFO[acn]);
		else
			acns.push(acn);
	}
	if (!acns.length) {
		funcOK(recs); 
		return;
	} 
	else {
		recs = [];
	}
	
	
	var arg = {
		url: sys_u_srv+API_TOOLS2
		,data: "mode=wns_acn2info&keyword="+list.join(",")
		,cookie: "nu_code="+sys_nu_code
		,cache: 600
	}
var t = B_getCurrentTime();
	$.ajax({
		type: "POST"
	,	dataType: "json"
	,	url: "/api_external"
	,	data: arg
	,	success: function(data, textStatus) {
// console.log("### /api_external?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
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
// console.log("### /api_external?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(XMLHttpRequest);
			if (funcOK) funcOK(null);
		}
	});
}
// Main 視窗
if (true || !window.rs_con_acn2info)
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
/*		if (acn.indexOf(".") > -1 && !B_is_mail(acn))
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
		{*/
			// return {ssn, sun, acn, mail, alias1, alias2, description, status}
			var arg = {
				url: sys_u_srv+API_TOOLS2+"?mode=wns_acn2info&keyword="+acn
				,cache: 0
			}
var t = B_getCurrentTime();
			$.ajax({
				type: "POST"
			,	dataType: "json"
			,	url: "/api_external"
			,	data: arg
			,	success: function(data, textStatus) {
// console.log("### api_external?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
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
			,	error: function(xhr) {
// console.log("### api_external?"+B_con_Object2UrlArg(arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(xhr);
					if (funcOK) funcOK(null);
				}
			});
		}
	//}
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
	
	var request_arg = {
		url: sys_u_srv+API_TOOLS
		,data: B_con_Object2UrlArg(argData)
		,cookie: "nu_code="+sys_nu_code
		,cache: 180
	}
var t = B_getCurrentTime();
	$.ajax({
		type: "POST"
	,	dataType: "json"
	,	url: "/api_external"
	,	data: request_arg
	,	success: function(data) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
			}
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
	,	error: function(xhr) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(xhr);
			//var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (funcOK) funcOK();
		}
	});
}





// arg => {funcOK}
function WRS_API_get_relation_list(arg)
{
	var request_arg = {
		url: sys_u_srv+"/API/get_relation_list.php"
		,cookie: "nu_code="+sys_nu_code
		,cache: 600
	}
var t = B_getCurrentTime();
	$.ajax({
		type: "POST"
	,	dataType: "json"
	,	url: "/api_external"
	,	data: request_arg
	,	success: function(data) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
			}
			if (arg.funcOK) arg.funcOK(data, err);
		}
	,	error: function(xhr) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (arg.funcOK) arg.funcOK(null, err);
		}
	});
}
// arg => {mode[getUrlParse / ], url, tv, funcOK}
function WRS_API_url_cache(arg)
{
	var API_url_cache = "/tools/api_url_cache.php";
	var dataArg = {
		mode: 	arg.mode
		,url:	arg.url
	}
	if (arg.tv) dataArg['tv'] = arg.tv;
	
	var request_arg = {
		url: sys_u_srv+API_url_cache
		,data: B_con_Object2UrlArg(dataArg)
		,cookie: "nu_code="+sys_nu_code
		,cache: 600
	}
var t = B_getCurrentTime();
	$.ajax({
		type: "POST"
	,	dataType: "json"
	,	url: "/api_external"
	,	data: request_arg
	,	success: function(data) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(data);
			var err;
			if (B_CheckError_SendResult(data, false)) {
				err = data;
				data = null;
			}
			if (arg.funcOK) arg.funcOK(data, err);
		}
	,	error: function(xhr) {
// console.log("### /api_external?"+B_con_Object2UrlArg(request_arg)+"  total time="+((B_getCurrentTime()-t)/1000));
// console.log(xhr);
			var err = "Error: "+xhr.status+", "+xhr.responseText;
			if (arg.funcOK) arg.funcOK(null, err);
		}
	});
}




// arg => {nu_code, path, mtime, fn, fs,  file, funcOK(ufid, err)}
function cb_upload_file_part(arg)
{
// console.log('@@@ cb_upload_file_part arg=', arg);
	var MAX_ERR_PL = 5;
	var MAX_ERR_P = 20;
	
	var Part = "";
	var PartCnt = 0;
	var PartX = 0;
	var ErrPLCnt = 0;
	var ErrPCnt = 0;
	
	function do_ok(ufid){
// console.log('@@@ cb_upload_file_part do_ok ~~~~~~~~~~~~~~~');
		if (arg.funcOK) arg.funcOK(ufid);
	}
	function do_p(){
// console.log('@@@ cb_upload_file_part do_p ~~~ x/cnt='+PartX+'/'+PartCnt);
		// OK
		if (PartX >= PartCnt) {
			ErrPLCnt++;
			do_pl();
			return;
		}
		//
		if (Part[PartX] == "1") {
			PartX++;
			do_p();
			return;
		}
		//
		cb_upload_file_part_p({
				nu_code:	arg.nu_code
				,path:		arg.path
				,fn:		arg.fn
				,fs:		arg.fs
				,ps:		UF_PART_SIZE
				,px:		PartX
			}
			,arg.file
			,function(res, err){
// console.log('@@@ cb_upload_file_part do_p ~~~ x/cnt='+PartX+'/'+PartCnt+" res=", res);
// console.log('@@@ cb_upload_file_part do_p ~~~ x/cnt/ErrPCnt='+PartX+'/'+PartCnt+'/'+ErrPCnt+" err=", err);
				if (res && res.result == "ok") {
					PartX++;
					do_p();
				}
				else {
					// 錯誤太多結束
					if (++ErrPCnt > MAX_ERR_P) {
						if (arg.funcOK) arg.funcOK(null, err);
					}
					else {
						PartX++;
						do_p();
					}
				}
			});
	}
	function do_pl(){
		cb_upload_file_part_pl({
				nu_code:	arg.nu_code
				,path:		arg.path
				,mtime:		arg.mtime
				,fn:		arg.fn
				,fs:		arg.fs
				,ps:		UF_PART_SIZE
			}
			,arg.file
			,function(res, err){
				if (!err && res) {
					// 上傳完成
					if (res.ufid) {
// console.log('@@@ cb_upload_file_part 上傳完成 res.ufid=',res.ufid);
						do_ok(res.ufid);
						return;
					}
					// 須上傳片斷
					else if (ErrPLCnt <= MAX_ERR_PL && res.part) {
// console.log('@@@ cb_upload_file_part 須上傳片斷 res.part=',res.part);
						Part = res.part;
						PartCnt = Part.length;
						PartX = 0;
						do_p();
						return;
					}
				}
				// 錯誤太多結束
				if (++ErrPLCnt > MAX_ERR_PL) {
					if (arg.funcOK) arg.funcOK(null, err);
				} else {
					do_pl();
				}
			});
	}
	do_pl();
}
// arg => {nu_code, path, fn, mtime, fs, ps}
function cb_upload_file_part_pl(arg, file, funcOK)
{
// console.log('@@@ cb_upload_file_part_pl arg=', arg);

	arg.mode = "pl";
	var data = new FormData();
	data.append("data", JSON.stringify(arg));
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4) {
// console.log('~~~~~~~~~~~~~~~ readyState=4 xhr=', xhr);
			var data, err;
			if (xhr.status == 200 && !B_CheckError_SendResult(xhr.responseText)) {
				try {
					data = JSON.parse(xhr.responseText);
				} catch(e){}
			}
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
		"/api_upload_file_p"
	);
	xhr.setRequestHeader("Cache-Control", "no-cache");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(data);
}
// arg => {nu_code, path, fn, fs, ps, px}
function cb_upload_file_part_p(arg, file, funcOK)
{
// console.log('@@@ cb_upload_file_part_p arg=', arg);

	arg.mode = "p";
	var nStar = arg.px*arg.ps;
	var nEnd = min(nStar+arg.ps, arg.fs);
	var file_part = file.slice(nStar, nEnd);
// console.log('@@@ cb_upload_file_part_p x='+arg.px+' - '+nStar+' / '+nEnd+', '+file_part.size);
	
	var data = new FormData();
	data.append("data", JSON.stringify(arg));
	data.append("file", file_part);
	
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (xhr.readyState == 4) {
// console.log('~~~~~~~~~~~~~~~ readyState=4 xhr=', xhr);
			var data, err;
			if (xhr.status == 200 && !B_CheckError_SendResult(xhr.responseText)) {
				try {
					data = JSON.parse(xhr.responseText);
				} catch(e){}
			}
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
		"/api_upload_file_p"
	);
	xhr.setRequestHeader("Cache-Control", "no-cache");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(data);
}

