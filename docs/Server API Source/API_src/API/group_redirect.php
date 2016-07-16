<?php
    require_once("/data/HTTPD/htdocs/tools/public_lib.php");

    $code = $_REQUEST["code"];
    $acn = $_REQUEST["acn"];
    $mode = $_REQUEST["mode"];
    $cs_acn = $_REQUEST["cs_acn"];

    /* 預設的 redirect url 是 cs_acn 的 web 網站 */
    $def_url = "http://$cs_acn.nuweb.cc/Site/web/";

    /* 檢查 code 與 acn 資料是否符合 */
    $content = auth_decode($code);
    if ($content == false)
    {
        header("Location: $def_url");
        exit;
    }
    list($l_ssn, $l_acn, $l_mail, $l_sun, $l_user_lang) = explode(":", $content);
    if (($l_acn !== $acn) || (empty($l_ssn)) || (empty($l_acn)) || (empty($l_mail)) || (empty($l_sun)) || (is_numeric($l_ssn) != true))
    {
        header("Location: $def_url");
        exit;
    }

    /* 取得在 group 中 user 的網站 list,檢查是否有與 acn 同名網站,若有就直接選取,若有多個就取第一個 */
    $user_site = group_get_user_site($acn, $l_mail);
    $user_site_url = NULL;
    if ($user_site !== false)
        $cnt = count($user_site);
    else
        $cnt = 0;
    if ($cnt > 0)
    {
        /* 先預設第一個網站 */
        $user_site_url = "http://".$user_site[0]["cs_acn"].".nuweb.cc/index.php?site_acn=".$user_site[0]["site_acn"]."&mode=$mode&code=$code";
        for ($i = 0; $i < $cnt; $i++)
        {
            /* 尋找是否有同名網站,若有就選取同名網站 */
            if ($user_site[$i]["site_acn"] == $acn)
            {
                $user_site_url = "http://".$user_site[$i]["cs_acn"].".nuweb.cc/index.php?site_acn=".$user_site[$i]["site_acn"]."&mode=$mode&code=$code";
                break;
            }
        }
    }

    if ($user_site_url == NULL)
        header("Location: $def_url");
    else
        header("Location: $user_site_url");
?>
