
var express 	= require('express');
var os 			= require('os');
var fs 			= require('fs');
var md5 		= require('md5');
var path 		= require('path');
var temp 		= require('temp');
var colors 		= require('colors');
var async 		= require('async');
var ObjectID 	= require('mongodb').ObjectID;
var request 	= require('request');

var util		= require('../utils');
var _db			= require('../db');
var rs			= require('./rs_lib');
var gcm			= require('./gcm_lib');

var DB_TYPE_FRIEND = 1;	// 朋友
var DB_TYPE_GROUPS = 2;	// 群組
var DB_TYPE_COMM = 3;	// 社群

var DB_RECUPD_MODE_NoviewClear = 1;
var DB_RECUPD_MODE_NoviewAdd = 2;
var DB_RECUPD_MODE_MsgDelAll = 3;

var DB_CM_TYPE_SET 		= "set";		// 
var DB_CM_TYPE_RECORD	= "record";		// 
var DB_CM_TYPE_CHAT 	= "chat";		// 聊天
var DB_CM_TYPE_PUSH_URL = "push_url";	// 
var DB_CM_TYPES_SYS 	= ["text","set","record","chat","push_url"];

var RTC_MSG_NO_RESPONSE = 1;
var RTC_MSG_OFFLINE 	= 2;
var RTC_MSG_FAIL 		= 3;
var RTC_MSG_BUSY 		= 4;
var RTC_MSG_ADD 		= 5;
var RTC_MSG_QUIT 		= 6;
var RTC_MSG_END 		= 7;
var RTC_MSG_DISCONN 	= 8;

var DIR_PUBLIC = path.join(__dirname, '../htdocs/');
var DIR_DATA = path.join(__dirname, '../htdocs/data/');
var URL_DATA = "/data/";

// 檢查 DATA 目錄是否有建立
fs.exists(DIR_DATA, function (exists) {
	if (!exists) {
		fs.mkdir(DIR_DATA, function (err) {
			if (err)
				console.log(('Error: 建立 DATA 目錄失敗...('+DIR_DATA+')('+err+')').red);
		});
	}
});			



var _users = {};
var _rtc_pc = {};

exports.init = function(users)
{
	_users = users;
}
exports.ws_close = function(info)
{
	
	// WebRTC
	if (info.rtc.cid != "")
		cb_rtc_user_disconnection(info);
}
exports.ws_msg = function(info, arg)
{
	console.log(('cb::ws_msg '+arg.mode+' '+(info.acn||arg.acn)+' '+(info.sun||arg.sun)).green);
	switch(arg.mode){
		case "cb_msg_add":
			cb_msg_add(info, arg);
			break;
		case "cb_msg_del_all":
			cb_msg_del_all(info, arg);
			break;
		case "cb_msg_getList":
			cb_msg_getList(info, arg);
			break;
			
		case "cb_user_view":
			cb_user_view(info, arg);
			break;
		case "cb_watch_online":
			cb_watch_online(info, arg);
			break;
		case "cb_getList":
			cb_getList(info, arg);
			break;
		case "cb_getCID":
			cb_getCID(info, arg);
			break;
		case "cb_openBox":
			cb_openBox(info, arg);
			break;
		case "cb_openBox2":
			cb_openBox2(info, arg);
			break;
		case "cb_arg_set":
			cb_arg_set(info, arg);
			break;
		case "cb_friend_add":
			cb_friend_add(info, arg);
			break;
		case "cb_set_title":
			cb_set_title(info, arg);
			break;
		case "cb_set_admin":
			cb_set_admin(info, arg);
			break;
		case "cb_set_friend":
			cb_set_friend(info, arg);
			break;
		case "cb_set_quit":
			cb_set_quit(info, arg);
			break;
		case "cb_set_close":
			cb_set_close(info, arg);
			break;
		case "cb_set_data_sync":
			cb_set_data_sync(info, arg);
			break;
		case "cb_upload_file":
			cb_upload_file(info, arg);
			break;
		
		
		case "cb_rtc_call":
			cb_rtc_call(info, arg);
			break;
		case "cb_rtc_sdp":
			cb_rtc_sdp(info, arg);
			break;
		case "cb_rtc_candidate":
			cb_rtc_candidate(info, arg);
			break;
		
		// arg => {id, time}
/*		case "cb_test":
			var t = arg.time||5;
			//util.sleep(t*1000);
			
			setTimeout(function(){
				ws_send(info, {
					mode: "cb_test"
					,id: arg.id
				});
			}, t*1000);
			
			break;*/
		
		default:
			console.log('cb::ws_msg Error: '+('Invalid mode('+arg.mode+').').red);
			console.log('cb::ws_msg Error: arg='.red, util.con_Object2String(arg,false,-1,1).yellow);
			break;
	}
};
// User Online
exports.ws_watch_online = function(info)
{
	var user_acn = info.acn;
	var user = _users[user_acn];
	if (!user) return;
	var online = cb_is_online(user);
	if (!user.online || online != user.online) {
		user.online = online;
		
		console.log(('cb::ws_watch_online online='+online+', user_acn='+user_acn).yellow);
		// 通知所有連上人員
		for (var acn in _users) {
			var user = _users[acn];
			for (var uid in user.conns) {
				var info = user.conns[uid];
				if (!info.fun_cb || !info.watch_online 
						|| info.watch_online.indexOf(user_acn) == -1)
					continue;
				
				ws_send(info, {
					mode: "user_online"
					,acn: user_acn
					,online: online
				});
			}
		}
	}
}

// data => {mode, ...}
// {cid, act[add / del / transfer(擁有者轉移)], acn[string / array], sun[string / array]}
exports.cb_msg = function(req, res)
{
	console.log('cb::cb_msg: ~~~');
	// req.query GET
	// req.body POST
	
	try {
		var nu_code = req.body['nu_code']||req.query['nu_code']||"";
		var data = req.body['data']||req.query['data'];
	} catch(e){}
	var err;
	if (nu_code == "")
		err = "empty nu_code";
	else if ((data||"") == "") 
		err = "empty data";
	if (err) {
		console.log('ws::cb_msg: Error: '.red, err);
		util.error(res, 404);
		return;
	}
	
	try {
		var arg = JSON.parse(data);
	} catch(e){}
	var userInfo;
	async.waterfall([
		function(callback) {
			rs.auth_decode(nu_code, function(res, err){
				userInfo = res;
				if (!userInfo)
					callback("Permission denied");
				else
					callback();
			});
		},
		function(callback) {
			if (!arg || !arg.mode)
				callback("empty mode");
			else {
				switch(arg.mode) {
					case "cb_set_friend":
						cb_set_friend(userInfo, arg);
						break;
					case "cb_set_admin":
						cb_set_admin(userInfo, arg);
						break;
					case "cb_friend_add":
						cb_friend_add(userInfo, arg);
						break;
					default:
						callback("mode invalid");
						break;
				}
			}
		}
	], function(err) {
		if (err) {
			util.error(res, 404, err);
			console.log('cb::cb_msg: Error: err='.red, err);
		}
		else {
			console.log('cb::cb_msg: OK.'.green);
		}
	});
}
exports.cb_view_file = function(req, res)
{
	try {
		var url  = req.body['url']||req.query['url'];
		var type = req.body['type']||req.query['type'];
		var mode = req.body['mode']||req.query['mode'];
		var size = req.body['size']||req.query['size'];
	} catch(e){}
	var err;
	if (!url)
		err = "empty url";
	else if ((type||"") == "") 
		err = "empty type";
	if (err) {
		console.log('ws::cb_view_file: Error: '+err.red);
		util.error(res, 404);
		return;
	}
	
	url = util.file_filter_path(url);
	
	var bDownload = mode == "download";
	var code, err;
	var fp = path.join(DIR_PUBLIC, url);
	var f_rec = fp+".rec";
	var rec, filename;
	var out_file, out_fn;
	async.waterfall([
		function(callback) {
			fs.exists(fp, function (exists) {
				if (!exists) {
					util.error(res, 404)
				} else {
					callback();
				}
			});
		},
		// Read Record
		function(callback) {
			fs.readFile(f_rec, function(err, data){
				if (data)
					rec = JSON.parse(data);
				callback();
			});
		},
		function(callback) {
			if (type == "Image") {
				var w = rec && rec.file_info && rec.file_info.width ? rec.file_info.width : 0;
				if (size == 300) {
					if (w < 300)
						out_file = fp;
					else
						out_file = fp+".thumbs.jpg";
				}
				else if (size == 1920) {
					if (w < 1920)
						out_file = fp;
					else
						out_file = fp+".1920.thumbs.jpg";
				}
				else if (size == "src")
					out_file = fp;
				else if (bDownload)
					out_file = fp;
				else {
					if (w < 1920)
						out_file = fp;
					else
						out_file = fp+".1920.thumbs.jpg";
				}
			}
			else if (type == "Video") {
				if (bDownload)
					out_file = fp;
				else {
					f_mp4 = rs.con_fp2mp4(fp);
					fs.exists(f_mp4, function (exists){
						if (exists) {
							out_file = f_mp4;
							callback();
						} 
						else {
							out_file = fp;
							callback();
						}
					});
					return;
				}
			}
			else if (type == "Audio") {
				out_file = fp;
			}
			else if (type == "Document") {
				if (bDownload)
					out_file = fp;
				else {
					f_pdf = rs.con_fp2pdf(fp);
					fs.exists(f_pdf, function (exists){
						if (exists) {
							out_file = f_pdf;
							callback();
						} 
						else {
							out_file = fp;
							callback();
						}
					});
					return;
				}
			}
			else if (type == "Other") {
				out_file = fp;
			}
			else {
				util.error(res, 404)
				return;
			}
			
			callback();
		},
		function(callback) {
			out_fn = rec ? rec.filename : path.basename(fp);
			function fun_res(err) {
				if (err)
					res.status(err.status).end();
				callback(err)
			}
			if (mode == "download")
				res.download(out_file, out_fn, fun_res);
			else 
				res.sendfile(out_file, out_fn, fun_res);
		}
	], function(err) {
		if (err)
			console.log('cb::cb_view_file: err='.red, err);
		else
			console.log('cb::cb_view_file: OK. out_fn=', out_fn, out_file);
	});
}
exports.cb_tools = function(req, res)
{
	try {
		var mode = req.body['mode']||req.query['mode']||"";
	} catch(e){}
	var err;
	if (mode == "")
		return do_err("empty mode");
	
	if (mode == "getMsg")
	{
		var mid = getVal("mid");
		db_cm_find_list({
				mid:mid
			}, function(recs, err){
				if (recs && recs.length)
					res.json(recs[0]).end();
				else
					util.error(res, 404, err);
			});
	}
	else
	{
		return do_err("Invalid mode.("+mode+")");
	}
	
	
	function getVal(key){
		return req.body[key]||req.query[key];
	}
	function do_err(err){
		console.log('ws::cb_tools: Error: '.red, err);
		util.error(res, 404, err);
	}
}
// data => {nu_code, cid, fid, fn, fs, mtime, [ufid]};
// [file] => FileData
exports.cb_upload_file = function(req, res, next)
{
// console.log('cb::cb_upload_file 1 body=', req.body);
// console.log('cb::cb_upload_file 2 files=', util.con_Object2String(req.files, false, 1));
// 1. fieldname:"file",
// 2. originalname:"CA-olwp2.jpg",
// 3. encoding:"7bit",
// 4. mimetype:"image/jpeg",
// 5. destination:"/tmp/",
// 6. filename:"e1f30754bdc7586088ae89d650349ca4",
// 7. path:"/tmp/e1f30754bdc7586088ae89d650349ca4",
// 8. size:604018
	
	try {
		var data = JSON.parse(req.body.data||req.query.data);
	} catch(e){
		var data = {}
	}
// console.log('cb::cb_upload_file @@@ data=', data);

	var nu_code = data.nu_code||"";
	var cid 	= data.cid||"";
	var fid 	= data.fid||"";
	var file 	= req.files && req.files.length ? req.files[0] : null;
	var ufid 	= data.ufid||"";
	var err;
	if (nu_code == "")
		err = "empty nu_code";
	else if (cid == "")
		err = "empty cid";
	else if (fid == "")
		err = "empty fid";
	else if (file == null && ufid == "") // 二選一
		err = "empty file";
	if (err) {
		console.log('cb::cb_upload_file: Error: '.red, err);
		util.error(res, 404, err);
		return;
	}
	
	var src_path = file ? file.path : os.tmpDir()+"/ufid_"+ufid;
	var ext = util.file_makeExt(data.fn);
	var type = rs.con_ext2type(ext);
	var time = util.getCurrentTimeStr(null,1);
	var dir = path.join(DIR_DATA, cid);
	var userInfo, recCB, dir, target_path, msg, file_info;
	var out = {};
	async.waterfall([
		// Decode
		function(callback) {
			rs.auth_decode(nu_code, function(res, err){
// console.log('cb::cb_upload_file auth_decode res=', res);
				if (!res || (res.acn||"") == "" || (res.sun||"") == "")
					callback(err||"Decoding failure");
				else {
					userInfo = res;
					callback();
				}
			})
		},
		// Get recCB
		function(callback) {
			db_cb_find_id(cid, function(rec, err){
				if (rec) {
					recCB = rec;
					callback();
				}
				else
					callback(err);
			});
		},
		// Check Exists And Create cid Dir
		function(callback) {
			dir = path.join(DIR_DATA, cid);
			fs.exists(dir, function (exists) {
				if (exists) {
					callback();
				}
				else {
					fs.mkdir(dir, function (err) {
						callback(err);
					});
				}
			});			
		},
		// Rename File
		function(callback) {
			target_path = temp.path({dir:dir, suffix:'.'+ext}); // dir, prefix, suffix
			// move the file from the temporary location to the intended location
			fs.rename(src_path, target_path, function(err) {
				//fs.unlink(file.path);
				callback(err);
			})
		},
		// 
		function(callback) {
			cb_upload_file_handle(type, target_path, function(f_info){
				file_info = f_info;
				callback();
			});
		},
		// Create File Rec
		function(callback) {
			var f_rec = target_path+".rec";
			var rec = {
				cid: 		cid
				,owner: 	userInfo.acn
				,owner_sun: userInfo.sun
				,type: 		type
				,filename: 	data.fn
				,size: 		data.fs
				,time:		time
				,mtime:		data.mtime||""
			}
			if (file_info) rec.file_info = file_info;
			fs.writeFile(f_rec, JSON.stringify(rec), function(err){
				callback(err);
			});
		},
		// ChatMsg Add
		function(callback) {
			var fn = path.basename(target_path);
			url = cb_con_fp2ufp(cid, target_path);
			var recNew = {
				cid: 		cid
				,owner: 	userInfo.acn
				,owner_sun: userInfo.sun
				,type: 		type
				,filename: 	data.fn
				,size: 		data.fs
				,mtime:		data.mtime||""
				,url:		url
			}
			if (file_info) recNew.file_info = file_info;
			f_db_cm_add(recNew, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			}
			,{ fid: fid }
			);
		}
	], function(err) {
		if (err) {
			util.error(res, 500, err);
			console.log('cb::cb_upload_file @@@ err='.red, err);
		}
		else {
			res.end("ok");
			console.log('cb::cb_upload_file @@@ ok.');
		}
	});
}
exports.cb_upload_record = function(req, res, next)
{
	console.log('cb::cb_upload_record ~~~ ');
// console.log('cb::cb_upload_record 1 body typeof=', typeof req.body);
// console.log('cb::cb_upload_record 1 body Keys=', util.obj_getKeys(req.body));
// console.log('cb::cb_upload_record 1 body=', req.body);
// console.log('cb::cb_upload_record 2 files=', util.con_Object2String(req.files, false, 1));
	try {
		var data = JSON.parse(req.body.data);
	} catch(e){
		var data = {}
	}
// console.log('cb::cb_upload_record 3 data=', data);

	var cid 	= data.cid||"";
	var nu_code = data.nu_code||"";
	var fid 	= data.fid||"";
	var err;
	if (cid == "")
		err = "empty cid";
	else if (nu_code == "")
		err = "empty nu_code";
	else if (fid == "")
		err = "empty fid";
	if (err) {
		console.log('cb::cb_upload_record: Error: '.red, err);
		util.error(res, 404, err);
		return;
	}
	
	var dir = path.join(DIR_DATA, cid);
	var path_key = temp.path({dir:dir, prefix:'rec_'}); // dir, prefix, suffix
	var userInfo, recCB, target_path, msg;
	var out = {};
	async.waterfall([
		// Decode
		function(callback) {
			rs.auth_decode(nu_code, function(res, err){
// console.log('cb::cb_upload_record auth_decode res=', res);
				if (!res || (res.acn||"") == "" || (res.sun||"") == "")
					callback(err||"Decoding failure");
				else {
					userInfo = res;
					callback();
				}
			})
		},
		// Get recCB
		function(callback) {
			db_cb_find_id(cid, function(rec, err){
				if (rec) {
					recCB = rec;
					callback();
				}
				else
					callback(err);
			});
		},
		// Check Exists And Create cid Dir
		function(callback) {
			fs.exists(dir, function (exists) {
				if (exists) {
					callback();
				}
				else {
					fs.mkdir(dir, function (err) {
						callback(err);
					});
				}
			});			
		},
		// Files 2 User
		function(callback) {
			// Video
			if (data.type == "video")
			{
				var users = {};
				var file, a, acn, type;
				for(var x=0; x<req.files.length; x++){
					file = req.files[x];
					if (!file.originalname) continue;
					a = file.originalname.split("-");
					acn = a[0];
					type = a[1];
					if (!users[acn]) users[acn] = {acn:acn};
					users[acn][type] = file;
				}
// console.log('cb::cb_upload_record Files 2 User users=', users);
				async.eachSeries(users, function(user, cbUsers) {
					var acn = user.acn;
					// 合併
					if (user.audio && user.video) {
						target_path = path_key+"-"+acn+".webm";
						rs.video8audio(user.video.path, user.audio.path, target_path, function(bExists){
							if (bExists) {
								data.users[acn].video = target_path.split("/").pop();
							}
							cbUsers();
						});
					}
					else if (user.video) {
						target_path = path_key+"-"+acn+".webm";
						fs.rename(user.video.path, target_path, function(err) {
							if (!err) data.users[acn].video = target_path.split("/").pop();
							cbUsers();
						});
					}
					else if (user.audio) {
						target_path = path_key+"-"+acn+".wav";
						fs.rename(user.video.path, target_path, function(err) {
							if (!err) data.users[acn].video = target_path.split("/").pop();
							cbUsers();
						});
					}
// console.log('cb::cb_upload_record Files 2 User target_path=', target_path);
				}, function(){
					callback();
				});
			}
			// Phone
			else
			{
				// target_path = path_key+".wav";
				// var file, list = [];
				// for(var x=0; x<req.files.length; x++){
					// file = req.files[x];
					
					// if (!file.path) continue;
					// list.push(file.path);
				// }
// console.log('cb::cb_upload_record list=', list);
				
				async.eachSeries(req.files, function(file, cbFiles) {
					if (!file.originalname) return;
					var a = file.originalname.split("-");
					var acn = a[0];
					
					target_path = path_key+"-"+acn+".wav";
					fs.rename(file.path, target_path, function(err) {
						if (!err) data.users[acn].audio = target_path.split("/").pop();
						cbFiles();
					});
					
				}, function(){
// console.log('cb::cb_upload_record ~~~ Phone ~~~ data=', data);
					callback();
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			delete data.b;
			delete data.time;
			delete data.bFirefox;
			delete data.fid;
			delete data.cid;
			delete data.nu_code;
			
			if (data.type == "video")
				msg = "將視訊記錄下來";
			else
				msg = "將聲音記錄下來";
			
			var recMsg = {
				cid: 		cid
				,owner: 	userInfo.acn
				,owner_sun: userInfo.sun
				,type: 		DB_CM_TYPE_RECORD
				,content:	msg
				,file_info:	data
			}
// console.log('cb::cb_upload_record 產生動作訊息 ~~~ recMsg=', recMsg);
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
// console.log('cb::cb_upload_record 產生動作訊息 ~~~ rec/err=', rec, err);
				if (rec)
					callback();
				else
					callback(err);
			});
		},
	], function(err) {
// console.log('cb::cb_upload_record End ~~~ data=', data);
		if (err) {
			util.error(res, 404, err);
			console.log('cb::cb_upload_record: Error: '.red, err);
		}
		else {
			res.json(out).end();
			console.log('cb::cb_upload_record: OK. acn='+userInfo.acn+', msg=', msg);
		}
	});
}
exports.getCBList = function(funcOK)
{
	sys_getCBList(funcOK);
}


function ws_send(info, arg)
{
	if (!info.conn) return;
	if (info.fun_cb) {
		try {
			info.conn.send(JSON.stringify(arg));
		} catch(e){}
		console.log('cb::ws_send'.green+' Notice'.cyan+' uid='+(info.uid+'').cyan+', acn='+info.acn.cyan+", mode="+arg.mode);
	} else {
		//console.log('ws::ws_send'.green+' Notice'.cyan+' uid='+(info.uid+'').cyan+', acn='+info.acn.cyan+' ~~~~~~ fun_cb=false');
	}
}
// arg => {mode, ...; [cid], [rec]}
function ws_send_all(allow, arg, users)
{
	console.log('cb::ws_send_all'.green+' ~~~ users.length='+(util.obj_length(_users)+"").cyan
					+', mode='+arg.mode.cyan+', allow='+allow);
	if (!users) users = _users;
	for (var acn in users) {
		if (allow && allow.indexOf(acn) == -1)
			continue;
		
		var user = users[acn];
		for (var uid in user.conns) {
			ws_send(user.conns[uid], arg);
		}
	}
}

function cb_is_online(userInfo)
{
	if (!userInfo || !userInfo.conns) return false;
	for (var uid in userInfo.conns) {
		if (userInfo.conns[uid].fun_cb == true)
			return true;
	}
	return false;
}
function cb_is_admin(recCB, user)
{
	if (recCB.owner == user)
		return true;
	if (recCB.admin && recCB.admin.indexOf(user) > -1)
		return true;
	return false;
}
// funcOK(dir, err)
function cb_chk_dir(cid, funcOK)
{
	var dir = path.join(DIR_DATA, cid);
	fs.exists(dir, function (exists) {
		if (exists) {
			funcOK(dir);
		}
		else {
			fs.mkdir(dir, function (err) {
				if (err)
					funcOK(null, err);
				else
					funcOK(dir);
			});
		}
	});			
}
function cb_con_fp2ufp(cid, fp)
{
	return URL_DATA+cid+"/"+path.basename(fp);
}

// arg => {mode, acn}
function cb_watch_online(info, arg)
{
// console.log('ws::cb_watch_online ~~~ arg='.green, arg);
	var list = [];
	var acns = arg.acn;
	async.waterfall([
		function(callback) {
			if (typeof acns != "object" || !acns.length)
				callback("acn invalid");
			else {
				info.watch_online = acns;
				for (var acn in _users) {
					if (acns.indexOf(acn) == -1)
						continue;
					
					if (cb_is_online(_users[acn]))
						list.push(acn);
				}
				callback();
			}
		}
	], function(err) {
		out = {mode: "cb_watch_online"};
		if (err) out.error = err;
		else out.data = list;
		ws_send(info, out);
		
		if (err)console.log('cb::cb_watch_online: Error: '.red, err);
		else	console.log('cb::cb_watch_online: OK. out=', out);
	});
	
}
// arg => {mode, cid}
function cb_user_view(info, arg)
{
// console.log('cb::cb_user_view ~~~ arg=',arg);
	var recCB;
	var cid = arg['cid']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			cb_rec_upd(info, recCB, null, DB_RECUPD_MODE_NoviewClear);
// console.log('cb::cb_user_view ~~~ recCB=', recCB);
			f_db_cb_upd(recCB, null, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_user_view: Error: '.red, err);
		}
		else {
			console.log('cb::cb_user_view: OK.');
		}
	});
}
// arg => {mode}
function cb_getList(info, arg)
{
// console.log('cb::cb_getList ~~~ arg=',arg);
	db_cb_find_user(info.acn, function(recs, err){
		
// console.log('cb::cb_getList '+('count='+recs.length).green);
		ws_send(info, {
			mode: "cb_getList"
			,recs: recs
		});
	});
}
// arg => {[site_acn], [cid] }
function cb_getCID(info, arg)
{
// console.log('cb::cb_getCID ~~~ arg=',arg);
	// waterfall callback => 有給 err 就會結束.
	var cid, recCB;
	async.waterfall([
		// Find ID
		function(callback) {
			if ((arg.site_acn||"") != "") {
				var query = {site_acn: arg.site_acn};
				db_cb_find({query:query}, function(recs, err){
					if (recs) {
						recCB = recs[0];
						cid = recCB._id;
					}
					callback(err);
				});
			}
			else if ((arg.cid||"") != "") {
				var query = {_id:ObjectID(arg.cid)};
				db_cb_find({query:query}, function(recs, err){
					if (recs) {
						recCB = recs[0];
						cid = recCB._id;
					}
					callback(err);
				});
			}
			else
				callback("arg invalid");
		}
	], function(err) {
		out = {mode: "cb_getCID"};
		if (recCB) out.rec = recCB;
		if (cid) out.cid = cid;
		if (err) out.error = err;
		ws_send(info, out);
		
		if (err) 
			console.log('cb::cb_getCID: Error: '.red, err);
		else
			console.log('cb::cb_getCID: OK. cid=', cid);
	});
}
// arg => {[cid,] / [users,] / [type, ownwer, title, allow] }
function cb_openBox(info, arg)
{
// console.log('cb::cb_openBox ~~~ arg=',arg);
	var allow = null;
	function do_ok(rec){
		ws_send(info, {
			mode: "cb_openBox"
			,rec: rec
		});
	}
	// waterfall callback => 有給 err 就會結束.
	async.waterfall([
		// Find ID
		function(callback) {
			if (arg.cid && arg.cid != "") {
				db_cb_find_id(arg.cid, function(rec, err){
					if (rec)
						do_ok(rec);
					else
						callback();
				});
			}
			else
				callback();
		},
		// Find Users
		function(callback) {
			if (typeof arg.users != "object" || arg.users.length == 0) {
				callback();
				return;
			}
			
			allow = arg.users;
			if (allow.indexOf(info.acn) == -1)
				allow.unshift(info.acn);
			db_cb_find_allow(allow, function(rec, err) {
				if (rec)
					do_ok(rec);
				else
					callback();
			});
		},
		// Create
		function(callback) {
			if (allow == null) { callback("Error: empty users."); return; }
			
			var type = allow.length > 2 ? DB_TYPE_GROUPS : DB_TYPE_FRIEND;
			
			var recCB = {
				owner:		info.acn
				,allow: 	allow
				,type:		type
				,title: 	""
			}
			cb_rec_upd(info, recCB, null, 0);
			db_cb_add(recCB, function(rec, err){
				if (rec)
					do_ok(rec);
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,msg: err
			});
			console.log('cb::cb_openBox: Error: '+err.red);
		}
		else {
			console.log('cb::cb_openBox: OK.');
		}
	});
}
// 建立社群聊天室
// arg => {type, [site_acn], owner, admin, allow, title}
function cb_openBox2(info, arg)
{
// console.log('cb::cb_openBox2 ~~~ arg=',arg);
	var bTypeGroups = arg.type == DB_TYPE_GROUPS;
	var bTypeComm = arg.type == DB_TYPE_COMM;
	var site_acn = arg.site_acn||"";
	var recCB;
	// waterfall callback => 有給 err 就會結束.
	async.waterfall([
		// Find site_acn
		function(callback) {
			if (!bTypeGroups && !bTypeComm) {
				callback("type invalid");
			}
			else if (bTypeComm) {
				if (site_acn == "") {
					callback("empty site_acn");
				}
				else {
					var query = {site_acn: arg.site_acn};
					db_cb_find({query:query}, function(recs, err){
						if (recs) { // 已經存在了
							recCB = recs[0];
						}
						callback();
					});
				}
			}
			else {
				callback();
			}
		},
		// Create
		function(callback) {
			if (recCB) {
				callback();
			}
			else if ((arg.owner||"") == "") { 
				callback("empty owner");
			}
			else if (arg.admin && typeof arg.admin != "object") { 
				callback("admin invalid");
			}
			else if (typeof arg.allow != "object") { 
				callback("allow invalid");
			}
			else if ((arg.title||"") == "") { 
				callback("empty title");
			}
			else {
				var recNew = {
					type:		arg.type
					,owner:		arg.owner
					,admin: 	(arg.admin||[])
					,allow: 	arg.allow
					,title: 	arg.title
				}
				if (site_acn) recNew.site_acn = site_acn;
				cb_rec_upd(info, recNew, null, 0);
				db_cb_add(recNew, function(rec, err){
					if (rec)
						recCB = rec;
					callback(err);
				});
			}
		}
	], function(err) {
		out = {mode: "cb_openBox2"};
		if (recCB) out.rec = recCB;
		if (err) out.error = err;
		ws_send(info, out);
		
		if (recCB)	console.log('cb::cb_openBox2: OK.');
		else 		console.log('cb::cb_openBox2: Error: '.red, err);
	});
}

// arg => {mode, cid, type, content, [file_info:{}] ...}
// file_info => {url, host, img, title, desc}
function cb_msg_add(info, arg)
{
// console.log('cb::cb_msg_add ~~~ arg=',arg);
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var file_info;
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 
		function(callback) {
			if (arg.type == DB_CM_TYPE_PUSH_URL) {
				var file_info, target_path, ext;
				
				file_info = arg.file_info;
				if (typeof file_info != "object") {
					callback("file_info invalid");
					return;
				}
				if (!file_info.img || file_info.img == "" || !util.isUrl(file_info.img)) {
					callback();
					return; // 不處理
				}
				
				cb_chk_dir(cid, function(dir, err){
					if (err) {
						callback(err);
						return;
					}
					
					ext = util.file_makeExt(file_info.img);
					target_path = temp.path({dir:dir, suffix:'.'+ext}); // dir, prefix, suffix
					// 取得圖片
					util.url_getFile_get({
						url: 	file_info.img
						,fp:	target_path
						,funcOK:function(b, err){
							if (b) {
								file_info.img = cb_con_fp2ufp(cid, target_path);
								callback();
							}
							else {
								console.log('cb::cb_msg_add Push Url url_getFile_get Error: '.red, err);
								callback();
							}
						}
					});
				});
			}
			else {
				callback();
			}
		},
		// Message Add
		function(callback) {
			recMsg = util.obj_merge(arg);
			delete recMsg['mode'];
			recMsg['owner'] = info.acn;
			recMsg['owner_sun'] = info.sun;
			db_cm_add(recMsg, function(rec, err){
				// OK
				if (rec) {
					// 通知所有連上人員
					ws_send_all(recCB.allow, {
						mode: "cb_msg_add"
						,cid: cid
						,rec: rec
					});
					recMsg = rec;
					callback();
				}
				else
					callback(err);
			});
		},
		// 更新 Record 
		function(callback) {
			cb_rec_upd(info, recCB, recMsg, DB_RECUPD_MODE_NoviewAdd);
// console.log('cb::cb_msg_add ~~~ recMsg=', recMsg);
// console.log('cb::cb_msg_add ~~~ recCB=', recCB);
			f_db_cb_upd(recCB, null, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_msg_add: Error: '+err.red);
		}
		else {
			console.log('cb::cb_msg_add: OK.');
		}
	});
}
// arg => {mode, cid}
function cb_msg_del_all(info, arg)
{
// console.log('cb::cb_msg_del_all ~~~ arg=',arg);
	var recCB;
	var cid = arg['cid']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			cb_rec_upd(info, recCB, null, DB_RECUPD_MODE_MsgDelAll);
// console.log('cb::cb_msg_del_all ~~~ recCB=', recCB);
			db_cb_upd(recCB, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		},
		function(callback) {
			ws_send(info, {
				mode: "cb_msg_del_all"
				,cid: cid
				,'return': 'ok'
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_msg_del_all: Error: '+err.red);
		}
		else {
			console.log('cb::cb_msg_del_all: OK.');
		}
	});
}
// arg => {mode cid, lt, ps}
function cb_msg_getList(info, arg)
{
// console.log('cb::cb_msg_getList ~~~ arg=',arg);
	var recCB;
	var cid = arg['cid']||"";
	if (arg.ps < 1) arg.ps = 5;
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		function(callback) {
			f_db_cm_find_list(info, recCB, arg, function(recs, err){
				if (recs)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_msg_getList: Error: '+err.red);
		}
		else {
			console.log('cb::cb_msg_getList: OK.');
		}
	});
}
// arg => {[cid / site_acn], acns, suns}
function cb_friend_add(info, arg)
{
// console.log('cb::cb_friend_add ~~~ arg=',arg);
	var recCB, recNew;
	var cid = arg['cid']||"";
	var site_acn = arg['site_acn']||"";
	var acns = arg['acns'];
	var suns = arg['suns'];
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "" && site_acn == "")
				callback("empty cid");
			else if (typeof acns != "object" || acns.length == 0)
				callback("acns invalid");
			else if (typeof suns != "object" || suns.length == 0)
				callback("suns invalid");
			else {
				if (site_acn != "") {
					db_cb_find_site_acn(site_acn, function(rec, err){
						if (rec) {
							cid = rec._id;
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
				else {
					db_cb_find_id(cid, function(rec, err){
						if (rec) {
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
			}
		},
		// 建立群組 或 增加朋友
		function(callback) {
			// 建立群組聊天室
			if (recCB.type == DB_TYPE_FRIEND)
			{
				var allow = util.array_unique( recCB.allow.concat(acns) );
				if (allow.length < 3) {
					callback("acns invalid ");
					return;
				}
				
				var recNew = {
					owner:		info.acn
					,allow: 	allow
					,type:		DB_TYPE_GROUPS
					,title: 	""
				}
				cb_rec_upd(info, recNew, null, 0);
				db_cb_add(recNew, function(rec, err){
					
					// OK
					if (rec) {
						var fid = cid;
						cid = rec._id;
						recCB = rec;
						
						ws_send_all(allow, {
							mode: "cb_friend_add"
							,fid: fid
							,cid: cid
							,rec: rec
						});
						
						callback();
					}
					else
						callback(err);
				});
			}
			// 增加朋友
			else
			{
				recCB.allow = util.array_unique( recCB.allow.concat(acns) );
				cb_rec_upd(info, recCB, null, 0);
				f_db_cb_upd(recCB, null, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			var recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	"加了 "+suns.join("、")
			}
			db_cm_add(recMsg, function(rec, err){
				// OK
				if (rec) {
					// 通知所有連上人員
					ws_send_all(recCB.allow, {
						mode: "cb_msg_add"
						,cid: cid
						,rec: rec
					});
					console.log('cb::cb_friend_add: OK.');
				}
				else
					callback(err);
			});
		}
	], function(err) {
		ws_send(info, {
			mode: "error"
			,cid: cid
			,msg: err
		});
		console.log('cb::cb_friend_add: Error: '+err.red);
	});
}
// arg => {cid, [admin, allow, title]}
function cb_set_data_sync(info, arg)
{
// console.log('cb::cb_set_data_sync ~~~ arg='.yellow, arg);
	var recCB, recUpd = {};
	var cid = arg['cid']||"";
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "")
				callback("empty cid");
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			if (recCB.type == DB_TYPE_COMM)
			{
				if (!cb_is_admin(recCB, info.acn))
					callback("Permission denied");
				else {
					var bUpd = false;
					if (arg.admin && typeof arg.admin == "object") {
						bUpd = true;
						recCB.admin = arg.admin;
						recUpd.admin = arg.admin;
					}
					if (arg.allow && typeof arg.allow == "object") {
						bUpd = true;
						recCB.allow = arg.allow;
						recUpd.allow = arg.allow;
					}
					if ((arg.title||"") != "") {
						bUpd = true;
						recCB.title = arg.title;
						recUpd.title = arg.title;
					}
					if (!bUpd) {
						callback("Did not modify");
						return;
					}
					f_db_cb_upd(recCB, null, function(rec, err){
						if (rec)
							callback();
						else
							callback(err);
					});
				}
			}
			else
			{
				callback("Prohibits the modification");
			}
		}
	], function(err) {
		out = {mode: "cb_set_title"};
		if (err) out.error = err;
		else if (recCB) out.rec = recCB;
		ws_send(info, out);
		
		if (err)console.log('cb::cb_set_data_sync: Error: '.red, err);
		else	console.log('cb::cb_set_data_sync: OK.'.yellow+' recUpd=', recUpd);
	});
}
// arg => {cid, title}
function cb_set_title(info, arg)
{
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var title = arg.title||"";
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "")
				callback("empty cid");
			else if (title == "")
				callback("empty title");
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			// 群組 才能改
			if (recCB.type != DB_TYPE_GROUPS)
				callback("type invalid");
			// 管理者 才能改
			else if (!cb_is_admin(recCB, info.acn))
				callback("Permission denied");
			else {
				recCB.title = title;
				f_db_cb_upd(recCB, null, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	"修改聊天室名稱為「"+title+"」"
			}
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		out = {mode: "cb_set_title"};
		if (err) out.error = err;
		else if (recCB) out.rec = recCB;
		ws_send(info, out);
		
		if (err)console.log('cb::cb_set_title: Error: '.red, err);
		else	console.log('cb::cb_set_title: OK. title=', recCB.title);
	});
}
// arg => {[cid / site_acn], act[add / del], acns[array], suns[array]}
function cb_set_friend(info, arg)
{
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var site_acn = arg['site_acn']||"";
	var act = arg['act']||"";
	var acns = arg['acns'];
	var suns = arg['suns'];
	var bAdd = act == "add";
	var msg;
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "" && site_acn == "")
				callback("empty cid");
			else if (act != "add" && act != "del")
				callback("act invalid");
			else if (typeof acns != "object" || acns.length == 0)
				callback("acns invalid");
			else if (typeof suns != "object" || suns.length == 0)
				callback("suns invalid");
			else {
				if (site_acn != "") {
					db_cb_find_site_acn(site_acn, function(rec, err){
						if (rec) {
							cid = rec._id;
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
				else {
					db_cb_find_id(cid, function(rec, err){
						if (rec) {
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
			}
		},
		// 更新 Record 
		function(callback) {
			if (recCB.type == DB_TYPE_FRIEND)
				callback("Permission denied 1");
			// 群組 - 擁有者 才可以設定
			//else if (recCB.type == DB_TYPE_GROUPS && info.acn != recCB.owner)
			//	callback("Permission denied 2");
			// 社群 - 管理者 才可以設定
			//else if (recCB.type == DB_TYPE_COMM && !cb_is_admin(recCB, info.acn))
			//	callback("Permission denied 3");
			else {
				if (bAdd) {
					msg = "加了「"+suns.join(", ")+"」";
					recCB.allow = util.array_add(recCB.allow, acns);
				}
				else {
					acns = util.array_del(acns, recCB.owner); // 擁有者不能刪除 過濾掉
					msg = "移除了「"+suns.join(", ")+"」";
					recCB.allow = util.array_del(recCB.allow, acns);
				}
				cb_rec_upd(info, recCB, null, 0);
				f_db_cb_upd(recCB, null, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	msg
			}
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		out = {mode: "cb_set_friend"};
		if (err) out.error = err;
		else if (recCB) out.rec = recCB;
		ws_send(info, out);
		
		if (err)console.log('cb::cb_set_friend: Error: '.red, err);
		else	console.log('cb::cb_set_friend: OK.'.yellow+' act='+act+', recCB.admin=', recCB.admin);
	});
}
// arg => {[cid / site_acn], act[add / del / transfer(擁有者轉移)], acn[string / array], sun[string / array]}
function cb_set_admin(info, arg)
{
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var site_acn = arg['site_acn']||"";
	var act = arg['act']||"";
	var acn = arg['acn']||"";
	var sun = arg['sun']||"";
	var bTransfer = act == "transfer";	// 擁有者轉移
	var bAdd = act == "add";			// 設為管理者
	var msg;
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "" && site_acn == "")
				callback("empty cid");
			else if (act != "add" && act != "del" && act != "transfer")
				callback("act invalid");
			else if (acn == "")
				callback("empty acn");
			else if (sun == "")
				callback("empty sun");
			else {
				if (site_acn != "") {
					db_cb_find_site_acn(site_acn, function(rec, err){
						if (rec) {
							cid = rec._id;
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
				else {
					db_cb_find_id(cid, function(rec, err){
						if (rec) {
							recCB = rec;
							callback();
						}
						else
							callback(err);
					});
				}
			}
		},
		// 更新 Record 
		function(callback) {
			if (recCB.type == DB_TYPE_FRIEND)
				callback("Permission denied 1");
			// 群組 - 擁有者 才可以設定
			else if (recCB.type == DB_TYPE_GROUPS && info.acn != recCB.owner)
				callback("Permission denied 2");
			// 社群 - 管理者 才可以設定
			else if (recCB.type == DB_TYPE_COMM && !cb_is_admin(recCB, info.acn))
				callback("Permission denied 3");
			else {
				if (!recCB.admin) recCB.admin = [];
				if (bTransfer) {
					msg = "將擁有者轉移給「"+sun+"」";
					recCB.owner = acn;
					recCB.admin = util.array_add(recCB.admin, info.acn);// 將自己加入管理者
					recCB.admin = util.array_del(recCB.admin, acn);		// 將 acn 移出管理者
				}
				else if (bAdd) {
					if (typeof acn == "object")
						msg = "將「"+sun.join(", ")+"」設為管理者";
					else
						msg = "將「"+sun+"」設為管理者";
					recCB.admin = util.array_add(recCB.admin, acn);
				}
				else {
					if (typeof acn == "object")
						msg = "將「"+sun.join(", ")+"」移除管理者";
					else
						msg = "將「"+sun+"」移除管理者";
					recCB.admin = util.array_del(recCB.admin, acn);
				}
				f_db_cb_upd(recCB, null, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	msg
			}
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		out = {mode: "cb_set_admin"};
		if (err) out.error = err;
		else if (recCB) out.rec = recCB;
		ws_send(info, out);
		
		if (err)console.log('cb::cb_set_admin: Error: '.red, err);
		else	console.log('cb::cb_set_admin: OK.'.yellow+' act='+act+', recCB.admin=', recCB.admin);
	});
}
// arg => {mode, cid}
function cb_set_quit(info, arg)
{
// console.log('cb::cb_set_quit ~~~ arg=',arg);
	var recCB;
	var cid = arg['cid']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			// 群組 才有退出功能
			if (recCB.type != DB_TYPE_GROUPS) {
				callback("type invalid");
			}
			else {
				var oldAllow = recCB.allow;
				recCB.allow = util.array_del(oldAllow, info.acn);
// console.log('cb::cb_set_quit ~~~ oldAllow=', oldAllow);
// console.log('cb::cb_set_quit ~~~ recCB.allow=', recCB.allow);
				f_db_cb_upd(recCB, oldAllow, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 通知自己
		function(callback) {
			var allow = [info.acn];
			ws_send_all(allow, {
				mode: "cb_set_quit"
				,cid: cid
				,rec: recCB
			});
			callback();
		},
		// 產生動作訊息
		function(callback) {
			var recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	"已經退出聊天室"
			}
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_set_quit: Error: '+err.red);
		}
		else {
			console.log('cb::cb_set_quit: OK.');
		}
	});
}
// arg => {mode, cid}
function cb_set_close(info, arg)
{
// console.log('cb::cb_set_close ~~~ arg=',arg);
	var recCB;
	var cid = arg['cid']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			// 擁有者 才可以關閉
			if (recCB.owner != info.acn) {
				callback("Permission denied");
			}
			// 群組 才有關閉功能
			else if (recCB.type != DB_TYPE_GROUPS) {
				callback("type invalid");
			}
			else {
				var oldAllow = recCB.allow;
				recCB.allow = [];
				f_db_cb_upd(recCB, oldAllow, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_set_close: Error: '.red, err);
		}
		else {
			console.log('cb::cb_set_close: OK.');
		}
	});
}
// arg => {cid, arg{}}
function cb_arg_set(info, arg)
{
// console.log('~~~ cb_arg_set arg=', arg);
	var recCB, recMsg;
	var cid = arg['cid']||"";
	async.waterfall([
		// Check And Get CB Rec
		function(callback) {
			if (cid == "")
				callback("empty cid");
			else if (typeof arg['arg'] != "object")
				callback("arg invalid");
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			if (!recCB.admin) recCB.admin = [];
			// 管理者 才可以變更參數
			if (info.acn != recCB.owner && recCB.admin.indexOf(info.acn) == -1)
				callback("Permission denied");
			else {
				recCB.arg = arg.arg;
				f_db_cb_upd(recCB, null, function(rec, err){
					if (rec)
						callback();
					else
						callback(err);
				});
			}
		},
		// 產生動作訊息
		function(callback) {
			recMsg = {
				cid:		cid
				,owner:		info.acn
				,owner_sun:	info.sun
				,type:		DB_CM_TYPE_SET
				,content:	"變更一般參數"
			}
			f_db_cm_add(recMsg, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "cb_arg_set"
				,cid: cid
				,error: 'Error: '+err
			});
			console.log('cb::cb_arg_set: Error: '+err.red);
		}
		else {
			ws_send(info, {
				mode: "cb_arg_set"
				,cid: cid
				,result: 'OK'
			});
			console.log('cb::cb_arg_set: OK.');
		}
	});
}



// arg => {cid, fid, fn, fs, mtime, [data / url]}
function cb_upload_file(info, arg)
{
// console.log('cb::cb_upload_file ~~~ arg.cid=',arg.cid);
// console.log('cb::cb_upload_file ~~~ arg.fn=',arg.fn);
// console.log('cb::cb_upload_file ~~~ arg.fs=',arg.fs);
	var err;
	if ((arg.cid||"") == "")
		err = "empty cid.";
	else if ((arg.fid||"") == "")
		err = "empty fid.";
	else if ((arg.fn||"") == "")
		err = "empty fn.";
	if (err) {
		ws_send(info, {
			mode: "error"
			,msg: "Error: "+err
		});
		console.log('cb::cb_upload_file: Error: '.red, err);
	}
	
	var cid = arg.cid;
	var ext = util.file_makeExt(arg.fn);
	var type = rs.con_ext2type(ext);
	var time = util.getCurrentTimeStr(null,1);
	var recCB, dir, target_path, url, file_info;
	async.waterfall([
		// Get recCB
		function(callback) {
			db_cb_find_id(cid, function(rec, err){
				if (rec) {
					recCB = rec;
					callback();
				}
				else
					callback(err);
			});
		},
		// Check Exists And Create cid Dir
		function(callback) {
			dir = path.join(DIR_DATA, cid);
			fs.exists(dir, function (exists) {
				if (exists) {
					callback();
				}
				else {
					fs.mkdir(dir, function (err) {
						callback(err);
					});
				}
			});			
		},
		// Save File
		function(callback) {
			if (arg.url) {
				target_path = temp.path({dir:dir, suffix:'.'+ext}); // dir, prefix, suffix
				util.url_getFile_get({
					url: 	arg.url
					,fp:	target_path
					,funcOK:function(b, err){
						if (b) {
							//do_handle(type, target_path, callback);
							cb_upload_file_handle(type, target_path, function(f_info){
								file_info = f_info;
								callback();
							});
						}
						else
							callback(err);
					}
				});
			}
			else {
				if (!arg.data || !arg.data.length)
					callback("empty data");
				else {
					target_path = temp.path({dir:dir, suffix:'.'+ext}); // dir, prefix, suffix
					fs.writeFile(target_path, arg.data, "binary", function(err){
						if (err)
							callback(err);
						else {
							//do_handle(type, target_path, callback);
							cb_upload_file_handle(type, target_path, function(f_info){
								file_info = f_info;
								callback();
							});
						}
					});
				}
			}
			
/*			function do_handle(type, fp, funcOK){
				if (type == "Image") {
					// Create Thumbs
					rs.img2tn(fp, function(exists, size){
						file_info = size;
						funcOK();
					});
				}
				else if (type == "Video") {
					// Create Thumbs
					rs.video_get_img(fp, function(exists){
						rs.video2mp4(fp, function(exists){
							funcOK();
						});
					});
				}
				else if (type == "Audio") {
					// Create Thumbs
					rs.audio2mp3(fp, function(exists){
						funcOK();
					});
				}
				else if (type == "Document") {
					// Create Thumbs
					rs.doc2pdf(fp, function(exists){
						funcOK();
					});
				}
				else {
					funcOK();
				}
			}
*/
		},
		// Create File Rec
		function(callback) {
			var f_rec = target_path+".rec";
			var rec = {
				cid: 		cid
				,owner: 	info.acn
				,owner_sun: info.sun
				,type: 		type
				,filename: 	arg.fn
				,size: 		arg.fs
				,time:		time
				,mtime:		arg.mtime||""
			}
			if (file_info) rec.file_info = file_info;
			fs.writeFile(f_rec, JSON.stringify(rec), function(err){
				callback(err);
			});
		},
		// ChatMsg Add
		function(callback) {
			var fn = path.basename(target_path);
			url = cb_con_fp2ufp(cid, target_path);
			var recNew = {
				cid: 		cid
				,owner: 	info.acn
				,owner_sun: info.sun
				,type: 		type
				,filename: 	arg.fn
				,size: 		arg.fs
				,mtime:		arg.mtime||""
				,url:		url
			}
			if (file_info) recNew.file_info = file_info;
			f_db_cm_add(recNew, recCB.allow, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			}
			,{ fid: arg.fid }
			);
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: "error"
				,cid: cid
				,msg: err
			});
			console.log('cb::cb_upload_file: Error: '+err.red);
		}
		else
			console.log('cb::cb_upload_file: OK.');
	});
	
}
function cb_upload_file_handle(type, fp, funcOK)
{
	var file_info;
	if (type == "Image") {
		// Create Thumbs
		rs.img2tn(fp, function(exists, size){
			file_info = size;
			funcOK(file_info);
		});
	}
	else if (type == "Video") {
		// Create Thumbs
		rs.video_get_img(fp, function(exists){
			rs.video2mp4(fp, function(exists){
				funcOK(file_info);
			});
		});
	}
	else if (type == "Audio") {
		// Create Thumbs
		rs.audio2mp3(fp, function(exists){
			funcOK(file_info);
		});
	}
	else if (type == "Document") {
		// Create Thumbs
		rs.doc2pdf(fp, function(exists){
			funcOK(file_info);
		});
	}
	else {
		funcOK(file_info);
	}
}

// rec => {owner, allow(array), type, title, time, msg_rec, ... ,users{}}
// users => {acn{tFirst, tLast, cnt_noview}, ...}
function db_cb_add(rec, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	var err;
	if ((rec['owner']||"") == "") 
		err = "empty owner";
	else if (typeof rec['allow'] != "object" || rec['allow'].length < 1) 
		err = "allow invalid";
	else if (!(rec['type'] > 0)) 
		err = "type invalid";
	if (err) {
		funcOK(null, err);
		return;
	}
	
	rec['time'] = util.getCurrentTimeStr(null,1);
	co.insert(rec, function(error, result) {
// console.log('@@@ db_cb_add insert error=', error);
// console.log('@@@ db_cb_add insert result=', result);

		var id;
		if (result) {
			try {
				var objId = new ObjectID(result['insertedIds'][0]['id']);
				id = objId.toHexString();
			} catch(e){}
		}
		if (id) {
			rec['_id'] = id;
			funcOK(rec);
		} else {
			funcOK(null, error);
		}
	});
}
// rec => {_id, owner, allow, type, title, time, msg_rec, ...}
function db_cb_upd(rec, funcOK)
{
// console.log('@@@ db_cb_upd rec=', rec);
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	var err;
	if ((rec['_id']||"") == "") 
		err = "empty _id";
	else if ((rec['owner']||"") == "") 
		err = "empty owner";
	else if (typeof rec['allow'] != "object") 
		err = "allow invalid";
	else if (!(rec['type'] > 0)) 
		err = "type invalid";
	if (err) {
		funcOK(null, err);
		return;
	}
	
	co.update({_id:ObjectID(rec._id)}, rec, function(error, result){
// console.log('@@@ db_cb_upd update error=', error);
// console.log('@@@ db_cb_upd update result=', result);

		if (error) {
			if (funcOK) funcOK(null, error);
		} else {
			if (funcOK) funcOK(rec);
		}
	});
}
// rec => {_id, owner, allow, type, title, time, msg_rec, ...}
function db_cb_del(rec, funcOK)
{
// console.log('@@@ db_cb_del rec=', rec);
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	var err;
	if ((rec['_id']||"") == "") 
		err = "empty _id";
	if (err) {
		funcOK(null, err);
		return;
	}
	
	co.remove({_id:ObjectID(rec._id)}, function(error, result){
// console.log('@@@ db_cb_upd remove error=', error);
// console.log('@@@ db_cb_upd remove result=', result);

		if (error) {
			if (funcOK) funcOK(null, error);
		} else {
			if (funcOK) funcOK(result);
		}
	});
}
// var DB_RECUPD_MODE_NoviewClear = 1;
// var DB_RECUPD_MODE_NoviewAdd = 2;
// var DB_RECUPD_MODE_MsgDelAll = 3;
// rec => {owner, allow(array), type, title, time, msg_rec, ... ,users{}}
// 		users => {acn{tFirst, tLast, cnt_noview}, ...}
// 		recMsg => {cid, owner, owner_sun, type, content, time}
function cb_rec_upd(info, rec, recMsg, mode)
{
	var time = util.getCurrentTimeStr(null,1);
	if (!rec.users) rec.users = {};
	for (var x=0; x<rec.allow.length; x++) {
		var user = rec.allow[x];
		if (util.isMail(user)) continue;
		
		if (!rec.users[user]) {
			rec.users[user] = {
				tFirst:	time
				,tLast: time
				,cnt_noview: 0
			}
		}
		if (user == info.acn)
		{
			if (DB_RECUPD_MODE_NoviewClear == mode) {
				rec.users[user].tLast = time;
				rec.users[user].cnt_noview = 0;
			}
			if (DB_RECUPD_MODE_MsgDelAll == mode) {
				rec.users[user].tFirst = time;
				rec.users[user].tLast = time;
				rec.users[user].cnt_noview = 0;
			}
		}
		else
		{
			if (DB_RECUPD_MODE_NoviewAdd == mode) {
				rec.users[user].cnt_noview++;
			}
		}
	}
	if (recMsg) {
		rec.time = recMsg.time;
		rec.msg_rec = recMsg;
	}
}
// arg => {query}
function db_cb_find(arg, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find(arg.query)
		.toArray(function(error, recs){
			
			if (recs && recs.length > 0)
				funcOK(recs);
			else
				funcOK(null, "Error: Not Found.");
		});
}
function db_cb_find_id(id, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find({_id:ObjectID(id)})
		.toArray(function(error, recs){
			
			if (recs && recs.length > 0)
				funcOK(recs[0]);
			else
				funcOK(null, "Error: Not Found.");
		});
}
function db_cb_find_site_acn(site_acn, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find({site_acn:site_acn})
		.toArray(function(error, recs){
			
			if (recs && recs.length > 0)
				funcOK(recs[0]);
			else
				funcOK(null, "Error: Not Found.");
		});
}
function db_cb_find_allow(allow, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find({$and:[{allow:allow[0]},{allow:allow[1]},{type:DB_TYPE_FRIEND}]})
		.toArray(function(error, recs){
// console.log('@@@ db_cb_add insert error=', error);
// console.log('@@@ db_cb_add insert recs=', recs);
			
			if (recs && recs.length > 0) {
				for (var i=0; i<recs.length; i++) {
					var rec = recs[i];
					if (rec.allow.length == 2) {
						funcOK(rec);
						return;
					}
				}
			}
			funcOK(null, "Error: Not Found.");
		});
}
function db_cb_find_user(user, funcOK)
{
	var co = _db.table_cb();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find({allow:user})
		.sort({time:-1})
		.toArray(function(error, recs){
// console.log('@@@ db_cb_find_user error=', error);
// console.log('@@@ db_cb_find_user recs=', recs);
			
			funcOK(recs);
		});
}


// rec => {cid, owner, owner_sun, type, content}
function db_cm_add(rec, funcOK)
{
// console.log('@@@ db_cm_add ~~~ rec='.cyan, rec);
	var co = _db.table_cm();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	var err;
	if ((rec['cid']||"") == "") 
		err = "empty cid";
	else if ((rec['owner']||"") == "") 
		err = "empty owner";
	else if ((rec['owner_sun']||"") == "") 
		err = "empty owner_sun";
	else if ((rec['type']||"") == "") 
		err = "empty type";
// Check Type
	// Push Url
	if (DB_CM_TYPE_PUSH_URL == rec['type']) {
		if (typeof rec['file_info'] != "object")
			err = "file_info invalid";
	}
	// Text
	else if (DB_CM_TYPES_SYS.indexOf(rec['type']) > -1) {
		if ((rec['content']||"") == "")
			err = "empty content";
	}
	// File
	else if (rs.GDATA_FILE_TYPES.indexOf(rec['type']) > -1) {
		if ((rec['url']||"") == "")
			err = "empty url";
		if ((rec['filename']||"") == "")
			err = "empty filename";
	}
	else
		err = "type invalid";
	if (err) {
		funcOK(null, err);
		return;
	}
	
	rec['time'] = util.getCurrentTimeStr(null,1);
	
	co.insert(rec, function(error, result) {
// console.log('@@@ db_cm_add insert error='.cyan, error);
// console.log('@@@ db_cm_add insert result='.cyan, result);

		var id;
		if (result) {
			try {
				var objId = new ObjectID(result['insertedIds'][0]['id']);
				id = objId.toHexString();
			} catch(e){}
		}
		if (id) {
			rec['_id'] = id;
			funcOK(rec);
		} else {
			funcOK(null, error);
		}
	});
}
// arg => {cid, gt(大於), lt(小於), mid(_id), ps}
function db_cm_find_list(arg, funcOK)
{
// console.log('cb::db_cm_find_list arg=', arg);
	var co = _db.table_cm();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	var query = {}
	if (arg.cid) query['cid'] = arg.cid;
	if (arg.gt) query['time'] = {'$gt':arg.gt};
	if (arg.lt) query['time'] = {'$lt':arg.lt};
	if (arg.mid) query['_id'] = ObjectID(arg.mid);
	co	.find(query)
		.sort({time:-1})
		.limit(arg.ps > 0 ? arg.ps : 5)
		.toArray(function(error, recs){
// console.log('@@@ db_cm_find_list find error=', error);
// console.log('@@@ db_cm_find_list find recs=', recs);
			if (recs)
				funcOK(recs);
			else
				funcOK(null, error);
		});
}


function cb_rtc_send_msg(m, pcInfo, cnInfo, acns)
{
	var msg;
	var suns = acns ? util.obj_getCols(pcInfo.mbs_info, "sun", acns) : [];
	if (m == RTC_MSG_NO_RESPONSE)
		msg = "撥打給 "+suns.join("、")+"，未回應";
	else if (m == RTC_MSG_OFFLINE)
		msg = "撥打給 "+suns.join("、")+"，未上線";
	else if (m == RTC_MSG_FAIL)
		msg = "視訊啟動失敗";
	else if (m == RTC_MSG_BUSY)
		msg = "忙線中";
	else if (m == RTC_MSG_ADD)
		msg = "加入通話";
	else if (m == RTC_MSG_QUIT)
		msg = "離開通話";
	else if (m == RTC_MSG_END) {
		var tDiff = parseInt(((new Date()).getTime() - pcInfo.time)/1000);
		msg = "\%*通話結束，時間為 "+util.time_con_S2TS(tDiff);
	}
	else if (m == RTC_MSG_DISCONN)
		msg = "連線中斷";
	else
		return;
	
	f_db_cm_add5(pcInfo.cid, cnInfo, DB_CM_TYPE_SET, msg, pcInfo.members);
}
function cb_rtc_pc_create(recCB, cnInfo, arg)
{
	var cid = recCB._id+'';
	var onlineInfo = cb_rtc_getOnlineList(cid, recCB.allow); // 取得線上名單(Have Websocket List)
	var pcInfo = {
		cid:		cid
		,type:		arg.type||""		// [video/phone]
		,time:		0
		,call_acn: 	cnInfo.acn
		,members: 	recCB.allow
		,mbs_info: 	arg.mbs_info
		,onlines:	onlineInfo.onlines	// 格式(_users)
		,allow: 	onlineInfo.acns		// online list
		,allow_cnts:onlineInfo.cnts
		,talks:		{}
	};
// console.log('cb::cb_rtc_pc_create: pcInfo='.yellow, pcInfo);
	return pcInfo;
}
// 關閉視訊通話
function cb_rtc_pc_close(pcInfo)
{
	if (!pcInfo) return;
	for (var acn in pcInfo.onlines) {
		var user = pcInfo.onlines[acn];
		for (var uid in user.conns) {
			try{
				user.conns[uid].rtc.cid = "";
			} catch(e){};
		}
	}
	for (var acn in pcInfo.talks) {
		var user = pcInfo.talks[acn];
		for (var uid in user.conns) {
			try{
				user.conns[uid].rtc.cid = "";
			} catch(e){};
		}
	}
	delete _rtc_pc[pcInfo.cid];
}
function cb_rtc_talks_add(pcInfo, cnInfo)
{
// console.log('!!! cb::cb_rtc_talks_add: cnInfo.acn='.yellow, cnInfo.acn);
	if (!pcInfo) return;
	cnInfo.rtc.cid = pcInfo.cid;
	rs.user_conn_add(pcInfo.talks, cnInfo);
	// 有多個連線, 關閉沒有用到的連線
	var user = pcInfo.onlines[cnInfo.acn];
// console.log('!!! cb::cb_rtc_talks_add: user.conns.length='.yellow, util.obj_length(user.conns));
	if (util.obj_length(user.conns) > 1) {
		for (var uid in user.conns) {
			if (uid != cnInfo.uid) {
// console.log('!!! cb::cb_rtc_talks_add: ws_send uid='.yellow, uid);
				ws_send(user.conns[uid], {
					mode: "cb_rtc_call"
					,act: "call_close"
					,cid: pcInfo.cid
				});
				delete user.conns[uid];
			}
		}
	}
}
function cb_rtc_online_del(pcInfo, cnInfo)
{
	cnInfo.rtc.cid = "";
	var cnt = rs.user_conn_del(pcInfo.onlines, cnInfo, true);
	if (cnt == 0)
		pcInfo.allow = util.array_del(pcInfo.allow, cnInfo.acn);
}
function cb_rtc_talks_del(pcInfo, cnInfo)
{
	cnInfo.rtc.cid = "";
	rs.user_conn_del(pcInfo.talks, cnInfo, true);
}
function cb_rtc_user_disconnection(cnInfo)
{
	var cid = cnInfo.rtc.cid;
	var pcInfo = _rtc_pc[cid];
	cnInfo.rtc.cid = "";
	if (!pcInfo) return;
	
	cb_rtc_call(cnInfo, {
		act: "disconnection"
		,cid: cid
	})
}
function cb_rtc_getOnlineList(cid, allow)
{
	var out = {acns:[], cnts:[], onlines:{}};
	for (var acn in _users) {
		if (allow.indexOf(acn) == -1)
			continue;
		
		var user = _users[acn];
		if (!user) continue;
		for (var uid in user.conns) {
			var info = user.conns[uid];
			if (info.conn && info.fun_cb) {
				var x = out.acns.indexOf(acn);
				if (x == -1) {
					out.acns.push(acn);
					out.cnts.push(1);
				} else {
					out.cnts[x]++;
				}
				//
				rs.user_conn_add(out.onlines, info);
				info.rtc.cid = cid;
			}
		}
	}
	return out;
}
function cb_rtc_gcm_send(pcInfo, cnInfo, funcOK)
{
	var msg = {
		mode: "callin"
		,cid: pcInfo.cid
		,type: pcInfo.type
	}
	var key = util.array_del(pcInfo.members, cnInfo.acn);
// console.log('~~~ cb_rtc_gcm_send key=', key);
	var rec = {
		key:			key.join(",")
		,time: 			"20160413000000"
		,msg:			JSON.stringify(msg)
		,title:			"title"
		,description:	"desc"
	}
	gcm.sendMsg({
		server_acn:	cnInfo.server_acn
		,rec:		JSON.stringify(rec)
		,cookie: 	"nu_code="+cnInfo.nu_code
		,funcOK: 	function(res, err){
			
// console.log('~~~ cb_rtc_gcm_send sendMsg OK ~~~~~~~~~~~~~~~~~~~~~~');
			if (err)
				console.log('cb::cb_rtc_gcm_send: Error: '.red, err);

			var data = res.data;
			var cnt = 0;
			if (data && data.recs_ios) cnt += data.recs_ios;
			if (data && data.recs_android) cnt += data.recs_android;
// console.log('~~~ cb_rtc_gcm_send gcm_cnt=', cnt);
			funcOK(cnt);
		}
	});
}
// arg => {act, cid, type}
// act -> [call, busy(忙線), fail(啟動失敗), deny(拒絕), accept(接收), call_close, talk_close, talk_stop(暫停)]
function cb_rtc_call(info, arg)
{
console.log('cb::cb_rtc_call ~~~ acn='+info.acn+', arg=',arg);
	var recCB, recMsg, error, msg;
	var act = arg['act']||"";
	var cid = arg['cid']||"";
	var type = arg['type']||"";
	var pcInfo, allow;
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (act == "")
				callback("empty act");
			else if (cid == "")
				callback("empty cid");
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 
		function(callback) {
			// ~~~ Call ~~~
			if (act == "call")
			{
				// 已經在通話中...
				pcInfo = _rtc_pc[cid];
				if (pcInfo) {
					// 用接受 加入通話
					cb_rtc_call_accept(info, pcInfo);
					// Msg
					cb_rtc_send_msg(RTC_MSG_ADD, pcInfo, info, null);
					return;
				}
				
				
				
				pcInfo = cb_rtc_pc_create(recCB, info, arg);
				// GCM Send
				cb_rtc_gcm_send(pcInfo, info, function(gcm_cnt){
				
					allow = pcInfo.allow;
console.log('~~~ 撥出視訊 ~~~ gcm_cnt='+gcm_cnt+', allow.length='+allow.length+", allow=", allow);
					if (0 && !gcm_cnt && allow.length <= 1)
					{
						// Msg 顯示誰未上線
						var offline_acns = util.array_diff(pcInfo.members, pcInfo.allow);
						if (offline_acns.length)
							cb_rtc_send_msg(RTC_MSG_OFFLINE, pcInfo, info, offline_acns);
						
						// 沒有人在線上，未回應
						error = "Friends, did not respond";
						ws_send_all(null, {
							mode: "cb_rtc_call"
							,act: "call_close"
							,cid: cid
							,error: error
						}, pcInfo.onlines);
						cb_rtc_pc_close(pcInfo);
						callback(error);
					}
					else
					{
						// 送出 - 來電中...
						_rtc_pc[cid] = pcInfo;
						cb_rtc_talks_add(pcInfo, info);
						
						ws_send_all(allow, {
							mode: 	"cb_rtc_call"
							,act: 	"call"
							,cid: 	cid
							,rec: 	recCB
							,type:	pcInfo.type
							,allow: pcInfo.allow		// Online list
							,call_acn: pcInfo.call_acn	// 撥出 user
						});
						callback();
					}
				});
			}
			else
			{
				pcInfo = _rtc_pc[cid];
				if (!pcInfo) {
					callback("Room does not exist");
				} else {
					// 顯示 來電中...
					if (act == "callin")
					{
						// Allow Add
						if (pcInfo.allow.indexOf(info.acn) == -1) {
							pcInfo.allow.push(info.acn);
							info.rtc.cid = pcInfo.cid;
						}
						rs.user_conn_add(pcInfo.onlines, info);
						info.rtc.cid = pcInfo.cid;
						//
						ws_send(info, {
							mode: 	"cb_rtc_call"
							,act: 	"call"
							,cid: 	cid
							,rec: 	recCB
							,type:	pcInfo.type
							,allow: pcInfo.allow		// Online list
							,call_acn: pcInfo.call_acn 	// 撥出 user
						});
					}
					// 忙線, 啟動失敗
					else if (act == "busy" || act == "fail")
					{
						/*if (pcInfo.allow.length <= 2) {
							msg = info.sun+" "
									+(act == "busy" ? "忙線中"
									: act == "fail" ? "啟動失敗"
									: "unknown");
							cb_rtc_call_call_close(info, pcInfo, msg);
						}
						else {*/
							cb_rtc_online_del(pcInfo, info);
							var user_conn_cnt = rs.user_conn_cnt(pcInfo.onlines, info.acn);
console.log('~~~ '+act+' ~~~ user='+info.acn+', user_conn_cnt='+user_conn_cnt);
							if (user_conn_cnt > 0) {
								
							}
							else {
								ws_send_all(null, {
									mode: "cb_rtc_call"
									,act: "acn_close"
									,cid: cid
									,acn: info.acn
									,allow: pcInfo.allow
								}, pcInfo.talks);
								// Msg
								if (act == "busy")
									cb_rtc_send_msg(RTC_MSG_BUSY, pcInfo, info, null);
								else
									cb_rtc_send_msg(RTC_MSG_FAIL, pcInfo, info, null);
							}
						//}
					}
					// 拒絕
					else if (act == "deny")
					{
						if (pcInfo.allow.length <= 2) {
							msg = info.sun+" 忙線中"
							cb_rtc_call_call_close(info, pcInfo, msg);
						}
						else {
							cb_rtc_online_del(pcInfo, info);
							ws_send_all(null, {
								mode: "cb_rtc_call"
								,act: "acn_close"
								,cid: cid
								,acn: info.acn
								,allow: pcInfo.allow
							}, pcInfo.talks);
						}
						// Msg
						cb_rtc_send_msg(RTC_MSG_BUSY, pcInfo, info, null);
					}
					// 取得 來電中... 訊息
					else if (act == "get_call")
					{
						info.rtc.cid = cid;
						rs.user_conn_add(pcInfo.onlines, info);
						
						ws_send(info, {
							mode: "cb_rtc_call"
							,act: "call"
							,cid: cid
							,rec: recCB
							,type:	pcInfo.type
							,allow: pcInfo.allow// Online list
							,call_acn: info.acn // 撥出 user
						});
					}
					// 接受
					else if (act == "accept")
					{
						cb_rtc_call_accept(info, pcInfo);
					}
					// 取消撥出
					else if (act == "call_close")
					{
						cb_rtc_call_call_close(info, pcInfo);
						// Msg
						var acns = util.array_del(pcInfo.allow, info.acn);
						cb_rtc_send_msg(RTC_MSG_NO_RESPONSE, pcInfo, info, acns);
					}
					// 通話結束
					else if (act == "talk_close")
					{
						cb_rtc_talks_del(pcInfo, info);
						var talk_list = util.obj_getCols(pcInfo.talks, "acn");
						// User 離開
						if (talk_list.length > 1) {
							ws_send_all(null, {
								mode: "cb_rtc_call"
								,act: "acn_close"
								,cid: cid
								,acn: info.acn
							}, pcInfo.talks);
							// Msg
							cb_rtc_send_msg(RTC_MSG_QUIT, pcInfo, info, null);
						}
						// 通話結束
						else {
							ws_send_all(null, {
								mode: "cb_rtc_call"
								,act: "talk_close"
								,cid: cid
								,acn: info.acn
							}, pcInfo.talks);
							cb_rtc_pc_close(pcInfo);
							// Msg
							cb_rtc_send_msg(RTC_MSG_END, pcInfo, info, null);
						}
					}
					// 通話暫停
					else if (act == "acn_stop")
					{
						ws_send_all(null, {
							mode: "cb_rtc_call"
							,act: "acn_stop"
							,cid: cid
							,acn: info.acn
						}, pcInfo.talks);
					}
					// 斷線
					else if (act == "disconnection")
					{
						var bMyCall = pcInfo.call_acn == info.acn;
						// Callin 中...
						if (pcInfo.time == 0) {
							//if (bMyCall || pcInfo.allow.length <= 2)
							if (bMyCall)
								cb_rtc_call_call_close(info, pcInfo);
							else {
								cb_rtc_online_del(pcInfo, info);
								// 繼線有可能在換瀏覽器中...
								// ws_send_all(null, {
									// mode: "cb_rtc_call"
									// ,act: "acn_close"
									// ,cid: cid
									// ,acn: info.acn
									// ,allow: pcInfo.allow
								// }, pcInfo.onlines);
							}
							// Msg
							//cb_rtc_send_msg(RTC_MSG_DISCONN, pcInfo, info, null);
						}
						// 通話中...
						else {
							var talk_list = util.obj_getCols(pcInfo.talks, "acn");
							cb_rtc_talks_del(pcInfo, info);
							if (talk_list.indexOf(info.acn) == -1 || talk_list.length > 2) {
								ws_send_all(null, {
									mode: "cb_rtc_call"
									,act: "acn_close"
									,cid: cid
									,acn: info.acn
								}, pcInfo.talks);
								// Msg
								cb_rtc_send_msg(RTC_MSG_DISCONN, pcInfo, info, null);
							}
							else {
								ws_send_all(null, {
									mode: "cb_rtc_call"
									,act: "talk_close"
									,cid: cid
									,acn: info.acn
								}, pcInfo.talks);
								cb_rtc_pc_close(pcInfo);
								// Msg
								cb_rtc_send_msg(RTC_MSG_DISCONN, pcInfo, info, null);
								cb_rtc_send_msg(RTC_MSG_END, pcInfo, info, null);
							}
						}
					}
					else
					{
						callback("act invalid");
						return;
					}
					callback();
				}
			}
		}
	], function(err) {
		if (err) {
			ws_send(info, {
				mode: 	"cb_rtc_call"
				,act:	act
				,error:	err
			});
			console.log('cb::cb_rtc_call: Error: '.red, err);
		}
		else {
			console.log('cb::cb_rtc_call: OK. act='+act+', allow=', allow);
		}
	});
}
// 取消撥出
function cb_rtc_call_call_close(info, pcInfo, msg)
{
// console.log('cb::cb_rtc_call_call_close 取消撥出 ~~~ pcInfo.allow=', pcInfo.allow);
	ws_send_all(pcInfo.allow, {
		mode: "cb_rtc_call"
		,act: "call_close"
		,cid: pcInfo.cid
		,msg: msg
	});
	cb_rtc_pc_close(pcInfo);
}
// 接受
function cb_rtc_call_accept(info, pcInfo)
{
	if (pcInfo.time == 0) // 開始記時
		pcInfo.time = (new Date()).getTime();
	// Allow Add
	if (pcInfo.allow.indexOf(info.acn) == -1) {
		pcInfo.allow.push(info.acn);
	}
	rs.user_conn_add(pcInfo.onlines, info);
	info.rtc.cid = pcInfo.cid;
	//
	var talk_list = util.obj_getCols(pcInfo.talks, "acn");
// console.log('cb::cb_rtc_call: 接受 talk_list='.yellow, talk_list);
	cb_rtc_talks_add(pcInfo, info);
	
	ws_send(info, {
		mode: "cb_rtc_call"
		,act: "talk"
		,cid: pcInfo.cid
		,allow: 	pcInfo.allow
		,talk_list: talk_list
	});
}
// arg => {mode, cid, acn, name, sdp}
function cb_rtc_sdp(info, arg)
{
// console.log('cb::cb_rtc_sdp ~~~ arg=',arg);
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var acn = arg['acn']||"";
	var name = arg['name']||"";
	var pcInfo, cnInfo;
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else if (acn == "") {
				callback("empty acn");
			}
			else if (!(pcInfo=_rtc_pc[cid])) {
				callback("Room does not exist");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		function(callback) {
			var user = pcInfo.talks[acn];
			if (user) cnInfo = util.obj_getVal(user.conns, 0);
			if (!cnInfo) {
				callback("Connection does not exist");
			}
			else {
				ws_send(cnInfo, {
					mode: "cb_rtc_sdp"
					,cid: cid
					,acn: info.acn
					,name: name
					,sdp: arg.sdp
				});
				callback();
			}
		}
	], function(err) {
		if (err) {
			console.log('cb::cb_rtc_sdp: Error: '.red, err);
		}
		else {
			//console.log('cb::cb_rtc_sdp: OK. acn=', acn);
		}
	});
}
// arg => {cid, acn, name, candidate}
function cb_rtc_candidate(info, arg)
{
// console.log('cb::cb_rtc_candidate ~~~ arg=',arg);
	var recCB, recMsg;
	var cid = arg['cid']||"";
	var acn = arg['acn']||"";
	var name = arg['name']||"";
	var pcInfo, cnInfo;
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (cid == "") {
				callback("empty cid");
			}
			else if (acn == "") {
				callback("empty acn");
			}
			else if (!(pcInfo=_rtc_pc[cid])) {
				callback("Room does not exist");
			}
			else {
				db_cb_find_id(cid, function(rec, err){
					if (rec) {
						recCB = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 
		function(callback) {
			var user = pcInfo.talks[acn];
			if (user) cnInfo = util.obj_getVal(user.conns, 0);
			if (!cnInfo) {
				callback("Connection does not exist");
			}
			else {
				ws_send(cnInfo, {
					mode: "cb_rtc_candidate"
					,cid: cid
					,acn: info.acn
					,name: name
					,candidate: arg.candidate
				});
				callback();
			}
		}
	], function(err) {
		if (err) {
			console.log('cb::cb_rtc_candidate: Error: '.red, err);
		}
		else {
			//console.log('cb::cb_rtc_candidate: OK. acn=', acn);
		}
	});
}





function f_db_cm_find_list(info, recCB, arg, funcOK)
{
	var cid = recCB._id;
	var user = recCB.users[info.acn];
	if (user && user['tFirst'])
		arg.gt = user['tFirst'];
	
	db_cm_find_list(arg, function(recs, err){
		if (recs) {
			ws_send(info, {
				mode: "cb_msg_getList"
				,cid: cid
				,recs: recs
			});
			if (funcOK) funcOK(recs);
		}
		else {
			if (funcOK) funcOK(null, err);
		}
	});
}
function f_db_cb_upd(recCB, allow, funcOK)
{
	function do_ok(rec, err){
		if (rec) {
			ws_send_all(allow||recCB.allow, {
				mode: "cb_upd"
				,cid: recCB._id
				,rec: recCB
			});
			if (funcOK) funcOK(recCB);
		}
		else {
			if (funcOK) funcOK(null, err);
		}
	}
	if (recCB.allow.length > 0)
		db_cb_upd(recCB, do_ok);
	else
		db_cb_del(recCB, do_ok);
}
function f_db_cm_add5(cid, cnInfo, type, msg, allow, funcOK)
{
	var recMsg = {
		cid:		cid
		,owner:		cnInfo.acn
		,owner_sun:	cnInfo.sun
		,type:		type
		,content:	msg
	}
	f_db_cm_add(recMsg, allow, funcOK);
}
function f_db_cm_add(recMsg, allow, funcOK, arg2)
{
	db_cm_add(recMsg, function(rec, err){
		if (rec) {
			var arg = {
				mode: "cb_msg_add"
				,cid: rec.cid
				,rec: rec
			}
			if (arg2) arg = util.obj_merge(arg, arg2);
			// 通知所有連上人員
			ws_send_all(allow, arg);
			if (funcOK) funcOK(rec);
		}
		else {
			if (funcOK) funcOK(null, err);
		}
	});
}







/////////////////////////////////////////
function sys_getCBList(funcOK)
{
	var recsCB = {};
	async.waterfall([
		function(callback) {
			var co = _db.table_cb();
			if (!co) {
				callback("DB Server Error");
				return;
			}
			
			co	.find({type:DB_TYPE_GROUPS})
				.sort({time:-1})
				.toArray(function(error, recs){
					
					if (recs && recs.length) {
						for(var x=0; x<recs.length; x++) {
							var rec = recs[x];
							recsCB[rec._id] = rec;
						}
					}
					
					callback();
				});
		}
		,function(callback) {
			fs.readdir(DIR_DATA, function(err, list) {
				if (err) {
					callback(err);
				}
				else {
					async.forEach(list, function(cid, cbList) {
						var dir = path.join(DIR_DATA, cid);
						util.file_getDirSize(dir, function(res, err){
							
							if (res) {
								if (!recsCB[cid]) recsCB[cid] = {};
								recsCB[cid]['dirInfo'] = res;
							}
							cbList(err);
						});
					},  
					function(err) {
						callback(err);
					});  
				}
			});
		}		
	], function(err) {
		if (err)console.log('ws::sys_getCBList: Error: '.red, err);
		else	console.log('ws::sys_getCBList: OK.'.yellow);
		
		funcOK(recsCB, err);
	});
}
function sys_init()
{
	var recsCB = {};
	async.waterfall([
		function(callback) {
			
		}
	], function(err) {
		if (err)console.log('ws::sys_init: Error: '.red, err);
		else	console.log('ws::sys_init: OK.'.yellow);

		setTimeout(sys_init, 86400000);
	});
}
setTimeout(sys_init, 3000);

