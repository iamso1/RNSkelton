<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得所有可能的輸入參數 */
    $site_acn = strtolower($_REQUEST["site_acn"]);
    if (isset($_REQUEST["tpl"]))
        $tpl = $_REQUEST["tpl"];
    else
        $tpl = NULL;

    /* 判斷參數是否正確 */
    if (empty($site_acn))
        die(EMPTY_SITE_ACN);
    $site_dir = WEB_PAGE_DIR.$site_acn;
    if (!is_dir($site_dir))
        die(ERR_SITE_ACN);
    /* 檢查 tpl 是否存在,若不存在就不處理 */
    if (site_tpl_exists($tpl) === false)
        die(ERR_TPL);

    /* 檢查是否為管理者,只有管理者可使用 */
    if (chk_manager_right($site_acn) !== PASS)
        die(ERR_NO_PERMISSION);

    /* 更新 .nuweb_dir_set 內容,若 tpl 為空的,代表使用預設版型,需刪除 .nuweb_dir_set */
    $dir_set_file = $site_dir."/".NUWEB_DIR_SET;
    if ((empty($tpl)) && (file_exists($dir_set_file)))
        unlink($dir_set_file);
    if (!empty($tpl))
    {
        $dir_set["type"] = TYPE_PAGE_DIR;
        $dir_set["tpl_mode"] = $tpl;
        $dir_set["def_frame"] = NO; /* 有傳入 tpl_mode 代表要使用特殊樣版,一律將 def_frame 設為 N */
        write_conf($dir_set_file, $dir_set);
    }
    echo "ok";
?>
