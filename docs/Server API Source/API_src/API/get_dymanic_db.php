<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    $ps = intval($_REQUEST['ps']);
    $q['gt'] = intval($_REQUEST['gt']);
    $q['lt'] = intval($_REQUEST['lt']);
    $q['ao'] = $_REQUEST['ao'];
    $q['do'] = $_REQUEST['do'];
    $q['as'] = $_REQUEST['as'];
    $q['ds'] = $_REQUEST['ds'];
    $q['au'] = $_REQUEST['au'];
    $q['du'] = $_REQUEST['du'];
    $q['kw'] = $_REQUEST['kw'];
    $mode = strtolower($_REQUEST['mode']);

    if ($mode == "group")
    {
        $out = array();
        $out = get_message_group($q);
        print json_encode($out);
        exit;
    }

    /* 2015/11/2 新增,使用 id 取得訊息資料 */
    if ($mode == "id")
    {
        $out = array();
        $out = get_message_by_id($_REQUEST['id']);
        print json_encode($out);
        exit;
    }

    /* 2015/12/2 新增,使用 url 取得訊息資料 */
    if ($mode == "url")
    {
        $out = array();
        $out = get_message_info($_REQUEST['id']);
        print json_encode($out);
        exit;
    }

    if ($ps <= 0)
        $ps = DEF_PS;
    $out = array();

    $out['recs'] = gd_main($ps, $q);
    $out['cnt'] = count($out['recs']);
    $out['time'] = time();
    print json_encode($out);

    /************/
    /* 函 數 區 */
    /************/

    // 主要的
    function gd_main($ps, $q)
    {
        $recs = array();
        $xend = $ps + 1;
        $data_p = 0;
        $data_ps = 500;

        do {
            $data_p++;
            /* 取得動態資料結果 */
            $data_recs = get_message($q, $data_p, $data_ps);
            if (empty($data_recs) || !is_array($data_recs))
                break;
            gd_con_data($recs, $data_recs);
        } while ((count($recs) < $xend) && (count($data_recs) == $data_ps));

        if ($ps < 3) $ps = 3;
        $StartID = 0;
        return array_slice($recs, $StartID, $ps);
    }

    function gd_con_data(&$recsOut, $recsIn)
    {
        foreach($recsIn as $rec)
        {
            /* 2014/12/24 新增,若 url 最後有 / 必須先過濾掉,以避免 group 整理時會造成誤判 */
            if (substr($rec['url'], -1) == "/")
                $rec['url'] = substr($rec['url'], 0, -1);
            /* 2014/12/25 新增,將 array 欄位資料轉換回 string 格式 */
            foreach ($rec as $key => $value)
            {
                if (is_array($value))
                    $rec[$key] = implode(",", $value);
            }

            $u_fp = gd_MakePath($rec['url']);
            $tu = strtotime($rec['upload_time']);

            $cnt = count($recsOut);
            $x = $cnt-1;
            for(; $x>=0; $x--)
            {
                $dir_rec = $recsOut[$x];
                $dir_tu = $dir_rec['t_last'];

                if ($dir_tu - $tu > 1800) // 小於 30分鐘
                {
                    $x = -1;
                    break;
                }
                // 同目錄
                if ($dir_rec['u_fp'] == $u_fp)
                    break;
            }

            if ($x > -1)
            {
                $recsOut[$x]['t_last'] = $tu;
                $recsOut[$x]['cnt'] += 1;
                if ($recsOut[$x]['cnt'] <= 10) // 只取 10
                    $recsOut[$x]['files'][] = $rec;
            }
            else
            {
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
?>
