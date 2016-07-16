<?php
    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
    define("EMPTY_SSN", "Error: empty ssn!");
    define("EMPTY_SCA", "Error: empty sca!");

    /* 取得所有可能的輸入參數 */
    $ssn = $_REQUEST["ssn"];
    $sca = $_REQUEST["sca"];
    $mode = $_REQUEST["mode"];

    /* 必須傳入 ssn & sca 參數 */
    if (empty($ssn))
        die(EMPTY_SSN);
    if (empty($sca))
        die(EMPTY_SCA);

    /* 檢查如果 cookie 有問題,才需要進行下列處理 */
    /* 2016/3/1 修改,若 mode 為 set 就一律重新設定 cookie */
    if (($mode == "set") || (check_login_cookie() === false))
    {
        /* 檢查傳入的 user 資料是否正確 */
        if (($acn_mail_sun = get_acn_mail($ssn, $sca)) == false)
            die(ERR_SCA);

        /* 取出 acn 與 mail */
        list($acn, $mail, $sun) = explode(":", $acn_mail_sun);

        /* 檢查成功,就設定 cookie */
        set_login_cookie($ssn, $acn, $mail, $sun);

        /* 設定 sca 的 session */
        sca_session($ssn, $sca);

        echo "ok\n";
    }
?>
