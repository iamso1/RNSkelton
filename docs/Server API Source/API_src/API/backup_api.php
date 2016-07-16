<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $path = $_REQUEST["path"];
    $keep_name = $_REQUEST["keep_name"];
    $mtime = $_REQUEST["mtime"];
    $file = $_FILES["file"];

    /* 檢查 backup_mode 除了 mode=get_file 時必須是 BACKUP_SOURCE 其餘都必須是 BACKUP_TARGET */
    $backup_mode = get_backup_mode();
    if ($mode == "get_file")
    {
        if ($backup_mode !== BACKUP_SOURCE)
            exit;
    }
    else if ($backup_mode !== BACKUP_TARGET)
        exit;

    /* 檢查參數 */
    if (empty($mode))
        die(EMPTY_MODE);
    if (($mode != "upload_tgz") && (empty($path)))
        die(EMPTY_PATH);
    /* 若有傳入檔案,就檢查是否有問題 */
    if (isset($_FILE["file"]))
    {
        switch ($_FILE["file"]["error"])
        {
            case UPLOAD_ERR_OK:            /* 沒有錯誤 */
                break;
            case UPLOAD_ERR_INI_SIZE:
                die(ERR_UPLOAD_INI_SIZE);
            case UPLOAD_ERR_FORM_SIZE:
                die(ERR_UPLOAD_FORM_SIZE);
            case UPLOAD_ERR_PARTIAL:
                die(ERR_PARTIAL);
            case UPLOAD_ERR_NO_FILE:
                die(ERR_NO_FILE);
            case UPLOAD_ERR_NO_TMP_DIR:
                die(ERR_UPLOAD_NO_TMP_DIR);
            case UPLOAD_ERR_CANT_WRITE:
                die(ERR_UPLOAD_CANT_WRITE);
            case UPLOAD_ERR_EXTENSION:
                die(ERR_EXTENSION);
            default:
                die(ERR_UPLOAD_OTHER);
        }
    }
    /* 目前僅能處理 /data/ 內的資料 */
    if ((!empty($path)) && (substr($path, 0, 6) !== "/data/"))
        die(ERR_PATH);
    $p_item = explode("/", substr($path, 6));
    $p_cnt = count($p_item);
    $page_dir = WEB_PAGE_DIR;
    $l = strlen($page_dir);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "set_keep":
            if (substr($path, -1) == "/")
                $path = substr($path , 0, -1);
            $n = strrpos($path, "/");
            $file = substr($path, $n+1);
            $dir = substr($path, 0, $n);
            $cmd = "cd $dir ; tar cfz /home/nuweb/$keep_name.tgz $file";
            $fp = popen($cmd, "r");
            pclose($fp);
            break;

        case "receive_keep":
            if (substr($path, -1) == "/")
                $path = substr($path , 0, -1);
            $n = strrpos($path, "/");
            $file = substr($path, $n+1);
            $dir = substr($path, 0, $n);
            $cmd = "cd $dir ; tar xzfp /home/nuweb/$keep_name.tgz ; rm -f /home/nuweb/$keep_name.tgz";
            $fp = popen($cmd, "r");
            pclose($fp);
            break;

        case "upload_tgz":
            /* 將上傳的壓縮檔進行解壓縮 (直接解壓縮到 /data/ 中),再刪除上傳的壓縮檔 */
            $tmp_file = $file["tmp_name"];
            untar_tgz_file($tmp_file);
            unlink($tmp_file);
            break;

        case "upload_file":
            /* 檢查 path 路徑中是否有目錄尚未建立,若有就先建立好目錄位置 */
            $now_path = "/data/";
            $dir_cnt = $p_cnt - 1;
            for ($i = 0; $i < $dir_cnt; $i++)
            {
                $now_path .= $p_item[$i]."/";
                if ((!is_dir($now_path)) && (mkdir($now_path) === false))
                    return false;
            }
            /* 將檔案存入 */
            move_uploaded_file($file["tmp_name"], $path);
            /* 若有傳 mtime 參數,就設定檔案的 mtime */
            if (!empty($mtime))
                touch($path, $mtime);
            break;

        case "download_file":
            /* 檢查 path 路徑中是否有目錄尚未建立,若有就先建立好目錄位置 */
            $now_path = "/data/";
            $dir_cnt = $p_cnt - 1;
            for ($i = 0; $i < $dir_cnt; $i++)
            {
                $now_path .= $p_item[$i]."/";
                if ((!is_dir($now_path)) && (mkdir($now_path) === false))
                    return false;
            }
            /* 整理要下載檔案的 url (因為是 Backup Client,所以 Server 的 acn 與 Source 是相同的) */
            //$url = "http://".$reg_conf["acn"].".nuweb.cc".str_replace(WEB_ROOT_PATH, "", $path);
            $url = "http://".$reg_conf["acn"].".nuweb.cc".BACKUP_API."?mode=get_file&path=".rawurlencode($path);
            $fp1 = fopen($url, "r");
            if ($fp1 == false)
                return false;
            flock($fp1, LOCK_SH);
            $fp2 = fopen($path, "w");
            flock($fp2, LOCK_EX);
            while($buf = @fgets($fp1, MAX_BUFFER_LEN))
                fputs($fp2, $buf);
            flock($fp1, LOCK_UN);
            fclose($fp1);
            flock($fp2, LOCK_UN);
            fclose($fp2);
            /* 若有傳 mtime 參數,就設定檔案的 mtime */
            if (!empty($mtime))
                touch($path, $mtime);
            break;

        case "get_file":
            if (!file_exists($path))
                return false;
            $filename = $p_item[$p_cnt - 1];
            header("Content-type: application/force-download");
            header("Content-Disposition: attachment; filename=\"$filename\"");
            header("Content-Transfer-Encoding: binary");
            header("Last-Modified: ".gmdate("D, d M Y H:i:s", filemtime($path))." GMT");
            $fsize = real_filesize($path);
            header("Content-Length: $fsize");
            readfile_chunked($path);
            exit;

        case "del":
            if (!file_exists($path))
                return false;
            /* 2014/9/10 修改,mode=del 時僅可刪除檔案或 symlink,不可刪除目錄 (避免被刪除重要目錄) */
            if ((is_file($path)) || (is_link($path)))
                unlink($path);
            break;

        case "del_obj_file":
            /* 必須是在 WEB_PAGE_DIR 內,且檔案存在才處理 */
            if ((substr($path, 0, $l) !== $page_dir) || (!file_exists($path)))
                return false;
            /* 整理相關參數再 call del_file 函數 */
            $path = substr($path, $l);
            $n = strrpos($path, "/");
            $file = substr($path, $n+1);
            $path = substr($path, 0, $n);
            del_file($page_dir, $path, $file);
            break;

        case "del_obj_dir":
            /* 必須是在 WEB_PAGE_DIR 內,且目錄存在才處理 */
            if ((substr($path, 0, $l) !== $page_dir) || (!is_dir($path)))
                return false;
            /* 整理 path 參數 */
            if (substr($path, -1) == "/")
                $path = substr($path , 0, -1);
            $path = substr($path, $l);
            /* 若整理後的 path 沒有 / 代表是網站,就 call del_site_dir 函數,否則就是目錄 call del_dir 函數 */
            if (strstr($path, "/") == false)
                del_site_dir($page_dir, $path);
            else
                del_dir($page_dir, $path);
            break;

        default:
            die(ERR_MODE);
    }

    echo "ok";

    /***********/
    /* 函 數 區*/
    /***********/

?>
