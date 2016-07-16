<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    /* 若是 Group Client 就直接導向 Group Server 取得資料 */
    if ($group_mode == GROUP_CLIENT)
    {
        $url = "http://".$set_conf["group_server"].".nuweb.cc/API/get_announcement.php";
        //header("Location: $url");
        echo implode("", @file($url));
        exit;
    }

    if ((!isset($set_conf["announcement_url"])) || (empty($set_conf["announcement_url"])))
        exit;
    $url = $set_conf["announcement_url"];
    $now_date = (int)date("Ymd");
    $now_time = (int)date("Hi");
    if ((isset($set_conf["announcement_sdate"])) && (!empty($set_conf["announcement_sdate"])))
    {
        $s_date = (int)$set_conf["announcement_sdate"];
        if ((isset($set_conf["announcement_stime"])) && (!empty($set_conf["announcement_stime"])))
            $s_time = (int)$set_conf["announcement_stime"];
        else
            $s_time = 0;
        if (($now_date < $s_date) || (($now_date == $s_date) && ($now_time < $s_time)))
            exit;
    }
    if ((isset($set_conf["announcement_edate"])) && (!empty($set_conf["announcement_edate"])))
    {
        $e_date = (int)$set_conf["announcement_edate"];
        if ((isset($set_conf["announcement_etime"])) && (!empty($set_conf["announcement_etime"])))
            $e_time = (int)$set_conf["announcement_etime"];
        else
            $e_time = 0;
        if (($now_date > $e_date) || (($now_date == $e_date) && ($now_time > $e_time)))
            exit;
    }
    if (substr($url, 0, 1) == "/")
        $url = get_server_url().substr($url, 1);
    else if ((substr($url, 0, 7) !== "http://") && (substr($url, 0, 8) !== "https://"))
        $url = "http://".$url;
    echo $url;
?>
