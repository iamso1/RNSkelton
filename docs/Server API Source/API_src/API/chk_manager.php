<?php
    include("../Admin/init.php");

    /* ���o�n�J�� cookie */
    $cookie_ssn_acn = $_COOKIE["ssn_acn"];

    /* �Y�S���n�J cookie �N���O�޲z�� */
    if (!empty($cookie_ssn_acn))
    {
        list($uid, $uacn) = explode(":", $cookie_ssn_acn);
        /* ���o�t�γ]�w��Ƥ����޲z�̸�� */
        $set_conf = read_conf(SETUP_CONFIG);
        $manager = explode(",", $set_conf["manager"]);
        $cnt = count($manager);
        /* �ˬd�O�_���޲z�� */
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
