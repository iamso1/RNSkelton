<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    if (isset($_REQUEST["name"]))
        $name = $_REQUEST["name"];

    /* 取得群組資料 */
    $group_alias = get_group_alias_list();
    if ((!isset($name)) || (empty($name)))
    {
        echo json_encode($group_alias);
        exit;
    }
    $output = NULL;
    $cnt = count($group_alias);
    for ($i = 0; $i < $cnt; $i++)
    {
        if ($group_alias[$i]["name"] == $name)
        {
            $output = $group_alias[$i];
            break;
        }
    }
    echo json_encode($output);
?>
