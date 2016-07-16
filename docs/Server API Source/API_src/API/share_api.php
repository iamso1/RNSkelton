<?php
    require_once("API_init.php");

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $page_url = $_REQUEST["page_url"];
    $site_acn = $_REQUEST["site_acn"];
    $content = $_REQUEST["content"];
    $fun = $_REQUEST["fun"];
    $value = $_REQUEST["value"];
    $time = $_REQUEST["time"];
    $sort_by = $_REQUEST["sort_by"];
    $sort_mode = $_REQUEST["sort_mode"];
    $share_mode = $_REQUEST["share_mode"];
    $share_end = $_REQUEST["share_end"];
    $share_pwd = $_REQUEST["share_pwd"];

    /* 判斷參數是否正確 */
    if (empty($mode))
        die(EMPTY_MODE);
    if ((!empty($fun)) && ($fun != "public") && ($fun != "share") && ($fun != "use_acn") && ($fun != "all"))
        die(ERR_FUN);
    if (($mode !== "get_share_log") && ($mode !== "get_share_list") && (empty($page_url)))
        die(EMPTY_PAGE_URL);
    if ((($mode == "get_share_log") || ($mode == "get_share_list")) && (empty($site_acn)))
        die(EMPTY_SITE_ACN);
    if (!empty($page_url))
    {
        $file_path = WEB_ROOT_PATH.$page_url;
        if (!file_exists($file_path))
            die(ERR_PAGE_URL);
    }
    if ((!empty($site_acn)) && (!is_dir(WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn)))
        die(ERR_SITE_ACN);
    if (($mode == "set_share_log") && (empty($time)))
        $time = date("YmdHis");
    if ($share_mode !== "all")
        $share_mode = "";

    /* 檢查是否為網站管理員 */
    if (!empty($file_path))
        $is_site_manager = chk_site_manager($file_path);
    else
        $is_site_manager = chk_site_manager(WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn);
    if ($is_site_manager !== true)
        die(ERR_NO_PERMISSION);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "set_public":
            $result = set_public($file_path, $value);
            break;

        case "set_share":
            /* 2015/11/9 新增,檢查是否有設定分享連結的權限 */
            if (chk_share_link_right() !== true)
                die(ERR_NO_PERMISSION);
            /* 2015/8/10 修改,增加 share_end 參數 */
            /* 2015/9/10 修改,增加 share_pwd 參數 */
            $result = set_share_code($file_path, $value, $share_end, $share_pwd);
            break;

        case "set_use_acn":
            $use_acn = explode(",", $value);
            $result = set_use_acn($file_path, $use_acn);
            break;

        case "set_share_log":
            $result = set_share_log($file_path, "share", $value, NULL, $time, $content);
            break;

        case "get_share_log":
            $result = get_share_log($site_acn, $fun, $sort_by, $sort_mode, $share_mode);
            break;

        case "get_share_list":
            $result = get_share_log($site_acn, "share", $sort_by, $sort_mode, "all"); 
            break;

        case "get_share_rec":
            $result = get_share_rec($file_path, $fun);
            break;

        case "get_use_acn_list":
            $result = get_use_acn_list($file_path);
            break;

        case "set_share_end":
            $result = set_share_code($file_path, SET_END, $share_end);
            break;

        case "set_share_pwd":
            $result = set_share_code($file_path, SET_PWD, NULL, $share_pwd);
            break;

        default:
            die(ERR_MODE);
    }
    if ($result === false)
        die("Error: $mode is fail!");
    if ($result === true)
        echo "ok";
    else if (is_array($result))
        echo json_encode($result);
    else
        echo $result;
?>
