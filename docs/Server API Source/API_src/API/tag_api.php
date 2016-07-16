<?php
    define("DEF_TAG", "SYS_STAR");

    require_once("API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    $page_url = $_REQUEST["page_url"];
    $mode = $_REQUEST["mode"];
    $tag = $_REQUEST["tag"];

    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    if (empty($tag))
        $tag = DEF_TAG;
    $file_path = WEB_ROOT_PATH.$page_url;
    if (!file_exists($file_path))
        die(ERR_PAGE_URL);

    /* 檢查是否為子網站 file_path (僅提供子網站使用) */
    $page_dir = WEB_ROOT_PATH."/".SUB_SITE_NAME."/";
    $l = strlen($page_dir);
    if ((substr($file_path, 0, $l) !== $page_dir) || (strlen($file_path) <= $l))
        die(ERR_PAGE_URL);
    $path = substr($file_path, $l);

    /* 找出 record file 位置 (若 record file 不存在就不處理) */
    $rec_file = get_file_rec_path($file_path);
    if ($rec_file === false)
        die(ERR_REC_FILE);
    /* 取出 record file 資料,並找出 tage 設定資料 */
    $rec = rec2array($rec_file);

    /* mode = get 僅檢查瀏覽權限,否則必須檢查上傳權限 */
    if ($mode !== "get")
        $right = chk_upload_right($page_dir, $path);
    else
        $right = chk_browse_right($page_dir, $path);
    if ($right !== PASS)
        die(ERR_NO_PERMISSION);

    $change = false;
    $result = "ok";
    switch($mode)
    {
        case "add":
            if (!isset($rec[0]["tag"]) || (empty($rec[0]["tag"])))
            {
                $rec[0]["tag"] = $tag;
                $change = true;
            }
            else
            {
                $src_tag = explode(",", $rec[0]["tag"]);
                $add_tag = explode(",", $tag);
                $src_cnt = count($src_tag);
                $add_cnt = count($add_tag);
                for ($i = 0; $i < $add_cnt; $i++)
                {
                    $exist = false;
                    $add_tag[$i] = trim($add_tag[$i]);
                    for ($j = 0; $j < $src_cnt; $j++)
                    {
                        $src_tag[$j] = trim($src_tag[$j]);
                        if ($src_tag[$j] == $add_tag[$i])
                            $exist = true;
                    }
                    if ($exist == false)
                    {
                        $src_tag[$src_cnt++] = $add_tag[$i];
                        $change = true;
                    }
                }
                if ($change == true)
                    $rec[0]["tag"] = implode(",", $src_tag);
            }
            break;

        case "set":
            if ($rec[0]["tag"] == $tag)
                break;
            $rec[0]["tag"] = $tag;
            $change = true;
            break;

        case "del":
            if (!isset($rec[0]["tag"]) || (empty($rec[0]["tag"])))
                break;
            $src_tag = explode(",", $rec[0]["tag"]);
            $del_tag = explode(",", $tag);
            $src_cnt = count($src_tag);
            $del_cnt = count($del_tag);
            for ($i = 0; $i < $del_cnt; $i++)
            {
                $del_tag[$i] = trim($del_tag[$i]);
                for ($j = 0; $j < $src_cnt; $j++)
                {
                    if (!isset($src_tag[$j]))
                        continue;
                    $src_tag[$j] = trim($src_tag[$j]);
                    if ($src_tag[$j] == $del_tag[$i])
                    {
                        unset($src_tag[$j]);
                        $change = true;
                    }
                }
            }
            if ($change == true)
                $rec[0]["tag"] = implode(",", $src_tag);
            break;

        case "clean":
            if (!isset($rec[0]["tag"]) || (empty($rec[0]["tag"])))
                break;
            $rec[0]["tag"] = "";
            $change = true;
            break;

        case "get":
            $result = $rec[0]["tag"];
            break;

        default:
            die(ERR_MODE);
    }

    if ($change == true)
        write_rec_file($rec_file, $rec[0]);
    echo $result;
?>
