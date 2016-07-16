<?php
    require_once("API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得及檢查參數 */
    $mode = $_REQUEST["mode"];
    $page_url = $_REQUEST["page_url"];
    $site_acn = $_REQUEST["site_acn"];
    $trash_id = $_REQUEST["trash_id"];
    $rewrite = $_REQUEST["rewrite"];
    if (empty($mode))
        die(EMPTY_MODE);
    if (($mode == "set_trash") && (empty($page_url)))
        die(EMPTY_PAGE_URL);
    if (($mode != "set_trash") && (empty($site_acn)))
        die(EMPTY_SITE_ACN);
    if ((($mode == "del_trash") || ($mode == "recover_trash") || ($mode == "chk_trash_file_exists")) && (empty($trash_id)))
        die(EMPTY_TRASH_ID);
    if ($rewrite != ON)
        $rewrite = OFF;
    if (!empty($page_url))
    {
        if (is_Driver($page_url) == true)
            die(ERR_DRIVER);
        $file_path = WEB_ROOT_PATH.$page_url;
        if (!file_exists($file_path))
        {
            /* 2014/4/10 修改,檔案不存在,也嘗試從 index 中刪除此檔案 */
            rec_delete($page_url);
            die(ERR_PAGE_URL);
        }
    }
    if (!empty($site_acn))
    {
        $site_path = WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn;
        if (!is_dir($site_path))
            die(ERR_SITE_ACN);
    }

    /* 除了 set_trash 外,其餘功能必須是否為網站管理員 */
    $is_site_manager = false;
    if (!empty($file_path))
        $is_site_manager = chk_site_manager($file_path);
    if (!empty($site_acn))
        $is_site_manager = chk_site_manager($site_path);
    if (($mode !== "set_trash") && ($is_site_manager !== true))
        die(ERR_NO_PERMISSION);
    /* set_trash 功能必須檢查是否有上傳權限 */
    if (($mode == "set_trash") && (chk_upload_right(WEB_PAGE_DIR, str_replace(WEB_PAGE_DIR, "", $file_path)) !== PASS))
        die(ERR_NO_PERMISSION);

    /* 依 mode 執行不同功能 */
    switch($mode)
    {
        /* 將檔案或目錄丟進垃圾桶 */
        case "set_trash":
            $trash_id = set_trash($file_path);
            if ($trash_id == false)
                die(ERR_SET_TRASH);
            echo $trash_id;
            break;

        /* 將垃圾桶內的檔案或目錄清除掉 */
        case "del_trash":
            if (del_trash($site_acn, $trash_id) == false)
                die(ERR_DEL_TRASH);
            echo "ok";
            break;

        /* 清空垃圾桶 */
        case "clean_trash":
            if (clean_trash($site_acn) == false)
                die(ERR_CLEAN_TRASH);
            echo "ok";
            break;

        /* 還原垃圾桶內的檔案或目錄 */
        case "recover_trash":
            /* 2014/7/24 新增,若 rewrite 為 ON 且垃圾桶內的檔案或目錄已存在網站內,就將網站內的檔案或目錄先丟進垃圾桶,再進行還原 */
            if ($rewrite == ON)
            {
                $f_path = chk_trash_file_exists($site_acn, $trash_id);
                if (($f_path !== false) && ($f_path !== NO))
                    set_trash(WEB_PAGE_DIR.$f_path);
            }
            $file_url = recover_trash($site_acn, $trash_id);
            if ($file_url == false)
                die(ERR_RECOVER_TRASH);
            echo $file_url;
            break;

        /* 檢查垃圾桶內的檔案或目錄是否在網站已存在 */
        case "chk_trash_file_exists":
            $status = chk_trash_file_exists($site_acn, $trash_id);
            if ($status === false)
                die(ERR_NO_PERMISSION);
                //die(ERR_CHK_TRASH_FILE_EXISTS);
            if ($status === NO)
                echo NO;
            else
                echo YES;
            //echo $status;
            break;

        /* 取得垃圾桶的 log */
        case "get_trash_log":
            if (!empty($trash_id))
                $log = get_trash_log($site_acn, $trash_id);
            else
                $log = get_trash_log($site_acn);
            if ($log != false)
                echo json_encode($log);
            break;

        default:
            die(ERR_MODE);
            break;
    }
?>
