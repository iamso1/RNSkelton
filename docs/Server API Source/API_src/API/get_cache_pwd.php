<?php
require_once("/data/HTTPD/htdocs/tools/public_lib.php");
define('UPDATE_RANDPWD_IVL',300);
if(isset($_COOKIE["ssn_acn"])){
	list($ssn, $acn) = explode(":", $_COOKIE["ssn_acn"]);
}else{
	exit;
}
if(chk_manager($acn)){
	$set_conf = read_conf(SETUP_CONFIG);
	if($set_conf['use_cache_pwd'] == NO){
		list($updated_time, $cache_pwd) = explode(":", $set_conf["cache_pwd"]);
		if(strpos($set_conf["cache_pwd"], ":") === false || time() > intval($updated_time)){
			mt_srand(time());
			$updated_time = time() + UPDATE_RANDPWD_IVL;
			$cache_pwd = mt_rand(1000, 9999);
			$set_conf["cache_pwd"] = $updated_time.":".$cache_pwd;
			write_conf(SETUP_CONFIG, $set_conf);
		}
		echo json_encode((string)$cache_pwd);
	}else{
		echo json_encode($set_conf["cache_pwd"]);
	}
}else{
	echo json_encode(false);
}
exit;
?>
