<?php
    require_once("API_init.php");

    $mode = $_REQUEST["mode"];
    $path = $_REQUEST["path"];
    $site_acn = $_REQUEST["site_acn"];
    $site_path = WEB_ROOT_PATH."/".SUB_SITE_NAME."/";

    /* 檢查參數 */
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($path))
        die(EMPTY_PATH);

    /* 依 mode 執行功能 */
    switch($mode)
    {
        case "f2v":
            $file_path = $site_path.$path;
            if (!file_exists($file_path))
                die(ERR_PATH);
            $v_path = get_view_path($file_path);
            if ($v_path == false)
                die(ERR_PATH);
            echo $v_path;
            break;

        case "v2f":
            if (empty($site_acn))
                die(EMPTY_SITE_ACN);
            $site_path = WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn."/";
            if (!is_dir($site_path))
                die(ERR_SITE_ACN);
            $f_path = view_path_to_file_path($site_acn, $path);
            if ($f_path == false)
                die(ERR_PATH);
            echo $f_path;
            break;

        default:
            die(ERR_MODE);
    }
?>
