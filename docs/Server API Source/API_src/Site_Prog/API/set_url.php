<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    define("EMPTY_URL", "Error: empty url!");
    define("EMPTY_NAME", "Error: empty name!");
    define("EMPTY_FILE", "Error: empty file!");
    define("ERR_NAME", "Error: name error!");
    define("ERR_URL_FILE_NOT_FOUND", "Error: url file not found!");
    define("ERR_CRT_URL_FILE", "Error: create url file is fails!");

    $mode = $_REQUEST["mode"];
    $path = stripslashes($_REQUEST["path"]);
    $url = stripslashes($_REQUEST["url"]);
    $name = stripslashes($_REQUEST["name"]);
    $file = stripslashes($_REQUEST["file"]);
    $description = str_replace("\n", "<br>", stripslashes($_REQUEST["description"]));
    $tag = stripslashes($_REQUEST["tag"]);
    $img_url = stripslashes($_REQUEST["img_url"]);
    $img_data = stripslashes($_REQUEST["img_data"]);

    /* 檢查參數是否正確 */
    if (empty($path))
        die(EMPTY_PATH);
    if (empty($url))
        die(EMPTY_URL);
    if (substr($path, -1) != "/")
        $path .= "/";
    $dir = WEB_PAGE_DIR.$path;
    if ((!is_dir($dir)) || (strstr($path, "../") != false))
        die(ERR_NO_PATH);
    if ($mode != "update")
    {
        $mode = "new";
        if (empty($name))
            die(EMPTY_NAME);
        if (preg_match(FORMAT_FAIL_FILE_NAME, $name))
            die(ERR_NAME);
    }
    else
        if (empty($file))
            die(EMPTY_FILE);
    /* 若有傳入 name 就整理出真實檔名 (需加上 .url 副檔名) */
    $real_file_name = "";
    $title = "";
    if (!empty($name))
    {
        if (substr($name, -4) !== ".url")
        {
            $real_file_name = $name.".url";
            $title = $name;
        }
        else
        {
            $real_file_name = $name;
            $title = substr($name, 0, -4);
        }
    }

    /* 檢查是否有上傳權限 */
    $u_right = chk_upload_right(WEB_PAGE_DIR, $path);
    if ($u_right != PASS)
        die(ERR_NO_PERMISSION);

    /* 依據 mode 進行不同處理 */
    switch($mode)
    {
        case "new":
            /* 真實檔名必須加上 .url 的副檔名,建立新的 Link 檔,並取得路徑資料 */
            $real_file_name = $name.".url";
            $url_path = new_file(WEB_PAGE_DIR, $path, $real_file_name);
            $url_file = WEB_PAGE_DIR.$url_path;
            if ($url_path === false)
                die(ERR_CRT_URL_FILE);
            break;

        case "update":
            /* 取得 Link 檔路徑資料與真實檔名 */
            $url_file = $dir.$file;
            $url_path = $path.$file;
            if (!file_exists($url_file))
                die(ERR_URL_FILE_NOT_FOUND);
            if (empty($real_file_name))
            {
                $real_file_name = get_file_name(WEB_PAGE_DIR, $url_path);
                $title = substr($real_file_name, 0, -4);
            }
            break;
    }

    /* 整理縮圖 */
    $thumbs_file = false;
    if (!empty($img_data))
        $thumbs_file = get_url_thumbs($url_file, $img_data);
    else if (!empty($img_url))
        $thumbs_file = get_url_thumbs($url_file, NULL, $img_url);
    /* 2015/8/14 新增,檢查 url 若開頭不是 / 且不是 http:// 或 https:// 就加上 http:// */
    if (($url[0] !== "/") && (substr($url, 0, 7) !== "http://") && (substr($url, 0, 8) !== "https://"))
        $url = "http://$url";
    /* 儲存 url 擋 */
    $fp = fopen($url_file, "w");
    flock($fp, LOCK_EX);
    fputs($fp, "[InternetShortcut]\n");
    fputs($fp, "URL=$url\n");
    fputs($fp, "title=$title\n");
    fputs($fp, "description=$description\n");
    fputs($fp, "tag=$tag\n");
    if ($thumbs_file !== false)
    {
        if (file_exists($thumbs_file))
        {
            $n = strrpos($thumbs_file, "/");
            $thumbs_name = substr($thumbs_file, $n+1);
        }
        else
            $thumbs_name = "";
        fputs($fp, "thumbs=$thumbs_name\n");
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    write_def_record(WEB_PAGE_DIR, $url_path, $real_file_name, true);
    /* 2015/1/9 新增,上傳動態訊息並記錄到 upload_log 中 */
    upload_dymanic_share_rec(WEB_PAGE_DIR, $url_path, "new");
    write_upload_log(PAGE_URL.$url_path);
    /* 2014/9/6 新增,紀錄到 modify.list 中 */
    write_modify_list($mode, $url_file, "file");
    echo str_replace(WEB_ROOT_PATH, "", $url_file);

    /**********/
    /* 函數區 */
    /**********/

    function get_url_thumbs($url_file, $img_data=NULL, $img_url=NULL)
    {
        /* url_file 不可為空的,img_data 與 img_url 不可同時為空的 */
        if ((empty($url_file)) || ((empty($img_data)) && (empty($img_url))))
            return false;
        $thumbs_file = $url_file.TN_FE_NAME;

        /* 若 img_data 內容為 del 代表要刪除縮圖檔 */
        if ($img_data == "del")
        {
            unlink($thumbs_file);
            return NULL;
        }

        $thumbs_file = $url_file.TN_FE_NAME;
        $tmp_img_file = tempnam(NUWEB_TMP_DIR, "img_");
        $tmp_thumbs_file = $tmp_img_file.TN_FE_NAME;

        /* 處理 img_data */
        $img_content = "";
        if (!empty($img_data))
        {
            list($img_header, $img_base64) = explode(",", $img_data, 2);
            if ((substr($img_header, 0, 11) !== "data:image/") || (substr($img_header, -6) !== "base64"))
                $img_base64 = $img_data;
            $img_content = base64_decode($img_base64);
        }

        /* 處理 img_url (必須 img_data 為空的時才處理,否則已 img_data 為主) */
        /* 2015/3/9 修改,改用 curl 抓取圖檔 (原方式抓 https:// 的圖片會有問題) */
        if ((!empty($img_url)) && (empty($img_data)))
            $img_content = get_url_by_curl($img_url);
            //$img_content = file_get_contents($img_url);
        if (empty($img_content))
        {
            unlink($tmp_img_file);
            return false;
        }
        $fp = fopen($tmp_img_file, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $img_content);
        flock($fp, LOCK_UN);
        fclose($fp);

        if (!file_exists($tmp_img_file))
            return false;
        extract_tn($tmp_img_file);
        if ((file_exists($tmp_thumbs_file)) && (real_filesize($tmp_img_file) > 0))
            rename($tmp_thumbs_file, $thumbs_file);
        else
        {
            if (file_exists($tmp_thumbs_file))
                unlink($tmp_thumbs_file);
            unlink($tmp_img_file);
            return false;
        }
        unlink($tmp_img_file);
        return $thumbs_file;
    }
?>
