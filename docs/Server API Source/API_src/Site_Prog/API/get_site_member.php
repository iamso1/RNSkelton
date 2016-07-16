<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    $site = $_REQUEST["site"];

    /* 取得子網站的會員名單並輸出 */
    $site_member = get_site_member($site);
    $cnt = count($site_member);
    for ($i = 0; $i < $cnt; $i++)
        echo $site_member[$i]."\n";
?>
