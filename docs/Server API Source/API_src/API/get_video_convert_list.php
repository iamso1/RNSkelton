<?php
    require_once("API_init.php");

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

    $convert_list = get_video_convert_list($file_path);
    if ($convert_list === false)
        die(ERR_PAGE_URL);
    echo json_encode($convert_list);
?>
