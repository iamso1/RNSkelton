<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");
    require_once("/data/HTTPD/htdocs/Admin/init.php");    

    /* 檢查 fun_ser.conf 是否存在,若存在就取得設定資料 */
    if (file_exists(FUN_SET_CONF))
        $fun_conf = read_conf(FUN_SET_CONF);

    /* 將功能設定項目,設定到樣版中 */
    $output = array();
    foreach($fun_item as $id => $name)
    {
        if ((isset($fun_conf[$id])) && ($fun_conf[$id] == NO))
            $output[$id] = false;
        else
            $output[$id] = true;
    }
    echo json_encode($output);
?>
