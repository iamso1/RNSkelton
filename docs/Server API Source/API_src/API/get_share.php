<?php
    require_once("API_init.php");
    define("DBMAN", SEARCH_BIN_DIR."dbman");
    define("SHARE_INDEX_FILE", SEARCH_INDEX_DIR."Share/current");
    define("DEF_PS", 20);

    $fun = $_REQUEST["fun"];
    if (empty($fun))
        $fun = "all";
    if (($fun !== "share") && ($fun !== "use_acn") && ($fun !== "all"))
        die(ERR_FUN);

    /* 取得 login user 資料,若未 login 就不執行 */
    $user = get_login_user();
    if ($user == false)
        exit;

    /* 執行搜尋功能取得結果 */
    $result = array();
    $n = 0;
    $select_arg = NULL;
    if ($fun !== "all")
        $select_arg = "-select \"@fun:$fun\"";
    $key = $user["acn"].",".$user["mail"];
    $cmd = DBMAN." -recbeg \"@\\n@GAIS_Rec:\" $select_arg -tag \"@key:$key\" -flag \"@_f:Normal\" -sort ".SHARE_INDEX_FILE;
    $fp = popen($cmd, "r");
    while($buf = fgets($fp, 1024))
    {
        $buf = trim($buf)."\n";
        if ($buf == "\n")
            continue;

        /* 整理輸出結果 */
        /* 若是 @\n 代表是新的一筆資料,將相關變數清空 */
        if ($buf == "@\n")
        {
            $url = NULL;
            $view_path = NULL;
            $name = NULL;
            $time = NULL;
            $acn = NULL;
            $type = NULL;
            $share_code = NULL;
            $key = NULL;
            $content = NULL;
            $in_content = false;
            continue;
        }

        /* 整理 record 各欄位資料 */
        if (strstr($buf, "@url:") === $buf)
            $url = trim(substr($buf, 5));
        if (strstr($buf, "@view_path:") === $buf)
            $view_path = trim(substr($buf, 11));
        if (strstr($buf, "@name:") === $buf)
            $name = trim(substr($buf, 6));
        if (strstr($buf, "@fun:") === $buf)
            $fun = trim(substr($buf, 5));
        if (strstr($buf, "@time:") === $buf)
            $time = trim(substr($buf, 6));
        if (strstr($buf, "@acn:") === $buf)
            $acn = trim(substr($buf, 5));
        if (strstr($buf, "@type:") === $buf)
            $type = trim(substr($buf, 6));
        if (strstr($buf, "@share_code:") === $buf)
            $share_code = trim(substr($buf, 12));
        if (strstr($buf, "@key:") === $buf)
            $key = trim(substr($buf, 5));
        /* content 可能有多行要處理 */
        if (strstr($buf, "@content:") === $buf)
        {
            $in_content = true;
            $content = trim(substr($buf, 9))."\n";
        }
        if ($in_content === true)
        {
            if ($buf[0] == "@")
               $in_content = false;
            else
               $content .= trim($buf)."\n";
        }

        /* 若是 @_A: 代表 record 結束,若 url 不是空的就要將各欄位資料放進 result 中 */
        if ((strstr($buf, "@_A:") === $buf) && (!empty($url)))
        {
            $result[$n]["url"] = $url;
            $result[$n]["view_path"] = $view_path;
            $result[$n]["name"] = $name;
            $result[$n]["fun"] = $fun;
            $result[$n]["time"] = $time;
            $result[$n]["acn"] = $acn;
            $result[$n]["type"] = $type;
            if (!empty($share_code))
                $result[$n]["share_code"] = $share_code;
            $result[$n]["key"] = $key;
            if (!empty($content))
                $result[$n]["content"] = $content;
            $n++;
        }
    }
    echo json_encode($result);
?>
