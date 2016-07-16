<?php
    /* 定義錯誤訊息 */
    define("EMPTY_MODE", "Error: empty mode!");
    define("EMPTY_EID", "Error: empty eid!");
    define("EMPTY_COMMENT", "Error: empty comment!");
    define("EMPTY_ALLOW", "Error: empty allow!");
    define("ERR_MODE", "Error: mode error!");
    define("ERR_ADD_COMMENT", "Error: add comment fail!");
    define("ERR_UPDATE_COMMENT", "Error: update comment fail!");
    define("ERR_UPDATE_ALLOW", "Error: update allow fail!");
    define("ERR_NO_PERMISSION", "Error: Permission denied!");

    require_once("/data/HTTPD/htdocs/Site_Prog/init.php");

    /* 取得及檢查參數 */
    $mode = $_REQUEST["mode"];
    $eid = $_REQUEST["eid"];
    $comment = $_REQUEST["comment"];
    $allow = $_REQUEST["allow"];
    $type = $_REQUEST["type"];
    if (empty($mode))
        die(EMPTY_MODE);
    if (empty($eid))
        die(EMPTY_EID);
    if (($mode == "add_comment") && (empty($comment)))
        die(EMPTY_COMMENT);
    if (($mode == "update_allow") && (empty($allow)))
        die(EMPTY_ALLOW);
    if (($type == "group") && ($group_mode == GROUP_SERVER))
        $index_dir = GROUP_EVENT_INDEX;
    else
        $index_dir = EVENT_INDEX_DIR;

    /* update_comment 與 update_allow 功能必須有管理權限才可執行 */
    /* 先讀取 record 內容 */
    $rec = get_event_rec($eid, $index_dir);
    /* 檢查是否有網站管理權限,有權限才可執行本功能 */
    if ((($mode == "update_comment") || ($mode == "update_allow")) && (chk_manager_right($rec["site_acn"]) !== PASS))
        die(ERR_NO_PERMISSION);

    /* 依 mode 執行不同功能 */
    switch($mode)
    {
        /* 新增留言 */
        case "add_comment":
            $rid = add_event_comment($eid, $comment, $index_dir);
            if ($rid == false)
                die(ERR_ADD_COMMENT);
            echo "ok";
            break;

        /* 更新留言 */
        case "update_comment":
            $rid = update_event_comment($eid, $comment, $index_dir);
            if ($rid == false)
                die(ERR_UPDATE_COMMENT);
            echo "ok";
            break;

        /* 更新權限 */
        case "update_allow":
            $rid = update_event_allow($eid, $allow, $index_dir);
            if ($rid == false)
                die(ERR_UPDATE_ALLOW);
            echo "ok";
            break;

        default:
            die(ERR_MODE);
            break;
    }
?>
