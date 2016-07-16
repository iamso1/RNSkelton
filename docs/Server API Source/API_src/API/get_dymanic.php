<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");
    define("DBMAN", SEARCH_BIN_DIR."dbman");
    define("DYMANIC_INDEX_FILE", DYMANIC_INDEX_DIR."current");
    define("DEF_PS", 20);

    define("ERR_SITE_ACN", "Error: site_acn not found!");

    $p = intval($_REQUEST['p']);
    $ps = intval($_REQUEST['ps']);
    $mode = $_REQUEST["mode"];
    $site_acn = $_REQUEST["site_acn"];

    if ($p <= 0)
        $p = 1;
    if ($ps <= 0)
        $ps = DEF_PS;
    if ($mode !== "get")
        $mode = "put";
    if (!empty($site_acn))
    {
        if (!is_dir(WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn))
            die(ERR_SITE_ACN);
        $url = "http://".$reg_conf["acn"].".nuweb.cc/Site/$site_acn/";
    }
    else
        $url = NULL;
    $out = array();

    /* 取得登入 User 資料,若沒登入就不處理 */
    if (($user = get_login_user()) !== false)
    {
        $key = $user["acn"].",".$user["mail"];
        $out['recs'] = gd_main($key, $p, $ps, $mode, $url);
        $out['cnt'] = count($out['recs']);
    }
    print json_encode($out);

    /************/
    /* 函 數 區 */
    /************/

    /* 取得動態資料搜尋結果 */
    function gd_getData($key, $p, $ps, $mode, $url=NULL)
    {
        if ($p <= 0)
            $p = 1;
        if ($ps <= 0)
            $ps = DEF_PS;
        $start = ($p - 1) * $ps + 1;
        $end = $p * $ps;

        /* 設定 sort 預設值 */
        $sort_by = "upload_time";
        $sort_mode = "D";

        /* 依據 mode 設定 -tag 搜尋欄位 */
        if ($mode == "get")
            $tag_arg = "-tag \"@key:$key\"";
        else
            $tag_arg = "-tag \"@owner:$key\"";

        /* 若有傳送 url 必須設定 -select 搜尋該 url 內的資料 */
        if (empty($url))
            $select_arg = "";
        else
            $select_arg = "-select \"@url:$url\"";

        /* 執行搜尋功能取得結果 */
        $result = array();
        $n = 0;
        $l_arg = "-L $start-$end";
        $cmd = DBMAN." -recbeg \"@\\n@GAIS_Rec:\" $tag_arg -flag \"@_f:Normal\" $select_arg -sort -reverse -key \"@upload_time:\" $l_arg ".DYMANIC_INDEX_FILE;
        $fp = popen($cmd, "r");
        $result = "";
        while($buf = fgets($fp, 1024))
            $result .= $buf;
        pclose($fp);
        $result = str_replace("@\n@\n", "@\n", $result);

        /* 取得符合的筆數 */
        if (preg_match("#^total:\s*(\d+)#mi", $result, $m))
            $match_cnt = (int)$m[1];
        else
            $match_cnt = 0;

        /* 將搜尋結果轉成 array */
        $result_rec = B_Rec_Data2Recs($result);

        /* sort 資料再輸出 */
        //sort_array($result_rec, $sort_by, $sort_mode);
        return $result_rec;
    }

    // 主要的
    function gd_main($key, $p, $ps, $mode, $url=NULL)
    {
        $recs = array();
        $xend = $p * $ps + 5;
        $data_p = 0;
        $data_ps = 500;
        do {
            $data_p++;
            $data_recs = gd_getData($key, $data_p, $data_ps, $mode, $url);
            if (empty($data_recs) || !is_array($data_recs)) {
                break;
            }

            gd_con_data($recs, $data_recs);
        } while(count($recs) < $xend);
        
        if ($p < 1) $p = 1;
        if ($ps < 3) $ps = 3;
        $StartID = ($p-1)*$ps;
        return array_slice($recs, $StartID, $ps);
    }

    function gd_con_data(&$recsOut, $recsIn)
    {
        foreach($recsIn as $rec) {
            //if ($rec['type'] == "Directory") continue;
                
            $u_fp = gd_MakePath($rec['url']);
            $tu = strtotime($rec['upload_time']);

            $cnt = count($recsOut);
            $x = $cnt-1;
            for(; $x>=0; $x--)
            {
                $dir_rec = $recsOut[$x];
                $dir_tu = $dir_rec['t_last'];
//echo ($dir_tu - $tu).", tu=$tu, dir_tu=$dir_tu <br>";
                if ($dir_tu - $tu > 1800) { // 小於 30分鐘
                    $x = -1;
                    break;
                }
                // 同目錄
                if ($dir_rec['u_fp'] == $u_fp) {
                    break;
                }
            }
//echo "*** x=$x <br>";
            if ($x > -1) {
                $recsOut[$x]['t_last'] = $tu;
                $recsOut[$x]['cnt'] += 1;
                if ($recsOut[$x]['cnt'] <= 10) // 只取 10
                    $recsOut[$x]['files'][] = $rec;
            }
            else {
                $recDir = array();
                $recDir['t_first'] = $tu;
                $recDir['t_last'] = $tu;
                $recDir['u_fp'] = $u_fp;
                $recDir['v_fp'] = gd_MakePath($rec['view_path']);
                $recDir['cnt'] = 1;
                $recDir['files'][] = $rec;
                $recsOut[] = $recDir;
            }
        }
    }

    function gd_MakePath($u)
    {
        // del ?
        $x = strpos($u, "?");
        if ($x !== false)
            $u = substr($u, 0, $x);
        //
        $x = strrpos($u, "/");
        if ($x === false) return "";
        return substr($u, 0, $x);
    }

    /* 將 dbman 搜尋結果轉成 array */
    function B_Rec_Data2Recs($Data, $key=null, $bSort=true)
    {
        if (empty($Data)) return array();
        if (substr($Data, -1, 1) == "\n")
            $Data = substr($Data, 0, -1);

        $aData = explode("\n", $Data);
        $bKey = !empty($key);
        $ss = array();
        foreach($aData as $Data)
        {
            if (substr($Data, -1) == "\r")
                $Data = substr($Data, 0, -1);

            if (substr($Data, 0, 1) == "@")
            {
                $a = explode(":", $Data, 2);
                if ($a[0] == "@") {
                    if (!empty($s)) {
                        if ($bKey)
                            $ss[$s[$key]] = $s;
                        else
                            $ss[] = $s;
                    }
                    $s = array();
                }
                else {
                    $k = substr($a[0], 1);
                    $s[$k] = $a[1];
                }
            }
            else if (!empty($k))
                $s[$k] .= "\n".$Data;
        }
        if (!empty($s)) {
            if ($bKey)
                $ss[$s[$key]] = $s;
            else
                $ss[] = $s;
        }
        if ($bKey && $bSort) ksort($ss);
        return $ss;
    }

    /* sort 陣列資料 */
    function sort_array(&$data, $sort_key, $sort_mode="A")
    {
        $sorter = array();
        $ret = array();
        reset($data);
        foreach ($data as $key => $value)
            $sorter[$key] = $value[$sort_key];
        if ($sort_mode == "D")
            arsort($sorter);
        else
            asort($sorter);
        foreach ($sorter as $key => $value)
            array_push($ret, $data[$key]);
        $data = $ret;
    }
?>
