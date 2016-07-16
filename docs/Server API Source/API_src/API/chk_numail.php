<?php
    include("../Admin/init.php");

    /* 檢查是否有安裝 NUMail */
    if (chk_numail() == true)
        echo "Yes";
    else
        echo "No";
?>
