<?php
    require_once("/data/HTTPD/htdocs/tools/page/page_lib.php");

    $page_url = $_REQUEST["page_url"];

    /* 檢查參數 */
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    /* page_url 開頭必須是 / 且不可以有 ./ (過濾掉 ./ 連 ../ 也會過濾掉) */
    if ((substr($page_url, 0, 1) != "/") || (strstr($page_url, "./") != false))
        die(ERR_PAGE_URL);

    /* 檢查 page_url,並取得檔案位置 */
    if (($status = chk_page_url($page_url)) !== true)
        die($status);

    /* 若是檔案直接取回 record 中的 time 內容 */
    $update_time = 0;
    if (is_file($page_path))
        $update_time = get_rec_field($page_path, "time");

    /* 若是目錄,必須再檢查是否為功能目錄 */
    if (is_dir($page_path))
    {
        /* 若是功能目錄就直接取回目錄的 mtime */
        if (chk_function_dir($page_dir, $path_name))
            $update_time = date("YmdHis", filemtime($page_path));
        else
        {
            /* 找到 dir_index 的 current 檔案位置 */
            if (substr($page_path, -1) !== "/")
                $page_path .= "/";
            $dir_index_file = $page_path.NUWEB_REC_PATH.DIR_INDEX."/current";

            /* 若 index 檔存在且 size 大於 0,就從 dir index 中取回目錄內最後更新的時間 */
            if ((file_exists($dir_index_file)) && (real_filesize($dir_index_file) > 0))
            {
                /* 用 egrep 找出 index 中所需資料 */
                $cmd = "/bin/egrep \"@_f:|@time:\" $dir_index_file";
                $fp = popen($cmd, "r");
                while($buf = fgets($fp, MAX_BUFFER_LEN))
                {
                    $new_data = false;
                    $buf = trim($buf);
                    if ($buf == "")
                        continue;

                    list($key, $value) = explode(":", $buf);
                    if (empty($key) || empty($value))
                        continue;

                    /* @_f:Normal 代表是新資料 */
                    if ($key == "@_f")
                    {
                        if ($value == "Normal")
                            $new_data = true;
                        else
                            $new_data = false;
                    }

                    /* 若不是新資料,就不處理 */
                    if ($new_data !== true)
                        continue;

                    /* 取得 time 資料,並找出最後的更新時間 */
                    if (($key == "@time") && ($update_time < $value))
                        $update_time = $value;
                }
            }

            if ($update_time == 0)
                $update_time = date("YmdHis", filemtime($page_path));
        }
        echo $update_time;
    }

?>
