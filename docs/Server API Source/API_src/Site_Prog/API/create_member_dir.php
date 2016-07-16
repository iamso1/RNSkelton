<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    define("ERR_CREATE_MEMBER_DIR", "Error: create member directory is fail!");

    $path = stripslashes($_REQUEST["path"]);

    /* 檢查參數 */
    if (empty($path))
        die(EMPTY_PATH);
    $dir = WEB_PAGE_DIR.$path;
    if ((!is_dir($dir)) || (strstr($path, "../") != false))
        die(ERR_NO_PATH);

    /* 檢查是否有網站管理權限,有權限才可執行本功能 */
    if (chk_manager_right($path) !== PASS)
        die(ERR_NO_PERMISSION);

    if (create_member_dir(WEB_PAGE_DIR, $path) == false)
        die(ERR_CREATE_MEMBER_DIR);
    echo "ok";
?>
