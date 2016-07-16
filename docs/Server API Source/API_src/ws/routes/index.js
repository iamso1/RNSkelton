
var os 		= require('os');
var fs 		= require('fs');
var path	= require('path');
var colors 	= require('colors');
var async 	= require('async');
var md5 	= require('md5');
var util    = require('../utils');
var rs		= require('./rs_lib');
var ws 		= require('./websocket');
var cb 		= require('./chatbox');

exports.nunotice = function(req, res){
	console.log('index::nunotice ~~~ '.green);
	ws.nunotice(req, res);
};
exports.user_image = function(req, res)
{
	var cookies = util.cookie_parse(req);
// console.log('index::user_image cookies='.green, cookies);

	try {
		var acn 		= req.body['acn']||req.query['acn']||"";
		var server_acn 	= req.body['server_acn']||req.query['server_acn']||"";
		var u_srv 		= req.body['u_srv']||req.query['u_srv']||"";
	} catch(e){}
	
	var err;
	if (acn == "")
		err = "empty acn";
	else if (server_acn == "" && u_srv == "")
		err = "empty server_acn";
	if (err) {
		console.log('index::user_image: Error: '+err.red);
		util.error(res, 404, err);
		return;
	}

	var url = (u_srv != "" ? u_srv : "http://"+server_acn+".nuweb.cc")
				+"/UserProfile/user_image.php?acn="+acn;
	var fn = "user_icon_"+acn+".jpg";
	var fUserIcon = path.join(os.tmpdir(), fn);
	var nDiff = 0;
	async.waterfall([
		function(callback) {
			fs.stat(fUserIcon, function (err, stats) {
				if (err) {
					callback();
				} else {
					nDiff = (new Date()).getTime() - new Date(Date.parse(stats.mtime)).getTime();
					callback();
				}
			});
		}
		,function(callback) {
			// Cache 10分鐘
			if (nDiff == 0 || nDiff > 600000) {
				util.url_getFile_get({
					url: url
					,fp: fUserIcon
					,getHeaders: true
					,funcOK: function(data, err){
						callback(err);
					}
				});
			}
			else
				callback();
		}
	], function(err) {
		if (err) {
			util.error(res, 404, err);
			console.log('index::user_image: Error: err='.red, err);
		}
		else {
			function fun_res(err) {
				if (err)
					res.status(err.status).end();
			}
			res.sendfile(fUserIcon, fn, fun_res);
			console.log('index::user_image: OK.'.green);
		}
	});
};
// TempFile => ae_xxx
exports.api_external = function(req, res)
{
	var cookies = util.cookie_parse(req);
// console.log('ndx::api_external cookies='.green, cookies);

	try {
		var url = req.body['url']||req.query['url']||"";
		var data = req.body['data']||req.query['data']||"";
		var cookie = req.body['cookie']||req.query['cookie']||"";
		var cache = req.body['cache']||req.query['cache']||0;
	} catch(e){}
	
	var err;
	if (url == "")
		err = "empty url";
	if (err) {
		console.log('ndx::api_external: Error: '+err.red);
		util.error(res, 404, err);
		return;
	}

// console.log('ndx::api_external url='.green, url);
// console.log('ndx::api_external data='.green, data);
// console.log('ndx::api_external cookie='.green, cookie);
	var fn = "api_ext_"+md5(url);
	var file = path.join(os.tmpdir(), fn);
// console.log('ndx::api_external file='.green, file);
	var nDiff = 0;
	async.waterfall([
		function(callback) {
			fs.stat(file, function (err, stats) {
				if (err) {
					callback();
				} else {
					nDiff = (new Date()).getTime() - new Date(Date.parse(stats.mtime)).getTime();
					callback();
				}
			});
		}
		,function(callback) {
			// Cache 10分鐘
			if (nDiff == 0 || nDiff > cache) {
				util.url_getFile({
					url: url
					,fp: file
					,data: (data.length ? data : null)
					,cookie: cookie
					,getHeaders: true
					,funcOK: function(data, err){
						callback(err);
					}
				});
			}
			else
				callback();
		}
	], function(err) {
		if (err) {
			util.error(res, 404, err);
			console.log('index::user_image: Error: err='.red, err);
		}
		else {
			function fun_res(err) {
				if (err)
					res.status(err.status).end();
			}
			res.sendfile(file, fn, fun_res);
			console.log('index::user_image: OK.'.green);
		}
	});
};
// data => {mode, nu_code, path, fn, mtime,  fs, ps, px}
exports.api_upload_file_p = function(req, res, next)
{
// console.log('ndx::api_upload_file_p 1 body=', req.body);
// console.log('ndx::api_upload_file_p 2 files=', util.con_Object2String(req.files, false, 1));
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
// console.log('ndx::api_upload_file_p @@@ data=', data);

	var mode 	= data.mode||"";
	var nu_code = data.nu_code||"";
	var path 	= data.path||"";
	var fn 		= data.fn||"";
	var fs2 	= parseFloat(data.fs||"");	// file size
	var ps 		= parseInt(data.ps||"");	// part size
	
	var err;
	if (mode == "")
		err = "empty mode";
	else if (nu_code == "")
		err = "empty nu_code";
	else if (path == "")
		err = "empty path";
	else if (fn == "")
		err = "empty fn";
	else if (isNaN(fs2) || fs2 < 1)
		callback("file size");
	else if (isNaN(ps) || ps < 1)
		callback("part size");
	if (err) {
		console.log('cb::api_upload_file_p: Error: '.red, err);
		util.error(res, 404, err);
		return;
	}
	
	
	
	var temp_dir = os.tmpDir()+"/";
	var ufid = md5(path+fn);
	var fp_pm = temp_dir+"ufid_"+ufid+".part.met";
	var fp_p = temp_dir+"ufid_"+ufid+".part";
	var fp_f = temp_dir+"ufid_"+ufid;
// console.log('ndx::api_upload_file_p temp_dir=', temp_dir);
// console.log('ndx::api_upload_file_p ufid=', ufid);
// console.log('ndx::api_upload_file_p fp_pm=', fp_pm);
// console.log('ndx::api_upload_file_p fp_p=', fp_p);
// console.log('ndx::api_upload_file_p fp_f=', fp_f);
// console.log('ndx::api_upload_file_p fs2='.green, fs2, ps);
	
	
	var userInfo;
	var out = {};
	async.waterfall([
		// Decode
		function(callback) {
			rs.auth_decode(nu_code, function(res, err){
// console.log('ndx::api_upload_file_p auth_decode res=', res);
				if (!res || (res.acn||"") == "" || (res.sun||"") == "") {
					callback(err||"Decoding failure");
				}
				else {
					userInfo = res;
					callback();
				}
			})
		},
		// 
		function(callback)
		{
			if (mode == "pl")
			{
				fs.exists(fp_pm, function (exists) {
					
// console.log('ndx::api_upload_file_p exists='.green, exists);
					// 建立片斷資料傳回
					function do_create_return() {
						var pc = parseInt((fs2-1)/ps)+1; // part count
						var part = util.str_repeat("0", pc);
// console.log('ndx::api_upload_file_p 建立片斷資料傳回 pc='.green, pc);
// console.log('ndx::api_upload_file_p 建立片斷資料傳回 part='.green, part);
						out = {
							ufid: 	ufid
							,fs:	fs2
							,ps:	ps
							,part: 	part
						}
						var data = JSON.stringify(out);
						fs.writeFile(fp_pm, data, function(err){
							if (err) {
								callback(err);
							}
							else {
								fs.writeFile(fp_p, "", function(err){
									if (err) console.log('ndx::api_upload_file_p writeFile fp_p err='.red, err);
								});
								
								// *** out ***
								out = {
									part: part
								}
								res.json(out).end();
// console.log('ndx::api_upload_file_p do_create_return out='.green, out);
								callback();
							}
						});
					}
					
					if (exists) {
						fs.readFile(fp_pm, function(err, data){
							if (!err && data) {
								var info = JSON.parse(data);
// console.log('ndx::api_upload_file_p readFile info='.green, info);
								if (info && info.fs == fs2 && info.ps == ps
										&& info.part && info.part.length) {
									// *** 完成
									if (info.part.indexOf("0") == -1)
									{
										fs.rename(fp_p, fp_f, function(err) {
											if (err) {
												callback(err);
											}
											else {
												// Delete File
												fs.unlink(fp_pm);
												//
												out = {
													result: "ok"
													,ufid: ufid
												}
												res.json(out).end();
// console.log('ndx::api_upload_file_p 完成 out='.green, out);
											}
										});
									}
									// *** 傳回片斷
									else
									{
										out = {
											part: info.part
										}
										res.json(out).end();
// console.log('ndx::api_upload_file_p 傳回片斷 out='.green, out);
									}
									callback();
								}
								else
									do_create_return();
							}
							// 取片斷資料錯誤
							else
								do_create_return();
						});
					}
					else 
						do_create_return();
				});
			}
			else if (mode == "p")
			{
				var file = req.files && req.files.length ? req.files[0] : null;
				var fp_src = file ? file.path : null;
				var px = parseInt(data.px);
				var dataInfo = null;;
// console.log('ndx::api_upload_file_p [p] fp_src=', fp_src);
// console.log('ndx::api_upload_file_p [p] px=', px);
				async.waterfall([
					function(pCallback) {
						if (fp_src == null || fp_src == "")
							pCallback("Error: empty file.");
						else if (isNaN(px))
							pCallback("Error: empty px.");
						else
							pCallback();
					},
					function(pCallback) {
						fs.readFile(fp_pm, function(err, data) {
							if (data) {
								try {
									dataInfo = JSON.parse(data);
								} catch(e){}
							}
// console.log('ndx::api_upload_file_p ~~~~~ dataInfo='.green, dataInfo);
							if (!dataInfo)
								pCallback("Error: empty info");
							else if (dataInfo.fs != fs2 || dataInfo.ps != ps)
								pCallback("Error: Data do not match")
							else
								pCallback();
						})
					},
					function(pCallback) {
						var pos = px*ps;
						var len = util.min(ps, ps);
// console.log('ndx::api_upload_file_p [p] writeFile dataInfo pos='+pos+', len='+len);
						util.file_writeFile(fp_src, fp_p, pos, len, function(err){
							pCallback(err);
						});
					},
					function(pCallback) {
						dataInfo.part = dataInfo.part.replaceAt(px,"1");
// console.log('ndx::api_upload_file_p [p] writeFile dataInfo part=', px, dataInfo.part);
						var data = JSON.stringify(dataInfo);
						fs.writeFile(fp_pm, data, function(err){
							pCallback(err);
						});
					}
				], function(err) {
					if (!err) {
						// *** ***
						out = {
							result: "ok"
						}
						res.json(out).end();
					}
					
					// Delete Part File
					//if (fp_src) fs.unlink(fp_src);
					
					callback(err);
				});
			}
			else
				callback("Error: Invalid mode.");
		}
	], function(err) {
		if (err) {
			util.error(res, 500, err);
			console.log('ndx::api_upload_file_p @@@ err='.red, err);
		}
		else {
			//res.end("ok");
			console.log('ndx::api_upload_file_p @@@ ok.'.green);
		}
	});
}

exports.index = function(req, res){
	res.render('index', { title: 'Express' });
};

exports.ws_test = function(req, res){
	console.log('index::test ~~~ '.green);
	res.render('test', { title: 'Express' });
};

exports.server = function(req, res){
	console.log('index::server ~~~ '.green);
	var out_users = {};
	var out_cbs = {};
	async.waterfall([
		function(callback) {
			var t = (new Date()).getTime();
			var users = ws.getUsers();
			for (var acn in users) {
				var user = users[acn];
				if (!out_users[acn]) {
					out_users[acn] = util.obj_merge(user);
					out_users[acn]['conns'] = {};
				}
				for (var uid in user.conns) {
					var info = util.obj_merge(user.conns[uid]);
					info['etime'] = t - info['time'];
					info['readyState'] = info.conn.readyState;
					delete info.conn;
					out_users[acn]['conns'][uid] = info;
				}
			}
			callback();
		}
		,function(callback) {
			cb.getCBList(function(res, err){
				if (res) {
					for(var cid in res) {
						if (res[cid].users)
							delete res[cid].users;
					}
				}
				out_cbs = res;
				callback();
			});
		}
	], function(err) {
// console.log('is:server: out_cbs='.yellow, out_cbs);
		res.render('server', {
			users: JSON.stringify(out_users)
			,cbs: JSON.stringify(out_cbs)
		});
	});
};

exports.nudb = function(req, res){
	console.log('index::nudb ~~~ '.green);
	res.render('nudb', null);
};

