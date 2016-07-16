<?php
    include("../Admin/init.php");

    $mode = $_REQUEST["mode"];

    /* 取得註冊資訊 */
    $conf = read_conf(REGISTER_CONFIG);

    /* 若沒設定 acn 直接回傳錯誤 */
    if (!isset($conf["acn"]))
    {
        $info["error"] = "Error: acn not exists!";
        echo json_encode($info);
        exit;
    }

    /* 整理要輸出的系統資訊 */
    $info["acn"] = $conf["acn"];
    $info["sun"] = $conf["sun"];
    $info["OS"] = SYS_OS;
    $info["NUWEB_CS_VER"] = NUWEB_CS_VER;

    /* 若傳入的 mode=get_info 就輸出系統資訊,否則就只輸出 acn */
    if ($mode == "get_info")
        echo json_encode($info);
    else
        echo $conf["acn"];
?>
