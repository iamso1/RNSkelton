<?php
    include("../Admin/init.php");

    /* �ˬd�O�_���w�� NUMail */
    if (chk_numail() == true)
        echo "Yes";
    else
        echo "No";
?>
