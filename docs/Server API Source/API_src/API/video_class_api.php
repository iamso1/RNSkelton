<?php
    require_once("/data/HTTPD/htdocs/Admin/init.php");
    require_once(TEMPLATE_LIB);

    /* 定義影音類別設定檔與預設影音類別檔位置 */
    define("VIDEO_CLASS", "/data/NUWeb_Site/List/video_class.list");
    define("DEF_VIDEO_CLASS", "/data/NUWeb_Site/List/def_video_class.list");
    /* 定義樣板目錄 */
    define("TPL_DIR", "Template/");

    $lang = strtolower($_REQUEST["lang"]);
    $mode = strtolower($_REQUEST["mode"]);
    $content = $_REQUEST["content"];

    /* 先取得 lang list (語系列表) */
    $lang_list = get_lang_list();

    switch($mode)
    {
        /* 儲存 video class 設定 */
        case "save":
            /* 僅管理者可執行 */
            /* 2015/3/19 修改,系統管理者(目前已不使用)或後端管理者才可執行 */
            if (($is_manager) || ($admin_manager))
                save_video_class($content);
            break;
        /* 顯示 video class 設定畫面 */
        case "set":
            /* 僅管理者可執行 */
            /* 2015/3/19 修改,系統管理者(目前已不使用)或後端管理者才可執行 */
            if (($is_manager) || ($admin_manager))
                set_video_class($lang_list, $lang);
            break;
        /* 輸出 video class 內容 */
        default:
            /* 取得 video class 資料 */
            $video_class = read_video_class($lang_list);
            /* 依據 lang 參數輸出 video class 內容,若未傳入 lang 就全部輸出 */
            output_video_class($video_class, $lang_list, $lang);
    }

    /************/
    /* 函 數 區 */
    /************/

    /* 取得 lang list */
    function get_lang_list()
    {
        $buf = @file(LANG_LIST);
        $cnt = count($buf);
        /* 第一個 lang 預設為 eng */
        $lang_cnt = 0;
        $lang_list[$lang_cnt++] = "eng";
        for ($i = 0; $i < $cnt; $i++)
        {
            list($lang_mode, $lang_name) = explode("\t", strtolower(trim($buf[$i])));
            if ($lang_mode != "eng")
                $lang_list[$lang_cnt++] = $lang_mode;
        }
        return $lang_list;
    }

    /* 讀取 video class 資料 */
    function read_video_class($lang_list)
    {
        /* 若沒有 video class list,就用預設的 video class */
        if (!file_exists(VIDEO_CLASS))
            $class_file = DEF_VIDEO_CLASS;
        else
            $class_file = VIDEO_CLASS;

        $lang_cnt = count($lang_list);

        /* 取出 video class */
        $buf = @file($class_file);
        $cnt = count($buf);
        for ($i = 0; $i < $cnt; $i++)
        {
            $v_class = explode(",", trim($buf[$i]));
            for ($j = 0; $j < $lang_cnt; $j++)
            {
                $v_class[$j] = trim($v_class[$j]);
                /* 檢查是否有設定該語系的類別,若沒有就用預設的 eng 類別 */
                if (!empty($v_class[$j]))
                    $video_class[$i][$lang_list[$j]] = $v_class[$j];
                else
                    $video_class[$i][$lang_list[$j]] = $v_class[0];

            }
        }
        return $video_class;
    }

    /* 輸出 video class */
    function output_video_class($video_class, $lang_list, $lang="")
    {
        $class_cnt = count($video_class);
        $lang_cnt = count($lang_list);
        $content = "";
        for ($i = 0; $i < $class_cnt; $i++)
        {
            /* 如果沒傳入 lang 參數,就將所有 video class 資料都輸出,若有傳入 lang 參數,則僅顯示該語系的 video class 資料 */
            if (empty($lang))
            {
                /* 第一欄位為英文資料 */
                $content .= $video_class[$i]["eng"];
                /* 依序為其他語系,各語系間用逗號隔開 */
                for ($j = 1; $j < $lang_cnt; $j++)
                    $content .= ",".$video_class[$i][$lang_list[$j]];
                $content .= "\n";
            }
            else
                $content .= $video_class[$i][$lang]."\n";
        }
        echo $content;
    }

    /* 儲存 video class 資料 */
    function save_video_class($content)
    {
        $fp = fopen(VIDEO_CLASS, "w");
        fputs($fp, $content);
        fclose($fp);
        echo "ok";
    }

    /* 顯示設定 video class 畫面 */
    function set_video_class($lang_list, $lang="")
    {
        Global $PHP_SELF;

        /* 預設使用中文顯示 */
        if (empty($lang))
            $lang = "cht";

        /* 若沒有 video class list,就用預設的 video class */
        if (file_exists(VIDEO_CLASS))
            $content = implode("", @file(VIDEO_CLASS));
        else
            $content = implode("", @file(DEF_VIDEO_CLASS));

        /* 依 lang 設定取得並顯示 video class 設定畫面樣板 */
        require_once(TPL_DIR."video_class_set.tpl.$lang");
    }
?>
