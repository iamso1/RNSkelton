
var os 		= require('os');
var fs 		= require('fs');
var path 	= require('path');
var cp 		= require('child_process');
var querystring = require('querystring');
var oUrl 	= require('url');
var oHttp 	= require('http');
var oHttps 	= require('https');
var colors 	= require('colors');
var async 	= require('async');

var HTTP_USER_AGENT = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)";

/*
var url ="https://s.yimg.com/bt/api/res/1.2/02QfwyIzvS7s5uXLKvYCTw--/YXBwaWQ9eW5ld3NfbGVnbztxPTc1O3c9NjAw/http://media.zenfs.com/zh-Hant/homerun/Appappapps.com/f7b52c1a3d3a194a726f3b71bb1d8a57.cf.png";
url_getFile_get({
	url: 	url
//	,data:	{aa:"111", bb:"222"}
	,funcOK:function(data, err){
	
console.log('@@@@@@@@@@ data=',data);
console.log('@@@@@@@@@@ err=',err);
	
	}
});
*/


String.prototype.replaceAt = 
function(index, character) {
	return this.substr(0, index) + character + this.substr(index+character.length);
}

///////////////////////////////////////////////////////
function ran_no( min, max )
{
	return Math.floor( Math.random() * ( max - min + 1 )) + min;
}
function min(n1, n2)
{
	return n1 < n2 ? n1 : n2;
}
function max(n1, n2)
{
	return n1 > n2 ? n1 : n2;
}
function uid( len )
{
	var str     = '';
	var src     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var src_len = src.length;
	var i       = len;

	for( ; i-- ; ){
		str += src.charAt( this.ran_no( 0, src_len - 1 ));
	}

	return str;
}


function isUrl(url) 
{
	return /^https?\:\/\//i.test(url);
}
function isMail(m)
{
	if (!m || m.length == 0) return false;
	x = m.indexOf("@");
	if (x == -1) return false;
	x = m.indexOf(".", x);
	if (x == -1) return false;
	return true;
}


// 特殊碼轉成 html碼
function HTMLEncode(str, bEnter)
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
// 物件 轉成 字串
function con_Object2String(o, bH, limi, level) 
{
	var BSign, l, marN, marT;
	var bV = true;
	if (!limi) limi = -1;
	if (typeof(level) != "number") level = 0;
	l = level++;
	if (bH === 2) {
		bV = false;
		marN = "";
		marT = "";
	}
	else if (bH) {
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
				if (limi == -1 || level <= limi) {
					if (k == "_id" && o[n]['_bsontype'] && o[n]['_bsontype'] == "ObjectID") {
						var objId = new ObjectID(o[n].id);
						ss += BSign + (bV?x+". ":"")+ k + ':"'+objId.toHexString()+'",';
					}
					else {
						ss += BSign + (bV?x+". ":"")+ k+(bV?"("+this.obj_length(o[n])+")":"") + ":{" + this.con_Object2String(o[n], bH, limi, level) + BSign + "},";
					}
				}
				else 
					ss += BSign + (bV?x+". ":"")+ k+(bV?"("+this.obj_length(o[n])+")":"") + ':{"limitation"},';
				break;
				
			case "number":
			case "boolean":
				ss += BSign + (bV?x+". ":"")+ k + ':' + o[n] + ',';
				break;
			
			case "string":
				ss += BSign + (bV?x+". ":"")+ k + ':"' + this.HTMLEncode(o[n]) + '",';
				break;
		}
	}
	
	if (ss.length) ss = ss.substr(0,ss.length-1);
	return ss;
}



function str_repeat(s, n){
    var a = [];
    while(a.length < n){
        a.push(s);
    }
    return a.join('');
}



function array_unique(a)
{
	return a.filter(function(elem, pos) {
		return a.indexOf(elem) == pos;
	});
}
function array_merge(a, b, bUnique)
{
	var r = a.concat(b);
	if (bUnique == true)
		return array_unique(r);
	else
		return r;
}
function array_add(a, s)
{
	var a = a.slice();
	if (typeof s == "object") {
		for(var x=0; x<s.length; x++) {
			if (a.indexOf(s[x]) == -1)
				a.push(s[x]);
		}
	}
	else {
		var id = a.indexOf(s);
		if (id == -1) a.push(s);
	}
	return a;
}
function array_del(a, s)
{
	var a = a.slice();
	if (typeof s == "object") {
		for(var x=0; x<s.length; x++) {
			var id = a.indexOf(s[x]);
			if (id > -1) a.splice(id,1);
		}
	}
	else {
		var id = a.indexOf(s);
		if (id > -1) a.splice(id,1);
	}
	return a;
}
// 差異, a1 - a2
function array_diff(arr1)
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
function array_diff2(a1, a2)
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



function obj_indexOf(obj, k, v)
{
	if (!obj) return;
	for (var n in obj) {
		if (obj[n][k] == v)
			return n;
	}
}
// 取得物件長度
function obj_length(o)
{
	var l=0;
	for (var n in o) l++;
	return l;
}
// object 和並, 以 object2 為主
function obj_merge(obj1, obj2)
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
function obj_getKeys(obj)
{
	var out = [];
	for (var n in obj)
		out.push(n);
	return out;
}
function obj_getCols(obj, k, list)
{
	var out = [], v;
	for (var n in obj) {
		if (list && list.indexOf(n) == -1)
			continue;
		v = obj[n][k];
		if (v) out.push(v);
	}
	return out;
}
function obj_getVal(obj, index)
{
	var x = 0;
	for (var n in obj) {
		if (index == x)
			return obj[n];
		x++;
	}
	return null;
}


function getCurrentTimeStr(n, type)
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
	// YYYY/MM/DD hh:mm:ss
	else {
		return Y+"/"+(M<10?"0":"")+M+"/"+(D<10?"0":"")+D
				+" "+(h<10?"0":"")+h+":"+(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
	}
	
}
// Second 2 Time String
function time_con_S2TS(n, type)
{
	var out;
	var h=0, m, s;
	// mm:ss
	// hh:mm:ss
	s = n%60;
	m = parseInt(n/60);
	if (m > 60) {
		h = parseInt(m/60);
		m = m%60;
	}
	return m > 0 
		? (m<10?"0":"")+m+":"+(h<10?"0":"")+h+":"+(s<10?"0":"")+s
		: (h<10?"0":"")+h+":"+(s<10?"0":"")+s
}



function file_filter_path(u)
{
	return os.tmpdir();
}
function file_filter_path(u)
{
	if (u.indexOf("..") == -1) return u;
	u = u.replace(/\.\./g, "").replace(/\/{2,}/g, "\/");
	return u;
}
function file_replaceExt(fp, ext)
{
	var re = new RegExp('\\.[^\\/\\.]*$', 'i');
	if (re.test(fp))
		return fp.replace(re, '.'+ext);
	else
		return fp+"."+ext;
}
// 取副檔名
function file_makeExt(u)
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
// out => {size, cnt_file, cnt_dir}
function file_getDirSize(dir, funcOK)
{
	var out = {size:0, cnt_file:0, cnt_dir:0};
	function do_ok(err){
		if (funcOK) funcOK(out, err);
	}
	fs.lstat(dir, function(err, stats) {
		if (err) {
			do_ok(err);
		}
		else if(stats.isDirectory()) {
			out.size += stats.size;
			out.cnt_dir++;
			
			fs.readdir(dir, function(err, files) {
				if (err) return do_ok(err);

				async.forEach(files, function(filename, callback) {
					var subdir = path.join(dir, filename);
					file_getDirSize(subdir, function(res, err) {
						if (res) {
							out.size 	+= res.size;
							out.cnt_file+= res.cnt_file;
							out.cnt_dir	+= res.cnt_dir;
						}
						callback(err);
					}); 
				},  
				function(err) {
					do_ok(err);
				});  
			}); 
		}   
		else {
			out.size += stats.size;
			out.cnt_file++;
			do_ok();
		}   
	}); 
}
function file_writeFile(f_src, f_des, pos, len, funcOK)
{
	var data_src, fd_des = null;
	async.waterfall([
		function(callback) {
			fs.readFile(f_src, function(err, data){
				data_src = data;
				callback(err);
			});
		},
		function(callback) {
			fs.open(f_des, 'a+', function(err, fd) {
				fd_des = fd;
				callback(err);
			});
		},
		function(callback) {
			fs.write(fd_des, data_src, 0, data_src.length, pos, function(err){
				callback(err);
			})
		},
		function(callback) {
			fs.close(fd_des, function(err){
				if (!err) fd_des = null;
				callback(err);
			});
		}
	], function(err) {
		if (fd_des) fs.close(fd_des)
		if (funcOK) funcOK(err);
		if (err) console.log('util:file_writeFile Error: '.red, err);
	});
}


// del FileName; is del IP or '/'
function url_makePath(u, bHttp, bRR)
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

function url_chkError(r, bShowErr, name)
{
	if (!r) return true;
	var br = true;
	if (typeof(r) == "object") {
		br = r.error ? true : false;
		//if (br && bShowErr == true) B_Message((name && name != "" ? "("+name+")" : "") + r.error);
	}
	else if ( typeof(r) == "string" ) {
		if (r.length > 64) r = r.substr(0,64);
		re = new RegExp("<b>Warning</b>:|<b>Fatal error</b>:|<b>Notice</b>:|<b>Parse error</b>:", "i");
		br = re.test(r);
		if (!br) br = /error\:/i.test(r.substr(0,10));
		//if (br && bShowErr == true) B_Message((name && name != "" ? "("+name+")" : "") + r);
	}
	else {
		br = false;
	}
	return br;
}
// arg => {url, data, cookie, [fp], [getHeaders=false], [bLocation=true] funcOK}
function url_getFile(arg)
{
	var data = '';
	var urlInfo = oUrl.parse(arg.url);
	var bPost = arg.data ? true : false;
	var postData;

	var options = {
		hostname: 	urlInfo.hostname,
		port: 		urlInfo.port,
		path: 		urlInfo.path,
		method: 	(bPost ? 'POST' : 'GET'),
		headers:	{
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': HTTP_USER_AGENT
		}
	};
	if (arg.cookie && arg.cookie.length)
		options.headers['Cookie'] = arg.cookie
	if (bPost) {
		if (typeof arg.data == "object")
			postData = querystring.stringify(arg.data);
		else
			postData = arg.data;
		options.headers['Content-Length'] = Buffer.byteLength(postData,'utf8')
	}
	function do_req(res) {
		if (res.statusCode == 302 && arg.bLocation != false) {
			
			console.log(('util::url_getFile '+res.statusCode+', location=').yellow, res.headers.location);		

			arg.url = res.headers.location;
			url_getFile(arg);
			return;
		}
		else {
			//res.setEncoding('utf8');
			res.setEncoding('binary')
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function() {
				
				var err = null;
				var msgID = res.statusCode;
				if (msgID == 200 && url_chkError(data)) {
					msgID = -99;
					err = data;
					data = null;
				}
				
				if (msgID == 200) {
					if (data && arg.fp) {
						if (data && data.length) {
							fs.writeFile(arg.fp, data, "binary", function(err){
								if (err){
									console.log('util::url_getFile writeFile Error: '.red, err);
									if (arg.funcOK) arg.funcOK(null, err);
								}
								else {
									if (arg.funcOK) arg.funcOK(true);
								}
							});
						}
						else {
							if (arg.funcOK) arg.funcOK(null, err||"Error:");
						}
					}
					else {
						if (arg.getHeaders == true)
							arg.funcOK({data:data, headers:res.headers}, err);
						else
							arg.funcOK(data, err);
					}
				}
				else {
					if (err == null)
						err = "Error: ("+msgID+") "+data;
					if (arg.getHeaders == true)
						arg.funcOK({headers:res.headers}, err);
					else
						arg.funcOK(data, err);
				}
			})
		}
	};
	
// console.log('url_getFile: arg=', arg);
// console.log('url_getFile: urlInfo=', urlInfo);
// console.log('url_getFile: options=', options);
// console.log('url_getFile: postData=', postData);
	
	if (urlInfo.protocol == "https:") {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // 忽略憑證
		var req = oHttps.request(options, do_req);
	}
	else
		var req = oHttp.request(options, do_req);
	//
	req.on('error', function(e) {
		console.log('util::url_getFile Error: ' + e.message);
		if (arg.funcOK) arg.funcOK(null, e.message);
	});
	// write data to request body
	if (bPost) req.write(postData);
	req.end();

}
// arg => {url, [fp], [getHeaders=false], [bLocation=true], funcOK}
function url_getFile_get(arg)
{
// console.log('url_getFile_get: arg=', arg);		
	var data = '';
	var obj = /^https:/.test(arg.url) ? oHttps : oHttp;
// console.log('url_getFile_get: arg.url=', arg.url);		
	var req = obj.request(arg.url, function(res) {
// console.log('url_getFile_get: statusCode=', res.statusCode);		
// console.log('url_getFile_get: headers=', res.headers);		
		if (res.statusCode != 200) {
			if (res.statusCode == 302 && arg.bLocation != false) {
				arg.url = res.headers.location;
				url_getFile_get(arg);
				return;
			}
			
			if (arg.funcOK) 
				arg.funcOK(null, res.statusCode);
		}
		else {
			//res.setEncoding('utf8');
			res.setEncoding('binary')
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function() {
				
				var err;
				if (url_chkError(data)) {
					err = data;
					data = null;
				}
				if (data && arg.fp) {
					if (data && data.length) {
						fs.writeFile(arg.fp, data, "binary", function(err){
							if (err){
								console.log('util::url_getFile_get writeFile Error: '.red, err);
								if (arg.funcOK) arg.funcOK(null, err);
							}
							else {
								if (arg.funcOK) arg.funcOK(true);
							}
						});
					}
					else {
						if (arg.funcOK) arg.funcOK(null, err||"Error:");
					}
				}
				else {
					if (arg.funcOK) {
						if (arg.getHeaders == true)
							arg.funcOK({data:data, headers:res.headers}, err);
						else
							arg.funcOK(data, err);
					}
				}
			})
		}
	});
	//
	req.on('error', function(e) {
		console.log('util::url_getFile_get Error:'.red, e);
		if (arg.funcOK) arg.funcOK(null, e.message);
	});
	req.end();
}

function cookie_parse(request)
{
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}




function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
function error(res, code, err){
    var body;
	switch(code){
		case 401:	// 未授權
			res.statusCode = code;
			res.setHeader('WWW-Authenticate', 'Basic realm="NUWeb"');
			break;
		case 403:		// 禁止
			res.statusCode = code;
			body = "<h1>403 Access Forbiden!</h1>"
					+(err ? err : "Page access is forbidden.")
			break;
		case 404:		// 沒有發現
			res.statusCode = code;
			body = "<h1>404 Not Found</h1>"
					+(err ? err : "The page that you have requested could not be found.")
			break;
		case 500:		// 內部伺服器錯誤
			res.statusCode = code;
			body = "<h1>500 Internal Server Error</h1>"
					+(err ? err : "Internal server error.")
			break;
		default:
			res.statusCode = code;
			body = '<h1>'+code+'</h1>';
			break;
	}
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);
}



module.exports = {

ran_no:				ran_no
,min:				min
,max:				max
,uid:				uid

,isUrl:				isUrl
,isMail:			isMail

,HTMLEncode:		HTMLEncode
,con_Object2String:	con_Object2String

,str_repeat:		str_repeat

,array_unique:		array_unique
,array_merge:		array_merge
,array_add:			array_add
,array_del:			array_del
,array_diff:		array_diff
,array_diff2:		array_diff2

,obj_indexOf:		obj_indexOf
,obj_length:		obj_length
,obj_merge:			obj_merge
,obj_getKeys:		obj_getKeys
,obj_getCols:		obj_getCols
,obj_getVal:		obj_getVal

,getCurrentTimeStr:	getCurrentTimeStr
,time_con_S2TS:		time_con_S2TS

,file_filter_path:	file_filter_path
,file_replaceExt:	file_replaceExt
,file_makeExt:		file_makeExt
,file_getDirSize:	file_getDirSize
,file_writeFile:	file_writeFile

,url_makePath:		url_makePath
,url_chkError:		url_chkError
,url_getFile:		url_getFile
,url_getFile_get:	url_getFile_get

,cookie_parse:		cookie_parse

,sleep:				sleep
,error:				error

};
