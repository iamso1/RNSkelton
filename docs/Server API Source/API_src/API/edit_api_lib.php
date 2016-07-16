<?php
    require_once("API_init.php");
    define("DEF_HTML_PAGE", "index.html");

    /* 2014/12/23 新增 ud 參數,若 ud=N 代表不上傳動態訊息 */
    if (strtoupper($_REQUEST["ud"]) == NO)
        $u_dymanic = false;
    else
        $u_dymanic = true;

    /************/
    /*  函數區  */
    /************/

    /* 用 cookie 檢查是否為 group user */
    function check_user($ssn_acn)
    {
        /* 分解登入 user 的 cookie (ssn_acn) 資料 */
        list($uid, $uacn) = explode(":", $ssn_acn);
        /* 取得 group user list 的資料 */
        $user_list = @file(GROUP_USER_LIST);
        $user_cnt = count($user_list);
        for ($i = 0; $i < $user_cnt; $i++)
        {
            /* 將 group user 資料分解出來 */
            list($id, $acn, $mail) = explode("\t", trim($user_list[$i]));
            /* 檢查登入的 user 是否為 group user */
            if (($id == $uid) && ($acn = $uacn))
                return true;
        }
        return false;
    }

    /* 建立目錄 */
    function create_dir($page_dir, $page_url, $file_path, $name, $dir_type, $hidden=false)
    {
        /* 檢查上傳權限 */
        $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 建立新目錄 */
        $dir = new_dir($page_dir, $file_path, $name, $dir_type, NULL, $hidden);
        if ($dir == false)
            die(ERR_CREATE_DIR);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$dir, "dir");

        echo $page_url.$dir;
    }

    /* 建立目錄 (不寫入 file list,提供功能目錄 sync 用) */
    function create_sync_dir($page_dir, $page_url, $file_path, $name)
    {
        /* 檢查上傳權限 */
        $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 檢查目錄是否已存在,若不存在就建立 */
        $dir = str_replace("//", "/", "$file_path/$name");
        $real_dir = $page_dir.$dir."/";
        if (!is_dir($real_dir))
        {
            if (mkdir($real_dir) == false)
                die(ERR_CREATE_DIR);
        }

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$dir, "dir");

        echo $page_url.$dir;
    }

    /* 建立文章 */
    function create_article($page_dir, $page_url, $file_path, $name, $content, $fmtime="")
    {
        Global $u_dymanic;

        /* 檢查上傳權限 */
        $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 建立新文章 */
        $file = new_article($page_dir, $file_path, $name, $content, $fmtime);
        if ($file == false)
            die(ERR_CREATE_ARTICLE);

        /* 檢查並上傳動態 share record */
        if ($u_dymanic != false)
            upload_dymanic_share_rec($page_dir, $file, "new");

        /* 記錄 upload log */
        write_upload_log($page_url.$file);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$file, "html");

        echo $page_url.$file;
    }

    /* 更新文章 */
    function update_article($page_dir, $page_url, $file_path, $name, $content, $fmtime="", $fname=NULL)
    {
        Global $u_dymanic;

        /* 檢查上傳權限 */
        $file = str_replace("//", "/", $file_path."/".$name);
        $u_right = chk_upload_right($page_dir, $file);
        if ($u_right != PASS)
            err_header($u_right);

        /* 檢查文章檔案是否存在,不存在就顯示錯誤 */
        if (!is_file($file))
            die(ERR_FILE);

        /* 檢查目前網站使用空間是否超出 quota,若已超出就不可更新文章 */
        list($site_acn, $other) = explode("/", $file_path, 2);
        $status = chk_site_quota($site_acn);
        if ($status === QUOTA_OVER)
            die(ERR_QUOTA_OVER);
        if ($status === SYSTEM_QUOTA_OVER)
            die(ERR_SYSTEM_QUOTA_OVER);

        /* 先取得原文章 size */
        //$src_size = get_use_space($page_dir.$file);
        $src_size = real_filesize($page_dir.$file);

        /* 將原本的文章建立新版本 */
        set_file_ver($page_dir.$file);

        /* 更新文章內容 */
        $fp = fopen($file, "w");
        fputs($fp, $content);
        fclose($fp);

        /* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
        if (!empty($fmtime))
            touch($page_dir.$file, $fmtime);

        /* 更新文章的 record 檔 */
        /* 2015/3/6 修改,增加 fname 參數,代表要修改檔名,直接將 fname 傳入 write_def_recrod 的參數中,進行 rename 工作 */
        if ($name !== DEF_HTML_PAGE)
            $file_path = $file;
        write_def_record($page_dir, $file_path, $fname, true);

        /* 更新使用的空間 */
        update_use_space($page_dir, $file, MODE_UPDATE, $src_size);

        /* 檢查並上傳動態 share record */
        if ($u_dymanic != false)
            upload_dymanic_share_rec($page_dir, $file_path, "update");

        /* 記錄 upload log */
        write_upload_log($page_url.$file, "update");

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("update", $page_dir.$file, "html");

        echo $page_url.$file;
    }

    /* 讀取文章 */
    function read_article($page_dir, $file_path, $name)
    {
        /* 檢查瀏覽權限 */
        $file = str_replace("//", "/", $file_path."/".$name);
        $b_right = chk_browse_right($page_dir, $file);
        if ($b_right != PASS)
            err_header($b_right);

        /* 檢查文章檔案是否存在,不存在就顯示錯誤 */
        if (!is_file($file))
            die(ERR_FILE);

        readfile($file);
    }

    /* 上傳檔案 */
    function upload_file($type, $page_dir, $page_url, $file_path, $fmtime="", $name="")
    {
        Global $u_dymanic;

        /* 檢查上傳權限 */
        if ((!empty($name)) && ($type !== "new"))
            $chk_file_path = str_replace("//", "/", $file_path."/".$name);
        else
            $chk_file_path = $file_path;
        $u_right = chk_upload_right($page_dir, $chk_file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 檢查目前網站使用空間是否超出 quota,若已超出就不可上傳檔案 */
        list($site_acn, $other) = explode("/", $file_path, 2);
        $status = chk_site_quota($site_acn);
        if ($status === QUOTA_OVER)
            die(ERR_QUOTA_OVER);
        if ($status === SYSTEM_QUOTA_OVER)
            die(ERR_SYSTEM_QUOTA_OVER);

        switch ($_FILES["file"]["error"])
        {
            case UPLOAD_ERR_OK:            /* 沒有錯誤 */
                break;
            case UPLOAD_ERR_INI_SIZE:
                die(ERR_UPLOAD_INI_SIZE);
            case UPLOAD_ERR_FORM_SIZE:
                die(ERR_UPLOAD_FORM_SIZE);
            case UPLOAD_ERR_PARTIAL:
                die(ERR_PARTIAL);
            case UPLOAD_ERR_NO_FILE:
                die(ERR_NO_FILE);
            case UPLOAD_ERR_NO_TMP_DIR:
                die(ERR_UPLOAD_NO_TMP_DIR);
            case UPLOAD_ERR_CANT_WRITE:
                die(ERR_UPLOAD_CANT_WRITE);
            case UPLOAD_ERR_EXTENSION:
                die(ERR_EXTENSION);
            default:
                die(ERR_UPLOAD_OTHER);
        }

        /* 取得最後要儲存的 filename,以及使用空間 */
        if ($type == "update")
        {
            $modify_mode = $type;
            $modify_type = "file";

            $file = str_replace("//", "/", $file_path."/".$name);
            /* 若檔案不存在就輸出錯誤訊息,否則就先刪除檔案 */
            if (!is_file($file))
                die(ERR_FILE);

            /* 先取出原檔案的使用空間 */
            //$src_size = get_use_space($page_dir.$file);
            $src_size = real_filesize($page_dir.$file);

            /* 將原本的檔案建立新版本 */
            set_file_ver($page_dir.$file);
            unlink($file);

            /* 取得檔案真實名稱 */
            $page_filename = get_file_name($page_dir, $file);
        }
        if ($type == "sync_data")
        {
            $modify_mode = "new";
            $modify_type = $type;

            $file = str_replace("//", "/", $file_path."/".$name);
            /* 若檔案已存在就先取得原使用空間並刪除檔案 */
            if (file_exists($file))
            {
                $modify_mode = "update";
                //$src_size = get_use_space($page_dir.$file);
                $src_size = real_filesize($page_dir.$file);
                unlink($file);
            }
            else
                $src_size = 0;
        }
        if ($type == "new")
        {
            $modify_mode = $type;
            $modify_type = "file";

            /* 2013/10/25 修改,若有傳入 name 就直接設為檔名,否則就取得檔案真實名稱 */
            if (!empty($name))
                $page_filename = $name;
            else
                $page_filename = $_FILES["file"]["name"];
            /* 建立空的新檔案 */
            $file = new_file($page_dir, $file_path, $page_filename);
            if ($file == false)
                die(ERR_CREATE_FILE);
            $src_size = 0;
        }
        /* 將上傳的檔案存入 file 中 */
        if (!move_uploaded_file($_FILES["file"]["tmp_name"], $file))
            die(ERR_UPLOAD_FILE);

        /* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
        if (!empty($fmtime))
            touch($page_dir.$file, $fmtime);

        echo $page_url.$file;

        /* 如果是 sync data file 就先更新使用空間然後離開,不必進行下列的處理 */
        if ($type == "sync_data")
        {
            /* 2014/9/5 新增,紀錄到 modify.list 中 */
            write_modify_list($modify_mode, $page_dir.$file, $modify_type);

            update_use_space($page_dir, $file, MODE_UPDATE, $src_size);
            return;
        }

        /* 檢查是否為 video 檔,若是就進行轉 flv 檔 */
        chk_video_file($page_dir, $file);

        /* 檢查是否為 image 檔,若是就建立縮圖 */
        set_img_tn($page_dir, $file);

        /* 20150503 新增,檢查是否為 Audio 檔,若是就轉出 mp3 檔案 */
        audio2mp3($page_dir.$file);

        /* 2014/9/9 取消,改由 modify.list 紀錄進行處理 */
        /* 檢查是否為文件檔,若是就轉出 pdf 檔 */
        //chk_doc_file($page_dir, $file);

        /* 建立檔案的 record 檔 */
        write_def_record($page_dir, $file, $page_filename, true);

        /* 更新使用的空間 */
        update_use_space($page_dir, $file, MODE_UPDATE, $src_size);

        /* 檢查並上傳動態 share record */
        if ($u_dymanic != false)
            upload_dymanic_share_rec($page_dir, $file, $type);

        /* 記錄 upload log */
        if ($type == "update")
            $mode = $type;
        else
            $mode = NULL;
        write_upload_log($page_url.$file, $mode);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list($modify_mode, $page_dir.$file, $modify_type);
    }

    /* copy or move 檔案 */
    /* 2015/2/25 修改,增加 file_list 參數 */
    /* 2015/5/8 修改,增加 sync 參數 */
    function copy_move_filepath($mode, $page_dir, $page_url, $src_path, $target_path, $rewrite=false, $sync=false, $fmtime="", $name="", $file_list="", $chk_right=true)
    {
        Global $u_dymanic;

        /* 2015/2/26 修改,若是 move 功能就先檢查權限 (可避免多檔搬移時重覆檢查權限),增加 chk_right 參數,代表是否要檢查權限 */
        if (($mode == "move") && ($chk_right == true))
        {
            /* 檢查上傳權限,有上傳權限才可進行 move */
            $u_right = chk_upload_right($page_dir, $src_path);
            if ($u_right != PASS)
                err_header($u_right);
            $u_right = chk_upload_right($page_dir, $target_path);
            if ($u_right != PASS)
                err_header($u_right);
        }

        /* 2014/9/5 新增 */
        if (is_dir("$page_dir/$src_path"))
        {
            /* 2015/2/25 修改,若有傳入 file_list 代表有多筆資料要處理,需逐一處理 */
            if (!empty($file_list))
            {
                /* 由 file_list 整理出所有要處理檔案再逐一處理 (file_list 中是用逗號隔開多筆資料) */
                $list = explode(",", $file_list);
                $cnt = count($list);
                for ($i = 0; $i < $cnt; $i++)
                {
                    $list[$i] = trim($list[$i]);
                    if (empty($list[$i]))
                        continue;
                    $new_src_path = str_replace("//", "/", $src_path."/".$list[$i]);
                    $new_src_file = $page_dir.$new_src_path;
                    /* 若來源檔不存在就跳下一筆 */
                    if (!file_exists($new_src_file))
                        continue;
                    /* 執行 copy or move 檔案功能 (處理多筆時不必傳入 name 參數) */
                    /* 2015/2/26 修改,增加 chk_right 參數,因前面已檢查過權限,多筆處理時後續可不必再檢查權限,所以直接傳入 false */
                    copy_move_filepath($mode, $page_dir, $page_url, $new_src_path, $target_path, $rewrite, $sync, $fmtime, NULL, NULL, false);
                }
                return;
            }

            /* 沒有 file_list 就代表要處理的是目錄 */
            $modify_type = "dir";
        }
        else
            $modify_type = "file";

        /* 2013/5/6 更新,若是 move 功能改 call move_page_path,若是 copy 與 copy_sync 仍用原方式*/
        if ($mode == "move")
        {
            /* 檢查並上傳動態 share record (將 src_path 設為 del,因會檢查檔案是否存在,所以必須在檔案搬移前執行) */
            if ($u_dymanic != false)
                upload_dymanic_share_rec($page_dir, $src_path, "del");

            /* 2014/9/5 新增,紀錄到 modify.list 中 */
            write_modify_list("del", $page_dir.$src_path, $modify_type);

            /* 執行 move_page_path 功能 */
            $file = move_page_path($page_dir, $src_path, $target_path, $name, $fmtime);

            /* 檢查並上傳動態 share record (將搬移後的檔案設為 new) */
            if ($u_dymanic != false)
                upload_dymanic_share_rec($page_dir, $file, "new");
        }
        else
        {
            /* 進行檔案 copy or move,若失敗就輸出錯誤訊息 */
            $file = copy_move_path($mode, $page_dir, $src_path, $target_path, $rewrite, $name, $fmtime, $sync);
        }
        if ($file === false)
        {
            if (($mode == "copy") || ($mode == "copy_sync"))
                die(ERR_COPY_FILE);
            else
                die(ERR_MOVE_FILE);
        }

        /* 記錄 upload log */
        write_upload_log($page_url.$file, $mode);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("new", $page_dir.$file, $modify_type);

        echo $page_url.$file;
    }

    /* 變更目錄或檔案的顯示名稱 (實際儲存名稱不變更) */
    function rename_filepath($page_dir, $file_path, $name)
    {
        Global $u_dymanic;

        /* 檢查上傳權限 */
        $u_right = chk_upload_right($page_dir, $file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 變更目錄或檔案顯示名稱 */
        if (rename_page($page_dir, $file_path, $name) == false)
            die(ERR_RENAME);

        /* 檢查並上傳動態 share record */
        /* 2014/12/23 修改,上傳動態訊息時不更新 upload_time */
        if ($u_dymanic != false)
            upload_dymanic_share_rec($page_dir, $file_path, "update", NULL, NULL, false);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        if (is_dir("$page_dir/$file_path"))
            $modify_type = "dir";
        else
            $modify_type = "file";
        write_modify_list("rename", $page_dir.$file_path, $modify_type, $name);

        echo "ok";
    }

    /* 刪除目錄或檔案 */
    function del_filepath($page_dir, $file_path, $name)
    {
        Global $u_dymanic;

        /* 檢查上傳權限 */
        if (!empty($name))
            $chk_file_path = str_replace("//", "/", $file_path."/".$name);
        else
            $chk_file_path = $file_path;
        $u_right = chk_upload_right($page_dir, $chk_file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 檢查並上傳動態 share record (設為 del,因會檢查檔案是否存在,所以必須在檔案刪除前執行) */
        if ($u_dymanic != false)
            upload_dymanic_share_rec($page_dir, $file_path, "del");

        /* 若沒傳入 name 就代表要刪除的是目錄,否則就是要刪除檔案 */
        if (empty($name))
        {
            $modify_type = "dir";
            $del_flag = del_dir($page_dir, $file_path);
        }
        else
        {
            $modify_type = "file";
            $del_flag = del_file($page_dir, $file_path, $name);
        }
        if ($del_flag == false)
            die(ERR_DEL);

        /* 2014/9/5 新增,紀錄到 modify.list 中 */
        write_modify_list("del", $page_dir.$file_path, $modify_type);

        echo "ok";
    }

    /* 取得子目錄 list */
    function get_subdir($page_dir, $file_path, $all_subdir=false)
    {
        /* 檢查瀏覽權限 */
        $b_right = chk_browse_right($page_dir, $file_path);
        if ($b_right != PASS)
            err_header($b_right);

        /* 取得 menu 資料 */
        $menu = get_nuweb_menu($file_path);
        if ($menu != false)
            $menu_cnt = count($menu);
        else
            $menu_cnt = 0;

        /* 取得子目錄資料,若 all_subdir == true 代表要取得所有子目錄資料 */
        $subdir_data = get_subdir_data($page_dir, $file_path, $all_subdir, $menu, true);
        echo $subdir_data;
    }

    /* 設定檔案附屬的 rec file */
    function set_rec($page_dir, $file_path, $name, $content)
    {
        /* 檢查上傳權限 */
        $chk_file_path = str_replace("//", "/", $file_path."/".$name);
        $u_right = chk_upload_right($page_dir, $chk_file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 找出 record 目錄位置,若 record 目錄不存在就建立 */
        $rec_dir = str_replace("//", "/", $page_dir.$file_path."/".NUWEB_REC_PATH);
        if (!is_dir($rec_dir))
        {
            if (mkdir($rec_dir) == false)
                die(ERR_REC_DIR);
        }

        /* 檢查 record file 是否存在,若存在必須用更新的方式,若不存在才可直接寫入 */
        $rec_file = $rec_dir.$name.".rec";
        if (!file_exists($rec_file))
        {
            /* 直接寫入 record file */
            $fp = fopen($rec_file, "w");
            fputs($fp, $content);
            fclose($fp);
        }
        else
        {
            /* 更新 record file */
            $buf = explode("\n", $content);
            $cnt = count($buf);
            for ($i = 0; $i < $cnt; $i++)
                $buf[$i] .= "\n";
            $u_rec = recbuf2array($buf);
            update_rec_file($rec_file, $u_rec[0]);
        }

        echo $page_url.$rec_file;
    }

    /* 讀取檔案附屬的 rec file */
    function read_rec($page_dir, $file_path, $name)
    {
        /* 檢查瀏覽權限 */
        $file = str_replace("//", "/", $file_path."/".$name);
        $b_right = chk_browse_right($page_dir, $file);
        if ($b_right != PASS)
            err_header($b_right);

        /* 找出 record 檔位置,並將檔案內容輸出 */
        $rec_file = str_replace("//", "/", $file_path."/".NUWEB_REC_PATH.$name.".rec");
        if (is_file($rec_file))
            readfile($rec_file);
    }

    /* 刪除檔案附屬的 rec file */
    function del_rec($page_dir, $file_path, $name)
    {
        /* 檢查上傳權限 */
        $chk_file_path = str_replace("//", "/", $file_path."/".$name);
        $u_right = chk_upload_right($page_dir, $chk_file_path);
        if ($u_right != PASS)
            err_header($u_right);

        /* 找出 record 檔位置,並將檔案刪除 */
        $rec_file = str_replace("//", "/", $file_path."/".NUWEB_REC_PATH.$name.".rec");
        if (is_file($rec_file))
            del_rec_file($rec_file);
        echo "ok";
    }

    /* 取得子目錄 list 資料 */
    function get_subdir_data($page_dir, $file_path, $all_subdir=false, $menu=false, $first_call=false)
    {
        /* 若有傳入 menu 就要計算總共有幾個 menu 項目,若沒傳入就設為 0 */
        if ($menu != false)
            $menu_cnt = count($menu);
        else
            $menu_cnt = 0;

        /* 讀取目錄內所有子目錄與檔案 */
        $subdir_data="";
        $handle = opendir($file_path);
        while ($sub_name = readdir($handle))
        {
            if ($sub_name == "..")
                continue;
            if ($sub_name == ".")
                $subdir = $file_path;
            else
                $subdir = str_replace("//", "/", $file_path."/".$sub_name);

            /* 過濾掉 NUWeb 自訂的系統檔案與目錄 (.nuweb_*) */
            if (strstr($sub_name, NUWEB_SYS_FILE) == $sub_name)
               continue;

            /* 過濾掉 symlink,必須是實際的子目錄才輸出 */
            if (is_link($subdir))
                continue;

            /* 只處理子目錄 */
            if (is_dir($subdir))
            {
                /* 如果不是第一次 call 本函數,就必須把 . 過濾掉 */
                if (($first_call != true) && ($sub_name == "."))
                    continue;

                /* 如果有設定 menu,必須過濾掉不在 menu 中的目錄 (. 不可過濾掉) */
                if (($menu != false) && ($sub_name != "."))
                {
                    $in_menu = false;
                    for ($i = 0; $i < $menu_cnt; $i++)
                    {
                        /* 檢查是否在 menu 中 */
                        if ($menu[$i] == $subdir)
                        {
                            $in_menu = true;
                            break;
                        }
                    }
                    /* 若不在 menu 中就過濾掉 */
                    if ($in_menu == false)
                        continue;
                }

                /* 取得子目錄的權限屬性 */
                $attr_info = get_right_attr($page_dir, $subdir);

                /* 如果 show_dir 是 false,代表不顯示,就直接跳過 */
                if ($attr_info["show_dir"] == false)
                    continue;

                /* 檢查子目錄內是否還有子目錄 */
                if (chk_subdir($page_dir, $subdir) == true)
                    $sub_dir = "T";
                else
                    $sub_dir = "F";

                /* 設定輸出的瀏覽屬性 */
                if ($attr_info["browse"] == true)
                    $browse = "T";
                else
                    $browse = "F";

                /* 設定輸出的上傳屬性 */
                if ($attr_info["upload"] == true)
                    $upload = "T";
                else
                    $upload = "F";

                /* 設定輸出的密碼屬性 */
                if ($attr_info["set_pwd"] == true)
                    $set_pwd = "T";
                else
                    $set_pwd = "F";

                /* 設定輸出的設定使用者屬性 */
                if ($attr_info["set_user"] == true)
                    $set_user = "T";
                else
                    $set_user = "F";

                /* 取出子目錄的 type */
                $type_file = $subdir."/".NUWEB_TYPE;
                if (file_exists($type_file))
                    $type = read_conf($type_file);
                else
                    $type["DIR_TYPE"] = "";

                /* 整理要輸出的子目錄資訊 */
                if ($all_subdir == true)
                    $subdir_name = $subdir;
                else
                    $subdir_name = $sub_name;
                if ($sub_name == ".")
                    $filename = $sub_name;
                else
                {
                    $filename = get_file_name($page_dir, $subdir);
                    if (empty($filename))
                        $filename = $sub_name;
                }
                $subdir_data .= $subdir_name."\t".$filename."\t".$browse.$upload.$set_pwd.$set_user.$sub_dir."\t".$type["DIR_TYPE"]."\n";

                /* 如果要取得所有子目錄資料,就繼續往下層處理 */
                if (($all_subdir == true) && ($sub_name != "."))
                {
                    /* 檢查子目錄瀏覽權限,若無權限就不處理 */
                    $b_right = chk_browse_right($page_dir, $subdir);
                    if ($b_right != PASS)
                        break;
                    $subdir_data .= get_subdir_data($page_dir, $subdir, $all_subdir);
                }
            }
        }
        closedir($handle);
        return $subdir_data;
    }

    /* 取得目錄內 .nuweb_menu 資料 (子網站 MENU,僅子網站目錄才會有) */
    function get_nuweb_menu($file_path)
    {
        /* 檢查並取出 .nuweb_menu 內容 */
        $menu_file = str_replace("//", "/", $file_path."/".NUWEB_MENU);
        if (file_exists($menu_file))
        {
            $menu = @file($menu_file);
            $menu_cnt = count($menu);
            /* 整理 menu 的資料 */
            for ($i = 0; $i < $menu_cnt; $i++)
                $menu[$i] = str_replace("//", "/", $file_path."/".trim($menu[$i]));
        }
        else
            $menu = false;
        return $menu;
    }

    /* 檢查是否有子目錄 */
    function chk_subdir($page_dir, $file_path)
    {
        /* 讀取目錄內所有子目錄與檔案 */
        $l = strlen(NUWEB_SYS_FILE);
        $handle = opendir($file_path);
        while ($sub_name = readdir($handle))
        {
            /* 先過濾掉 . & .. & .nuweb_* */
            if (($sub_name == ".") || ($sub_name == "..") || (substr($sub_name, 0, $l) === NUWEB_SYS_FILE))
                continue;
            /* 取得 subdir 名稱,並過濾掉 *.files & .sync 都不能算進子目錄 */
            $subdir = str_replace("//", "/", $file_path."/".$sub_name);
            $subdir_name = get_file_name($page_dir, $subdir);
            if (empty($subdir_name))
                $subdir_name = $sub_name;
            if ((substr($subdir_name, -6) == ".files") || ($subdir_name == SYNC_DIR))
                continue;

            /* 不可以是 symlink,必須是實際的子目錄 */
            if (is_link($subdir))
                continue;
            /* 只要有發現子目錄,就回傳 true */
            if (is_dir($subdir))
            {
                closedir($handle);
                return true;
            }
        }
        closedir($handle);
        return false;
    }
?>
