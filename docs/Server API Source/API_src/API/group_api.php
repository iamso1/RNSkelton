<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/tools/upnp_lib.php");
    require_once("/data/HTTPD/htdocs/API/TemplateLib.php");

    /* 取得所有可能的輸入參數 */
    $grp_code = $_REQUEST["grp_code"];
    $content = stripslashes($_REQUEST["content"]);
    $mode = $_REQUEST["mode"];
    $code = $_REQUEST["code"];
    $acn = $_REQUEST["acn"];
    $my_mode = $_REQUEST["my_mode"];
    $cs_acn = $_REQUEST["cs_acn"];

    /* 若不是 Group 內的 CS 就不必處理 */
    if ($group_mode == GROUP_NONE)
        exit;

    /* 判斷參數是否正確 */
    if (!empty($grp_code))
    {
        $grp_info = auth_decode($grp_code);
        if ($grp_info == false)
            die(ERR_GRP_CODE);
        list($g_acn, $g_alias, $mode, $arg) = explode(":", $grp_info, 4);
    }

    if (empty($mode))
        die(EMPTY_MODE);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "redirect":
            redirect($code, $acn, $my_mode, $cs_acn);
            break;

        case "update_setup":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
                update_setup($content);
            break;

        case "update_subsite_linkname":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
                update_subsite_linkname($content);
            break;

        case "add_short":
            if ($group_mode == GROUP_SERVER)
            {
                list($short_code, $url) = explode(":", $arg, 2);
                if (group_ser_add_short($short_code, $url, $g_acn) == true)
                    echo "ok";
            }
            break;

        case "update_short":
            if ($group_mode == GROUP_SERVER)
            {
                list($short_code, $new_short_code) = explode(":", $arg, 2);
                if (group_ser_update_short($short_code, $new_short_code, $g_acn) == true)
                    echo "ok";
            }
            break;

        case "del_short":
            if ($group_mode == GROUP_SERVER)
            {
                $short_code = $arg;
                if (group_ser_del_short($short_code, $g_acn) == true)
                    echo "ok";
            }
            break;

        case "chk_login":
            /* 2014/10/23 修改,chk_login 也有可能是 Group Server 自己 call (為解決 domain 問題) */
            //if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            if (($group_mode == GROUP_SERVER) && ((in_group_cs_list($g_acn) == true) || ($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"])))
            {
                if ((!isset($_COOKIE["nu_code"])) || (empty($_COOKIE["nu_code"])))
                    $nu_code = "";
                else
                    $nu_code = $_COOKIE["nu_code"];
                $grp_code = get_grp_code("set_login", $nu_code);
                /* 2014/10/23 修改,arg 會傳入 domain 或 IP,可直接使用,不必再轉成 nuweb domain */
                if (!empty($arg))
                    $domain = $arg;
                else
                    $domain = "$g_acn.nuweb.cc";
                header("Location: http://$domain".GROUP_API."?grp_code=$grp_code&content=".rawurlencode($content));
            }
            break;

        case "set_login":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
            {
                /* 若 arg 為空的但 login_user 不是 false,代表在 Group Server 端 User 已登出,Client 端尚未登出,須自動登出 */
                if ((empty($arg)) && ($login_user != false))
                {
                    /* 清除 login user 的 cookie 與 random_path 的 session */
                    del_login_cookie();
                    session_start();
                    if (isset($_SESSION["random_path"]))
                        unset($_SESSION["random_path"]);
                    session_write_close();
                }

                /* 若 arg 不是空的,但沒設定 nu_code 的 cookie 或是 nu_code 與 arg 不相同,就必須用 arg 來設定新的 login cookie */
                if ((!empty($arg)) && ((!isset($_COOKIE["nu_code"])) || ($_COOKIE["nu_code"] !== $arg)))
                { 
                    $login_user = get_login_user($arg);
                    $uid = $login_user["ssn"];
                    $uacn = $login_user["acn"];
                }
                /* 要設定 group_login 這項 cookie 用來檢查是否已向 Group Server 進行過 chk_login,此 cookie 內容為目前時間,用來每隔一段時間重新檢查一次 */
                setcookie("group_login", time(), 0, "/", COOKIE_DOMAIN);

                /* 重新 redirect 會到原始呼叫的 url */
                header("Location: $content");
            }
            break;

        case "login":
            /* 取得 arg 內的 nu_code 與 login_list 資料 */
            list($nu_code, $login_list, $time) = explode(":", $arg);
            if ((empty($nu_code)) || (empty($login_list)))
                break;
            /* 用 nu_code 取得 Login user 資料,並設定 login cookie */
            $login_user = get_login_user($nu_code, $time);
            /* 整理 login_list 內容,第一筆應該是這台 CS,先過濾掉自己,在找出下一台 CS 進行處理 */
            $cs_list = explode(",", $login_list);
            if (($cs_list[0] != $reg_conf["acn"]) && ($cs_list[0] != $reg_conf["alias1"]) && ($cs_list[0] != $_SERVER["SERVER_NAME"]))
                break;
            if (!empty($cs_list[1]))
            {
                $grp_code = get_grp_code("login", $_COOKIE["nu_code"].":".substr($login_list, strpos($login_list, ",")+1).":$time");
                if (strstr($cs_list[1], ".") !== false)
                    $domain = $cs_list[1];
                else
                    $domain = $cs_list[1].".nuweb.cc";
                header("Location: http://$domain".GROUP_API."?grp_code=$grp_code&content=".rawurlencode($content));
                exit;
            }
            else
            {
                /* 2015/1/16 修改,若 content 最後有出現 :NC 代表不關閉視窗,直接在原視窗 replace 到 content 所指向的 url */
                $close_win = YES;
                if (substr($content, -3) == ":NC")
                {
                    $close_win = NO;
                    $content = substr($content, 0, -3);
                }
                /* 關閉視窗,若有傳入 content 就將上層視窗 replace 到 content 所指向的 url */
                /* 設定啟始樣版檔 */
                $tpl = new TemplateLib("Template/group_login.tpl");
                /* 設定樣版的參數 */
                $tpl->assign("close_win", $close_win);
                if (!empty($content))
                    $tpl->assign("redirect_url", $content);
                /* 輸出樣版結果 */
                $tpl->printToScreen();
            }
            break;

        case "logout":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            /* 2014/8/28 修改,不一定是從 Group Server 送來,不過可從 grp_code 檢查是否由 Group Server 開始送出 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
            {
                del_login_cookie();
                /* 整理 content 內容,過濾掉自己,在找出下一台 CS Client,通知它進行登出,並延續下去直到所有 Client 都登出 */
                $cs_list = explode(",", $content);
                $content = "";
                $first_cs = "";
                $cnt = count($cs_list);
                for ($i = 0; $i < $cnt; $i++)
                {
                    if (($cs_list[$i] == $reg_conf["acn"]) || ($cs_list[$i] == $reg_conf["alias1"]))
                        continue;
                    if (empty($continue))
                    {
                        $content .= $cs_list[$i];
                        $first_cs = $cs_list[$i];
                    }
                    else
                        $content .= ",".$cs_list[$i];
                }
                if (!empty($first_cs))
                    header("Location: http://$first_cs.nuweb.cc".GROUP_API."?grp_code=$grp_code&content=$content");
            }
            break;

        case "update_site_conf":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                $conf = json_decode($content, true);
                group_update_site_conf($conf, $g_acn);
            }
            break;

        case "del_site_conf":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                $site_acn = $arg;
                if (group_ser_del_site_conf($site_acn, $g_acn) == true)
                    echo "ok";
            }
            break;

        case "get_site_conf_rec":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
                echo group_get_site_conf_rec();
            break;

        case "get_ser_url":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
                echo get_server_url();
            break;

        case "get_site_list":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
                echo group_site_list();
            break;

        case "set_event_rec":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                if (group_set_event_rec($content) !== false)
                    echo "ok";
            }
            break;

        case "set_member_quota":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
            {
                if (group_set_member_quota($arg, $content) !== false)
                    echo "ok";
            }
            break;

        /* 2015/3/26 新增,取得 Group Server 的資料 */
        case "get_group_server_info":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                $info["ssn"] = $reg_conf["ssn"];
                $info["acn"] = $reg_conf["acn"];
                $info["sun"] = $reg_conf["sun"];
                $info["alias"] = $reg_conf["alias1"];
                echo json_encode($info);
            }
            break;

        /* 2015/8/7 新增,設定自動邀請名單 */
        case "add_auto_invite":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                list($mail, $path, $mode, $acn, $sun) = explode(":", $arg);
                if (add_auto_invite($mail, $path, $mode, $acn, $sun) !== false)
                    echo "ok";
            }
            break;

        /* 2015/8/19 新增,檢查網站是否已存在 */
        case "site_exists":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                if (group_site_exists($arg) !== false)
                    echo YES;
                else
                    echo NO;
            }
            break;

        /* 2015/9/23 新增,設定網站垃圾桶 log 資料 */
        case "write_site_trash_log":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                write_group_site_trash_log($arg, $g_acn);
                echo "ok";
            }
            break;

        /* 2015/9/23 新增,刪除網站垃圾桶 log 資料 */
        case "del_site_trash_log":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                del_group_site_trash_log($arg, $g_acn);
                echo "ok";
            }
            break;

        /* 2015/9/23 新增,清除網站垃圾桶 log 資料 */
        case "clean_site_trash_log":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                clean_group_site_trash_log($g_acn);
                echo "ok";
            }
            break;

        /* 2015/9/23 新增,更新網站垃圾桶 log 資料 */
        case "update_site_trash_log":
            if (($group_mode == GROUP_SERVER) && (in_group_cs_list($g_acn) == true))
            {
                update_group_site_trash_log($g_acn, $content);
                echo "ok";
            }
            break;

        /* 2015/9/24 新增,由 Group Server 將檔案傳送到 Group Client */
        case "s2c_file":
            /* 檢查是否為 Group Server 送來的資料,若不是就不處理 */
            if (($g_acn == $set_conf["group_server"]) || ($g_alias == $set_conf["group_server"]))
                if (s2c_file($arg, $content) == true)
                    echo "ok";
            break;

        default:
            die(ERR_MODE);
    }

    /***********/
    /* 函 數 區*/
    /***********/

    function redirect($code, $acn, $my_mode, $cs_acn)
    {
        Global $group_mode;

        /* 僅 Group Server 可執行 */
        if ($group_mode != GROUP_SERVER)
            return false;

        /* 預設的 redirect url 是 cs_acn 的 web 網站 */
        $def_url = "http://$cs_acn.nuweb.cc/Site/web/";

        /* 檢查 code 與 acn 資料是否符合 */
        $content = auth_decode($code);
        if ($content == false)
        {
            header("Location: $def_url");
            exit;
        }
        list($l_ssn, $l_acn, $l_mail, $l_sun, $l_user_lang) = explode(":", $content);
        if (($l_acn !== $acn) || (empty($l_ssn)) || (empty($l_acn)) || (empty($l_mail)) || (empty($l_sun)) || (is_numeric($l_ssn) != true))
        {
            header("Location: $def_url");
            exit;
        }

        /* 取得在 group 中 user 的網站 list,檢查是否有與 acn 同名網站,若有就直接選取,若有多個就取第一個 */
        $user_site = group_get_user_site($acn, $l_mail);
        $user_site_url = NULL;
        if ($user_site !== false)
            $cnt = count($user_site);
        else
            $cnt = 0;
        if ($cnt > 0)
        {
            /* 先預設第一個網站 */
            $user_site_url = "http://".$user_site[0]["cs_acn"].".nuweb.cc/index.php?site_acn=".$user_site[0]["site_acn"]."&mode=$mode&code=$code";
            for ($i = 0; $i < $cnt; $i++)
            {
                /* 尋找是否有同名網站,若有就選取同名網站 */
                if ($user_site[$i]["site_acn"] == $acn)
                {
                    $user_site_url = "http://".$user_site[$i]["cs_acn"].".nuweb.cc/index.php?site_acn=".$user_site[$i]["site_acn"]."&mode=$mode&code=$code";
                    break;
                }
            }
        }

        if ($user_site_url == NULL)
            header("Location: $def_url");
        else
            header("Location: $user_site_url");
        exit;
    }

    /* 更新 setup.conf 內容 */
    function update_setup($content)
    {
        $set_conf = json_decode($content, true);
        if ((!isset($set_conf["manager"])) || (empty($set_conf["manager"])))
            die(ERR_CONTENT);

        /* 2014/10/10 修改,若設定中有 backup_server 項目需先移除,再讀取舊的設定資料,若有 backup_server 項目必須保留下來 */
        if (isset($set_conf["backup_server"]))
            unset($set_conf["backup_server"]);
        $old_conf = read_conf(SETUP_CONFIG);
        if (isset($old_conf["backup_server"]))
            $set_conf["backup_server"] = $old_conf["backup_server"];
        /* 2014/12/9 修改,若設定中有 domain 項目,也必須保留原設定值 */
        /* 在 Group 架構中,backup_server 與 domain 目前必須手動設定 */
        if (isset($set_conf["domain"]))
            unset($set_conf["domain"]);
        if (isset($old_conf["domain"]))
            $set_conf["domain"] = $old_conf["domain"];

        /* 備份舊的 setup.conf */
        /* 2015/9/18 修改,直接改用 write_conf 的備份方式,但第一次備份 .src 還是保留 */
        if (!file_exists(SETUP_CONFIG.".src"))
            rename(SETUP_CONFIG, SETUP_CONFIG.".src");
        //else
        //{
        //    if (file_exists(SETUP_CONFIG.".bak"))
        //        unlink(SETUP_CONFIG.".bak");
        //    rename(SETUP_CONFIG, SETUP_CONFIG.".bak");
        //}
        write_conf(SETUP_CONFIG, $set_conf, true);
    }

    /* 更新 subsite_linkname 內容 */
    function update_subsite_linkname($content)
    {
        if (empty($content))
            die(EMPTY_CONTENT);

        $fp = fopen(SUB_SITE_LINK_NAME, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $content);
        flock($fp, LOCK_UN);
        fclose($fp);
    }

    /* 2015/9/24 新增,從 Group Server 將檔案傳送到 Group Client */
    function s2c_file($file_path, $content)
    {
        /* 必須傳入 file_path,且 file_path 不可有 /.. 且必須是在 /data/ 內 */
        if ((empty($file_path)) || (strstr($file_path, "/..") != false) || (substr($file_path, 0, 6) != "/data/"))
            return false;

        /* 若 content 是空的,代表要刪除這個檔案 */
        if (empty($content))
        {
            if (file_exists($file_path))
                unlink($file_path);
            return true;
        }

        /* 將 content 的資料使用 base64_decode 解碼後存入 file_path 中 */
        if (($fp = fopen($file_path, "w")) == false)
            return false;
        flock($fp, LOCK_EX);
        fputs($fp, base64_decode($content));
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }
?>