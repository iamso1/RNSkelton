
var fs 			= require('fs');
var colors 		= require('colors');
var async 		= require('async');
var ObjectID 	= require('mongodb').ObjectID;
var request 	= require('request');

var util		= require('../utils');
var _db			= require('../db');
var rs			= require('./rs_lib');

var WS_PROTOCOL = "nuweb-notice";
var _connection_uid = 0;
var _users = {};


// ChatBox
var _cb = require('./chatbox');
_cb.init(_users);


///////////////////////////////////////////////
exports.svr_getMsg = function()
{
	return util.con_Object2String(_users, true, 2);
};
exports.getUsers = function()
{
	return _users;
};
exports.onRequest = function(ws, req)
{
	var remoteAddress = (req.connection.remoteAddress||"").replace("::ffff:","");
	console.log('ws::onRequest ~~~ '+remoteAddress.magenta+', '+(ws.protocol||"null").magenta);
// console.log('ws::onRequest ws=', util.con_Object2String(ws, false, 1));
	
	if ((ws.protocol||"") != WS_PROTOCOL) {
		console.log(('Connection fail. protocol='+(ws.protocol||"null")).red);
		ws.close();
		return;
	}
	
	//console.log('ws::Connection accepted.');
	var This = this;
	// {conn, acn, sun, nu_code}
	var info = {
		conn: ws
		,ip: remoteAddress
		,time: (new Date()).getTime()
		// WebRTC
		,rtc: {cid:""}
	};
	
	ws.on('message', function(msg, flags) { // flags {masked, buffer}
//console.log('ws::message ~~~ msg='.green, msg);
		
		var arg = null;
		try{
			arg = JSON.parse(msg);
			if (!arg || ((arg.mode||"") == "") && ((arg.acn||"") == "") )
				arg = null;
		}catch(e){}
		if (arg) {
			ws_msg(info, arg);
		} else {
			
			// var fp = "data/aaa.jpg";
// console.log('cb::cb_upload_file fp=',fp, flags.buffer.length);
			// var fd =  fs.openSync(fp, 'w');
			// fs.write(fd, flags.buffer, 0, flags.buffer.length, 0, function(err,written){
			// fs.writeFile(fp, flags.buffer, "binary", function(err){
// console.log('cb::cb_upload_file write err=',err);

			// });
			
			console.log('ws::message '+'Error: '.red, msg.magenta);
			ws.close();
		}
		
	});
	ws.on('close', function(msg) {
		console.log('ws::close ~~~ msg=', msg);
		console.log('ws::close ~~~ '+(info.acn||"").cyan+', '+(info.sun||"").cyan+', '+remoteAddress.cyan);
		m_logout(info);
		_cb.ws_close(info);
	});
	// 5秒內沒有 Login 就斷線
	setTimeout(function(){
		if (!info.uid) {
			console.log(('ws::~~~ Lonig Timeout ~~~ '+remoteAddress).red);
			ws.close();
		}
		else {
			// 間隔 10分鐘 Ping 
			function do_ping(){
				try {
					ws.send(JSON.stringify({mode:"ping"}));
					setTimeout(do_ping,600000);
				}
				// Sned Error
				catch(e){
					console.log(('ws::Ping Error:'+e).red+' '+(info.acn||"").yellow+', '+(info.sun||"").yellow+', '+(info.uid||""));
					ws.close();
				}
			}
			setTimeout(do_ping,600000);
		}
	},5000);
};
// data => {owner, url, [url_group], url_type, allow, title, content}
exports.nunotice = function(req, res)
{
	console.log('ws::nunotice: ~~~');
	// req.query GET
	// req.body POST
	
	try {
		var nu_code = req.body['nu_code']||req.query['nu_code'];
		var bCallback = req.body['callback']||req.query['callback'];
		var data = JSON.parse(req.body['data']||req.query['data']);
	} catch(e){}
// console.log('ws::nunotice data=', data);
	var err;
	//if (!nu_code)
	//	err = "empty nu_code";
	if (!data)
		err = "empty data";
	else if ((data['owner']||"") == "") 
		err = "empty owner";
	else if ((data['url']||"") == "") 
		err = "empty url";
	else if ((data['url_type']||"") == "") 
		err = "empty url_type";
	else if (typeof(data['allow']) != "object" || data['allow'].length == 0) 
		err = "allow not array";
	else if ((data['title']||"") == "") 
		err = "empty title";
	// else if ((data['content']||"") == "") 
		// err = "empty content";
	if (err) {
		console.log('ws::nunotice: Error: '+err.red);
		util.error(res, 404, err);
		return;
	}
	data['time'] = util.getCurrentTimeStr(null,1);
	
	if (data.url_type == "msgs") {
		var recNew;
		var allow = data.allow;
		var bGroup = (data.url_group||"") != "";
		var query = {};
		if (bGroup)
			query.url_group = data.url_group;
		else
			query.url = data.url;
		var sort = {time:-1}
		async.waterfall([
			function(callback) {
				db_find(query, sort, function(recs, err){
					
					if (recs) {
						var rscOld = recs[0];
						rscOld.allow = util.array_merge(rscOld.allow, data.allow, true);
						nt_rec_upd(rscOld, data, "upd");
						db_upd(rscOld, function(rec, err){
							if (rec) {
								recNew = rec;
								callback()
							}
							else
								callback(err);
						});
					}
					else {
						nt_rec_upd(data, data, "add");
						db_add(data, function(rec, err){
							if (rec) {
								recNew = rec;
								callback()
							}
							else
								callback(err);
						});
					}
				});
			}
		], function(err) {
			var out;
			if (err) {
				console.log('ws::nunotice: Error: '+err.red);
				out = {error:err};
			}
			else {
				ws_send_all("item_upd", recNew, allow);
				out = recNew;
				console.log('ws::nunotice: OK.');
			}
			if (bCallback)
				res.jsonp(out).end();
			else 
				res.json(out).end();
		});
		
	}
	else {
		db_add(data, function(rec2, err){
			if (rec2){
				var out = {succeed:"ok",rec:rec2};
				if (bCallback)
					res.jsonp(out).end();
				else 
					res.json(out).end();
				// Send Item Update
				ws_send_all("item_upd", rec2);
				console.log('ws::nunotice db_add '+'insert OK'.cyan+' _id='+rec2._id.cyan);
				// ---
			}
			else {
				util.error(res, 404, err);
				console.log('ws::nunotice db_add '+('insert Err '+err).red);
			}
		});
	}
};



function con_rec2out(rec, user)
{
	if (typeof rec != "object") return;
	
	var user_info = rec.users && rec.users[user] ? rec.users[user] : null;
	if (user_info) {
		rec['MyView'] 	= user_info.cnt_noview == 0;
		rec['cnt']		= user_info.cnt_noview;
		rec['time'] 	= user_info.time;
		rec['owner'] 	= user_info.owner;
		rec['title'] 	= user_info.title;
		rec['content'] 	= user_info.content;
	} else {
		rec['MyView'] 	= false;
		rec['cnt']		= 1;
	}
	//delete rec['allow'];
	//delete rec['view'];
	return rec;
}

function ws_send(info, arg)
{
	try {
		info.conn.send(JSON.stringify(arg));
	} catch(e) {		
	}
}
function ws_msg(info, arg)
{
	if (arg.mode == "ping")
		return;
	
	// ChatBox OR ChatMsg
	if (arg.mode.substr(0,3) == "cb_") {
		_cb.ws_msg(info, arg);
		return;
	}
	
// console.log('ws::ws_msg '+(arg.mode||"NULL").green+' '+(info.acn||arg.acn||"NULL").green+' '+(info.sun||arg.sun||"NULL").green);
	switch(arg.mode){
		case "login":
			m_login(info, arg);
			break;
		case "item_view":
			nt_item_view(info, arg);
			break;
		case "item_del":
			nt_item_del(info, arg);
			break;
			
		case "nt_getList":
			nt_getList(info, arg);
			break;
			
		case "nt_set_read_all":
			nt_set_read_all(info, arg);
			break;
			
		default:
			console.log('ws::ws_msg Error: '+('Invalid mode('+arg.mode+').').red);
			console.log('cb::ws_msg Error: arg='.red, util.con_Object2String(arg,false,-1,1).yellow);
			break;
	}
}

// arg => {nu_code, mode2, server_acn, server_url, fun_cb, platform, os}
function m_login(info, arg)
{
// console.log('ws::m_login ~~~'.green, arg);
	if (info.uid)
		return true;
	
	var nu_code = arg.nu_code||"";
	var acn = arg.acn||"";
	var sun = arg.sun||"";
	var user, userInfo, acn, sun, mail;
	async.waterfall([
		function(callback) {
			// if (nu_code == "")
				// callback("empty nu_code");
			if (acn == "")
				callback("empty acn");
			else if (sun == "")
				callback("empty sun");
			else {
				callback();
				// rs.auth_decode(nu_code, function(res, err){
					// if (!res || (res.acn||"") == "" || (res.sun||"") == "")
						// callback(err||"Decoding failure");
					// else {
						// userInfo = res;
						// callback();
					// }
				// })
			}
		}
		,function(callback) {
			info.uid 		= ++_connection_uid;
			info.nu_code 	= nu_code;
			info.mode		= arg.mode2||"";
			//info.acn 		= userInfo.acn;
			//info.sun 		= decodeURIComponent(userInfo.sun);
			info.acn 		= acn;
			info.sun 		= decodeURIComponent(sun);
			//info.mail 	= decodeURIComponent(userInfo.mail);
			info.server_acn = arg.server_acn||"";
			info.server_url = arg.server_url||"";
			info.platform 	= decodeURIComponent(arg.platform||"");
			info.os 		= decodeURIComponent(arg.os||"");
		// 功能
			// 有聊天室功能
			info.fun_cb		= (arg.fun_cb == true ? true : false);
			// 其他欄位 {watch_online, ... }
			//
			// user => {acn, sun, conns, online}
			user = _users[info.acn];
			if (!user) _users[info.acn] = user = {  acn:  info.acn, 
													sun:  info.sun, 
													conns:{} };
			user.conns[info.uid] = info;
			
			if (info.mode == "" || info.mode == "notice")
				nt_getList(info);
			// User Online
			_cb.ws_watch_online(info);
			callback();
		}
	], function(err) {
		out = {mode: "login"};
		if (err) out.error = err;
		else out.result = "ok";
		ws_send(info, out);
		
		if (err)console.log('ws::m_login: Error: '.red, err);
		else {
			console.log('ws::m_login OK. '.green+info.acn+', '+info.sun+', uid='+(info.uid+'')
					+', conn.length='+(util.obj_length(user.conns)+""));
		}
	});
	return true;
}
function m_logout(info)
{
	var bOK = false;
	if (info && info.acn && info.uid && _users[info.acn] && _users[info.acn]['conns'][info.uid]) {
		bOK = true;
		delete _users[info.acn]['conns'][info.uid];
		//
		// if (util.obj_length(_users[info.acn]) == 0)
			// delete _users[info.acn];
	}
	// User Online
	_cb.ws_watch_online(info);
	
	console.log('ws::m_logout bOK='+(bOK?"true":"false")+', '+(info.acn||"").cyan
				+', uid='+(info.uid+"").cyan+', conn.length='+((_users[info.acn]?util.obj_length(_users[info.acn]['conns']):"0")+"").cyan);
}

// arg => {}
function nt_getList(info, arg)
{
	// 過濾兩個禮拜內的訊息
	var tTime = util.getCurrentTimeStr((new Date()).getTime()-14*86400*1000,1);
	var query = {allow:info.acn, time:{$gt:tTime}};
	var sort = {time:-1};
	db_find(query, sort, function(recs, err){
		
			var cnt_noview = 0; // 未瀏覽次數
			if (recs) {
				console.log(('nt_getList: find acn='+info.acn+', recs.length='+recs.length).cyan);
				for(var x in recs) {
					var rec = recs[x];
					con_rec2out(recs[x], info.acn);
					if (rec.MyView == 0) cnt_noview++;
				}
			} else {
				recs = [];
				console.log('nt_getList: find err='.red, err);
			}
			ws_send(info, {
				mode: "nt_getList"
				,cnt: recs.length
				,cnt_noview: cnt_noview
				,recs: recs
			});
	});
}
// arg => {act["clear" / "add"] }
function nt_set_read_all(info, arg)
{
// console.log('ws::nt_set_read_all ~~~ arg='.green, arg);
	var allow = [info.acn];
	var id = arg['_id']||"";
	var bAdd = arg.act == "add";
	var bClear = arg.act == "clear";
	async.waterfall([
		function(callback) {
			if (!bClear && !bAdd) {
				callback("act invalid");
			}
			else {
				var query = {allow:info.acn};
				var sort = {time:-1};
				db_find(query, sort, function(recs, err){
					
					if (recs) {
						for(var x in recs) {
							var rec = recs[x];
							var user_info = rec.users && rec.users[info.acn] ? rec.users[info.acn] : null;
							// 未瀏覽次數
							if (user_info && user_info.cnt_noview > 0) {
								// 更新 Record 
								if (bAdd)
									nt_rec_upd(rec, rec, "add", allow);
								else
									nt_rec_upd(rec, rec, "clear", allow);
								
								db_upd(rec, function(rec, err){
									if (rec) {
										// Send Item Update
										ws_send_all("item_upd", rec, allow);
										console.log('cb::cb_user_view: OK.');
									}
									else {
										console.log('cb::nt_set_read_all: Error: '.red, err);
									}
								});
							}
						}
						callback();
					}
					else 
						callback(err);
				});
			}
		},
	], function(err) {
		out = {mode: "nt_set_read_all"};
		if (err) out.error = err;
		else out['return'] = "ok";
		ws_send(info, out);
		
		if (err)console.log('cb::nt_set_read_all: Error: '.red, err);
		else	console.log('cb::nt_set_read_all: OK.'.yellow);
	});
}
// arg => {_id}
function nt_item_view(info, arg)
{
	console.log('ws::nt_item_view ~~~ _id=',arg._id);
	var recN, allow;
	var id = arg['_id']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (id == "") {
				callback("empty _id");
			}
			else {
				db_find_id(id, function(rec, err){
					if (rec) {
						recN = rec;
						callback();
					}
					else
						callback(err);
				});
			}
		},
		// 更新 Record 
		function(callback) {
			allow = [info.acn];
			nt_rec_upd(recN, recN, "clear", allow);
			db_upd(recN, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			console.log('cb::cb_user_view: Error: '+err.red);
		}
		else {
			// Send Item Update
			ws_send_all("item_upd", recN, allow);
			console.log('cb::cb_user_view: OK.');
		}
	});
}
// arg => {_id}
function nt_item_del(info, arg)
{
	console.log('ws::nt_item_del ~~~ _id=',arg._id);
	var recN, allow;
	var id = arg['_id']||"";
	async.waterfall([
		// Get CB Rec
		function(callback) {
			if (id == "") {
				callback("empty _id");
			}
			else {
				db_find_id(id, function(rec, err){
					if (rec) {
						recN = rec;
						callback();
					}
					else
						callback(err||"error.");
				});
			}
		},
		// 更新 Record 
		function(callback) {
			var id = recN.allow.indexOf(info.acn);
			if (id > -1) {
				recN.allow.splice(id,1);
			}
			
			db_upd(recN, function(rec, err){
				if (rec)
					callback();
				else
					callback(err);
			});
		}
	], function(err) {
		if (err) {
			console.log('cb::cb_user_view: Error: ', err);
		}
		else {
			// Send Item Update
			ws_send_all("item_del", recN, [info.acn]);
		}
	});
}
function nt_rec_upd(rec, recNew, mode, allow)
{
	var bUpd = mode == "add" || mode == "upd";
	var bClear = mode == "clear";
	var time = util.getCurrentTimeStr(null,1);
	if (!rec.users) rec.users = {};
	if (!allow) allow = recNew.allow;
	for (var x=0; x<allow.length; x++) {
		var user = allow[x];
		if (!rec.users[user]) {
			rec.users[user] = {
				time:	time
				,cnt_noview: 0
			}
		}
		if (bUpd) {
			rec.users[user].cnt_noview++;
			rec.users[user].time 	= time;
			rec.users[user].owner 	= recNew.owner;
			rec.users[user].title 	= recNew.title;
			rec.users[user].content	= recNew.content;
		}
		if (bClear) {
			rec.users[user].cnt_noview = 0;
		}
	}
}


function db_add(rec, funcOK)
{
	var co = _db.table();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co.insert(rec, function(error, result) {
		var id;
		if (result) {
			try {
				var objId = new ObjectID(result['insertedIds'][0]['id']);
				id = objId.toHexString();
			} catch(e){}
		}
		if (id) {
			rec['_id'] = id;
			if (funcOK) funcOK(rec);
		} else {
			if (funcOK) funcOK(null, error);
		}
	});
}
function db_upd(rec, funcOK)
{
	var co = _db.table();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co.update({_id:rec._id}, rec, function(err, result){
		
		if (err) {
			if (funcOK) funcOK(null, err);
		} else {
			if (funcOK) funcOK(rec);
		}
	});
}
function db_find(query, sort, funcOK)
{
	var co = _db.table();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find(query)
		.sort(sort)
		.toArray(function(err, recs){
			if (recs && recs.length)
				funcOK(recs);
			else
				funcOK(null, err);
		});
		
}
function db_find_id(id, funcOK)
{
	var co = _db.table();
	if (!co) {
		if (funcOK) funcOK(null, "'DB Server Error'");
		return;
	}
	
	co	.find({_id:ObjectID(id)})
		.toArray(function(err, recs){
			if (recs && recs.length)
				funcOK(recs[0]);
			else
				funcOK(null, err);
	});
}


// rec => {allow, ...}
function ws_send_all(mode, rec, allow)
{
	if (!mode) {
		console.log('ws::ws_send_all Error: '+'empty mode'.red+' rec=', rec);
		return;
	}
	console.log('ws::ws_send_all ~~~ users.length='+(util.obj_length(_users)+"").cyan
					+', mode='+mode.cyan+', allow='+rec.allow+', title='+rec.title);
	
// console.log('ws::ws_send_all rec=',rec);
	var allow = allow||rec.allow;
	if (typeof allow != "object" || allow.length == 0) {
		console.log('ws::ws_send_all Error: '+'empty allow'.red+' rec=', rec);
		return;
	}
	for (var acn in _users) {
		if (allow.indexOf(acn) == -1)
			continue;
		
		var rec2 = util.obj_merge(rec);
		con_rec2out(rec2, acn);
		
		var user = _users[acn];
		for (var uid in user.conns) {
			ws_send(user.conns[uid], {
				mode: mode
				,rec: rec2
			});
			console.log('ws::ws_send_all '.green+'Notice'.cyan+' uid='+uid.cyan+', acn='+acn.cyan);
		}
	}
}





/////////////////////////////////////////
function sys_init()
{
	async.waterfall([
		function(callback) {
			var co = _db.table();
			if (!co) {
				callback("DB Server Error");
				return;
			}
			
		// 過濾掉 1個月以上的訊息
			var tTime = util.getCurrentTimeStr((new Date()).getTime()-30*86400*1000,1);
			var query = {time:{$lt:tTime}};

/*			co	.find(query)
				.toArray(function(err, recs){
console.log('ws:sys_init: recs='.yellow, (recs ? recs.length : 0));
					if (recs && recs.length) {
						for(var x=0; x<recs.length; x++) {
							var rec = recs[x];
console.log('ws:sys_init: title='.yellow, rec.owner, rec.time, rec.title);
						}
					}
				callback(err);
			});*/
				
			co.remove(query, function(err, res) {
				callback(err);
			});
		}
	], function(err) {
		if (err)console.log('ws::sys_init: Error: '.red, err);
		else	console.log('ws::sys_init: OK.'.yellow);
		
		setTimeout(sys_init, 86400000);
	});
}
setTimeout(sys_init, 3000);
