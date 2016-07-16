<?php
    include("../Admin/init.php");
    define("GROUP_USER_LIST", ADMIN_DIR."group_user.list");

    $cookie_ssn_acn = $_COOKIE["ssn_acn"];

    /* �p�G�S�� cookie �� group_user.list ���s�b�N������ group_user.list */
    //if (empty($cookie_ssn_acn) || !file_exists(GROUP_USER_LIST))
    if (!file_exists(GROUP_USER_LIST))
        exit;

    /* ���ѵn�J�� cookie ���o�b�� */
    list($uid, $uacn) = explode(":", $cookie_ssn_acn);
    /* Ū���t�γ]�w�����޲z�̦W�� */
    $set_conf = read_conf(SETUP_CONFIG);
    $manager = explode(",", $set_conf["manager"]);
    $cnt = count($manager);
    $flag = false;
    /* �v�@�ˬd�ˬd�O�_���޲z�� */
    for ($i = 0; $i < $cnt; $i++)
    {
        if ($uacn == $manager[$i])
        {
            $flag = true;
            break;
        }
    }

    /* ���O�޲z��,�A�ˬd�O�_�� group user */
    if ($flag == false)
    {
        /* ���X�Ҧ� group user �W�� */
        $user_list = @file(GROUP_USER_LIST);
        $user_cnt = count($user_list);
        /* �v�@���O�_�� group user */
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

    /* �u���޲z�̤� group user �~��X group_user.list ���e */
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
