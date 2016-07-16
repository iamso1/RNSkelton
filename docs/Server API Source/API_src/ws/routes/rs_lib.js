
var fs 			= require('fs');
var cp 			= require('child_process');
var async 		= require('async');
var imagesize	= require('image-size');
var colors 		= require('colors');

var util	= require('../utils');


var URLPATH_ICON 	= "/icon/";

var GDATA_FILE_TYPES = ["Video","Audio","Image","Document","Text","Html","Link","Other"]
var GDATA_EXT2TYPE_LIST = 
"Video	,3gp,asf,asx,avi,mpg,wmv,mpeg,mov,mp4,mts,m2ts,m2t,f4v,rm,rmvb,flv,mov,swf,vob,\n"
+"Audio	,mp3,wma,wav,ape,flac,acc,amr,m4a,ogg,\n"
+"Image	,jpg,gif,png,bmp,ico,jpeg,pcd,giif,tiff,psd,\n"
+"Document	,doc,docm,docx,dot,dotm,dotx,eps,fodp,fods,fodt,odp,ods,odt,otp,ots,ott,pdf,pot,potm,potx,ppam,pps,ppsm,ppsx,ppt,pptm,pptx,ps,rtf,tex,xla,xlam,xls,xlsb,xlsm,xlsx,xlt,xltm,xltx,\n"
+"Text	,text,txt,log,config,dic,mno,cfm,php,as,cs,shtm,aspx,xslt,ascx,resx,pkgdef,asax,ashx,asmx,disco,scp,ps1xml,\n"
+"Html	,htm,html,\n"
+"Link	,7p,\n"
// Other
var GDATA_EXT2ICON_LIST = 
"7P	,7p,\n"
+"doc	,doc,docx,rtf,\n"
+"exe	,exe,\n"
+"jpg	,jpg,gif,png,bmp,ico,jpeg,pcd,giif,tiff,psd,\n"
+"pdf	,pdf,\n"
+"pptx	,ppt,pptx,\n"
+"rar	,cab,jar,gz,rar,tar,7z,\n"
+"txt	,txt,log,config,dic,mno,cfm,php,as,cs,shtm,aspx,xslt,ascx,resx,pkgdef,asax,ashx,asmx,disco,scp,ps1xml,\n"
+"video	,avi,mpg,wmv,mpeg,mov,mp4,mts,m2ts,m2t,f4v,rm,rmvb,flv,mov,swf,\n"
+"audio	,mp3,wma,wav,ape,flac,acc,m4a,\n"
+"xlsx	,xls,xlsx,\n"
+"zip	,zip,\n"


var SYS_CONVERT 	= "/usr/bin/convert";
var SYS_FFMPEG 		= "/usr/bin/ffmpeg";
var SYS_PS2PDF 		= "/usr/bin/ps2pdf";
var SYS_DOC2PDF 	= "/usr/bin/soffice";
// /data/NUWeb_Site/bin/video2mp4.php video_file mp4_file [height]
var SYS_VIDEO2MP4 	= "/data/NUWeb_Site/bin/video2mp4.php";
var GET_IMG_PARAM_1 = "-y -f image2 -ss 10 -vframes 1 ";
var GET_IMG_PARAM_2 = "-y -f image2 -ss 3 -vframes 1 ";
var GET_MP3_PARAM	= "-y -acodec libmp3lame -ar 44100 -ab 256k -f mp3";

var SYS_WS_TOOLS_PHP= "/data/HTTPD/php/bin/php /data/NUWeb_Site/bin/ws_tools.php";
var GET_IMAGESIZE_PARAM = " -m imagesize -f ";

var SYS_AUTH_DECODE	= "/data/NUWeb_Site/bin/AuthDecode.exe";



///////////////////////////////////////////////////////

function con_key_quote(k)
{
	return k.replace(/\@\./, "_");
}
function con_fp2mp4(fp)
{
	var ext = util.file_makeExt(fp);
	return fp+".mp4";
}
function con_fp2mp3(fp)
{
	var ext = util.file_makeExt(fp);
	if (ext == "mp3")
		return fp;
	else
		return fp+".mp3";
}
function con_fp2pdf(fp)
{
	var ext = util.file_makeExt(fp);
	if (ext == "pdf")
		return fp;
	else
		return fp+".pdf";
}
function con_type2name(type)
{
	switch(type) {
		case "Video":
			return "影片";
		case "Audio":
			return "音樂";
		case "Image":
			return "圖片";
		case "Document":
			return "文件";
		case "Text":
			return "文字";
		case "Html":
			return "文章";
		case "Link":
			return "連結";
		//case "Other":
		default:
			return "檔案";
	}
}
function con_ext2type(ext)
{
	var re = new RegExp("^([\\w^\\t]+)\\t.*,"+ext+",", "im");
	var m = GDATA_EXT2TYPE_LIST.match(re);
	if (m) return m[1];
	return "Other";
}
function con_ext2icon(ext, bMin)
{
	var re = new RegExp("^([\\w^\\t]+)\\t.*,"+ext+",", "im");
	var m = GDATA_EXT2ICON_LIST.match(re);
	if (m) return URLPATH_ICON+m[1]+(bMin ? "16" : "125")+".png";
	return URLPATH_ICON+"file"+(bMin ? "16" : "125")+".png";
}

function auth_decode(code, funcOK)
{
	var cmd = SYS_AUTH_DECODE+" \""+code+"\"";
	cp.exec(cmd, function(err, stdout, stderr) {
		if (stdout) {
			try {
				var a = stdout.split(":");
				if (a.length == 5 && (a[0]||"") != "" && (a[1]||"") != ""
						&& (a[3]||"") != "") {
					var data = {
						ssn: a[0]
						,acn: a[1]
						,mail: (a[2]||"")
						,sun: a[3]
						,time: (a[5]||"")
					};
					funcOK(data);
					return;
				}
			} catch(e) {}
		}
		console.log('rs:auth_decode Error: '.red, err, "code="+code);
		funcOK(null, err);
	});	
}


function extract_tn(fp, size, fpTn, funcOK)
{
	if (!fpTn) fpTn = fp+".thumbs.jpg";
	var ext = util.file_makeExt(fp);
	var cmd;
	if (ext == "png" || ext == "gif")
		cmd = SYS_CONVERT+" \""+fp+"\" -flatten -quality 80 -thumbnail "+size+"x"+size+" \""+fpTn+"\"";
	else
		cmd = SYS_CONVERT+" \""+fp+"\" -thumbnail "+size+"x"+size+" \""+fpTn+"\"";

	cp.exec(cmd, function(err, stdout, stderr) {
		fs.exists(fpTn, function (exists) {
			if (funcOK) funcOK(exists);
		});
	});	
}
function img_getSize(fp, funcOK)
{
	try {
		if (/.ico$/i.test(fp)) {
			cmd = SYS_WS_TOOLS_PHP+GET_IMAGESIZE_PARAM+" \""+fp+"\"";
			cp.exec(cmd, function(err, stdout, stderr) {
				
				if (stdout && !util.url_chkError(stdout)) {
					funcOK(JSON.parse(stdout));
				}
				else {
					console.log('util:img_getSize Error:'.red, stdout);
					funcOK();
				}
			});	
		}
		else {
			funcOK(imagesize(fp));
		}
	} catch(e) {
		console.log('util:img_getSize Error:'.red, e);
		funcOK();
	}
}
function img2tn(fp, funcOK)
{
	var f_tn = fp+".thumbs.jpg";
	var f_1920 = fp+".1920.thumbs.jpg";
	var bExists, size, w;
	async.waterfall([
		function(callback) {
			img_getSize(fp, function(res){
				size = res;
				callback();
			})
		},
		// 300
		function(callback) {
			fs.exists(f_tn, function (exists) {
				bExists = exists;
				if (exists)
					callback();
				else {
					w = size && size.width < 300 ? size.width : 300;
					extract_tn(fp, w, f_tn, function(exists){
						bExists = exists;
						callback();
					})
				}
			});
		},
		// 1920
		function(callback) {
			fs.exists(f_1920, function (exists) {
				bExists = exists;
				if (exists)
					callback();
				else {
					w = size && size.width < 1920 ? size.width : 1920;
					extract_tn(fp, w, f_1920, function(exists){
						bExists = exists;
						callback();
					})
				}
			});
		}
	], function(err) {
		if (funcOK) funcOK(bExists, size);
	});
}
// 影片產生圖
function video_get_img(fp, funcOK)
{
	var f_src = fp+".src.thumbs.jpg";
    var f_tn = fp+".thumbs.jpg";
	var cmd, bExists;
	async.waterfall([
		// 原圖 方法 1
		function(callback) {
			cmd = SYS_FFMPEG+" -i \""+fp+"\" "+GET_IMG_PARAM_1+" \""+f_src+"\"";
			cp.exec(cmd, function(err, stdout, stderr) {
				fs.exists(f_src, function (exists) {
					bExists = exists;
					callback();
				})
			});
		},
		// 原圖 方法 2
		function(callback) {
			if (bExists) 
				callback();
			else {
				cmd = SYS_FFMPEG+" -i \""+fp+"\" "+GET_IMG_PARAM_2+" \""+f_src+"\"";
				cp.exec(cmd, function(err, stdout, stderr) {
					fs.exists(f_src, function (exists) {
						bExists = exists;
						callback();
					})
				});
			}
		},
		// 縮圖
		function(callback) {
			if (!bExists) {
				callback("error");
			}
			else {
				extract_tn(f_src, 300, f_tn, function(exists) {
					bExists = exists;
					callback();
				});
			}
		}
	], function(err) {
		if (funcOK) funcOK(bExists);
	});
}
// 影片轉檔
function video2mp4(fp, funcOK)
{
	var f_mp4 = con_fp2mp4(fp);
	var cmd = SYS_VIDEO2MP4+" \""+fp+"\" \""+f_mp4+"\"";
	cp.exec(cmd, function(err, stdout, stderr) {
		fs.exists(f_mp4, function (exists) {
			if (funcOK) funcOK(exists);
		})
	});
}
function video8audio(video, audio, out_fp, funcOK)
{
	var cmd = SYS_FFMPEG+" -i \""+video+"\" -i \""+audio+"\" -map 0:0 -map 1:0 "+"\""+out_fp+"\"";
console.log('rs:video8audio cmd=', cmd);
	cp.exec(cmd, function(err, stdout, stderr) {
		fs.exists(out_fp, function (exists) {
			if (funcOK) funcOK(exists);
		})
	});
}
function audioMerge(liat, out_fp, funcOK)
{
	var cmd = SYS_FFMPEG+" -i \""+video+"\" -i \""+audio+"\" -map 0:0 -map 1:0 "+"\""+out_fp+"\"";
console.log('rs:video8audio cmd=', cmd);
	cp.exec(cmd, function(err, stdout, stderr) {
		fs.exists(out_fp, function (exists) {
			if (funcOK) funcOK(exists);
		})
	});
}
// 文件轉 PDF
function doc2pdf(fp, funcOK)
{
	var f_pdf = con_fp2pdf(fp);
	var ext = util.file_makeExt(fp);
	var cmd;
	
	if (ext == "pdf")
	{
		if (funcOK) funcOK(true);
	}
	else if (ext == "ps" || ext == "eps")
	{
		cmd = SYS_PS2PDF+" \""+fp+"\" \""+f_pdf+"\"";
		cp.exec(cmd, function(err, stdout, stderr) {
			fs.exists(f_pdf, function(exists) {
				if (funcOK) funcOK(exists);
			})
		});
	}
	else
	{
		var dir = util.url_makePath(fp, true, false);
		var f_pdf2 = util.file_replaceExt(fp, "pdf");
		cmd = SYS_DOC2PDF+" --headless --convert-to pdf --outdir \""+dir+"\" \""+fp+"\"";
		cp.exec(cmd, function(err, stdout, stderr) {
			fs.exists(f_pdf2, function (exists) {
				if (exists) {
					fs.rename(f_pdf2, f_pdf, function(err) {
						if (funcOK) funcOK(!err);
					});
				}
				else {
					if (funcOK) funcOK(false);
				}
			})
		});
	}
}
// 音樂轉 MP3
function audio2mp3(fp, funcOK)
{
	var f_mp3 = con_fp2mp3(fp);
	var ext = util.file_makeExt(fp);
	var cmd;
	
	if (ext == "mp3")
	{
		if (funcOK) funcOK(true);
	}
	else
	{
		cmd = SYS_FFMPEG+" -i \""+fp+"\" "+GET_MP3_PARAM+" \""+f_mp3+"\"";
		cp.exec(cmd, function(err, stdout, stderr) {
			fs.exists(f_mp3, function (exists) {
				if (funcOK) funcOK(exists);
			})
		});
	}
}



function user_conn_add(users, cmInfo)
{
	var acn = cmInfo.acn;
	if (!users[acn]) {
		users[acn] = {
			acn:  acn, 
			sun:  cmInfo.sun, 
			conns:{} 
		};
	}
	users[acn].conns[cmInfo.uid] = cmInfo;
}
function user_conn_del(users, cmInfo, bDelUser)
{
	if (!users || !cmInfo || !users[cmInfo.acn]) return;
	var user = users[cmInfo.acn];
	var cnt = util.obj_length(user.conns);
	if (user.conns[cmInfo.uid]) {
		delete user.conns[cmInfo.uid];
		cnt = util.obj_length(user.conns);
		if (bDelUser == true && cnt == 0)
			delete users[cmInfo.acn];
	}
	return cnt;
}
function user_conn_cnt(users, acn)
{
	if (!users || !users[acn]) return 0;
	var user = users[acn];
	return user.conns ? util.obj_length(user.conns) : 0;
}

///////////////////////////////////////////////////////
module.exports = {
GDATA_FILE_TYPES: 	GDATA_FILE_TYPES

,con_key_quote:		con_key_quote
,con_fp2mp4:		con_fp2mp4
,con_fp2mp3:		con_fp2mp3
,con_fp2pdf:		con_fp2pdf
,con_type2name:		con_type2name
,con_ext2type:		con_ext2type
,con_ext2icon:		con_ext2icon

,auth_decode:		auth_decode

,extract_tn:		extract_tn
,img_getSize:		img_getSize
,img2tn:			img2tn
,video_get_img:		video_get_img
,video2mp4:			video2mp4
,video8audio:		video8audio
,doc2pdf:			doc2pdf
,audio2mp3:			audio2mp3

,user_conn_add: 	user_conn_add
,user_conn_del:		user_conn_del
,user_conn_cnt:		user_conn_cnt

};
