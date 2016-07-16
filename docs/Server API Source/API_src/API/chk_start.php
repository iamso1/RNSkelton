<?php
    require_once("/data/HTTPD/htdocs/Admin/init.php");

    /* 檢查是否已啟用過 */
    if (file_exists(SYS_START_FLAG))
        echo NO;
    else
        echo YES;
?>
