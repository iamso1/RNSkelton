<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得及檢查參數 */
    $url = $_REQUEST["url"];
    $code = $_REQUEST["code"];
    if (empty($url))
        exit;

    /* url 開頭必須是 / 且不可以有 ./ (過濾掉 ./ 連 ../ 也會過濾掉) */
    if ((substr($url, 0, 1) != "/") || (strstr($url, "./") != false))
        die(ERR_URL);
    /* 檢查 url 的實際位置是否存在,若不存在就不處理 */
    $path = WEB_ROOT_PATH.$url;
    $page_path = str_replace(WEB_PAGE_DIR, "", $path);
    if (!file_exists($path))
        die(ERR_URL);

    /* 若有傳入 code 參數,就設定成登入資料,檢查若不是網站管理者就無法使用 */
    if (!empty($code))
    {
        $login_user = get_login_user($code);
        /* 2015/3/19 修改,取消系統管理者檢查 */
        //$is_manager = chk_manager();
    }

    /* 檢查是否為網站管理者 */
    if ((empty($login_user)) || ($login_user == false) || (chk_manager_right($page_path) !== PASS))
        echo NO;
    else
        echo YES;
?>
