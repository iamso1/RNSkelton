<?php
    require_once("API_init.php");

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $page_url = $_REQUEST["page_url"];
    $share_mode = $_REQUEST["share_mode"];

    /* 判斷參數是否正確 */
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    $file_path = WEB_ROOT_PATH.$page_url;
    if (!file_exists($file_path))
        die(ERR_PAGE_URL);
    if ($mode !== "get")
    {
        /* 必須是目錄才可以設定 share_mode */
        if (!is_dir($file_path))
            die(ERR_PAGE_URL);
        if ($mode !== "clean")
        {
            if (empty($share_mode))
                die(EMPTY_SHARE_MODE);
            $s_mode = explode(",", $share_mode);
            $s_cnt = count($s_mode);
            for ($i = 0; $i < $s_cnt; $i++)
            {
                if (($s_mode[$i] !== SHARE_READ) && ($s_mode[$i] !== SHARE_DOWNLOAD) && ($s_mode[$i] !== SHARE_WRITE))
                    die(ERR_SHARE_MODE);
            }
        }
        /* 必須是網站管理員才可以設定 share_mode */
        if (chk_site_manager($file_path) !== true)
            die(ERR_NO_PERMISSION);
    }

    /* 檢查是否為子網站 file_path (僅提供子網站使用) */
    $page_dir = WEB_ROOT_PATH."/".SUB_SITE_NAME."/";
    $l = strlen($page_dir);
    if ((substr($file_path, 0, $l) !== $page_dir) || (strlen($file_path) <= $l))
        die(ERR_PAGE_URL);
    $path = substr($file_path, $l);

    /* 2015/2/9 修改,share_mode 改到 record 中,所以必須改成讀取 record 檔,並取出 share_mode 的資料 */
    /* mode 為 get 時,file_path 有可能不是目錄,必須改讀取所在目錄的 share_mode 資料 */
    if (($mode == "get") && (!is_dir($file_path)))
        $file_path = substr($file_path, 0, strrpos($file_path, "/"));
    $rec_file = get_file_rec_path($file_path);
    if ($rec_file === false)
        return false;
    $rec = rec2array($rec_file);
    if (isset($rec[0]["share_mode"]))
        $rec_share_mode = $rec[0]["share_mode"];
    else
        $rec_share_mode = NULL;

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "get":
            /* mode=get 時直接將讀取到的 share_mode 輸出 */
            echo $rec_share_mode;
            exit;

        case "set":
            /* mode=set 時直接將 share_mode 內容設定更新 */
            $update_rec["share_mode"] = $share_mode;
            break;

        case "add":
            /* 先將原本的 share_mode 與要新增的 share_mode 合併 */
            if (!empty($rec_share_mode))
                $s_mode = explode(",", $rec_share_mode.",".$share_mode);
            $s_cnt = count($s_mode);
            $share_mode = "";
            for ($i = 0; $i < $s_cnt; $i++)
            {
                for ($j = 0; $j < $i; $j++)
                {
                    /* 檢查 share_mode 是否有重覆的模式設定,若有就清除多餘的 */
                    if ($s_mode[$j] == $s_mode[$i])
                    {
                        $s_mode[$i] = "";
                        break;
                    }
                }
                /* 整理要記錄的 share_mode 資料 */
                if (empty($s_mode[$i]))
                    continue;
                if (empty($share_mode))
                    $share_mode = $s_mode[$i];
                else
                    $share_mode .= ",".$s_mode[$i];
            }
            /* 將整理好的 share_mode 資料設定到 share_mode 欄位中,準備更新 */
            $update_rec["share_mode"] = $share_mode;
            break;

        case "del":
            /* 若原本的 share_mode 或是要刪除的 share_mode 是空的就不必處理 */
            if ((empty($rec_share_mode)) || (empty($share_mode)))
                break;
            /* 取出原本的 share_mode 資料 */
            $r_mode = explode(",", $rec_share_mode);
            $r_cnt = count($r_mode);
            $share_mode = "";
            for ($i = 0; $i < $r_cnt; $i++)
            {
                /* 檢查原本的 share_mode 中是否有要刪除的模式,若有就清除 */
                for ($j = 0; $j < $s_cnt; $j++)
                {
                    if ($r_mode[$i] == $s_mode[$j])
                        $r_mode[$i] = "";
                }
                /* 整理要記錄的 share_mode 資料 */
                if (empty($r_mode[$i]))
                    continue;
                if (empty($share_mode))
                    $share_mode = $r_mode[$i];
                else
                    $share_mode .= ",".$r_mode[$i];
            }
            /* 將整理好的 share_mode 資料設定到 share_mode 欄位中,準備更新 */
            $update_rec["share_mode"] = $share_mode;
            break;

        case "clean":
            $update_rec["share_mode"] = "";
            break;

        default:
            die(ERR_MODE);
    }

    /* 若 share_mode 有變更,就將 share_mode 欄位資料寫回 record file 中 */
    if ($rec_share_mode !== $update_rec["share_mode"])
        update_rec_file($rec_file, $update_rec);
    echo "ok";
?>
