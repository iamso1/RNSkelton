<?php
    include("../Admin/init.php");

    $field = $_REQUEST["field"];

    /* ���o�t�γ]�w��T */
    $conf = read_conf(SETUP_CONFIG);

    /* ���i���o�t�����ҽX�����e */
    if ($field == "cache_pwd")
        die("Error: Permission denied!");
    /* �Y�n���o����줣�s�b�N��X���~�T�� */
    if (!isset($conf[$field]))
        die("Error: \"$field\" not exists!");
    /* ��X�n���o����줺�e */
    echo $conf[$field];
?>
