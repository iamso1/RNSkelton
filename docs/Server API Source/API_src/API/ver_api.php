<?php
    require_once("API_init.php");

    /* 取得及檢查參數 */
    $mode = $_REQUEST["mode"];
    $page_url = $_REQUEST["page_url"];
    $ver = $_REQUEST["ver"];
    $code = $_REQUEST["code"];
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    $file_path = WEB_ROOT_PATH.$page_url;
    if (!file_exists($file_path))
        die(ERR_PAGE_URL);
    if (is_dir($file_path))
        $file_path = str_replace("//", "/", $file_path."/".DEF_HTML_PAGE);
    if ((($mode == "del_ver") || ($mode == "recover_ver") || ($mode == "read_ver_file")) && (empty($ver)))
        die(EMPTY_VER);

    /* 若有傳入 code 就以此參數,先取得登入者資料 */
    if (!empty($code))
    {
        $user = get_login_user($code);
        $acn = $user["acn"];
    }
    else
       $acn = "";

    /* 檢查是否為網站管理員 */
    if (chk_site_manager($file_path, $acn) !== true)
        die(ERR_NO_PERMISSION);

    /* 依 mode 執行不同功能 */
    switch($mode)
    {
        /* 取得版本 List */
        case "get_ver_list":
            $ver_list = get_file_ver($file_path);
            if ($ver_list == false)
                $ver_list = array();
            echo json_encode($ver_list);
            break;

        /* 清除掉某個版本 */
        case "del_ver":
            if (del_file_ver($file_path, $ver) == false)
                die(ERR_DEL_VER);
            echo "ok";
            break;

        /* 清空所有版本 */
        case "clean_ver":
            if (del_file_ver($file_path, "all") == false)
                die(ERR_CLEAN_VER);
            echo "ok";
            break;

        /* 還原版本 */
        case "recover_ver":
            if (recover_file_ver($file_path, $ver) == false)
                die(ERR_RECOVER_VER);
            echo "ok";
            break;

        /* 取得版本實體檔案 */
        case "read_ver_file":
            /* 先取得副檔名,檢查是否可取得 Content-type 設定 */
            $fe = strtolower(substr($file_path, strrpos($file_path, ".")));
            if (isset($content_type[$fe]))
            {
                /* 取得 file_name 與 file_size 並設定相關的 header */
                $file_name = get_rec_field($file_path, "filename");
                $file_size = real_filesize($file_path);
                /* 檢查瀏覽器是否為 IE, 是就將 real_file_name 進行 rawurlencode */
                $buf = explode(";", $_SERVER["HTTP_USER_AGENT"]);
                list($brow, $brow_ver) = explode(" ", trim($buf[1]));
                if ($brow == "MSIE")
                   $file_name = rawurlencode($file_name);
                header("Content-type: ".$content_type[$fe]);
                header('Content-Disposition: inline; filename="'.$file_name.'"');
                header("Content-Length: $file_size");
            }
            if (read_ver_file($file_path, $ver, $code) == false)
                die(ERR_READ_VER_FILE);
            break;

        default:
            die(ERR_MODE);
            break;
    }
?>
