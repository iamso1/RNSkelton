<?php
    define("EMPTY_SITE", "Error: empty site!");
    define("ERR_DATA_PATH", "Error: data path isn't exist!");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    Global $table_list, $table_cnt;

    /* 取得所有可能的輸入參數 */
    $site = $_REQUEST["site"];

    if (empty($site))
        die(EMPTY_SITE);
    /* site 不可以有 . 並檢查帳號是否已經存在 */
    if ((strstr($site, ".") != false) || (site_exists(WEB_PAGE_DIR, $site) != true))
        die(ERR_SITE_NOT_EXISTS);

    /* 設定資料儲存目錄位置 */
    $page_dir = WEB_PAGE_DIR;
    if (!is_dir($page_dir))
        die(ERR_DATA_PATH);

    /* 取得 table list 的資料 */
    $site_dir = $page_dir.$site;
    $table_list = get_table_list($page_dir, $site_dir);
    /* 將 table list 逐筆整理輸出 */
    for ($i = 0; $i < $table_cnt; $i++)
        echo $table_list[$i]."\t".get_view_path($page_dir.$table_list[$i])."\n";
?>
