<?php
    require_once("API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

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
    $page_dir = WEB_ROOT_PATH."/".SUB_SITE_NAME."/";
    $l = strlen($page_dir);
    if ((substr($file_path, 0, $l) !== $page_dir) || (strlen($file_path) <= $l))
        die(ERR_PAGE_URL);
    $path = substr($file_path, $l);

    /* 必須有瀏覽權限才能使用 */
    $right = chk_browse_right($page_dir, $path);
    if ($right !== PASS)
        die(ERR_NO_PERMISSION);

    $view_path = get_view_path($file_path);
    echo $view_path;
?>
