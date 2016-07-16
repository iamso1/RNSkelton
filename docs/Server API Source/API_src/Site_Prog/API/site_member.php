<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $site_acn = strtolower($_REQUEST["site_acn"]);
    $member = $_REQUEST["member"];

    /* 判斷參數是否正確 */
    if (empty($site_acn))
        die(EMPTY_SITE_ACN);
    $site_dir = WEB_PAGE_DIR.$site_acn;
    if (!is_dir($site_dir))
        die(ERR_SITE_ACN);
    $manager_right = chk_manager_right($site_acn);

    /* mode = set, pass, deny 時,只有管理者可使用 */
    if ((($mode == "set") || ($mode == "pass") || ($mode == "deny"))&& ($manager_right !== PASS))
        die(ERR_NO_PERMISSION);
    /* mode = apply 時,必須登入的 user 才能使用 */
    /* 2015/9/7 修改,增加 mode = del 項目 */
    if ((($mode == "apply") || ($mode == "del")) && ((!isset($login_user)) || ($login_user == false) || (empty($login_user))))
        die(ERR_NO_PERMISSION);
    /* 2015/9/7 新增,若 mode = del 時,若沒傳入 member 參數,代表要刪除自己帳號,直接將 member 設為登入者帳號與 mail (以避免 member list 是記錄 mail),另外若非網站管理者只能刪除自己的成員帳號 */
    if ($mode == "del")
    {
        if (empty($member))
            $member = $login_user["acn"].",".$login_user["mail"];
        else if (($manager_right !== PASS) && ($login_user["acn"] !== $member) && ($login_user["mail"] !== $member))
            die(ERR_NO_PERMISSION);
    }

    /* 讀取網站資訊 */
    $conf_file = $site_dir."/".NUWEB_CONF;
    $s_conf = read_conf($conf_file);

    /* 依據 mode 執行相關功能 */
    switch($mode)
    {
        case "get":
            echo $s_conf["member"];
            break;

        case "get_list":
             $list["member"] = $s_conf["member"];
             if ((isset($s_conf["wait_member"])) && (!empty($s_conf["wait_member"])))
                 $list["wait_member"] = $s_conf["wait_member"];
             /* 2016/5/5 新增,增加 import_member 資料 */
             if ((isset($s_conf["import_member"])) && (!empty($s_conf["import_member"])))
                 $list["import_member"] = $s_conf["import_member"];
             echo json_encode($list);
             break;

        case "set":
            $content = set_member($site_acn, $member, $s_conf, $conf_file);
            if ($content !== true)
                die($content);
            echo "ok";
            break;

        case "apply":
            $content = set_wait_member($site_acn, $s_conf, $conf_file);
            if ($content === true)
                echo "ok";
            else if ($content === PASS)
                echo PASS;
            else
                die($content);
            break;

        case "pass":
            $content = pass_wait_member($site_acn, $member, $s_conf, $conf_file);
            if ($content !== true)
                die($content);
            echo "ok";
            break;

        case "deny":
            deny_wait_member($site_acn, $member, $s_conf, $conf_file);
            echo "ok";
            break;

        case "del":
            $content = del_member($site_acn, $member, $s_conf, $conf_file);
            if ($content !== true)
                die($content);
            echo "ok";
            break;

        default:
            die(ERR_MODE);
    }

    /***********/
    /* 函 數 區*/
    /***********/

    /* 設定 member */
    function set_member($site_acn, $member, $s_conf, $conf_file)
    {
        Global $wns_ser;

        /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許變更網站資料 */
        if ($wns_ser != DEF_WNS_SER)
            return ERR_WNS_SER;

        /* 更新 member 設定 (若 member 資料沒變更,就直接離開) */
        if ($s_conf["member"] == $member)
            return true;

        /* 2014/9/2 新增,member 有變更時須送出動態訊息 */
        /* 先找出新與舊的 member list 資料 */
        $old_member = explode(",", $s_conf["member"]);
        $new_member = explode(",", $member);
        $o_cnt = count($old_member);
        $n_cnt = count($new_member);
        for ($i = 0; $i < $o_cnt; $i++)
        {
            $old_member[$i] = trim($old_member[$i]);
            if (empty($old_member[$i]))
                continue;
            for ($j = 0; $j < $n_cnt; $j++)
            {
                if ($i == 0)
                    $new_member[$j] = trim($new_member[$j]);
                if ((!isset($new_member[$j])) || (empty($new_member[$j])))
                    continue;
                /* 找出新與舊的 member 都存在的資料(代表沒變更)先過濾掉 */
                if ($old_member[$i] == $new_member[$j])
                {
                    unset($old_member[$i]);
                    unset($new_member[$j]);
                }
            }
        }

        /* 取得被刪除的 member,送出 unset 的動態 record */
        if (!empty($old_member))
        {
            $del_member = trim(implode(",", $old_member));
            if (!empty($del_member))
                upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "unset_member", NULL, $del_member);
        }
        /* 取得新增的 member,送出 set 的動態 record */
        if (!empty($new_member))
        {
            $add_member = trim(implode(",", $new_member));
            if (!empty($add_member))
                upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "set_member", NULL, $add_member);
            /* 2015/8/7 新增,設定自動邀請名單 */
            $n_cnt = count($new_member);
            foreach ($new_member as $key => $value)
            {
                /* 檢查若 value 中有 @ 應該是 mail,就直接加到自動邀請中 */
                if (strstr($value, "@") !== false)
                    add_auto_invite($value, $site_acn, "member");
                else
                {
                    /* 若是帳號資料就向 wns 取回 user 資料,再加到自動邀請中 */
                    $udata = get_user_data($value);
                    if (!empty($udata["mail"]))
                        add_auto_invite($udata["mail"], $site_acn, "member");
                }
            }
        }

        if (empty($member))
            unset($s_conf["member"]);
        else
            $s_conf["member"] = $member;

        /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
        update_site_conf($site_acn, $s_conf, "update");
        /* 2014/5/6 新增,更新 site_member.list 內容 */
        $member_list = "";
        if (file_exists(SITE_MEMBER_LIST))
        {
            $m_list = @file(SITE_MEMBER_LIST);
            $m_cnt = count($m_list);
            /* 先過濾掉舊資料 */
            for ($i = 0; $i < $m_cnt; $i++)
            {
                list($s_acn, $s_member) = explode("\t", strtolower(trim($m_list[$i])));
                if ($s_acn !== $site_acn)
                    $member_list .= $m_list[$i];
            }
        }
        /* 設定新資料 */
        if (!empty($member))
            $member_list .= $site_acn."\t".$member."\n";
        /* 存入 site_member.list 中 */
        $fp = fopen(SITE_MEMBER_LIST, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $member_list);
        flock($fp, LOCK_UN);
        fclose($fp);

        /* 2015/3/11 新增,若 Members 目錄存在,就自動建立 member 的子目錄 */
        $members_path = WEB_PAGE_DIR.$site_acn."/".MEMBER_PATH;
        if (is_dir($members_path))
            create_member_dir(WEB_PAGE_DIR, $site_acn."/".MEMBER_PATH);

        return true;
    }

    /* 設定 wait member */
    function set_wait_member($site_acn, $s_conf, $conf_file)
    {
        Global $login_user;

        /* 若沒有登入者帳號就沒有權限執行 */
        $acn = $login_user["acn"];
        $mail = $login_user["mail"];
        if (empty($acn))
            return ERR_NO_PERMISSION;
        /* 若網站設定不開放加入成員,也沒有權限執行 */
        if ($s_conf["member_add"] !== YES)
            return ERR_NO_PERMISSION;

        /* 檢查若有網站管理權限就直接回傳 PASS (管理者不需要加入 member) */
        if (chk_manager_right($site_acn) == PASS)
            return PASS;

        /* 檢查是否已在 member 內,若是就回傳 PASS */
        $m_item = explode(",", $s_conf["member"]);
        $cnt = count($m_item);
        for ($i = 0; $i < $cnt; $i++)
        {
            $m_item[$i] = trim($m_item[$i]);
            if (empty($m_item[$i]))
                continue;
            if (($acn == $m_item[$i]) || ($mail == $m_item[$i]))
                return PASS;
        }

        /* 2015/3/26 新增,若 member_add_mode 為 MODE_FREE 代表自由申請加入,就直接加入成員中並回傳 PASS */
        if ((isset($s_conf["member_add_mode"])) && ($s_conf["member_add_mode"] == MODE_FREE))
        {
            if ((isset($s_conf["member"])) && (!empty($s_conf["member"])))
                $s_conf["member"] .= ",$acn";
            else
                $s_conf["member"] = $acn;

            /* 送出 set 的動態 record */
            upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "set_member", NULL, $acn);

            /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
            update_site_conf($site_acn, $s_conf, "update");
            /* 更新 site_member.list 內容 */
            $member_list = "";
            if (file_exists(SITE_MEMBER_LIST))
            {
                $m_list = @file(SITE_MEMBER_LIST);
                $m_cnt = count($m_list);
                /* 先過濾掉舊資料 */
                for ($i = 0; $i < $m_cnt; $i++)
                {
                    list($s_acn, $s_member) = explode("\t", strtolower(trim($m_list[$i])));
                    if ($s_acn !== $site_acn)
                        $member_list .= $m_list[$i];
                }
            }
            /* 設定新資料,並存入 site_member.list 中 */
            $member_list .= $site_acn."\t".$s_conf["member"]."\n";
            $fp = fopen(SITE_MEMBER_LIST, "w");
            flock($fp, LOCK_EX);
            fputs($fp, $member_list);
            flock($fp, LOCK_UN);
            fclose($fp);

            /* 若 Members 目錄存在,就自動建立 member 的子目錄 */
            $members_path = WEB_PAGE_DIR.$site_acn."/".MEMBER_PATH;
            if (is_dir($members_path))
                create_member_dir(WEB_PAGE_DIR, $site_acn."/".MEMBER_PATH);

            return PASS;
        }

        /* 檢查是否已在 wait_member 內,若是就直接回傳 true,若不存在就加入 */
        if ((isset($s_conf["wait_member"])) && (!empty($s_conf["wait_member"])))
        {
            $w_item = explode(",", $s_conf["wait_member"]);
            $cnt = count($w_item);
            for ($i = 0; $i < $cnt; $i++)
            {
                $w_item[$i] = trim($w_item[$i]);
                if (empty($w_item[$i]))
                    continue;
                if (($acn == $w_item[$i]) || ($mail == $w_item[$i]))
                    return true;
            }
            /* 不存在 wait_member 中,就加入 */
            $s_conf["wait_member"] .= ",$acn";
        }
        else
            $s_conf["wait_member"] = $acn;

        /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
        update_site_conf($site_acn, $s_conf, "update");
        /* 2015/3/16 新增,送出動態訊息通知管理者 */
        upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "apply", NULL, $acn);

        return true;
    }

    /* 通過 wait member 的審核 */
    function pass_wait_member($site_acn, $member, $s_conf, $conf_file)
    {
        Global $wns_ser;

        /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許變更網站資料 */
        if ($wns_ser != DEF_WNS_SER)
            return ERR_WNS_SER;

        /* 更新 member 與 wait member 名單 */
        $m_item = explode(",", $member);
        $m_cnt = count($m_item);
        $w_item = explode(",", $s_conf["wait_member"]);
        $w_cnt = count($w_item);
        $o_item = explode(",", $s_conf["member"]);
        $o_cnt = count($o_item);
        $change = false;
        for ($i = 0; $i < $m_cnt; $i++)
        {
            $m_item[$i] = trim($m_item[$i]);
            if (empty($m_item[$i]))
                continue;

            /* 將通過審核的名單從 wait member 中移除 */
            for ($j = 0; $j < $w_cnt; $j++)
            {
                if ($i == 0)
                    $w_item[$j] = trim($w_item[$j]);
                if ((!isset($w_item[$j])) || (empty($w_item[$j])))
                    continue;
                if ($m_item[$i] == $w_item[$j])
                {
                    unset($w_item[$j]);
                    $change = true;
                }
            }

            /* 將通過審核的名單加入 member 中 */
            for ($j = 0; $j < $w_cnt; $j++)
            {
                if ($i == 0)
                    $o_item[$j] = trim($o_item[$j]);
                if (empty($o_item[$j]))
                    continue;
                /* 若已存在 member 名單中,就將該筆資料 unset 掉 */
                if ($m_item[$i] == $o_item[$j])
                    unset($m_item[$i]);
            }
            /* 如果檢查的名單還存在,代表原 member 名單中沒有此名單,將此名單加入 member 中 */
            if ((isset($m_item[$i])) && (!empty($m_item[$i])))
            {
                $change = true;
                if ((isset($s_conf["member"])) && (!empty($s_conf["member"])))
                    $s_conf["member"] .= ",".$m_item[$i];
                else
                    $s_conf["member"] = $m_item[$i];
            }
        }

        /* 若相關設定資料沒變更就不必處理 */
        if ($change !== true)
            return true;

        /* 重新整理 wait member,若 wait member 已沒有資料,就 unset wait member */
        $s_conf["wait_member"] = (empty($w_item)) ? NULL : trim(implode(",", $w_item));
        if (empty($s_conf["wait_member"]))
            unset($s_conf["wait_member"]);

        /* 整理新增審查通過的 member,送出 set 的動態 record */
        $add_member = (empty($m_item)) ? NULL : trim(implode(",", $m_item));
        if (!empty($add_member))
            upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "set_member", NULL, $add_member);

        /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
        update_site_conf($site_acn, $s_conf, "update");
        /* 更新 site_member.list 內容 */
        $member_list = "";
        if (file_exists(SITE_MEMBER_LIST))
        {
            $m_list = @file(SITE_MEMBER_LIST);
            $m_cnt = count($m_list);
            /* 先過濾掉舊資料 */
            for ($i = 0; $i < $m_cnt; $i++)
            {
                list($s_acn, $s_member) = explode("\t", strtolower(trim($m_list[$i])));
                if ($s_acn !== $site_acn)
                    $member_list .= $m_list[$i];
            }
        }
        /* 設定新資料,並存入 site_member.list 中 */
        $member_list .= $site_acn."\t".$s_conf["member"]."\n";
        $fp = fopen(SITE_MEMBER_LIST, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $member_list);
        flock($fp, LOCK_UN);
        fclose($fp);

        /* 若 Members 目錄存在,就自動建立 member 的子目錄 */
        $members_path = WEB_PAGE_DIR.$site_acn."/".MEMBER_PATH;
        if (is_dir($members_path))
            create_member_dir(WEB_PAGE_DIR, $site_acn."/".MEMBER_PATH);

        return true;
    }

    /* 沒通過 wait member 的審核 */
    function deny_wait_member($site_acn, $member, $s_conf, $conf_file)
    {
        /* 若 wait member 不存在就不必處理 */
        if (!isset($s_conf["wait_member"]))
            return;

        /* 將沒通過的名單,從 wait member 中移除 */
        $m_item = explode(",", $member);
        $m_cnt = count($m_item);
        $w_item = explode(",", $s_conf["wait_member"]);
        $w_cnt = count($w_item);
        $change = false;
        for ($i = 0; $i < $m_cnt; $i++)
        {
            $m_item[$i] = trim($m_item[$i]);
            if (empty($m_item[$i]))
                continue;
            for ($j = 0; $j < $w_cnt; $j++)
            {
                if ($i == 0)
                    $w_item[$j] = trim($w_item[$j]);
                if ((!isset($w_item[$j])) || (empty($w_item[$j])))
                    continue;
                if ($m_item[$i] == $w_item[$j])
                {
                    unset($w_item[$j]);
                    $change = true;
                }
            }
        }

        /* 若 wait member 沒變更就不必處理 */
        if ($change !== true)
            return;

        /* 重新整理 wait member,若 wait member 已沒有資料,就 unset wait member */
        $s_conf["wait_member"] = (empty($w_item)) ? NULL : trim(implode(",", $w_item));
        if (empty($s_conf["wait_member"]))
            unset($s_conf["wait_member"]);

        /* 2015/8/4 修改,改 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
        update_site_conf($site_acn, $s_conf, "update");
   }

    /* 刪除 member (若非管理者只能刪除自己帳號) */
    function del_member($site_acn, $member, $s_conf, $conf_file)
    {
        Global $wns_ser, $manager_right, $login_user;

        /* 若 member 不存在或是空的就不必處理 */
        if ((!isset($s_conf["member"])) || (empty($s_conf["member"])))
            return true;

        /* 檢查目前的 wns server 是否為 DEF_WNS_SER,若不是就不允許變更網站資料 */
        if ($wns_ser != DEF_WNS_SER)
            return ERR_WNS_SER;

        /* 若不是管理者,且刪除不是自己帳號,就不允許刪除 */
        $del_member = explode(",", $member);
        if (($manager_right !== PASS) && ($del_member[0] !== $login_user["acn"]) && ($del_member[1] !== $login_user["mail"]))
            return ERR_NO_PERMISSION;

        /* 整理 member list 資料,將要刪除的成員從 member list 中清除 */
        $old_member = explode(",", $s_conf["member"]);
        $o_cnt = count($old_member);
        $d_cnt = count($del_member);
        $member_content = "";
        $change = false;
        for ($i = 0; $i < $o_cnt; $i++)
        {
            $old_member[$i] = trim($old_member[$i]);
            if ((!isset($old_member[$i])) || (empty($old_member[$i])))
                continue;
            for ($j = 0; $j < $d_cnt; $j++)
            {
                /* 找出要刪除的 member 過濾掉 */
                if ($old_member[$i] == $del_member[$j])
                {
                    $change = true;
                    unset($old_member[$i]);
                    break;
                }
            }
            if ((isset($old_member[$i])) && (!empty($old_member[$i])))
                $member_content .= (empty($member_content)) ? $old_member[$i] : ",".$old_member[$i];
        }

        /* 若 member list 資料沒變更,就不必處理 */
        if ($change !== true)
            return true;

        /* 刪除的 member,送出 unset 的動態 record */
        upload_dymanic_share_rec(WEB_PAGE_DIR, $site_acn, "unset_member", NULL, $member);

        /* 更新 member 資料,並 call update_site_conf 函數來處理更新網站設定資料的相關工作 */
        $s_conf["member"] = $member_content;
        update_site_conf($site_acn, $s_conf, "update");

        /* 更新 site_member.list 內容 */
        $member_list = "";
        if (file_exists(SITE_MEMBER_LIST))
        {
            $m_list = @file(SITE_MEMBER_LIST);
            $m_cnt = count($m_list);
            /* 先過濾掉舊資料 */
            for ($i = 0; $i < $m_cnt; $i++)
            {
                list($s_acn, $s_member) = explode("\t", strtolower(trim($m_list[$i])));
                if ($s_acn !== $site_acn)
                    $member_list .= $m_list[$i];
            }
        }
        /* 設定新資料 */
        if (!empty($s_conf["member"]))
            $member_list .= $site_acn."\t".$s_conf["member"]."\n";
        /* 存入 site_member.list 中 */
        $fp = fopen(SITE_MEMBER_LIST, "w");
        flock($fp, LOCK_EX);
        fputs($fp, $member_list);
        flock($fp, LOCK_UN);
        fclose($fp);

        return true;
    }
?>
