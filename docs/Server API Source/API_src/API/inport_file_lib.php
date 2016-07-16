<?php
require_once("/data/HTTPD/htdocs/API/API_init.php");
require_once("/data/HTTPD/htdocs/Site_Prog/init.php");
// whee odb
require_once("/data/HTTPD/htdocs/tools/rs_odb_lib.php");

function inport_file($read_file, $type, $page_dir, $page_url, $file_path, $fmtime, $name, $source=null, $img_url=null)
{
	/* 檢查上傳權限 */
	if ($type == "update")
		$u_right = chk_upload_right($page_dir, $file_path.$name);
	else
		$u_right = chk_upload_right($page_dir, $file_path);
	if ($u_right != PASS)
		return "Error: $u_right";

    /* 檢查目前網站使用空間是否超出 quota,若已超出就不可上傳資料 */
    list($site_acn, $other) = explode("/", $file_path, 2);
    $status = chk_site_quota($site_acn);
    if ($status === QUOTA_OVER)
        return ERR_QUOTA_OVER;
    if ($status === SYSTEM_QUOTA_OVER)
        return ERR_SYSTEM_QUOTA_OVER;
	
	/* 若 type = update 先取得儲存的 filename */
	if ($type == "update")
	{
		$file = $file_path.$name;
		if (!is_file($file))
			return ERR_FILE_NOT_EXIST;
		$page_filename = get_file_name($page_dir, $file);

		/* 先取出原檔案的使用空間 */
		$des_file = $page_dir.$file;
		$src_size = real_filesize($des_file);

		/* 將原本的檔案建立新版本 */
		set_file_ver($des_file);
		unlink($des_file);
	}
	/* type = new 要取得儲存的 filename */
	if ($type == "new")
	{
		$src_size = 0;
	
		$page_filename = $name;
		/* 先檢查檔案是否已存在 */
		if (filename_exists($page_dir, $file_path, $page_filename) != false)
			return ERR_FILE_EXIST;
		/* 建立空的新檔案 */
		$file = new_file($page_dir, $file_path, $page_filename);
		if ($file == false)
			return ERR_UPLOAD_FILE;
			
		$des_file = $page_dir.$file;
	}
	
	$r = rename($read_file, $des_file);
	clearstatcache();
	
	/* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
	if (!empty($fmtime))
		touch($des_file, $fmtime);
	

	
	// *** whee odb ***
	// odb 已經存在, 不須要在轉換了
	if (!odb_api_upload_file_chk_exists($des_file))
	{
	
	

		/* 檢查是否為 video 檔,若是就進行轉 flv 檔 */
		chk_video_file($page_dir, $file, $source, $img_url);

		/* 檢查是否為 image 檔,若是就建立縮圖 */
		set_img_tn($page_dir, $file);

		/* 20150503 新增,檢查是否為 Audio 檔,若是就轉出 mp3 檔案 */
		audio2mp3($page_dir.$file);

		/* 2014/9/9 取消,改由 modify.list 紀錄進行處理 */
		/* 檢查是否為文件檔,若是就轉出 pdf 檔 */
		//chk_doc_file($page_dir, $file);
	}

	/* 建立檔案的 record 檔 */
	write_def_record($page_dir, $file, $page_filename, true);

	/* 更新使用的空間 */
	update_use_space($page_dir, $file, MODE_UPDATE, $src_size);

	/* 檢查並上傳動態 share record */
	upload_dymanic_share_rec($page_dir, $file, $type);

	/* 記錄 upload log */
	if ($type == "update")
		$mode = $type;
	else
		$mode = NULL;
	write_upload_log($page_url.$file, $mode);
	
    /* 2014/9/5 新增,紀錄到 modify.list 中 */
    write_modify_list($type, $page_dir.$file, "file");

	
	
	// *** whee odb ***
	odb_api_upload_file($read_file, $type);
	
	

	return $page_url.$file;
}


?>
