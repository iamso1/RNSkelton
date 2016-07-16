<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    if ($group_mode == GROUP_NONE)
        exit;
    group_upload_site_manager();
?>
