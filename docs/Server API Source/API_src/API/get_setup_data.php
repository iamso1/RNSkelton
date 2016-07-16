<?php
    include("../Admin/init.php");

    $field = $_REQUEST["field"];

    /* 取得系統設定資訊 */
    $conf = read_conf(SETUP_CONFIG);

    /* 不可取得系統驗證碼的內容 */
    if ($field == "cache_pwd")
        die("Error: Permission denied!");
    /* 若要取得的欄位不存在就輸出錯誤訊息 */
    if (!isset($conf[$field]))
        die("Error: \"$field\" not exists!");
    /* 輸出要取得的欄位內容 */
    echo $conf[$field];
?>
