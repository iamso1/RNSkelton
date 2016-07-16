<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $site_acn = strtolower($_REQUEST["site_acn"]);
    $manager = $_REQUEST["manager"];

    /* 判斷參數是否正確 */
    if (empty($site_acn))
        die(EMPTY_SITE_ACN);
    $site_dir = WEB_PAGE_DIR.$site_acn;
    if (!is_dir($site_dir))
        die(ERR_SITE_ACN);

    /* 檢查是否為管理者,只有管理者可使用 */
    if (chk_manager_right($site_acn) !== PASS)
        die(ERR_NO_PERMISSION);

    /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許變更網站資料 */
    if ($wns_ser != DEF_WNS_SER)
        die(ERR_WNS_SER);

    /* 讀取原網站資訊 */
    $conf_file = $site_dir."/".NUWEB_CONF;
    $site_conf = read_conf($conf_file);

    /* 更新 manager 設定 (若 manager 資料沒變更,就直接離開) */
    if ($site_conf["manager"] == $manager)
        return;
    $site_conf["manager"] = $manager;

    /* 更新 WNS 上的網站資料 */
    /* 2015/6/19 取消 call update_cs_site 在後面寫入網站設定檔後,會另外 call update_cs_site_conf 上傳完整的網站設定資料 */
    //$contents = update_cs_site($site_conf["site_acn"], $site_conf["name"], $site_conf["owner"], $site_conf["manager"], $site_conf["describe"]);
    //if ($contents === false)
    //    die(ERR_WNS_SER);
    //else if ($contents !== true)
    //    die($contents);

    /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
    update_site_conf($site_acn, $site_conf, "update");
    ///* 更新網站資訊檔 */
    //write_conf($conf_file, $site_conf);
    ///* 2014/12/12 新增,將網站資訊更新到 DB 中 */
    //site2db($site_acn);
    ///* 2014/8/19 新增,將網站設定資料上傳到 Group Server */
    //group_upload_site_conf($site_conf);
    ///* 2015/1/21 新增,更新 Site_Index 資料 */
    //update_site_index($site_acn);
    ///* 2014/9/6 新增,紀錄到 modify.list 中 */
    //write_modify_list("update", $conf_file, "conf");
    ///* 2015/6/19 新增,將網站設定檔上傳到 wns server 建立 Global Site Index */
    //update_cs_site_conf($site_acn);

    echo "ok";
?>
