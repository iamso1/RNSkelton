<?php
    require_once("/data/HTTPD/htdocs/tools/page/page_lib.php");

    $page_url = $_REQUEST["page_url"];
    $sort_by = $_REQUEST["sort_by"];
    $sort_mode = $_REQUEST["sort_mode"];
    $type = $_REQUEST["type"];
    $offset = -1;
    $req_count = 0;
    if(isset($_REQUEST["offset"])) $offset = intval($_REQUEST["offset"]);
    if(isset($_REQUEST["req_count"])) $req_count = intval($_REQUEST["req_count"]);

    /* 檢查參數 */
    if (empty($page_url))
        die(EMPTY_PAGE_URL);
    /* page_url 開頭必須是 / 且不可以有 ./ (過濾掉 ./ 連 ../ 也會過濾掉) */
    if ((substr($page_url, 0, 1) != "/") || (strstr($page_url, "./") != false))
        die(ERR_PAGE_URL);
    /* sort_mode 預設為 A (ASC 遞增) */
    if ($sort_mode != "D")
        $sort_mode = "A";
    /* type 預設為 simple (簡單資訊) */
    if (empty($type))
        $type = TYPE_SIMPLE;

    /* 取得目錄或檔案的相關資訊,再用 json 格式輸出 */
    $output = get_page_info($page_url, $type, $sort_by, $sort_mode, $offset, $req_count);
    header("Content-type: text/javascript");
    echo json_encode($output);
?>
