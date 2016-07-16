<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    /* 若是 Group Client 就直接導向 Group Server 取得資料 */
    if ($group_mode == GROUP_CLIENT)
    {
        $url = "http://".$set_conf["group_server"].".nuweb.cc/API/get_ad.php";
        //header("Location: $url");
        echo implode("", @file($url));
        exit;
    }

    $ad_conf = array();
    if (file_exists(AD_CONF))
        $ad_conf = read_conf(AD_CONF);

    if (file_exists(AD_LIST))
        $ad_conf["ad"] = get_ad_list(true);

    /* 2015/7/29 新增,調整廣告 url,要先跳到 ad_log.php 再導向廣告,以便紀錄廣告 log */
    $cnt = count($ad_conf["ad"]);
    for ($i = 0; $i < $cnt; $i++)
    {
        $title = $ad_conf["ad"][$i]["title"];
        $url = $ad_conf["ad"][$i]["url"];
        $ad_conf["ad"][$i]["url"] = "/API/ad_log.php?title=".rawurlencode($title)."&url=".rawurlencode($url);
    }

    echo json_encode($ad_conf);
?>
