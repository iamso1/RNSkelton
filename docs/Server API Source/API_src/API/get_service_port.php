<?php
    require_once("/data/HTTPD/htdocs/tools/upnp_lib.php");

    $service_port = read_service_port();
    echo json_encode($service_port);
?>
