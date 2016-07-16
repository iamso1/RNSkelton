<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $path = stripslashes($_REQUEST["path"]);
    $filename = stripslashes($_REQUEST["filename"]);
    $content = stripslashes($_REQUEST["content"]);
    $cookie_ssn_acn = $_COOKIE["ssn_acn"];
    if ($_REQUEST["inherit"] == "YES")
        $inherit = true;
    else
        $inherit = false;
    if (empty($filename))
        $filename = NUWEB_DEF;

    /* 判斷參數是否正確 */
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($path))
        die(EMPTY_PATH);
    /* path 不可以是 / or .. 為開頭 */
    if (($path[0] == '/') || (strstr($path, "..") == $path))
        die(ERR_PATH);
    /* 檢查 filename 是否為系統檔案 (.nuweb_*) */
    if (substr($filename, 0, 7) != NUWEB_SYS_FILE)
        die(ERR_FILENAME);

    /* 設定目錄位置 */
    $page_dir = WEB_PAGE_DIR;
    $path_dir = $page_dir.$path;
    if (!is_dir($path_dir))
        die(ERR_PATH);
    chdir($path_dir);

    /* 檢查是否為管理者 */
    if (chk_manager_right($path) == PASS)
        $is_manager = true;
    else
        $is_manager = false;

    /* 只有管理者可設定或讀取系統檔 (.nuweb_*) */
    if ($is_manager != true)
        die(ERR_NO_PERMISSION);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "set":
            if (file_exists($filename))
                $modify_mode = "update";
            else
                $modify_mode = "new";

            /* 將系統檔寫入目錄內 */
            $fp = fopen($filename, "w");
            fputs($fp, $content);
            fclose($fp);

            /* 2014/9/6 新增,紀錄到 modify.list 中 */
            write_modify_list($modify_mode, str_replace("//", "/", "$path_dir/$filename"), "conf");

            echo "ok";
            break;
        case "get":
            /* 輸出系統檔內容 */
            if (file_exists($filename))
                readfile($filename);
            break;
        default:
            die(ERR_MODE);
    }
?>
