<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");

    if ((isset($_REQUEST["acn"])) && (!empty($_REQUEST["acn"])))
        $acn = $_REQUEST["acn"];
    else if (!empty($uacn))
        $acn = $uacn;

    echo (chk_ssn_lock($acn) == false) ? NO : YES;
?>
