<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    define("ERR_CODE", "Error: code error!");
    define("ERR_FRIEND_BASE_DIR", "Error: Can not create Friend directory!");
    define("ERR_FRIEND_DIR", "Error: Can not create friend's directory!");
    define("ERR_FRIEND_ACN", "Error: not friend!\n");
    define("ERR_FRIEND_LIST", "Error: friend list is empty!\n");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $site_acn = strtolower($_REQUEST["site_acn"]);
    $friend_acn = strtolower($_REQUEST["friend_acn"]);
    $code = $_REQUEST["code"];

    /* 判斷參數是否正確 */
    if (empty($site_acn))
        die(EMPTY_SITE_ACN);
    $site_dir = WEB_PAGE_DIR.$site_acn;
    if (!is_dir($site_dir))
        die(ERR_SITE_ACN);
    if (!empty($code))
    {
        $user = get_login_user($code);
        if ($user === false)
            die(ERR_CODE);
        $friend_acn = $user["acn"];
    }

    /* 若沒傳入 code 只有管理者可使用 */
    if ((empty($code)) && (chk_manager_right($site_acn) !== PASS))
        die(ERR_NO_PERMISSION);

    /* 若朋友目錄不存在就自動建立 */
    $friend_base_dir = $site_dir."/".FRIEND_DIR_NAME;
    if ((!is_dir($friend_base_dir)) && (($ret = new_friend_dir($site_acn)) !== true))
        die($ret);

    /* 依據 mode 執行相關功能 */
    switch($mode)
    {
        case "set_dir":
            if (empty($friend_acn))
            {
                echo "ok";
                exit;
            }
            $friend_dir = $friend_base_dir."/".$friend_acn;
            if ((($friend_acn == "all") || (!is_dir($friend_dir))) && (($ret = new_friend_dir($site_acn, $friend_acn)) !== true))
                die($ret);
            echo "ok";
            break;

        default:
            die(ERR_MODE);
    }

    /***********/
    /* 函 數 區*/
    /***********/

    /* 建立朋友目錄 */
    function new_friend_dir($site_acn, $f_acn=NULL)
    {
        Global $uacn;

        /* 讀取網站資訊,並將 uacn 設為網站 owner (建立目錄時才能預設為目錄 owner) */
        $conf_file = WEB_PAGE_DIR.$site_acn."/".NUWEB_CONF;
        $s_conf = read_conf($conf_file);
        $uacn = strtolower($s_conf["owner"]);

        /* 建立朋友主目錄(Friend),並設定權限所有人不可瀏覽上傳 */
        $path = $site_acn;
        if (empty($f_acn))
        {
            $f_path = new_dir(WEB_PAGE_DIR, $path, FRIEND_DIR_NAME, GENERAL_DIR_TYPE, FRIEND_DIR_NAME, true, false);
            if ($f_path == false)
                return ERR_FRIEND_BASE_DIR;
            $right_info["browse"] = "";
            $right_info["download"] = "";
            $right_info["upload"] = "";
            $right_info["edit"] = "";
            $right_info["del"] = "";
            set_rec_right_info(WEB_PAGE_DIR.$f_path, $right_info);
            /* 紀錄到 modify.list 中 */
            write_modify_list("new", WEB_PAGE_DIR.$f_path, "dir");

            return true;
        }

        /* 取得網站 owner 的朋友名單,並檢查 f_acn 是否在朋友名單中,是才建立目錄,不是就回傳錯誤訊息 (若 f_acn 為 all 代表要建立所有朋友的目錄) */
        $f_list = get_owner_friend_list($uacn);
        if (($f_list === false) || (empty($f_list)))
            return ERR_FRIEND_LIST;
        $friend = explode(",", $f_list);
        $f_cnt = count($friend);
        $is_friend = false;
        for ($i = 0; $i < $f_cnt; $i++)
        {
            if (($f_acn !== "all") && ($f_acn !== trim($friend[$i])))
                continue;
            $is_friend = true;
            $ret = create_friend_dir($site_acn, trim($friend[$i]));
            if (($ret !== true) && ($f_acn !== "all"))
                return $ret;
        }
        if (($f_acn !== "all") && ($is_friend !== true))
            return ERR_FRIEND_ACN;

        return true;
    }

    function create_friend_dir($site_acn, $f_acn)
    {
        $path = $site_acn."/".FRIEND_DIR_NAME;
        $f_path = new_dir(WEB_PAGE_DIR, $path, $f_acn, GENERAL_DIR_TYPE, $f_acn, false, false);
        if ($f_path == false)
            return ERR_FRIEND_DIR;
        $friend_dir = WEB_PAGE_DIR.$f_path;
        $path .= "/$f_acn";
        $f_path = new_dir(WEB_PAGE_DIR, $path, "Note", GENERAL_DIR_TYPE, "Note", false, false);
        $f_path = new_dir(WEB_PAGE_DIR, $path, "Share", GENERAL_DIR_TYPE, "Share", false, false);

        /* 設定朋友目錄權限資料並寫入 record 中 */
        $right_info["browse"] = $f_acn;
        $right_info["download"] = $f_acn;
        $right_info["upload"] = $f_acn;
        $right_info["edit"] = $f_acn;
        $right_info["del"] = $f_acn;
        set_rec_right_info($friend_dir, $right_info);

        /* 紀錄到 modify.list 中 */
        write_modify_list("new", $friend_dir, "dir");

        return true;
    }

    function get_owner_friend_list($owner)
    {
        /* 從 WNS 取得 owner 的朋友名單資料 */
        $code = auth_encode(DEF_CHK_KEY.":$owner:".DEF_CHK_KEY.":".DEF_CHK_KEY.":");
        $url = USER_PROFILE_URL."friend_api.php?code=$code&mode=get&name=friend";
        $f_list = json_decode(trim(implode("", file($url))), true);
        if ((isset($my_list["error"])) || (!isset($f_list["friend"])))
            return false;
        return $f_list["friend"];
    }
?>
