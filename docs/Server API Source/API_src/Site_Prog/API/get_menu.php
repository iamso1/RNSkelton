<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    $site = $_REQUEST["site"];
    $is_json = false;
    if (isset($_REQUEST["is_json"]) && $_REQUEST["is_json"] == "true")
        $is_json = true;
    $json_data = array();
    $site_path = WEB_PAGE_DIR.$site;

    /* 檢查網站是否存在 */
    if (!is_dir($site_path))
        exit;

    /* 尋找第一層目錄內是否有 .nuweb_menu 若有就取出來當 menu */
    $menu_file = WEB_PAGE_DIR.$site."/".NUWEB_MENU;
    if (file_exists($menu_file))
    {
        /* 取出 .nuweb_menu 的資料 */
        $menu = @file($menu_file);
        $menu_cnt = count($menu);
        for ($j = 0; $j < $menu_cnt; $j++)
        {
            $menu_path = $site."/".trim($menu[$j]);
            /* 找出 menu 的真實名稱 */
            $menu_name = get_file_name(WEB_PAGE_DIR, $menu_path);
            $file_list[$menu_path] = trim($menu[$j]);
            if ($is_json == false)
                echo $menu_name."\t".SITE_URL.$site."/".INDEX_PROG."?file_path=".$menu_path."/\n";
            else
                array_push($json_data, array("name"=>$menu_name, "url"=>SITE_URL.$menu_path));
        }
    }
    else
    {
        /* 取得目錄內第一層子目錄當成 menu */
        $level1_list = get_dir_file_list(WEB_PAGE_DIR.$site."/");
        foreach($level1_list as $path => $name)
        {
            /* 過濾掉非目錄 & symlink & .sync & *.files 目錄 */
            $file_path = WEB_PAGE_DIR.$path;
            if ((!is_dir($file_path)) || (is_link($file_path)) || ($name == SYNC_DIR) || (substr($name, -6) == ".files"))
                continue;
            if($is_json == false)
                echo $name."\t".SITE_URL.$site."/".INDEX_PROG."?file_path=".$path."/\n";
            else
                array_push($json_data, array("name"=>$name, "url"=>SITE_URL.$path));
        }
    }

    if($is_json == true)
        echo json_encode($json_data);
?>
