<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    $path = $_REQUEST["path"];

    /* 檢查登入的 user 是否有此目錄的管理權限(也就是此子網站的管理者) */
    if (chk_manager_right($path) == PASS)
        echo "YES";
    else
        echo "NO";
?>
