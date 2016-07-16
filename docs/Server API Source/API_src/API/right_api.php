<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $right_rec = $_REQUEST["right_rec"];
    $page_url = $_REQUEST["page_url"];

    /* 檢查參數 */
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    /* page_url 開頭必須是 / 且不可以有 ./ (過濾掉 ./ 連 ../ 也會過濾掉) */
    if ((substr($page_url, 0, 1) != "/") || (strstr($page_url, "./") != false))
        die(ERR_PAGE_URL);
    /* 若檔案不存在就回傳錯誤 */
    $file_path = WEB_ROOT_PATH.$page_url;
    if (!file_exists($file_path))
        die(ERR_PAGE_URL);
    /* 檢查是否為子網站 file_path (僅提供子網站使用) */
    $l = strlen(WEB_PAGE_DIR);
    if ((substr($file_path, 0, $l) !== WEB_PAGE_DIR) || (strlen($file_path) <= $l))
        die(ERR_PAGE_URL);
    /* 檢查是否有網站管理權限 */
    $path = substr($file_path, $l);
    if (chk_manager_right($path) == PASS)
        $manage_right = true;
    else
        $manage_right = false;
    /* 2015/4/13 新增,取得 user 的權限狀態 */
    $right_status = chk_user_right($file_path);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "set":
            /* 需有管理權限才能設定權限資料 */
            //if ($manage_right != true)
            //    die(ERR_NO_PERMISSION);
            /* 2015/4/13 修改,有 set 權限就可以進行設定 */
            if ($right_status["set"] !== PASS)
                die(ERR_NO_PERMISSION);

            /* 檢查 right_rec 參數,必須是 reset 或是 json 格式的 array */
            if (empty($right_rec))
                die(EMPTY_RIGHT_REC);
            if ($right_rec !== "reset")
            {
                /* 若 right_rec 不是 reset 就要將 right_rec 由 json 格式轉成 array */
                $right_rec = json_decode(stripslashes($right_rec), true);
                if ((empty($right_rec)) || (!is_array($right_rec)))
                    die(ERR_RIGHT_REC);
            }

            /* 2015/3/12 新增,先取得原權限資料 */
            $old_info = get_rec_right_info($file_path);

            /* 設定權限 */
            if (set_rec_right_info($file_path, $right_rec) != true)
                die(ERR_SET_REC_RIGHT_INFO);
            echo "ok";

            /* 2015/3/12 新增,檢查瀏覽與上傳權限資料,若有變更就取出變更的名單,傳送動態訊息 */
            //if ($right_rec == "reset")
                $new_info = get_rec_right_info($file_path);
            //else
            //    $new_info = $right_rec;
            $o_item = explode(",", update_list($old_info["browse"].",".$old_info["upload"]));
            $o_cnt = count($o_item);
            $n_item = explode(",", update_list($new_info["browse"].",".$new_info["upload"]));
            $n_cnt = count($n_item);
            $n = 0;
            for ($i = 0; $i < $o_cnt; $i++)
            {
                $o_item[$i] = trim($o_item[$i]);
                /* 原名單中有空的 '*' '+' 'site_owner' 'site_manager' 'W' 等,都要先過濾掉,不進行檢查 */
                if ((empty($o_item[$i])) || ($o_item[$i] == ALL_USER) || ($o_item[$i] == SITE_MEMBER) || ($o_item[$i] == SITE_OWNER) || ($o_item[$i] == SITE_MANAGER) || ($o_item[$i] == WNS_MEMBER))
                {
                    unset($o_item[$i]);
                    continue;
                }
                for ($j = 0; $j < $n_cnt; $j++)
                {
                    if ($n == 0)
                    {
                        $n++;
                        $n_item[$j] = trim($n_item[$j]);
                        /* 新名單中有空的 '*' '+' 'site_owner' 'site_manager' 'W' 等,也都要先過濾掉,不進行檢查 */
                        if ((empty($n_item[$j])) || ($n_item[$j] == ALL_USER) || ($n_item[$j] == SITE_MEMBER) || ($n_item[$j] == SITE_OWNER) || ($n_item[$j] == SITE_MANAGER) || ($n_item[$j] == WNS_MEMBER))
                        {
                            unset($n_item[$j]);
                            continue;
                        }
                    }
                    /* 若檢查的名單已不存在就跳過 */
                    if (!isset($n_item[$j]))
                        continue;
                    /* 找出新與舊的 member 都存在的資料(代表沒變更)先過濾掉 */
                    if ($o_item[$i] == $n_item[$j])
                    {
                        unset($o_item[$i]);
                        unset($n_item[$j]);
                    }
                }
            }

            /* 取得被刪除的名單 list,送出 unset 的動態 record */
            $del_list = (empty($o_item)) ? NULL : trim(implode(",", $o_item));
            if (!empty($del_list))
                upload_dymanic_share_rec(WEB_PAGE_DIR, $path, "unset", NULL, $del_list);

            /* 取得新增的名單 list,送出 set 的動態 record */
            $new_list = (empty($n_item)) ? NULL : trim(implode(",", $n_item));
            if (!empty($new_list))
                upload_dymanic_share_rec(WEB_PAGE_DIR, $path, "set", NULL, $new_list);

            /* 2015/8/7 新增,若有新增的名單就設定自動邀請名單 */
            if (!empty($n_item))
            {
                foreach ($n_item as $key => $value)
                {
                    /* 檢查若 value 中有 @ 應該是 mail,就直接加到自動邀請中 */
                    if (strstr($value, "@") !== false)
                        add_auto_invite($value, $path, "right");
                    else
                    {
                        /* 若是帳號資料就向 wns 取回 user 資料,再加到自動邀請中 */
                        $udata = get_user_data($value);
                        if (!empty($udata["mail"]))
                            add_auto_invite($udata["mail"], $path, "right");
                    }
                }
            }
            break;

        case "get":
            /* 取得權限資料 */
            $right_info = get_rec_right_info($file_path);
            if ($right_info == false)
                die(ERR_GET_REC_RIGHT_INFO);
            /* 增加一個 set_pwd 資料,若有設密碼就設為 true,否則設為 false */
            if ((isset($right_info["pwd"])) && (!empty($right_info["pwd"])))
            {
                $right_info["set_pwd"] = true;
                /* 有設密碼但沒有管理權限時,僅輸出 set_pwd 資料,將密碼資料清除不輸出 */
                if ($manage_right != true)
                    unset($right_info["pwd"]);
            }
            else
                $right_info["set_pwd"] = false;
            echo json_encode($right_info);
            break;

        default:
            die(ERR_MODE);
    }
?>
