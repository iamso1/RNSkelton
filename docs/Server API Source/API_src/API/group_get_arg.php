<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    if ($group_mode != GROUP_SERVER)
        exit;

    $code = $_REQUEST["code"];
    $file = NUWEB_TMP_DIR.$code;

    if (file_exists($file))
    {
        $content = trim(implode("", @file($file)));
        unlink($file);
        echo $content;
    }
?>
