<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得並檢查參數 */
    $site_acn = $_REQUEST["site_acn"];
    $update = $_REQUEST["update"];
    $mode = $_REQUEST["mode"];
    if (empty($site_acn))
        die(EMPTY_SITE_ACN);
    $site_dir = WEB_PAGE_DIR.$site_acn;
    if (!is_dir($site_dir))
        die(ERR_SITE_ACN);
    /* 2015/7/8 新增 update 參數 */
    if (($update == 1) || ($update == YES))
        $update = true;
    else
        $update = false;
    /* 2015/7/16 新增 mode 參數 */
    if ($mode !== "all")
        $mode = "total";

    $info = get_quota_info($site_acn, $update, NULL, $mode);
    if ($info == false)
        die(ERR_SITE_ACN);
    echo json_encode($info);
?>
