<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    require_once("/data/HTTPD/htdocs/API/edit_api_lib_p.php");

    /* 設定程式即使 timeout 或被 user 中斷,還是會執行到完成 */
    ignore_user_abort(true);
    set_time_limit(0);

    /* 取得所有可能的輸入參數 */
    $mode = $_REQUEST["mode"];
    $act = $_REQUEST["act"];
    $code = $_REQUEST["code"];
    $path = stripslashes($_REQUEST["path"]);
    $name = stripslashes($_REQUEST["name"]);
    $updfn = stripslashes($_REQUEST["updfn"]);
    $fmtime = $_REQUEST["fmtime"];
    $ssn_acn = $_COOKIE["ssn_acn"];
    $temp_dir = realpath(DIR_FILE_PART)."/";

    /* 判斷參數是否正確 */
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($path))
        die(EMPTY_PATH);
    if ($act != "update")
        $act = "new";
    if (($act == "new") && (empty($name)))
        die(EMPTY_NAME);
    if (($act == "update") && (empty($updfn)))
        die(EMPTY_UPDFN);
    if (empty($code))
        die(EMPTY_CODE);
    if (check_edit_code($code) == false)
        die(ERR_CODE);
    if (($act == "new") && (preg_match(FILE_NAME_CHK, $name)))
        die(ERR_NAME);

    $page_dir = WEB_PAGE_DIR;
    $page_url = SITE_URL;

    if (!is_dir($page_dir))
        die(ERR_DATA_PATH);
    chdir($page_dir);

    $file_path = $path;
    if (!is_dir($file_path))
        die(ERR_PATH);

    if (($file_path[0] == '/') || (strstr($file_path, "..") == $file_path))
        die(ERR_PATH);

    /* 依不同的 mode,執行不同的功能 */
    switch($mode)
    {
        case "up_f_p":
            m_up_f_p($page_dir, $page_url, $file_path, $name);
            break;
        case "up_f_pl":
            m_up_f_pl($page_dir, $page_url, $file_path, $name, $fmtime, $act, $updfn);
            break;
        default:
            die(ERR_MODE);
    }
?>
