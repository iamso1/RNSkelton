<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/tools/Language/htdocs/tools_lang_$lang.php");

    $url = $_REQUEST["url"];
    $mail = $_REQUEST["mail"];
    $mode = $_REQUEST["mode"];
    $sun = $_REQUEST["sun"];
    $pwd = $_REQUEST["pwd"];

    if (empty($url))
        $url = "/";
    update_url($url);
    if ($group_mode == GROUP_CLIENT)
    {
        header("Location: ".$set_conf["group_server"].".nuweb.cc".$PHP_SELF."?url=".rawurlencode($url)."&mail=".rawurlencode($mail));
        exit;
    }

    if ($mode == "reg_invite")
    {
        reg_invite($url, $mail, $pwd, $sun);
        exit;
    }

    if ((!empty($mail)) && (in_auto_invite_list($mail) == true))
        show_invite($url, $mail);
    else
        header("Location: $url");

    /* 檢查並調整 URL */
    function update_url(&$url)
    {
        /* 若 url 是空的或 url 開頭不是 / 或 http:// 或 https:// 就直接將 url 設為 / */
        if ((empty($url)) || (($url[0] !== "/") && (substr($url, 0, 7) !== "http://") && (substr($url, 0, 8) !== "https://")))
            $url = "/";

        /* 整理 url 位置 */
        if ($url[0] == "/")
            $url = get_server_url().substr($url, 1);
        //{
        //    $ser_url = get_server_url();
        //    if ($url == "/")
        //        $url_path = "";
        //    else
        //        $url_path = substr($url, 1);
        //}
        //else
        //{
        //    $p = explode("/", $url, 4);
        //    $ser_url = $p[0]."//".$p[2]."/";
        //    $url_path = $p[3];
        //}

        /* 若 url_path 有非檔名允許的特殊符號或 ../ 就強制將 url 設為 server url */
        //if ((preg_match(FORMAT_FAIL_PATH_NAME, $url_path)) || (strstr($url_path, "../")))
        //    $url = $ser_url;
        //else
        //    $url = $ser_url.$url_path;
    }

    /* 顯示邀請註冊畫面 */
    function show_invite($url, $mail)
    {
        Global $lang, $PHP_SELF, $reg_conf;

        /* 設定啟始樣版檔 */
        $tpl = new TemplateLib("Template/reg_invite.tpl.$lang");

        /* 設定樣版的參數 */
        $tpl->assignGlobal("url", $url);
        $tpl->assignGlobal("mail", $mail);
        $tpl->assignGlobal("lang", $lang);
        $tpl->assignGlobal("PHP_SELF", $PHP_SELF);
        $tpl->assignGlobal("cs_sun", $reg_conf["sun"]);

        /* 檢查 mail 是否已存在 */
        if (acn_exist($mail) !== true)
        {
            $tpl->newBlock("USER_NOT_EXIST_1");
            $tpl->newBlock("USER_NOT_EXIST_2");
        }

        /* 輸出樣版結果 */
        $tpl->printToScreen();
    }

    /* 進行邀請註冊 */
    function reg_invite($url, $mail, $pwd, $sun=NULL)
    {
        Global $set_conf, $group_mode;

        if ((empty($mail)) || (empty($pwd)) || (in_auto_invite_list($mail) !== true))
        {
            header("Location: $url");
            exit;
        }
        $real_pwd = base64_encode($pwd."\0");

        /* 找出自動邀請的 quota 限制 */
        if ((isset($set_conf["auto_invite_quota"])) && ($set_conf["auto_invite_quota"] > 0))
            $auto_invite_quota = $set_conf["auto_invite_quota"];

        /* 檢查是否已經有 nuweb 帳號 */
        if (acn_exist($mail) == true)
        {
            /* 用 mail & pwd 取出 user 的相關資料,如果 acn & pwd 比對錯誤,就顯示錯誤訊息 */
            if (($ssn_acn_mail_sun = get_ssn($mail, $real_pwd)) == false)
                alert_err(ERR_ACN_PWD);
            list($ssn, $acn, $mail, $sun) = explode(":", $ssn_acn_mail_sun);
        }
        else
        {
            /* 若沒設定 sun 就設定成 mail '@' 字元之前的帳號 */
            if (empty($sun))
                $sun = substr($mail, 0, strpos($mail, "@"));

            /* 檢查 sun 資料是否有特殊字元,若有就不允許註冊 */
            if (chk_special_char($sun) == true)
                alert_err(ERR_SUN);

            /* 向 WNS 進行註冊,若失敗就顯示錯誤訊息 */
            $ssn_acn = ssn_new2($mail, $real_pwd, $sun);
            list($ssn, $acn) = explode(":", $ssn_acn);
            if (is_numeric($ssn) != true)
                alert_err($ssn_acn);
        }

        /* 設定登入 cookie 與 login user 等資料 */
        set_login_cookie($ssn, $acn, $mail, $sun);
        $login_user = get_login_user();
        $uid = $login_user["ssn"];
        $uacn = $login_user["acn"];

        if ($group_mode == GROUP_SERVER)
        {
            if ($cs = group_new_site($ssn, $acn, $mail, $sun) == false)
                alert_err(ERR_GROUP_NEW_SITE);

            /* 將 user 加入 group user list 中 */
            add_group_user_list($acn);

            /* 若有設定自動邀請的 quota 限制,就要設定 member quota 並通知該 CS 進行更新 member quota */
            if ((isset($auto_invite_quota)) && ($auto_invite_quota > 0))
            {
                set_member_quota($acn, $auto_invite_quota);
                $grp_code = get_grp_code("set_member_quota", $acn);
                $grp_url = "http://$cs.nuweb.cc".GROUP_API."?grp_code=$grp_code&content=$auto_invite_quota";
                $content = trim(implode("", @file($grp_url)));
            }
        }
        else
        {
            /* 將 user 加入 group user list 中 */
            add_group_user_list($acn);

            /* 檢查子網站是否已存在,若不存在就新增子網站 */
            $page_dir = WEB_PAGE_DIR;
            if (site_exists($page_dir, $acn) != true)
            {
                /* 建立會員網站 */
                new_site_dir($page_dir, $acn, $sun, $acn, SITE_TYPE_PERSONAL, true);
                /* 若有設定自動邀請的 quota 限制,就要設定 member quota */
                if ((isset($auto_invite_quota)) && ($auto_invite_quota > 0))
                    set_member_quota($acn, $auto_invite_quota);
            }
        }

        /* 整理自動邀請的註冊資料 */
        reg_auto_invite($mail, $acn);

        /* 顯示註冊成功訊息,並跳到指定的 url */
        $msg = "<script language=\"JavaScript\">alert(\"".MSG_REGISTER_OK."\"); location.replace(\"$url\");</script>";
        echo $msg;
        //alert_msg(MSG_REGISTER_OK);
        //echo "<script language=\"JavaScript\">location.replace(\"$url\");</script>";
    }
?>
