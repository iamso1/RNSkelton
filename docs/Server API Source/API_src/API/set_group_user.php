<?php
    include("../Admin/init.php");
    define("GROUP_USER_LIST", ADMIN_DIR."group_user.list");
    define("ADD_MEMBER_SITE", "http://localhost/Site_Prog/API/add_member_site.php?acn=");
    define('UPDATE_RANDPWD_IVL',300);

    /* 取得所需參數 */
    $mode = $_REQUEST["mode"];
    $ssn = $_REQUEST["ssn"];
    $sca = $_REQUEST["sca"];
    $cache_pwd = $_REQUEST["cache_pwd"];

    /* 取得 user 資料(包括 acn mail sun),並檢查參數是否正確,若不正確就回傳錯誤訊息 */
    $data = get_acn_mail($ssn, $sca);
    if ($data === false)
        die("Error: user data error!\n");
    list($acn, $mail, $sun) = explode(":", $data);

    /* mode = add ,先檢查是否已在 user list 內,若不在 user list 才需要進行新增 */
    if (($mode == "add") && (!exists_user($ssn, $acn)))
    {
        /* 檢查是否為管理者,管理者可直接新增為 group user */
        /* 2015/3/19 修改,系統管理者(目前已不使用)與後端管理者可直接新增為 group user */
        if (($is_manager != true) && ($admin_manager != true))
        {
            /* 讀取 setup config 資料 */
            $conf = read_conf(SETUP_CONFIG);
            /* 檢查是否需要驗證碼,若不使用驗證碼,代表不可新增會員 */
            if ($conf["use_cache_pwd"] == NO){
		list($updated_time, $pre_cache_pwd) = explode(":", $conf["cache_pwd"]);
		if(strpos($conf["cache_pwd"], ":") === false || time() > intval($updated_time) || $pre_cache_pwd != $cache_pwd){
			die("Error: Permission denied!\n");
		}
	    }else if ($cache_pwd != $conf["cache_pwd"]){
                die("Error: cache_pwd is error!\n");
	    }
        }
        /* 新增 user 資料 */
        add_group_user_list($acn);
        /* 檢查與建立成員網站 */
        $contents = add_member_site($acn);
        echo $contents;
    }

    if ($mode == "del")
        del_group_user_list($acn)

    /************/
    /* 函 數 區 */
    /************/

    /* 檢查 user 是否已存在 */
    function exists_user($ssn, $acn)
    {
        /* 取出 user_list */
        if (file_exists(GROUP_USER_LIST))
        {
            $user_list = @file(GROUP_USER_LIST);
            $cnt = count($user_list);
            /* 檢查是否已記錄過 */
            for ($i = 0; $i < $cnt; $i++)
            {
                list($ussn, $uacn, $umail) = explode("\t", trim($user_list[$i]));
                if (($ussn == $ssn) && ($uacn == $acn))
                    return true;
            }
        }
        return false;
    }

    /* 檢查與建立成員子網站 */
    function add_member_site($acn)
    {
        $url = ADD_MEMBER_SITE.$acn;
        return implode("", @file($url));
    }
?>
