<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
	// whee odb
	require_once("/data/HTTPD/htdocs/tools/rs_odb_lib.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $path = stripslashes($_REQUEST["path"]);
    $name = stripslashes($_REQUEST["name"]);
    $filename = $_REQUEST["filename"];
    $fmtime = $_REQUEST["fmtime"];
    $ssn_acn = $_COOKIE["ssn_acn"];
    /* 2015/1/27 新增 sd (send_dymanic) 參數,若為 NO 代表不送動態訊息 (預設為傳送) */
    $sd = ((isset($_REQUEST["sd"])) && ($_REQUEST["sd"] == NO)) ? false : true;
    /* 2015/4/29 新增 url 參數 */
    $url = $_REQUEST["url"];

    /* 判斷參數是否正確 */
    if (empty($mode))
    {
        if ($_SERVER["CONTENT_LENGTH"] > 134217700)
            die(ERR_UPLOAD_INI_SIZE);
        else
            die(EMPTY_MODE);
    }
    if (empty($path))
        die(EMPTY_PATH);
    if (($mode == "update_file") && (empty($name)))
        die(EMPTY_NAME);
    if ((!empty($filename)) && (preg_match(FILE_NAME_CHK, $filename)))
        die(ERR_FILENAME);
    /* 2015/4/29 新增,增加 mode=fetch_file 功能,代表要抓取檔案,必須傳入 filename 與 url 參數 */
    if ($mode == "fetch_file")
    {
        if (empty($filename))
            die(EMPTY_FILENAME);
        if (empty($url))
            die(EMPTY_URL);
        if ((substr($url, 0, 7) !== "http://") && (substr($url, 0, 8) !== "https://"))
            die(ERR_URL);
    }

    /* 設定資料儲存目錄位置 */
    $page_dir = WEB_PAGE_DIR;
    $page_url = SITE_URL;
    if (!is_dir($page_dir))
        die(ERR_DATA_PATH);

    /* 檢查檔案存放目錄是否正確,path 不可從 / 開始,也不可有 .. */
    chdir($page_dir);
    $path = str_replace("//", "/", "/".$path);
    $path = str_replace("//", "/", $path);
    if(substr($path, 0, 6) == SITE_URL){
        $path = substr($path, 5);
    }
    $path = substr($path, 1);
    $file_path = $path;
    if (!is_dir($file_path))
        die(ERR_PATH);
    if (($file_path[0] == '/') || (strstr($file_path, "..") == $file_path))
        die(ERR_PATH);
    $file_path = str_replace("//", "/", $file_path."/");

    /* 檢查目前網站使用空間是否超出 quota,若已超出就不可上傳資料 */
    list($site_acn, $other) = explode("/", $file_path, 2);
    $status = chk_site_quota($site_acn);
    if ($status === QUOTA_OVER)
        die(ERR_QUOTA_OVER);
    if ($status === SYSTEM_QUOTA_OVER)
        die(ERR_SYSTEM_QUOTA_OVER);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "upload_file":
            $type = "new";
            upload_file($type, $page_dir, $page_url, $file_path, $fmtime, $filename, $sd);
            break;
        case "update_file":
            $type = "update";
            upload_file($type, $page_dir, $page_url, $file_path, $fmtime, $name, $sd);
            break;
        /* 2015/4/29 新增 mode=fetch_file 功能 */
        case "fetch_file":
            fetch_file($page_dir, $page_url, $file_path, $filename, $url, $fmtime, $sd);
            break;
        default:
            die(ERR_MODE);
    }

    /************/
    /*  函數區  */
    /************/

    /* 上傳檔案 */
    function upload_file($type, $page_dir, $page_url, $file_path, $fmtime="", $name="", $sd=true)
    {
        /* 檢查上傳權限 */
        if ($type == "update")
            $u_right = chk_upload_right($page_dir, $file_path.$name);
        else
            $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 若 type = update 先取得儲存的 filename */
        if ($type == "update")
        {
            $file = $file_path.$name;
            if (!is_file($file))
                die(ERR_FILE_NOT_EXIST);
            $page_filename = get_file_name($page_dir, $file);

            /* 先取出原檔案的使用空間 */
            //$src_size = get_use_space($page_dir.$file);
            $src_size = real_filesize($page_dir.$file);
        }
        else
            $src_size = 0;

        /* 檢查是否為 Firefox 上傳 */
        if ((isset($_GET['qqfile'])) || (isset($_GET['file'])))
        {
            /* 把上傳檔案內容先存到暫存檔中 */
            $input = fopen("php://input", "r");
            $tmp_fp = tmpfile();
            $realSize = stream_copy_to_stream($input, $tmp_fp);
            fclose($input);

            /* 檢查 size 是否正確 */
            if ($realSize != (int)$_SERVER["CONTENT_LENGTH"])
                die(ERR_UPLOAD_FILE_SIZE);

            /* type = new 要取得儲存的 filename */
            if ($type == "new")
            {
                if (!empty($name))
                    $page_filename = $name;
                else if (isset($_GET['qqfile']))
                    $page_filename = $_GET['qqfile'];
                else
                    $page_filename = $_GET['file'];
                /* 先檢查檔案是否已存在 */
                if (filename_exists($page_dir, $file_path, $page_filename) != false)
                    die(ERR_FILE_EXIST);
                /* 建立空的新檔案 */
                $file = new_file($page_dir, $file_path, $page_filename);
                if ($file == false)
                    die(ERR_UPLOAD_FILE);
            }

            /* type = update 時要先刪除舊的目的檔 (要先確認上傳檔案正確才能刪除) */
            if ($type == "update")
            {
                /* 將原本的檔案建立新版本 */
                set_file_ver($file);
                unlink($file);
            }

            /* 將暫存檔指標移到最前面 (要儲存目的檔時才能正確取得資料) */
            fseek($tmp_fp, 0, SEEK_SET);

            /* 將上傳的檔案儲存到目的檔中 */
            $fp = fopen($file, "w");
            stream_copy_to_stream($tmp_fp, $fp);
            fclose($fp);
        }
        else
        {
            if (isset($_FILES["qqfile"]))
                $file_point = $_FILES["qqfile"];
            else
                $file_point = $_FILES["file"];
            switch ($file_point["error"])
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

            /* type = new 要取得儲存的 filename */
            if ($type == "new")
            {
                if (!empty($name))
                    $page_filename = $name;
                else
                    $page_filename = $file_point["name"];
                /* 先檢查檔案是否已存在 */
                if (filename_exists($page_dir, $file_path, $page_filename) != false)
                    die(ERR_FILE_EXIST);
                /* 建立空的新檔案 */
                $file = new_file($page_dir, $file_path, $page_filename);
                if ($file == false)
                    die(ERR_UPLOAD_FILE);
            }

            /* type = update 時要先刪除舊的目的檔 (要先確認上傳檔案正確才能刪除) */
            if ($type == "update")
            {
                /* 將原本的檔案建立新版本 */
                set_file_ver($file);
                unlink($file);
            }

            /* 將上傳的檔案儲存到目的檔中 */
            if (!move_uploaded_file($file_point["tmp_name"], $file))
                die(ERR_UPLOAD_FILE);
        }

        /* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
        if (!empty($fmtime))
            touch($page_dir.$file, $fmtime);

	// *** whee odb ***
	// odb 已經存在, 不須要在轉換了
	$read_file = $page_dir.$file;
	if (!odb_api_upload_file_chk_exists($read_file))
	{
		/* 檢查是否為 video 檔,若是就進行轉 flv 檔 */
		chk_video_file($page_dir, $file);

		/* 檢查是否為 image 檔,若是就建立縮圖 */
		set_img_tn($page_dir, $file);

		/* 20150503 新增,檢查是否為 Audio 檔,若是就轉出 mp3 檔案 */
		audio2mp3($page_dir.$file);

		/* 2014/9/9 取消,改由 modify.list 紀錄進行處理 */
		/* 檢查是否為文件檔,若是就轉出 pdf 檔 */
		//chk_doc_file($page_dir, $file);
	}

        /* 建立檔案的 record 檔 */
        write_def_record($page_dir, $file, $page_filename, true);

        /* 更新使用的空間 */
        update_use_space($page_dir, $file, MODE_UPDATE, $src_size);

        /* 檢查並上傳動態 share record */
        if ($sd !== false)
            upload_dymanic_share_rec($page_dir, $file, $type);

        /* 記錄 upload log */
        if ($type == "update")
            $mode = $type;
        else
            $mode = NULL;
        write_upload_log($page_url.$file, $mode);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list($type, $page_dir.$file, "file");

		

		
		// *** whee odb ***
		odb_api_upload_file($read_file, $type);
		
		

        echo $page_url.$file;
    }
 
    /* 抓取檔案 */
    function fetch_file($page_dir, $page_url, $file_path, $filename, $url, $fmtime="", $sd=true)
    {
        /* 檢查上傳權限 */
        $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 先檢查檔案是否已存在 */
        if (filename_exists($page_dir, $file_path, $filename) != false)
            die(ERR_FILE_EXIST);
        /* 建立空的新檔案 */
        $file = new_file($page_dir, $file_path, $filename);
        if ($file == false)
            die(ERR_FETCH_FILE);

        /* 使用 curl 抓取檔案內容儲存到目的檔中 */
        $content = get_url_by_curl($url);
        if (($content == false) || (empty($content)))
        {
            unlink($page_dir.$file);
            die(ERR_FETCH_FILE);
        }
        $fp = fopen($page_dir.$file, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $content);
        flock($fp, LOCK_UN);
        fclose($fp);

        /* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
        if (!empty($fmtime))
            touch($page_dir.$file, $fmtime);

	// *** whee odb ***
	// odb 已經存在, 不須要在轉換了
	$read_file = $page_dir.$file;
	if (!odb_api_upload_file_chk_exists($read_file))
	{
		/* 檢查是否為 video 檔,若是就進行轉 flv 檔 */
		chk_video_file($page_dir, $file);

		/* 檢查是否為 image 檔,若是就建立縮圖 */
		set_img_tn($page_dir, $file);

		/* 20150503 新增,檢查是否為 Audio 檔,若是就轉出 mp3 檔案 */
		audio2mp3($page_dir.$file);

		/* 2014/9/9 取消,改由 modify.list 紀錄進行處理 */
		/* 檢查是否為文件檔,若是就轉出 pdf 檔 */
		//chk_doc_file($page_dir, $file);
	}

        /* 建立檔案的 record 檔 */
        write_def_record($page_dir, $file, $filename, true);

        /* 更新使用的空間 */
        update_use_space($page_dir, $file);

        /* 檢查並上傳動態 share record */
        if ($sd !== false)
            upload_dymanic_share_rec($page_dir, $file, "new");

        /* 記錄 upload log */
        write_upload_log($page_url.$file);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list($type, $page_dir.$file, "file");

        echo $page_url.$file;
    }
?>
