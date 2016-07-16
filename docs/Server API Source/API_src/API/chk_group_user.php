<?php
    include("../Admin/init.php");
    define("GROUP_USER_LIST", ADMIN_DIR."group_user.list");

    $ssn = isset($_REQUEST["ssn"]) ? $_REQUEST["ssn"] : NULL ;
    $sca = isset($_REQUEST["sca"]) ? $_REQUEST["sca"] : NULL ;

    $out = array('status'=>false);
    if( !empty($ssn) && !empty($sca) && exists_user($ssn, $acn) ) 
        $out['status'] = true;

    header("Content-type: text/javascript");
    echo json_encode( $out );

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
                list($ussn, $buf) = explode("\t", trim($user_list[$i]), 2);
                if ($ussn == $ssn)
                    return true;
            }
        }
        return false;
    }
