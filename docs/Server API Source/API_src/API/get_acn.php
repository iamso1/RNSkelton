<?php
    include("../Admin/init.php");

    $mode = $_REQUEST["mode"];

    /* ���o���U��T */
    $conf = read_conf(REGISTER_CONFIG);

    /* �Y�S�]�w acn �����^�ǿ��~ */
    if (!isset($conf["acn"]))
    {
        $info["error"] = "Error: acn not exists!";
        echo json_encode($info);
        exit;
    }

    /* ��z�n��X���t�θ�T */
    $info["acn"] = $conf["acn"];
    $info["sun"] = $conf["sun"];
    $info["OS"] = SYS_OS;
    $info["NUWEB_CS_VER"] = NUWEB_CS_VER;

    /* �Y�ǤJ�� mode=get_info �N��X�t�θ�T,�_�h�N�u��X acn */
    if ($mode == "get_info")
        echo json_encode($info);
    else
        echo $conf["acn"];
?>
