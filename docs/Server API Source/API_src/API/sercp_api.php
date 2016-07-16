<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $code = $_REQUEST["code"];
    $src_url = $_REQUEST["src_url"];
    $target_url = $_REQUEST["target_url"];
    $src_acn = $_REQUEST["src_acn"];
    $target_acn = $_REQUEST["target_acn"];
    $content = $_REQUEST["content"];
    if (substr($src_url, -1) == "/")
        $src_url = substr($src_url, 0, -1);
    if (substr($target_url, -1) == "/")
        $target_url = substr($target_url, 0, -1);
    $file_list = $_REQUEST["file_list"];
    $sync = $_REQUEST["sync"];

    /* 判斷參數是否正確 */
    if ($mode == "sercp")
    {
        if (empty($target_acn))
            die(EMPTY_TARGET_ACN);
    }
    else if ($mode == "sercp_target")
    {
        if (empty($src_acn))
            die(EMPTY_SRC_ACN);
    }
    else
    {
        if (empty($code))
            die(EMPTY_CODE);
        $info = auth_decode($code);
        if ($info == false)
            die(ERR_CODE);
        list($mode, $my_acn, $s_acn, $arg) = explode(",", $info, 4);
        if (($my_acn != $reg_conf["acn"]) && ($my_acn != $reg_conf["alias"]))
            die(ERR_CODE);
    }
    /* 2015/2/25 新增,檢查 file_list 不可以有 .. 與 / 等資料,若有就直接將 file_list 清空 */
    if ((!empty($file_list)) && ((strstr($file_list, "..") !== false) || (strstr($file_list, "/") !== false)))
        $file_list = "";
    /* 2015/4/15 新增 sync 參數,若為 true 代表要覆蓋舊檔案 (設定檔案版本) */
    if ($sync == YES)
        $sync = true;
    else
        $sync = false;

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        /* 執行 server copy */
        case "sercp":
            /* 檢查參數,src_url 與 target_url 都必須再 /Site/ 內,且 src_url 必須存在 */
            $l = strlen(SITE_URL);
            if (empty($src_url))
                die(EMPTY_SRC_URL);
            if (empty($target_url))
                die(EMPTY_TARGET_URL);
            if (substr($src_url, 0, $l) != SITE_URL)
                die(ERR_SRC_URL);
            if (substr($target_url, 0, $l) != SITE_URL)
                die(ERR_TARGET_URL);
            if (!file_exists(WEB_ROOT_PATH.$src_url))
                die(ERR_SRC_NOT_EXIST);
            /* 若有傳入 content 代表由 Target 來要求執行,content 內容是 nu_code,直接用此參數取得 login_user 資料 */
            if (!empty($content))
            {
                $login_user = get_login_user($content);
                /* 2015/3/19 修改,取消系統管理者檢查 */
                //$is_manager = chk_manager();
                $uid = $login_user["ssn"];
                $uacn = $login_user["acn"];
            }
            /* 2015/2/25 新增,若有傳入 file_list 代表有多筆檔案要處理,需逐一處理 */
            if (!empty($file_list))
            {
                /* src_url 必須是目錄 */
                if (!is_dir(WEB_ROOT_PATH.$src_url))
                    die(ERR_SRC_NOT_EXIST);
                /* 由 file_list 整理出所有要處理檔案再逐一處理 (file_list 中是用逗號隔開多筆資料) */
                $list = explode(",", $file_list);
                $cnt = count($list);
                for ($i = 0; $i < $cnt; $i++)
                {
                    $list[$i] = trim($list[$i]);
                    if (empty($list[$i]))
                        continue;
                    $new_src_url = $src_url."/".$list[$i];
                    /* 若來源檔不存在就跳下一筆 */
                    if (!file_exists(WEB_ROOT_PATH.$new_src_url))
                        continue;
                    /* 執行 sercp 函數進行 server copy 處理 */
                    sercp($new_src_url, $target_url, $target_acn, $sync);
                }
                echo "ok";
                break;
            }

            /* 執行 sercp 函數進行 server copy 處理 */
            $ret = sercp($src_url, $target_url, $target_acn, $sync);
            if ($ret === true)
                echo "ok";
            else
                echo $ret;
            break;

        /* 由 Target 端執行 server copy */
        case "sercp_target":
            /* 檢查參數,src_url 與 target_url 都必須再 /Site/ 內,且 target_url 必須是目錄 */
            $l = strlen(SITE_URL);
            if (empty($src_url))
                die(EMPTY_SRC_URL);
            if (empty($target_url))
                die(EMPTY_TARGET_URL);
            if (substr($src_url, 0, $l) != SITE_URL)
                die(ERR_SRC_URL);
            if (substr($target_url, 0, $l) != SITE_URL)
                die(ERR_TARGET_URL);
            if (!is_dir(WEB_ROOT_PATH.$target_url))
                die(ERR_TARGET_DIR_NOT_EXIST);

            /* 向 Source 端要求執行 server copy 功能 */
            $url = "http://$src_acn.nuweb.cc".SERCP_API."?mode=sercp&src_url=".rawurlencode($src_url)."&target_url=".rawurlencode($target_url)."&target_acn=".$reg_conf["acn"]."&content=".$_COOKIE["nu_code"];
            /* 2015/2/25 修改,若有傳入 file_list 參數,需加到 url 的 file_list 參數中 */
            if (!empty($file_list))
                $url .= "&file_list=$file_list";
            /* 2015/4/15 修改,若 sync 為 true 就在 url 參數加入 sync=Y */
            if ($sync == true)
                $url .= "&sync=".YES;
            $msg = "";
            $fp = fopen($url, "r");
            flock($fp, LOCK_SH);
            while($buf = @fgets($fp, MAX_BUFFER_LEN))
                $msg .= $buf;
            flock($fp, LOCK_UN);
            fclose($fp);
            echo $msg;
            break;

        /* 檢查是否可上傳 */
        case "chk_upload":
            /* 檢查參數 */
            if (empty($arg))
                die(ERR_CODE);
            list($name, $src_name) = explode(":", $arg);
            if ((empty($name)) || (empty($src_name)))
                die(ERR_CODE);
            if (empty($content))
                die(EMPTY_CONTENT);
            if (empty($target_url))
                die(EMPTY_TARGET_URL);
            $l = strlen(SITE_URL);
            if (substr($target_url, 0, $l) != SITE_URL)
                die(ERR_TARGET_URL);

            /* content 參數傳入的是 nu_code,直接用此參數取得 login_user 資料,並檢查是否為系統管理者 */
            $login_user = get_login_user($content);
            /* 2015/3/19 修改,取消系統管理者檢查 */
            //$is_manager = chk_manager();
            $uid = $login_user["ssn"];
            $uacn = $login_user["acn"];

            /* 檢查檔案名稱是否已存在目標目錄中,若已存在就回傳錯誤訊息 */
            $target_path = WEB_ROOT_PATH.$target_url."/".$src_name;
            if ((file_exists($target_path)) || (($f_path = filename_exists(WEB_PAGE_DIR, substr($target_url, $l), $name)) !== false))
            {
                /* 2015/4/15 修改,若 sync 不為 true 就直接回傳錯誤訊息 */
                if ($sync !== true)
                    die(ERR_TARGET_EXIST);
                /* 若是 target_path 已存在且不是目錄,就將檔案設定到新版本,否則就將檔案丟到垃圾桶 */
                if (file_exists($target_path))
                {
                    if (!is_dir($target_path))
                        set_file_ver($target_path);
                    else
                        $f_path = str_replace(WEB_PAGE_DIR, "", $target_path);
                }
                if ($f_path !== false)
                    set_trash(WEB_PAGE_DIR.$f_path);
            }

            /* 檢查並回傳是否有上傳權限 */
            echo chk_upload_right(WEB_PAGE_DIR, substr($target_url, $l));
            break;

        /* 依據傳入的 copy list,由 Target 端向 Source 端下載所有要 copy 的檔案 */
        case "sercp_list":
            /* 由 content 整理出 copy list */
            if (empty($content))
                die(EMPTY_CONTENT);
            $sercp_list = json_decode(StripSlashes($content), true);
            $cnt = count($sercp_list);
            //$err_msg = NULL;
            $src_list = NULL;
            $target_list = NULL;
            $n = 0;
            for ($i = 0; $i < $cnt; $i++)
            {
                /* 若是目錄就檢查是否已存在,若不存在就建立 */
                if ($sercp_list[$i]["type"] == "D")
                {
                    if (!is_dir($sercp_list[$i]["target_path"]))
                        mkdir($sercp_list[$i]["target_path"]);
                    /* 更新目錄的時間 */
                    touch($sercp_list[$i]["target_path"], $sercp_list[$i]["mtime"]);
                    continue;
                }
                $src_list[$n] = $sercp_list[$i]["src_path"];
                $target_list[$n] = $sercp_list[$i]["target_path"];
                $n++;
                touch($sercp_list[$i]["target_path"], $sercp_list[$i]["mtime"]);
                /* 若是檔案就向 Source 端要求下載,並儲存到目的檔中 */
                //$sercp_code = get_sercp_code("sercp_file", $s_acn, $sercp_list[$i]["src_path"]);
                //$url = "http://$s_acn.nuweb.cc".SERCP_API."?code=$sercp_code";
                //$fp1 = fopen($url, "r");
                //if ($fp1 == false)
                //{
                //    $err_msg .= "Error: ".$sercp_list[$i]["src_path"]." fail!\n";
                //    continue;
                //}
                //flock($fp1, LOCK_SH);
                //$fp2 = fopen($sercp_list[$i]["target_path"], "w");
                //flock($fp2, LOCK_EX);
                //while($buf = @fgets($fp1, MAX_BUFFER_LEN))
                //    fputs($fp2, $buf);
                //flock($fp1, LOCK_UN);
                //fclose($fp1);
                //flock($fp2, LOCK_UN);
                //fclose($fp2);
                /* 更新檔案時間 */
                //touch($sercp_list[$i]["target_path"], $sercp_list[$i]["mtime"]);
            }
            /* 2015/6/4 修改,將所有要 copy 的 file 都下載回來 */
            sercp_all_file($src_list, $target_list, $s_acn);

            /* 整理 target 的相關資料 (第一筆資料都是主要更新的檔案或目錄,所以直接使用此筆資料進行整理) */
            $target_path = $sercp_list[0]["target_path"];
            $target_page_path = str_replace(WEB_PAGE_DIR, "", $target_path);
            $src_dir_url = str_replace(WEB_ROOT_PATH, "", substr($sercp_list[0]["src_path"], 0, strrpos($sercp_list[0]["src_path"], "/")+1));
            $target_dir_url = str_replace(WEB_ROOT_PATH, "", substr($target_path, 0, strrpos($target_path, "/")+1));
            $target_url = str_replace(WEB_ROOT_PATH, "", $target_path);

            if ($sercp_list[0]["type"] == "D")
            {
                $modify_type = "dir";
                /* 更新 copy 後所有 HTML 網頁內的 link 與功能目錄設定 */
                update_move_html_dir_config(WEB_PAGE_DIR, $src_dir_url, $target_dir_url, $target_path);
                /* 更新目錄內所有 record */
                /* 2015/4/24 修改,增加傳入 clean_cnt 與 sync 參數,clean_cnt 為 true 代表要清空 cnt 資料,sync 為 true,代表不變更 time 與 mtime 欄位資料 */
                update_copy_move_rec(WEB_PAGE_DIR, $target_page_path, true, $sync);
            }
            else
            {
                $modify_type = "file";
                /* 若是 HTML 檔案需要調整網頁內的 Link */
                $fe = strtolower(substr($target_path, strrpos($target_path, '.')));
                if ($fe_type[$fe] == HTML_TYPE)
                {
                    /* 更新網頁內的 link */
                    update_move_file_content($target_path, $src_dir_url, $target_dir_url);

                    /* 更新 record 內的 link (主要是更新 images 欄位) */
                    $rec_file = get_file_rec_path($target_path);
                    if ($rec_file !== false)
                        update_move_file_content($rec_file, $src_dir_url, $target_dir_url);
                }

                /* 更新檔案 record */
                /* 2015/4/24 修改,增加傳入 clean_cnt 與 sync 參數,clean_cnt 為 true 代表要清空 cnt 資料,sync 為 true,代表不變更 time 與 mtime 欄位資料 */
                write_def_record(WEB_PAGE_DIR, $target_page_path, NULL, true, NULL, false, false, true, $sync);
            }

            /* 重新更新所有檔案與目錄的時間 (因前面處理流程可能造成 mtime 被變更) */
            for ($i = 0; $i < $cnt; $i++)
                touch($sercp_list[$i]["target_path"], $sercp_list[$i]["mtime"]);

            /* 更新使用空間 */
            update_use_space(WEB_PAGE_DIR, $target_page_path, MODE_ADD);

            /* 檢查並上傳動態 share record (將搬移後的檔案設為 new) */
            upload_dymanic_share_rec(WEB_PAGE_DIR, $target_page_path, "new");

            /* 記錄 upload log */
            write_upload_log($target_url, "copy");

            /* 紀錄到 modify.list 中 */
            write_modify_list("new", $target_path, $modify_type);

            /* 傳回結果 */
            if (!empty($err_msg))
                echo $err_msg;
            else
                echo "ok";
            break;

        /* 將檔案以下載模式輸出 (提供 Target 端下載) */
        case "sercp_file":
            $path = $arg;
            if (!file_exists($path))
                return false;
            $filename = substr($path, strrpos($path, "/") + 1);
            header("Content-type: application/force-download");
            header("Content-Disposition: attachment; filename=\"$filename\"");
            header("Content-Transfer-Encoding: binary");
            header("Last-Modified: ".gmdate("D, d M Y H:i:s", filemtime($path))." GMT");
            $fsize = real_filesize($path);
            header("Content-Length: $fsize");
            readfile_chunked($path);
            break;

        /* 2015/6/4 新增,將所有要下載的檔案全部輸出 */
        case "sercp_all_file":
            /* 由 content 整理出 copy list */
            if (empty($content))
                die(EMPTY_CONTENT);
            $list = json_decode(StripSlashes($content), true);
            $cnt = count($list);
            for ($i = 0; $i < $cnt; $i++)
            {
                $fsize = real_filesize($list[$i]);
                echo $fsize."\n";
                readfile_chunked($list[$i]);
                echo "\n";
            }
            break;

        /* 2015/6/16 新增,通知 Target 端進行抓取所有檔案 */
        case "fetch_all_file":
            /* 檢查參數,src_url 與 target_url 都必須再 /Site/ 內,且 target_url 必須是目錄 */
            $l = strlen(SITE_URL);
            if (empty($src_url))
                die(EMPTY_SRC_URL);
            if (empty($target_url))
                die(EMPTY_TARGET_URL);
            if (substr($src_url, 0, $l) != SITE_URL)
                die(ERR_SRC_URL);
            if (substr($target_url, 0, $l) != SITE_URL)
                die(ERR_TARGET_URL);
            $target_dir = WEB_ROOT_PATH.$target_url;
            if (!is_dir($target_dir))
                die(ERR_TARGET_DIR_NOT_EXIST);
            fetch_all_file($src_url, $target_dir, $s_acn);

            /* 2015/6/30 新增,整理 target 的相關資料 */
            $n = strrpos($src_url, "/");
            $src_filename = substr($src_url, $n+1);
            $src_dir_url = strrpos($src_url, 0, $n+1);
            $target_path = $target_dir."/".$src_filename;
            $target_page_path = str_replace(WEB_PAGE_DIR, "", $target_path);
            $target_dir_url = $target_url;
            $target_url = $target_dir_url."/".$src_filename;
            if (is_dir($target_path))
            {
                $modify_type = "dir";
                /* 更新 copy 後所有 HTML 網頁內的 link 與功能目錄設定 */
                update_move_html_dir_config(WEB_PAGE_DIR, $src_dir_url, $target_dir_url, $target_path);
                /* 更新目錄內所有 record (傳入 clean_cnt 與 sync 參數,clean_cnt 為 true 會清空 cnt 資料,sync 為 true 就不變更 time 與 mtime 欄位資料) */
                update_copy_move_rec(WEB_PAGE_DIR, $target_page_path, true, $sync);
            }
            else
            {
                $modify_type = "file";
                /* 若是 HTML 檔案需要調整網頁內的 Link */
                $fe = strtolower(substr($target_path, strrpos($target_path, '.')));
                if ($fe_type[$fe] == HTML_TYPE)
                {
                    /* 更新網頁內的 link */
                    update_move_file_content($target_path, $src_dir_url, $target_dir_url);

                    /* 更新 record 內的 link (主要是更新 images 欄位) */
                    $rec_file = get_file_rec_path($target_path);
                    if ($rec_file !== false)
                        update_move_file_content($rec_file, $src_dir_url, $target_dir_url);
                }

                /* 更新檔案 record (傳入 clean_cnt 與 sync 參數,clean_cnt 為 true 會清空 cnt 資料,sync 為 true 就不變更 time 與 mtime 欄位資料) */
                write_def_record(WEB_PAGE_DIR, $target_page_path, NULL, true, NULL, false, false, true, $sync);
            }

            /* 更新使用空間 */
            update_use_space(WEB_PAGE_DIR, $target_page_path, MODE_ADD);

            /* 檢查並上傳動態 share record (將搬移後的檔案設為 new) */
            upload_dymanic_share_rec(WEB_PAGE_DIR, $target_page_path, "new");

            /* 記錄 upload log */
            write_upload_log($target_url, "copy");

            /* 紀錄到 modify.list 中 */
            write_modify_list("new", $target_path, $modify_type);

            /* 傳回結果 */
            echo "ok";

            break;            

        case "get_all_file":
            /* 檢查參數 */
            if (empty($arg))
                die(ERR_CODE);
            $src_path = WEB_ROOT_PATH.$arg;
            if (substr($src_path, -1) == "/")
                $src_path = substr($src_path, 0, -1);
            if (!file_exists($src_path))
                return false;
            $src_dir = substr($src_path, 0, strrpos($src_path, "/")+1);
            $list = get_sercp_src_list($src_path);
            if (($list == false) || (empty($list)) || (!is_array($list)))
                return false;
            $cmd = "cd $src_dir ; tar -cf - ".implode(" ", $list);
            $fp = popen($cmd, "r");
            while (!feof($fp))
            {
                $buffer = fread($fp, MAX_BUFFER_LEN);
                echo $buffer;
            }
            pclose($fp);
            break;

        default:
            die(ERR_MODE);
    }
?>
