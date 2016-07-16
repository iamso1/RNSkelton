
var util    = require( '../utils' );

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.test = function(req, res){
	console.log('user::test ~~~ uid=', util.uid(32));
	res.render('test', { title: 'Express' });
};


