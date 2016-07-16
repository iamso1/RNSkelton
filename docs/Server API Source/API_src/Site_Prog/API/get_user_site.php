<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    $user_site = get_user_site();
    echo json_encode($user_site);
?>
