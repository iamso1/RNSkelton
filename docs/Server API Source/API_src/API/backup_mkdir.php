<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    /* 取得並檢查參數 */
    $dir_url = $_REQUEST["dir_url"];
    if ((empty($dir_url)) || (substr($dir_url, 0, 1) != "/") || (strstr($dir_url, "./") != false))
        exit;
    /* 檢查是否為子網站 dir_path (僅提供子網站使用) */
    $dir_path = WEB_ROOT_PATH.$dir_url;
    $page_dir = WEB_ROOT_PATH."/".SUB_SITE_NAME."/";
    $l = strlen($page_dir);
    if ((substr($dir_path, 0, $l) !== $page_dir) || (strlen($dir_path) <= $l))
        exit;
    $d_path = substr($dir_path, $l);

    /* 檢查 backup_mode 若不是 BACKUP_TARGET 就不必處理 */
    $mode = get_backup_mode();
    if ($mode !== BACKUP_TARGET)
        exit;

    /* 依據 path 的目錄位置,逐層檢查下去,若沒有相同目錄就建立出相同目錄 */
    $path = explode("/", $d_path);
    $cnt = count($path);
    $now_path = WEB_ROOT_PATH."/".SUB_SITE_NAME;
    for ($i = 0; $i < $cnt; $i++)
    {
        $path[$i] = trim($path[$i]);
        if (empty($path[$i]))
            continue;
        $now_path .= "/".$path[$i];
        if (!is_dir($now_path))
            if (mkdir($now_path) == false)
                exit;
    }
    echo "ok";
?>
