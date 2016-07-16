<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    if ($group_mode != GROUP_SERVER)
        exit;

    $acn = $_REQUEST["acn"];
    $content = $_REQUEST["content"];
    group_get_site_manager($acn, $content);
?>
