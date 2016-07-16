<?php
    require_once("/data/HTTPD/htdocs/API/API_init.php");

    if (empty($login_user))
        return NULL;
    $acn = $login_user["acn"];
    $mail = $login_user["mail"];

    /* 取得好友名單 */
    $my_list = get_my_list();
    $friend_list = NULL;
    if ((isset($my_list["friend"])) && (!empty($my_list["friend"])))
    {
        //$friend_list = list2array($my_list["friend"]);
        $item = explode(",", $my_list["friend"]);
        $f_cnt = count($item);
        for ($i = 0; $i < $f_cnt; $i++)
            $friend_list[$item[$i]] = 1;
    }

    /* 取得所屬的社群成員名單 */
    $group_member_list = NULL;
    $s_member_list = NULL;
    if ($group_mode == GROUP_NONE)
    {
        /* 非群組架構直接抓取 Server 內的 site_member.list 資料 */
        if (file_exists(SITE_MEMBER_LIST))
            $s_member_list = @file(SITE_MEMBER_LIST);
    }
    else
    {
        /* 群組架構時就讀取 group_site.list 資料 */ 
        $s_member_list = group_get_site_list(false, true);
    }
    $s_cnt = count($s_member_list);
    for ($i = 0; $i < $s_cnt ; $i++)
    {
        /* 取得 member 資料,若 member 資料為空的就跳下一筆 */
        if ($group_mode == GROUP_NONE)
            list($site_acn, $member_list) = explode("\t", strtolower(trim($s_member_list[$i])));
        else
            $member_list = $s_member_list[$i]["member"];
        if (empty($member_list))
            continue;

        /* 檢查 user 帳號是否在 member 資料內,若不在就跳過不處理 */
        $item = explode(",", $member_list);
        $m_cnt = count($item);
        $is_member = false;
        for ($j = 0; $j < $m_cnt; $j++)
        {
            if ($item[$j] == $acn)
            {
                $is_member = true;
                break;
            }
        }
        if ($is_member !== true)
            continue;

        /* 整理所有與我相關的 member 帳號 */
        for ($j = 0; $j < $m_cnt; $j++)
        {
            $m_acn = $item[$j];
            if ($m_acn == $acn)
                continue;
            if (isset($friend_list[$m_acn]))
                $friend_list[$m_acn]++;
            else if (isset($group_member_list[$m_acn]))
                $group_member_list[$m_acn]++;
            else
                $group_member_list[$m_acn] = 1;
        }
    }

    /* 將朋友名單與 member 名單進行排序 (依出現次數),再整合輸出 */
    /* 2016/4/26 修改,先檢查 friend_list 與 group_member_list 是否為 array,若是才處理 */
    //arsort($friend_list);
    //arsort($group_member_list);
    $relation_list = array();
    $n = 0;
    if ((!empty($friend_list)) && (is_array($friend_list)))
    {
        arsort($friend_list);
        foreach ($friend_list as $key => $value)
            $relation_list[$n++] = $key;
    }
    if ((!empty($group_member_list)) && (is_array($group_member_list)))
    {
        arsort($group_member_list);
        foreach ($group_member_list as $key => $value)
            $relation_list[$n++] = $key;
    }
    echo json_encode($relation_list);
?>
