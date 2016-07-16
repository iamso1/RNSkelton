
var fs 			= require('fs');
var async 		= require('async');
var colors 		= require('colors');

var util		= require('../utils');



var HOST_URL		= "http://140.123.4.93:8080"
var WNS_API_TOOLS 	= "/GCM/gcm_api_tools.php"
var API_TOOLS 		= "/tools/GCM/gcm_api_tools.php"



///////////////////////////////////////////////////////
// arg => {users, cookie, funcOK}
function getRegIDList(arg)
{
// console.log('gcm::getRegIDList ~~~ arg=', arg);
	var argData = {
		mode: "getRegIDList"
		,users: arg.users
		,regid: "y"
	}
	util.url_getFile({
		url: HOST_URL+WNS_API_TOOLS
		,data: argData
		,cookie: arg.cookie
		,getHeaders: true
		,funcOK: function(data, err){
// console.log('gcm::getRegIDList url_getFile data=', data);
// console.log('gcm::getRegIDList url_getFile err=', err);
			
			if (arg.funcOK) {
				if (data.data) {
					try {
						data.data = JSON.parse(data.data);
					} catch(e){}
				}
				arg.funcOK(data, err);
			}
		}
	});
}

// arg => {server_acn, rec[{key(users), time, msg{mode[am / rtc]}, title, description}], cookie, funcOK}
function sendMsg(arg)
{
// console.log('gcm::sendMsg ~~~ arg=', arg);
	var url = "http://"+arg.server_acn+".nuweb.cc"+API_TOOLS
	var argData = {
		mode: "send"
		,rec: arg.rec
	}
	util.url_getFile({
		url: url
		,data: argData
		,cookie: arg.cookie
		,getHeaders: true
		,funcOK: function(data, err){
// console.log('gcm::sendMsg url_getFile data=', data);
// console.log('gcm::sendMsg url_getFile err=', err);
			
			if (arg.funcOK) {
				if (data.data) {
					try {
						data.data = JSON.parse(data.data);
					} catch(e){}
				}
				arg.funcOK(data, err);
			}
		}
	});
}


///////////////////////////////////////////////////////
module.exports = {

getRegIDList:		getRegIDList
,sendMsg:			sendMsg

};
