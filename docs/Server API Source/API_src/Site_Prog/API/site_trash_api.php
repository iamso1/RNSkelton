<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    /* 取得語系的訊息檔 */
    $lang_msg = WEB_LANG_MSG_DIR."api_lang_$lang.php";
    if (!file_exists($lang_msg))
        $lang_msg = WEB_LANG_MSG_DIR."api_lang_$def_lang.php";
    require_once($lang_msg);

    /* 僅允許系統管理者或後端管理者使用 */
    if (($is_manager != true) && ($admin_manager != true))
        die(ERR_NO_PERMISSION);

    /* 取得及檢查參數 */
    $mode = $_REQUEST["mode"];
    $trash_id = $_REQUEST["trash_id"];
    if (empty($mode))
        die(EMPTY_MODE);
    if ((($mode == "del") || ($mode == "recover")) && (empty($trash_id)))
        die(EMPTY_TRASH_ID);

    /* 依 mode 執行不同功能 */
    switch($mode)
    {
        /* 將垃圾桶內的網站清除掉 */
        case "del":
            if (del_site_trash($trash_id) == false)
                die(ERR_DEL_TRASH);
            echo "ok";
            break;

        /* 清空垃圾桶 */
        case "clean":
            if (clean_site_trash() == false)
                die(ERR_CLEAN_TRASH);
            echo "ok";
            break;

        /* 還原垃圾桶內的檔案或目錄 */
        case "recover":
            if (recover_site_trash($trash_id) == false)
                die(ERR_RECOVER_TRASH);
            echo "ok";
            break;

        /* 取得垃圾桶的 log */
        case "get_log":
            if (!empty($trash_id))
                $log = get_site_trash_log($trash_id);
            else
                $log = get_site_trash_log();
            if ($log != false)
                echo json_encode($log);
            break;

        default:
            die(ERR_MODE);
            break;
    }
?>
