<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");
    define("DBMAN", SEARCH_BIN_DIR."dbman");
    define("EVENT_INDEX_FILE", EVENT_INDEX_DIR."current");
    define("SELECT_ALLOW_ALL", SEARCH_BIN_DIR."allow_all");
    define("DEF_PS", 20);

    define("ERR_SITE_ACN", "Error: site_acn not found!");

    $p = intval($_REQUEST['p']);
    $ps = intval($_REQUEST['ps']);
    $of = intval($_REQUEST['of']);
    $site_acn = $_REQUEST["site_acn"];

    if ($p <= 0)
        $p = 1;
    if ($ps <= 0)
        $ps = DEF_PS;
    if (!empty($site_acn))
    {
        if (!is_dir(WEB_ROOT_PATH."/".SUB_SITE_NAME."/".$site_acn))
            die(ERR_SITE_ACN);
        //$url = "http://".$reg_conf["acn"].".nuweb.cc/Site/$site_acn/";
        //$url = "/Site/$site_acn/";
    }
    //else
    //    $url = NULL;
    $out = array();

    //$out['recs'] = gd_main($p, $ps, $of, $url);
    $out['recs'] = gd_main($p, $ps, $of, $site_acn);
    $out['cnt'] = count($out['recs']);
    print json_encode($out);

    /************/
    /* 函 數 區 */
    /************/

    /* 取得 Event 搜尋結果 */
    //function gd_getData($p, $ps, $of=0, $url=NULL)
    function gd_getData($p, $ps, $of=0, $site_acn=NULL)
    {
        Global $login_user, $is_manager, $reg_conf;

        if ($p <= 0)
            $p = 1;
        if ($ps <= 0)
            $ps = DEF_PS;
        $start = ($p - 1) * $ps + 1;
        $end = $p * $ps;

        /* 設定 sort 預設值 */
        $sort_by = "time";
        $sort_mode = "D";

        /* 若有傳送 url 必須設定 -select 搜尋該 url 內的資料 */
        //if (empty($url))
        //    $select_arg = "";
        //else
        //    $select_arg = "-select \"@url:$url\"";
        /* 若有傳送 site_acn 必須設定 -select 搜尋該 site_acn 內的資料 */
        $select_arg = "";
        $nselect_arg = "";
        if (!empty($site_acn))
        {
            $url = "/".SUB_SITE_NAME."/$site_acn/";
            $select_arg = "-select \"@url:$url\"";
            /* 取得網站成立時間,僅抓取從網站成立到目前的資料 (避免網站之前曾存在過或抓到已不存在的資料) */
            $start_time = get_rec_field(WEB_ROOT_PATH.$url, "time");
            $end_time = date("YmdHis");
            $nselect_arg = "-nselect \"@time:$start_time-$end_time\"";
        }

        /* 設定 mselect 參數 (依登入帳號設定,若未登入一律只找 ALLOW_ALL 的資料) */
        $mselect_arg = "";
        if ((empty($login_user)) || (empty($login_user["acn"])))
            $mselect_arg = "-mselect \"@allow:\" ".SELECT_ALLOW_ALL;
        else
        {
            /* 檢查若是系統管理者可查所有資料,不必再用 mselect 參數 */
            if ($is_manager !== true)
            {
                /* 分別取出所管理與已加入成員的子網站 list */
                $manage_site = get_manage_site();
                $member_site = get_member_site();

                $mselect_file = tempnam(TMP_DIR, "event_");
                $fp = fopen($mselect_file, "w");
                fputs($fp, ALLOW_ALL."\n");

                /* 若有管理子網站,搜尋時必須加上子網站管理者設定資料 */
                if (!empty($manage_site))
                {
                    $s_cnt = count($manage_site);
                    for ($i = 0; $i < $s_cnt ; $i++)
                    {
                        /* 設定 {網站 acn}_manager 代表可查到僅開放給網站管理者看的 event 資料 */
                        fputs($fp, $manage_site[$i]."_manager\n");
                        /* 2014/12/15 新增,增加所管理子網站的帳號 ($site_acn.$cs),這樣才能找到所管理網站的 event 資料 */
                        fputs($fp, $manage_site[$i].".".$reg_conf["acn"]."\n");
                    }
                }

                /* 若是子網站成員,搜尋時必須加上子網站成員設定資料 */
                if (!empty($member_site))
                {
                    $s_cnt = count($member_site);
                    for ($i = 0; $i < $s_cnt ; $i++)
                    {
                        /* 設定 {網站 acn}_member 代表可查到僅開放給網站成員看的 event 資料 */
                        fputs($fp, $member_site[$i]."_member\n");
                        /* 2014/12/15 新增,增加所管理子網站的帳號 ($site_acn.$cs),這樣才能找到已是成員的網站 event 資料 */
                        fputs($fp, $member_site[$i].".".$reg_conf["acn"]."\n");
                    }
                }

                fclose($fp);
                $mselect_arg = "-mselect \"@allow:\" $mselect_file";
            }
        }

        /* 執行搜尋功能取得結果 */
        $result = array();
        $n = 0;
        $l_arg = "-L $start-$end";
        $begoff_arg = "";
        if ($of > 0)
            $begoff_arg = "-begoff $of";
        $cmd = DBMAN." -recbeg \"@\\n@GAIS_Rec:\" -flag \"@_f:Normal\" $select_arg $nselect_arg $mselect_arg -sort -reverse -key \"@time:\" $l_arg $begoff_arg ".EVENT_INDEX_FILE;
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

        /* 刪除 mselect 暫存檔 */
        if ((!empty($mselect_file)) && (file_exists($mselect_file)))
            unlink($mselect_file);

        /* sort 資料再輸出 */
        //sort_array($result_rec, $sort_by, $sort_mode);
        return $result_rec;
    }

    // 主要的
    function gd_main($p, $ps, $of, $url=NULL)
    {
        $recs = array();
        $xend = $p * $ps + 5;
        $data_p = 0;
        //$data_ps = 500;
        $data_ps = $ps * 10;
        do {
            $data_p++;
            $data_recs = gd_getData($data_p, $data_ps, $of, $url);
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
            //$tu = strtotime($rec['upload_time']);
            $tu = strtotime($rec['time']);

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
?>
