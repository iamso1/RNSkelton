<?php
    include("../Admin/init.php");
    define("GROUP_USER_LIST", ADMIN_DIR."group_user.list");

    $cookie_ssn_acn = $_COOKIE["ssn_acn"];

    /* 如果沒有 cookie 或 group_user.list 不存在就不提供 group_user.list */
    //if (empty($cookie_ssn_acn) || !file_exists(GROUP_USER_LIST))
    if (!file_exists(GROUP_USER_LIST))
        exit;

    /* 先由登入的 cookie 取得帳號 */
    list($uid, $uacn) = explode(":", $cookie_ssn_acn);
    /* 讀取系統設定中的管理者名單 */
    $set_conf = read_conf(SETUP_CONFIG);
    $manager = explode(",", $set_conf["manager"]);
    $cnt = count($manager);
    $flag = false;
    /* 逐一檢查檢查是否為管理者 */
    for ($i = 0; $i < $cnt; $i++)
    {
        if ($uacn == $manager[$i])
        {
            $flag = true;
            break;
        }
    }

    /* 不是管理者,再檢查是否為 group user */
    if ($flag == false)
    {
        /* 取出所有 group user 名單 */
        $user_list = @file(GROUP_USER_LIST);
        $user_cnt = count($user_list);
        /* 逐一比對是否為 group user */
        for ($i = 0; $i < $user_cnt; $i++)
        {
            list($id, $acn, $mail) = explode("\t", trim($user_list[$i]));
            if (($id == $uid) && ($acn = $uacn))
            {
                $flag = true;
                break;
            }
        }
    }

    /* 只有管理者及 group user 才輸出 group_user.list 內容 */
    //if ($flag == true)
    if($_REQUEST["is_json"] != true){
        readfile(GROUP_USER_LIST);
    }else{
        $user_list = @file(GROUP_USER_LIST);
        $user_cnt = count($user_list);
        $member_list = array();
        for ($i = 0; $i < $user_cnt; $i++){
            list($id, $acn, $mail) = explode("\t", trim($user_list[$i]));
            array_push($member_list, array("acn"=>$acn, "mail"=>$mail));
        }
	echo json_encode($member_list);
    }
?>
