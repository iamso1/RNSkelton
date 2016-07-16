<?php
    require_once("API_init.php");
    require_once("/data/HTTPD/htdocs/Admin/init.php");

    define("PASSWD_FILE", "/etc/passwd");
    define("MIN_UID", 1000);
    define("DATA_DIR", "/data/NUMail_Object/");
    define("WAITING_LIST", DATA_DIR."bin/waiting.list");
    define("OBJ_PREFIX", "obj_");
    define("OBJECT_LIST", "object.list");
    define("OBJECT_LOG", "object.log");
    define("MAIL_INFO", "mail.info");
    define("CHUNK_SIZE", 1*(1024*1024));	 // how many bytes per chunk
    define("OBJ_EXIST", "True");
    define("OBJ_NOT_EXIST", "False");
    define("IS_END", "T");
    define("NOT_END", "F");
    define("MODE_VIEW", "view");
    define("MODE_DOWNLOAD", "download");
    define("MODE_PLAY", "play");
    define("TEMPLATE_DIR", "Template/");
    define("IMAGE_VIEWER", TEMPLATE_DIR."image_viewer.tpl");
    define("FLV_PLAYER", TEMPLATE_DIR."flv_player.tpl");
    define("MEDIA_PLAYER", TEMPLATE_DIR."media_player.tpl");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    $PHP_SELF = $_SERVER["SCRIPT_NAME"];

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $account = $_REQUEST["account"];
    $read_mode = $_REQUEST["read_mode"];
    $mail_id = $_REQUEST["mail_id"];
    $obj_name = $_REQUEST["obj_name"];
    $obj_code = $_REQUEST["obj_code"];
    $mail_info = $_REQUEST["mail_info"];
    $start = $_REQUEST["start"];
    $is_end = $_REQUEST["is_end"];
    $block_size = $_REQUEST["block_size"];

    /* 檢查參數 */
    if (empty($mode))
        die(EMPTY_MODE);
    if ((empty($_COOKIE["ssn_acn"])) && ($mode != "read_obj"))
        die(EMPTY_COOKIE);
    else
        list($ssn, $acn) = explode(":", $_COOKIE["ssn_acn"]);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "new_user":
            new_user($ssn, $acn, $account);
            break;
        case "upload_obj":
            upload_obj($acn, $mail_id);
            break;
        case "upload_obj_block":
            upload_obj_block($acn, $mail_id, $block_size, $start, $is_end);
            break;
        case "get_obj_code":
            get_obj_code($acn, $mail_id, $obj_name);
            break;
        case "read_obj":
            read_obj($obj_code, $read_mode);
            break;
        case "get_obj":
            get_obj($acn, $mail_id, $obj_name, $read_mode);
            break;
        case "obj_exists":
            obj_exists($acn, $mail_id, $obj_name);
            break;
        case "get_obj_list":
            get_obj_list($acn, $mail_id);
            break;
        case "set_mail_info":
            set_mail_info($acn, $mail_id, $mail_info);
            break;
        case "get_mail_info":
            get_mail_info($acn, $mail_id);
            break;
        default:
            die(ERR_MODE);
    }

    /************/
    /*  函數區  */
    /************/

    /* 利用片段方式讀取檔案 (可避免 readfile() 無法讀取超過 4GB 檔案的問題) */
    function readfile_chunked($filename, $retbytes=true)
    {
        $buffer = '';
        $cnt = 0;
        $handle = fopen($filename, 'rb');
        if ($handle === false)
            return false;

        while (!feof($handle))
        {
            $buffer = fread($handle, CHUNK_SIZE);
            echo $buffer;
            flush();
            if ($retbytes)
                $cnt += strlen($buffer);
        }
        $status = fclose($handle);
        if ($retbytes && $status)
            return $cnt; // return num. bytes delivered like readfile() does.

        return $status;
    }

    /* 取出 object file 的實際位置 */
    function get_obj_file($acn, $mail_id, $obj_name)
    {
        /* 先找到 object list (object list 不存在代表 object 也不存在) */
        $object_list_file = DATA_DIR.$acn."/".OBJECT_LIST;
        if (!file_exists($object_list_file))
            return false;

        /* 再取出 object 存放的 path */
        $obj_list = @file($object_list_file);
        $obj_cnt = count($obj_list);
        $obj_file = "";
        for ($i = 0; $i < $obj_cnt; $i++)
        {
            /* 將 object list 內容整理出來,內容包括 mail_id, object_name, object_file 等資料 */
            list($m_id, $o_name, $o_file) = explode("\t", trim($obj_list[$i]));
            /* 檢查是否是要找的檔案,若是就傳回檔案位置 */
            if (($m_id == $mail_id) && ($o_name == $obj_name))
                return $o_file;
        }

        return false;
    }

    /* 取出 object name */
    function get_obj_name($acn, $obj_file)
    {
        /* 先找到 object list (object list 不存在代表 object 也不存在) */
        $object_list_file = DATA_DIR.$acn."/".OBJECT_LIST;
        if (!file_exists($object_list_file))
            return false;

        /* 再取出 object 存放的 path */
        $obj_list = @file($object_list_file);
        $obj_cnt = count($obj_list);
        for ($i = 0; $i < $obj_cnt; $i++)
        {
            /* 將 object list 內容整理出來,內容包括 mail_id, object_name, object_file 等資料 */
            list($m_id, $o_name, $o_file) = explode("\t", trim($obj_list[$i]));

            /* 檢查是否是要找的檔案,若是就傳回 object_name */
            if ($o_file == $obj_file)
                return $o_name;
        }

        return false;
    }

    /* 依 read_mode 模式顯示 object 檔案 */
    function output_obj($obj_name, $read_mode, $obj_file)
    {
        Global $PHP_SELF, $fe_type;

        /* 以 play (播放器)方式輸出 */
        if ($read_mode == MODE_PLAY)
        {
            /* 檢查是否已轉出 flv 檔,若已轉出就用 flv 檔輸出,否則使用原始檔輸出 */
            $flv_file = $obj_file.".flv";
            if (file_exists($flv_file))
                readfile_chunked($flv_file);
            else
                readfile_chunked($obj_file);
            return;
        }

        require_once("content_type.php");
        $fe = strtolower(substr($obj_name, strrpos($obj_name, ".")));

        /* 以 view 方式輸出 */
        if ($read_mode == MODE_VIEW)
        {
            /* 檢查檔案為何種 type */
            $f_type = "";

            /* 1. Video */
            if ($fe_type[$fe] == VIDEO_TYPE)
            {
                if (($fe == ".flv") || (file_exists($obj_file.".flv")))
                    $f_type = "flash";
                else
                    $f_type = "multimedia";
            }

            /* 2. Audio */
            if ($fe_type[$fe] == AUDIO_TYPE)
                $f_type = "multimedia";

            /* 3. Image */
            if ($fe_type[$fe] == IMAGE_TYPE)
                $f_type = "image";

            /* 若檔案是 audio 與 video 與 image,就包成 play 方式顯示 */
            if (!empty($f_type))
            {
                /* 由 object_file 取得 Object 相關資訊 */
                list($acn, $mail_id, $file_name) = explode("/", str_replace(DATA_DIR, "", $obj_file));
                /* 取得 object code */
                $obj_code = get_obj_code($acn, $mail_id, $obj_name);
                /* 整理 play 與 download 兩種 url */
                $play_arg = "?mode=read_obj&obj_code=$obj_code&read_mode=play";
                $download_arg = "?mode=read_obj&obj_code=$obj_code&read_mode=download";
                $url = $PHP_SELF.$play_arg;
                $url_encode = $PHP_SELF.rawurlencode($play_arg);
                $download_url = $PHP_SELF.$download_arg;
                $download_url_encode = $PHP_SELF.rawurlencode($download_arg);
                /* 依不同 file type 選擇不同的樣板檔 */
                if ($f_type == "image")
                    $tpl_file = IMAGE_VIEWER;
                if ($f_type == "flash")
                    $tpl_file = FLV_PLAYER;
                if ($f_type == "multimedia")
                    $tpl_file = MEDIA_PLAYER;
                /* 取得樣板檔,並將相關變數資料進行取代,並輸出結果 */
                $tpl = implode("", @file($tpl_file));
                $tpl = str_replace("{url}", $url, $tpl);
                $tpl = str_replace("{url_encode}", $url_encode, $tpl);
                $tpl = str_replace("{download_url}", $download_url, $tpl);
                $tpl = str_replace("{download_url_encode}", $download_url_encode, $tpl);
                $tpl = str_replace("{name}", $obj_name, $tpl);
                echo $tpl;
                return;
            }
            else
            {
                /* 找出對應的 Content_type 輸出 object,若找不到就變強制下載 */
                if (!empty($content_type[$fe]))
                {
                    header("Content-type: ".$content_type[$fe]);
                    header("Content-Disposition: inline; filename=\"".rawurlencode($obj_name)."\"");
                    readfile_chunked($obj_file);
                    return;
                }
            }
        }

        /* 設定強制下載 */
        header("Content-type: application/force-download");
        header("Content-Disposition: attachment; filename=\"".rawurlencode($obj_name)."\"");
        header("Content-Transfer-Encoding: binary");
        readfile_chunked($obj_file);
    }

    /* 檢查是否為 mail server user */
    function check_user($account)
    {
        /* 取得系統的 /etc/passwd 帳號檔 */
        $user_list = @file(PASSWD_FILE);
        $user_cnt = count($user_list);
        for ($i = 0; $i < $user_cnt; $i++)
        {
            /* 檢查 user 帳號是否已存在系統帳號檔中 */
            list($name, $pwd, $uid, $other) = explode(":", trim($user_list[$i]), 4);
            if (($account == $name) && ($uid >= MIN_UID))
                return true;
        }
        return false;
    }

    /* 紀錄 log */
    function write_log($log_file, $msg)
    {
        Global $mode;

        $fp = fopen($log_file, "a");
        fputs($fp, $_SERVER["REMOTE_ADDR"]."\t".date("Y-m-d:H:i:s")."\t".$mode."\t".$msg."\n");
        fclose($fp);
    }

    /* 新增 Mail Object 的 user */
    function new_user($ssn, $acn, $account)
    {
        if (empty($account))
            die(EMPTY_ACCOUNT);

        /* 檢查是否為 mail server user (只有 mail server user 才可使用 Mail Object 功能) */
        if (check_user($account) == false)
            die(ERR_NO_PERMISSION);

        $user_dir = DATA_DIR.$acn."/";
        /* 如果 user 目錄不存在,就建立 user 目錄 */
        if (!is_dir($user_dir))
        {
            if (mkdir($user_dir) == false)
                die(ERR_NEW_USER);
        }

        /* 紀錄 object log */
        $object_log_file = $user_dir.OBJECT_LOG;
        write_log($object_log_file, "ssn=$ssn&acn=$acn&account=$account");

        echo $acn;
    }

    /* 上傳 object */
    function upload_obj($acn, $mail_id)
    {
        Global $fe_type;

        /* 檢查參數 */
        if (empty($mail_id))
            die(EMPTY_MAIL_ID);

        switch ($_FILES["file"]["error"])
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

        /* 檢查 object file 是否已存在 */
        $obj_name = $_FILES["file"]["name"];
        if (get_obj_file($acn, $mail_id, $obj_name) != false)
            die(ERR_OBJ_EXISTS);

        /* 檢查 user 目錄 */
        $user_dir = DATA_DIR.$acn."/";
        if (!is_dir($user_dir))
            die(ERR_USER_DIR);

        /* 檢查 mail object 存放目錄,若不存在就建立 */
        $mail_dir = $user_dir.$mail_id."/";
        if (!is_dir($mail_dir))
        {
            if (mkdir($mail_dir) == false)
                die(ERR_CREATE_MAIL_DIR);
        }

        /* 儲存 object file */
        $obj_file = tempnam($mail_dir, OBJ_PREFIX);
        if (!move_uploaded_file($_FILES["file"]["tmp_name"], $obj_file))
            die(ERR_CREATE_OBJ_FILE);

        /* 紀錄 object list */
        $object_list_file = $user_dir.OBJECT_LIST;
        $fp = fopen($object_list_file, "a");
        fputs($fp, "$mail_id\t$obj_name\t$obj_file\n");
        fclose($fp);

        /* 檢查是否為 Video File (濾掉 .flv 因 flv 檔不必進行轉檔),若是就加到 waiting.list 中,以便進行 flv 轉檔工作 */
        $fe = strtolower(substr($obj_name, strrpos($obj_name, ".")));
        if (($fe_type[$fe] == VIDEO_TYPE) && ($fe != ".flv"))
        {
            $fp = fopen(WAITING_LIST, "a");
            fputs($fp, "$mail_id\t$obj_name\t$obj_file\n");
            fclose($fp);
        }

        /* 取得 object code */
        $obj_code = get_obj_code($acn, $mail_id, $obj_name);
        echo $obj_code;

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id&obj_name=$obj_name\tobj_file=$obj_file,obj_code=$obj_code");
    }

    /* 分段上傳 object (每次只上傳片段) */
    function upload_obj_block($acn, $mail_id, $block_size, $start=0, $is_end=NOT_END)
    {
        Global $fe_type;

        /* 檢查參數 */
        if (empty($mail_id))
            die(EMPTY_MAIL_ID);

        switch ($_FILES["file"]["error"])
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

        /* 檢查 user 目錄 */
        $user_dir = DATA_DIR.$acn."/";
        if (!is_dir($user_dir))
            die(ERR_USER_DIR);

        /* 若上傳 size 與 block_size 不一樣,代表上傳有錯誤 */
        if ($_FILES["file"]["size"] != $block_size)
            die(ERR_BLOCK_SIZE);
        $obj_block = implode("", @file($_FILES["file"]["tmp_name"]));

        $obj_name = $_FILES["file"]["name"];
        $obj_file = get_obj_file($acn, $mail_id, $obj_name);

        /* start = 0 代表是新增的 object file */
        if ($start == 0)
        {
            /* 檢查 object file 是否已存在 */
            if ($obj_file !== false)
                die(ERR_OBJ_EXISTS);

            /* 檢查 mail object 存放目錄,若不存在就建立 */
            $mail_dir = $user_dir.$mail_id."/";
            if (!is_dir($mail_dir))
            {
                if (mkdir($mail_dir) == false)
                    die(ERR_CREATE_MAIL_DIR);
            }

            /* 建立 object file 的檔案(只建立檔案,尚未儲存內容) */
            $obj_file = tempnam($mail_dir, OBJ_PREFIX);
            /* 設定續傳期間的暫存檔 */
            $tmp_file = $obj_file.".tmp";

            /* 紀錄 object list */
            $object_list_file = $user_dir.OBJECT_LIST;
            $fp = fopen($object_list_file, "a");
            fputs($fp, "$mail_id\t$obj_name\t$obj_file\n");
            fclose($fp);
        }

        /* 如果是續傳 (start > 0) */
        if ($start > 0)
        {
            /* 檢查 object file 是否存在 */
            if ($obj_file == false)
                die(ERR_OBJ_FILE);

            /* 檢查續傳期間的暫存檔是否存在 */
            $tmp_file = $obj_file.".tmp";
            if (!file_exists($tmp_file))
                die(ERR_TMP_FILE);
            /* 檢查續傳暫存檔的 size 是否為 start */
            $tmp_size = real_filesize($tmp_file);
            if ($tmp_size != $start)
                die(ERR_START);
        }

        /* 儲存 object block */
        $fp = fopen($tmp_file, "a");
        fputs($fp, $obj_block);
        fclose($fp);
        clearstatcache();

        /* 檢查是否檔案已結束,已結束就將暫存檔轉換成 object file */
        if ($is_end == IS_END)
        {
            if (!rename($tmp_file, $obj_file))
                die(ERR_CREATE_OBJ_FILE);

            /* 檢查是否為 Video File (濾掉 .flv 因 flv 檔不必進行轉檔),若是就加到 waiting.list 中,以便進行 flv 轉檔工作 */
            $fe = strtolower(substr($obj_name, strrpos($obj_name, ".")));
            if (($fe_type[$fe] == VIDEO_TYPE) && ($fe != ".flv"))
            {
                $fp = fopen(WAITING_LIST, "a");
                fputs($fp, "$mail_id\t$obj_name\t$obj_file\n");
                fclose($fp);
            }

            /* 取得 object code */
            $return_value = get_obj_code($acn, $mail_id, $obj_name);
        }
        else
            $return_value = real_filesize($tmp_file);
        echo $return_value;

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id&obj_name=$obj_name&start=$start&is_end=$is_end\tobj_file=$obj_file,return=$return_value");
    }

    /* 取得 obj_code */
    function get_obj_code($acn, $mail_id, $obj_name)
    {
        Global $mode;

        /* 檢查參數 */
        if (empty($mail_id))
            die(EMPTY_MAIL_ID);
        if (empty($obj_name))
            die(EMPTY_OBJ_NAME);

        /* 找到 onject file 位置 */
        $obj_file = get_obj_file($acn, $mail_id, $obj_name);
        /* 如果 object file 不存在,就無法產生 object code */
        if ($obj_file == false)
            die(ERR_GET_OBJ_CODE);

        /* 產生 object code */
        $cmd = AUTH_ENCODE_PROG."\"$acn,$obj_file\"";
        $fp = popen($cmd, "r");
        $obj_code = str_replace("\n", "", fgets($fp, MAX_BUF_LEN));
        pclose($fp);

        /* 紀錄 object log */
        if ($mode == "get_obj_code")
        {
            echo $obj_code;
            $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
            write_log($object_log_file, "acn=$acn&mail_id=$mail_id&obj_name=$obj_name\tobj_file=$obj_file,obj_code=$obj_code");
        }

        return $obj_code;
    }

    /* 讀取 object (提供一般 user 用 obj_code 取得 object,不必提供 cookie) */
    function read_obj($obj_code, $read_mode)
    {
        if (($read_mode != MODE_DOWNLOAD) && ($read_mode != MODE_PLAY))
            $read_mode = MODE_VIEW;

        /* 檢查 object code 格式是否正確 */
        if (!preg_match("/^[0-9a-z]+$/i", $obj_code))
            die(ERR_OBJ_CODE);

        /* 解開 object code 取得 object name & file path */
        $cmd = AUTH_DECODE_PROG.$obj_code;
        $fp = popen($cmd, "r");
        $obj_buf = str_replace("\n", "", fgets($fp, MAX_BUF_LEN));
        pclose($fp);
        list($acn, $obj_file) = explode(",", $obj_buf);
        if (!file_exists($obj_file))
            die(ERR_GET_OBJ_FILE);

        /* 取得 onject name */
        $obj_name = get_obj_name($acn, $obj_file);
        if ($obj_name == false)
            die(ERR_GET_OBJ_NAME);

        /* 輸出 object file 內容 */
        output_obj($obj_name, $read_mode, $obj_file);

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "obj_code=$obj_code&read_mode=$read_mode\tacn=$acn,obj_name=$obj_name,obj_file=$obj_file");
    }

    /* 取得 object (僅提供 owner 取得 object,必須提供 cookie) */
    function get_obj($acn, $mail_id, $obj_name, $read_mode)
    {
        /* 檢查參數 */
        if (empty($mail_id))
            die(EMPTY_MAIL_ID);
        if (empty($obj_name))
            die(EMPTY_OBJ_NAME);
        if (($read_mode != MODE_DOWNLOAD) && ($read_mode != MODE_PLAY))
            $read_mode = MODE_VIEW;

        /* 找到 onject file 位置 */
        $obj_file = get_obj_file($acn, $mail_id, $obj_name);
        if ($obj_file == false)
            die(ERR_GET_OBJ_FILE);

        /* 輸出 object file 內容 */
        output_obj($obj_name, $read_mode, $obj_file);

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id&obj_name=$obj_name\tobj_file=$obj_file");
    }

    /* 檢查 object 是否存在 */
    function obj_exists($acn, $mail_id, $obj_name)
    {
        /* 檢查參數 */
        if (empty($mail_id))
            die(EMPTY_MAIL_ID);
        if (empty($obj_name))
            die(EMPTY_OBJ_NAME);

        /* 找到 onject file 位置 */
        $obj_file = get_obj_file($acn, $mail_id, $obj_name);
        if ($obj_file == false)
            $return_value = OBJ_NOT_EXIST;
        else
        {
            /* 如果 object file 存在,但 size = 0,代表是續傳檔案尚未完成 */
            if (real_filesize($obj_file) > 0)
                $return_value = OBJ_EXIST;
            else
            {
                $tmp_file = $obj_file.".tmp";
                if (file_exists($tmp_file))
                    $return_value = real_filesize($tmp_file);
                else
                    $return_value = 0;
            }
        }
        echo $return_value;

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id&obj_name=$obj_name\tobj_file=$obj_file,return=$return_value");
    }

    /* 取得 object list */
    function get_obj_list($acn, $mail_id="")
    {
        /* 先找到 object list */
        $object_list_file = DATA_DIR.$acn."/".OBJECT_LIST;
        if (!file_exists($object_list_file))
            die(ERR_OBJECT_LIST);
        /* 取出 object list 資料 */
        $obj_list = @file($object_list_file);
        $obj_cnt = count($obj_list);
        $obj_file = "";
        for ($i = 0; $i < $obj_cnt; $i++)
        {
            /* 若有傳入 mail_id,就取出符合 mail_id 的 object list */
            if (!empty($mail_id))
            {
                list($m_id, $o_name, $o_file) = explode("\t", $obj_list[$i]);
                if ($m_id == $mail_id)
                    echo $obj_list[$i];
            }
            else
                echo $obj_list[$i];
        }

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id");
    }

    /* 設定 mail infomation */
    function set_mail_info($acn, $mail_id, $mail_info)
    {
        /* 檢查 mail id 目錄 */
        $mail_dir = DATA_DIR.$acn."/".$mail_id."/";
        if (!is_dir($mail_dir))
            die(ERR_MAIL_DIR);

        /* 將 mail infomation 寫入檔案 */
        $mail_info_file = $mail_dir.MAIL_INFO;
        $fp = fopen($mail_info_file, "w");
        fputs($fp, $mail_info);
        fclose($fp);

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id");
    }

    /* 讀取 mail infomation */
    function get_mail_info($acn, $mail_id)
    {
        /* 檢查 mail id 目錄 */
        $mail_dir = DATA_DIR.$acn."/".$mail_id."/";
        if (!is_dir($mail_dir))
            die(ERR_MAIL_DIR);

        /* 讀取 mail information 檔案 */
        $mail_info_file = $mail_dir.MAIL_INFO;
        readfile($mail_info_file);

        /* 紀錄 object log */
        $object_log_file = DATA_DIR.$acn."/".OBJECT_LOG;
        write_log($object_log_file, "acn=$acn&mail_id=$mail_id");
    }
?>
