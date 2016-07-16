<?php
	global $lang, $def_lang;
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    /* 取得語系的訊息檔 */
    $lang_msg = WEB_LANG_MSG_DIR."api_lang_$lang.php";
    if (!file_exists($lang_msg))
        $lang_msg = WEB_LANG_MSG_DIR."api_lang_$def_lang.php";
    require_once($lang_msg);
?>
