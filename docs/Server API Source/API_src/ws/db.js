

var DB_TABLE 	= "notice";
var DB_TABLE_CB	= "chatbox";
var DB_TABLE_CM	= "chatmsg";
var DB_URL 		= 'mongodb://localhost:27017/db';
var RECONNECTING_TIME = 10000;

var colors 		= require('colors');
var MongoClient = require('mongodb').MongoClient;

// Connection URL
var _db;
var _cnt_err = 0;

module.exports = {
	db: function(){
		return _db;
	}
	,table: function(){
		return _db ? _db.collection(DB_TABLE) : null;
	}
	,table_cb: function(){
		return _db ? _db.collection(DB_TABLE_CB) : null;
	}
	,table_cm: function(){
		return _db ? _db.collection(DB_TABLE_CM) : null;
	}
}



// Use connect method to connect to the Server
function connect()
{
	MongoClient.connect(DB_URL, function(err, db) {
		if (db) {
			console.log("db::connect OK");
			_cnt_err = 0;
			_db = db;
			
			db.on("error",function(msg){
				console.log("db::error msg: ".red, msg);
			})
		} else {
			console.log("db::connect Error: ".red, err);
			_cnt_err++;
			setTimeout(connect, RECONNECTING_TIME);
		}
	});
}
connect();

