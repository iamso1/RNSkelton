<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    $acn = strtolower($_REQUEST["acn"]);
    $page_dir = WEB_PAGE_DIR;

    /* 如果不是 127.0.0.1 過來的一律不處理 */
    if ($_SERVER["REMOTE_ADDR"] != "127.0.0.1")
        return;

    /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許註冊新網站 */
    if ($wns_ser != DEF_WNS_SER)
        die(ERR_WNS_SER);

    /* 檢查帳號是否已經存在,若不存在就自動建立會員網站 */
    if (site_exists($page_dir, $acn) != true)
    {
	$reg_conf = read_conf(REGISTER_CONFIG);
	$site["sun"] = $acn."-".$reg_conf["acn"];
        $site_account = new_site_dir($page_dir, $acn, $site["sun"], $acn, SITE_TYPE_PERSONAL, true);
        if ($site_account == false)
            return false;
        $site["acn"] = $site_account;
        //$site["sun"] = $acn;
        /* 2014/9/6 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$acn, "dir");
    }
    else
    {
        /* 讀取 CS 與網站的資料 */
        $reg_conf = read_conf(REGISTER_CONFIG);
        $site_conf = get_site_conf($acn);

        $site["acn"] = strtolower($site_conf["site_acn"].".".$reg_conf["acn"]);
        $site["sun"] = $site_conf["name"];
    }

    /* 回傳會員網站資料 */
    echo json_encode($site);
?>
