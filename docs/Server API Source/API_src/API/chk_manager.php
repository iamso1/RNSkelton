<?php
    include("../Admin/init.php");

    /* 取得登入者 cookie */
    $cookie_ssn_acn = $_COOKIE["ssn_acn"];

    /* 若沒有登入 cookie 就不是管理者 */
    if (!empty($cookie_ssn_acn))
    {
        list($uid, $uacn) = explode(":", $cookie_ssn_acn);
        /* 取得系統設定資料中的管理者資料 */
        $set_conf = read_conf(SETUP_CONFIG);
        $manager = explode(",", $set_conf["manager"]);
        $cnt = count($manager);
        /* 檢查是否為管理者 */
        for ($i = 0; $i < $cnt; $i++)
        {
            if ($uacn == $manager[$i])
            {
                echo "Yes";
                exit;
            }
        }
    }
    echo "No"
?>
