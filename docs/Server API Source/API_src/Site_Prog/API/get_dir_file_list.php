<?php
    /* 定義錯誤訊息 */
    define("EMPTY_PATH", "Error: empty path!");
    define("ERR_PATH", "Error: path isn't exist!");
    define("ERR_DATA_PATH", "Error: data path isn't exist!");

    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得所有可能的輸入參數 */
    $path = stripslashes($_REQUEST["path"]);
    $type = $_REQUEST["type"];

    /* 判斷參數是否正確 */
    if (empty($path))
        die(EMPTY_PATH);
    if (substr($path, -1) == "/")
        $path = substr($path, 0, -1);
    /* type = simple 代表只輸出簡單資料,否則輸出較完整資料 */
    if ($type == "simple")
        $simple_type = true;

    /* 設定相關目錄位置 */
    $page_dir = WEB_PAGE_DIR;
    if (!is_dir($page_dir))
        die(ERR_DATA_PATH);
    $dir_path = $page_dir.$path;
    if (!is_dir($dir_path))
        die(ERR_PATH);

    /* 檢查瀏覽權限 */
    $b_right = chk_browse_right($page_dir, $path);
    if ($b_right != PASS)
        err_header($b_right);

    /* 檢查是否為功能目錄,若是就把目錄內所有 file 都列出來 (會自動過濾部份不需要的檔案) */
    if (chk_function_dir($page_dir, $path) == true)
    {
        $real_flist = get_real_file_list($page_dir, $dir_path);
        $f_cnt = count($real_flist);
        for ($i = 0; $i < $f_cnt; $i++)
        {
            /* 取出真實檔名 */
            $n = strrpos($real_flist[$i], "/");
            if ($n === false)
                $real_filename = $real_flist[$i];
            else
                $real_filename = substr($real_flist[$i], $n+1);

            /* type = simple 只輸出檔案位置與真實檔名,否則多輸出檔案大小與檔案修改時間 */
            if ($simple_type == true)
                echo $real_flist[$i]."\t$real_filename\n";
            else
            {
                /* 若是功能目錄內的子目錄,回傳的檔案大小用預設的 FUNCTION_DIR_SIZE (-1) */
                if (is_dir($page_dir.$real_flist[$i]))
                    $file_size = FUNCTION_DIR_SIZE;
                else
                    $file_size = real_filesize($page_dir.$real_flist[$i]);
                $file_mtime = filemtime($page_dir.$real_flist[$i]);
                echo $real_flist[$i]."\t$real_filename\t$file_size\t$file_mtime\n";
            }
        }
        return;
    }

    /* 取得目錄的 file.list 並找出符合的資料,若有問題或是沒資料就離開 */
    $path_name = get_dir_file_list($dir_path);
    if (($path_name == false) || empty($path_name))
        return;
    $path_len = strlen($path)+1;
    foreach($path_name as $filename => $title)
    {
        /* 處理檔案 */
        $page_path = $page_dir.$filename;
        if (is_file($page_path))
        {
            /* type = simple 只輸出檔案位置與真實檔名,否則多輸出檔案大小與檔案修改時間 */
            if ($simple_type == true)
                echo $filename."\t".$title."\n";
            else
            {
                /* 取得 record file 資料 */
                $rec_file = get_file_rec_path($page_path);
                $rec = rec2array($rec_file);
                echo $filename."\t".$title."\t".$rec[0]["size"]."\t".datetime_mktime($rec[0]["mtime"])."\n";
            }
        }

        /* 處理子目錄 */
        if (is_dir($page_path))
        {
            /* type = simple 只輸出檔案位置與真實檔名,否則多輸出檔案大小與檔案修改時間 */
            if ($simple_type == true)
                 echo $filename."\t".$title."\n";
            else
            {
                /* 檢查目錄內是否有預設的首頁,若有則用預設首頁取得檔案大小與檔案修改時間,若沒有此2欄位自動設為 0 */
                if (is_file($page_path."/".DEF_HTML_PAGE))
                    echo $filename."\t".$title."\t".real_filesize($page_path."/".DEF_HTML_PAGE)."\t".filemtime($page_path."/".DEF_HTML_PAGE)."\n";
                else
                    echo $filename."\t".$title."\t0\t0\n";
            }
        }
    }
?>
