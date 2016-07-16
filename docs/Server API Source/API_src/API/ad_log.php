<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    $title = $_REQUEST["title"];
    $url = $_REQUEST["url"];

    if ((empty($title)) || (empty($url)))
        exit;

    write_ad_log($title, $url);
    if (substr($url, 0, 1) == "/")
        $url = get_server_url().substr($url, 1);
    else if ((substr($url, 0, 7) !== "http://") && (substr($url, 0, 8) !== "https://"))
        $url = "http://".$url;
    header("Location: $url");
?>
