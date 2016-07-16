<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");
    define("MODE_START_TRAN", "start_tran");
    define("MODE_TRANING", "traning");
    define("MODE_END_TRAN", "end_tran");

    $acn = strtolower($_REQUEST["acn"]);
    $code = $_REQUEST["code"];
    $mode = $_REQUEST["mode"];

    if ((empty($acn)) || (empty($mode)))
        exit;
    /* 2014/7/19 新增,檢查是否為 Group Client 所上傳的資料 */
    if (empty($code))
    {
        /* 必須是 Group Server 且上傳的 acn 在 cs list 中才處理 */
        if (($group_mode != GROUP_SERVER) || (in_group_cs_list($acn) == false))
            exit;
        $rec_dir = GROUP_REC_DIR;
    }
    else
        $rec_dir = CHILD_REC_DIR;
    if ((!empty($code)) && ($code !== $set_conf["upload_code"]))
        exit;
    if (($mode !== MODE_START_TRAN) && ($mode !== MODE_TRANING) && ($mode !== MODE_END_TRAN))
        exit;
    if (!is_dir($rec_dir))
        mkdir($rec_dir);

    switch($mode)
    {
        case MODE_START_TRAN:
            if ($_FILES["file"]["error"] != UPLOAD_ERR_OK)
                exit;
            move_uploaded_file($_FILES["file"]["tmp_name"], $rec_dir.$acn);
            break;

        case MODE_TRANING:
            if ($_FILES["file"]["error"] != UPLOAD_ERR_OK)
                exit;
            file_put_contents($rec_dir.$acn, file_get_contents($_FILES["file"]["tmp_name"]), FILE_APPEND);
            break;
    }
    echo "ok";
?>
