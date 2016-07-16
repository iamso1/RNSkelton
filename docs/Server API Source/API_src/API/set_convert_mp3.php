<?php
    require_once("API_init.php");

    if (empty($_REQUEST["url_list"]))
        exit;
    $url_list = explode(",", $_REQUEST["url_list"]);
    $cnt = count($url_list);
    for ($i = 0; $i < $cnt; $i++)
        set_convert_mp3(WEB_ROOT_PATH.$url_list[$i]);
    echo "ok";

    function set_convert_mp3($file)
    {
        Global $fe_type;

        /* 檔案不存在或非網站管理者就不處理 */
        if ((!file_exists($file)) || (chk_site_manager($file) != true))
            return false;
        /* 若非 Video 或 Audio 檔也不處理 */
        $fe = strtolower(substr($file, strrpos($file, ".")));
        if (($fe_type[$fe] != VIDEO_TYPE) && ($fe_type[$fe] != AUDIO_TYPE))
            return false;
        /* 加入 convert mp3 list 中 */
        add_convert_mp3_list($file);
    }
?>
