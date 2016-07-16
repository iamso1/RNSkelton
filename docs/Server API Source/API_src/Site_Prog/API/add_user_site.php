<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    $page_dir = WEB_PAGE_DIR;

    /* 若不是從 Local LAN 過來的一律不處理 */
    if (chk_local_lan($_SERVER["REMOTE_ADDR"]) !== true)
        die(ERR_NO_PERMISSION);

    /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許註冊新網站 */
    if ($wns_ser != DEF_WNS_SER)
        die(ERR_WNS_SER);

    /* 取得 login user 資料,使用 user 帳號來建立網站 */
    $login_user = get_login_user();
    if ($login_user === false)
        die(ERR_NO_PERMISSION);
    $acn = $login_user["acn"];

    /* 讀取 CS 的註冊資料 */
    $reg_conf = read_conf(REGISTER_CONFIG);

    /* 檢查帳號是否已經存在,若不存在就自動建立 user 網站 */
    if (site_exists($page_dir, $acn) != true)
    {
	$site["sun"] = $acn."-".$reg_conf["acn"];
        //$site_account = new_site_dir($page_dir, $acn, $site["sun"], $acn, SITE_TYPE_PERSONAL, true);
        $site_account = new_site_dir($page_dir, $acn, $site["sun"], $acn, SITE_TYPE_PERSONAL);
        if ($site_account == false)
            die(ERR_NO_PERMISSION);
        $site["acn"] = $site_account;
        /* 2014/9/6 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$acn, "dir");
    }
    else
    {
        /* 讀取 user 網站的資料 */
        $site_conf = get_site_conf($acn);

        $site["acn"] = strtolower($site_conf["site_acn"].".".$reg_conf["acn"]);
        $site["sun"] = $site_conf["name"];
    }
    /* 回傳會員網站資料 */
    echo json_encode($site);
?>
