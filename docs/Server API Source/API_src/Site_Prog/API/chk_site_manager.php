<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    $path = $_REQUEST["path"];

    /* �ˬd�n�J�� user �O�_�����ؿ����޲z�v��(�]�N�O���l�������޲z��) */
    if (chk_manager_right($path) == PASS)
        echo "YES";
    else
        echo "NO";
?>
