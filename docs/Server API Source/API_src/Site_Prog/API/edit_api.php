<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    require_once("/data/HTTPD/htdocs/API/edit_api_lib.php");
    
    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);
    
    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $dir_type = $_REQUEST["type"];
    $code = $_REQUEST["code"];
    $path = stripslashes($_REQUEST["path"]);
    $target_path = stripslashes($_REQUEST["target_path"]);
    $file_list = stripslashes($_REQUEST["file_list"]);
    $name = stripslashes($_REQUEST["name"]);
    $fname = stripslashes($_REQUEST["fname"]);
    $content = stripslashes($_REQUEST["content"]);
    $rewrite_key = strtolower($_REQUEST["rewrite"]);
    $fmtime = $_REQUEST["fmtime"];
    $ssn_acn = $_COOKIE["ssn_acn"];
    /* 2014/10/29 新增 hidden 參數,僅提供建立新目錄功能使用 */
    if (strtoupper($_REQUEST["hidden"]) == YES)
        $hidden = true;
    else
        $hidden = false;

    /* 判斷參數是否正確 */
    if (empty($mode))
        die(EMPTY_MODE);
    if ((($mode == "get_subdir") || ($mode == "get_all_subdir") || ($mode == "copy") || ($mode == "move") || ($mode == "copy_sync") || ($mode == "rename") || ($mode == "del") || ($mode == "set_rec") || ($mode == "read_rec") || ($mode == "del_rec")) && (empty($path)))
        die(EMPTY_PATH);
    if (($mode != "upload_file") && ($mode != "get_code") && ($mode != "get_subdir") && ($mode != "get_all_subdir") && ($mode != "del") && ($mode != "copy") && ($mode != "move") && ($mode != "copy_sync") && (empty($name)))
        die(EMPTY_NAME);
    if ((($mode == "copy") || ($mode == "move") || ($mode == "copy_sync")) && (empty($target_path)))
        die(EMPTY_TARGET_PATH);
    if ($mode != "get_code")
    {
        if (!($mode == "read_rec" && $name == "style_setting") && empty($code))
            die(EMPTY_CODE);
        if (!($mode == "read_rec" && $name == "style_setting") && check_edit_code($code) == false)
            die(ERR_CODE);
        if ((($mode == "create_dir") || ($mode == "new_article") || ($mode == "upload_file") || ($mode == "copy") || ($mode == "move") || ($mode == "copy_sync") || ($mode == "rename")) && (!empty($name)) && (preg_match(FILE_NAME_CHK, $name)))
            die(ERR_NAME);

        $page_dir = WEB_PAGE_DIR;
        $page_url = SITE_URL;
        $path = str_replace("//", "/", "/".$path);
        $path = str_replace("//", "/", $path);
        if(substr($path, 0, 6) == SITE_URL)
            $path = substr($path, 5);

        $path = substr($path, 1);
        if (!is_dir($page_dir))
            die(ERR_DATA_PATH);
        chdir($page_dir);
        if (!empty($path))
        {
            $file_path = $path;
            if (($mode == "copy") || ($mode == "move") || ($mode == "copy_sync"))
            {
                /* 2015/5/8 修改,檢查是否要 rewrite 與 sync */
                $rewrite = false;
                $sync = false;
                if ($rewrite_key == "y")
                    $rewrite = true;
                if ($rewrite_key == "sync")
                {
                    $rewrite = true;
                    $sync = true;
                }
                /* 2015/9/4 修改,增加 rewrite=save 項目,代表若檔名已存在仍要存檔,會建立序號檔名 */
                if ($rewrite_key == "save")
                    $rewrite = "save";

                /* 檢查 file_path 必須是檔案 or 目錄 */
                if ((!is_dir($file_path)) && (!is_file($file_path)))
                    die(ERR_PATH);
                /* copy or move 時,target_path 必須是目錄 */
                if (!is_dir($target_path))
                    die(ERR_TARGET_PATH);
            }
            else if ($mode == "rename")
            {
                if ((!is_dir($file_path)) && (!is_file($file_path)))
                    die(ERR_PATH);
            }
            else
            {
                if (!is_dir($file_path))
                    die(ERR_PATH);
            }
    
            if (($file_path[0] == '/') || (strstr($file_path, "..") == $file_path))
                die(ERR_PATH);
        }
        else
            $file_path = "";
    }
    /* 2015/2/25 新增,檢查 file_list 不可以有 .. 與 / 等資料,若有就直接將 file_list 清空 */
    if ((!empty($file_list)) && ((strstr($file_list, "..") !== false) || (strstr($file_list, "/") !== false)))
        $file_list = "";

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "create_dir":
            create_dir($page_dir, $page_url, $file_path, $name, $dir_type, $hidden);
            break;
        case "create_sync_dir":
            create_sync_dir($page_dir, $page_url, $file_path, $name);
            break;
        case "new_article":
            create_article($page_dir, $page_url, $file_path, $name, $content, $fmtime);
            break;
        case "update_article":
            update_article($page_dir, $page_url, $file_path, $name, $content, $fmtime, $fname);
            break;
        case "read_article":
            read_article($page_dir, $file_path, $name);
            break;
        case "upload_file":
            $type = "new";
            upload_file($type, $page_dir, $page_url, $file_path, $fmtime, $name);
            break;
        case "update_file":
            $type = "update";
            upload_file($type, $page_dir, $page_url, $file_path, $fmtime, $name);
            break;
        case "sync_data_file":
            $type = "sync_data";
            upload_file($type, $page_dir, $page_url, $file_path, $fmtime, $name);
            break;
        case "copy":
        case "move":
        case "copy_sync":
            /* 2015/2/25 修改,增加 file_list 參數 */
            /* 2015/5/8 修改,增加 sync 參數 */
            copy_move_filepath($mode, $page_dir, $page_url, $file_path, $target_path, $rewrite, $sync, $fmtime, $name, $file_list);
            break;
        case "rename":
            rename_filepath($page_dir, $file_path, $name);
            break;
        case "del":
            del_filepath($page_dir, $file_path, $name);
            break;
        case "get_code":
            echo get_edit_code();
            break;
        case "get_subdir":
            get_subdir($page_dir, $file_path);
            break;
        case "get_all_subdir":
            get_subdir($page_dir, $file_path, true);
            break;
        case "set_rec":
            set_rec($page_dir, $file_path, $name, $content);
            break;
        case "read_rec":
            read_rec($page_dir, $file_path, $name);
            break;
        case "del_rec":
            del_rec($page_dir, $file_path, $name);
            break;
        default:
            die(ERR_MODE);
    }
?>
