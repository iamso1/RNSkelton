<?php
    require_once("API_init.php");
	// whee odb
	require_once("/data/HTTPD/htdocs/tools/rs_odb_lib.php");

    define("DIR_FILE_PART", "temp/");

	if (!function_exists("B_Url_AddName"))
		require_once("/data/HTTPD/htdocs/tools/wbase2.php");
	
////////////////////////////////////////////////////////////////////////
	function m_up_f_p($page_dir, $page_url, $file_path, $name)
	{
 		global $temp_dir;

		/* 檢查上傳權限 */
		$u_right = chk_upload_right($page_dir, $file_path);
		if ($u_right != PASS)
			err_header($u_right);

		/* 檢查目前網站使用空間是否超出 quota,若已超出就不可上傳檔案 */
		list($site_acn, $other) = explode("/", $file_path, 2);
		$status = chk_site_quota($site_acn);
		if ($status === QUOTA_OVER)
			die(ERR_QUOTA_OVER);
		if ($status === SYSTEM_QUOTA_OVER)
			die(ERR_SYSTEM_QUOTA_OVER);

		$px = (int)$_REQUEST['px'];
		$fp = B_Url_AddName($page_dir, B_Url_AddName($file_path, $name));
		$fn_n = md5($fp);
		$fp_pm = $temp_dir.$fn_n.".part.met";
		$fp_p = $temp_dir.$fn_n.".part";
		//echo "fp_pm = $fp_pm, fp_p = $fp_p<br>";
$FP_LOG = "/data/HTTPD/htdocs/tools/logs/_up_f_p_".$fn_n.".log";
B_Log_f($FP_LOG, "px=$px");

		if (!file_exists($fp_pm)) {
B_Log_f($FP_LOG, "not exists fp_pm=$fp_pm");
			die(ERR_FILE);
		}

		$Data = B_LoadFile($fp_pm);
		$sPart = Rec_Data_GetPos($Data, "part");
		$ps = Rec_Data_GetPos($Data, "ps");
		$fs = Rec_Data_GetPos($Data, "fs");
		$pc = (int)($fs/$ps)+($fs%$ps ? 1 :0);	// part count

		// 錯誤檢查
		switch ($_FILES["file"]["error"])
		{
			case UPLOAD_ERR_OK:	/* 沒有錯誤 */
				break;
			case UPLOAD_ERR_INI_SIZE:
				die(ERR_UPLOAD_INI_SIZE);
			case UPLOAD_ERR_FORM_SIZE:
				die(ERR_UPLOAD_FORM_SIZE);
			case UPLOAD_ERR_PARTIAL:
				die(ERR_PARTIAL);
			case UPLOAD_ERR_NO_FILE:
				die(ERR_NO_FILE);
			case UPLOAD_ERR_NO_TMP_DIR:
				die(ERR_UPLOAD_NO_TMP_DIR);
			case UPLOAD_ERR_CANT_WRITE:
				die(ERR_UPLOAD_CANT_WRITE);
			case UPLOAD_ERR_EXTENSION:
				die(ERR_EXTENSION);
			default:
				die(ERR_UPLOAD_OTHER);
		}

		if ($px < 1 || $px > $pc)
			die(ERR_INVALID);
		$pos = ($px-1)*$ps;

		if ($px < $pc && $_FILES["file"]["size"] != $ps)
			die(ERR_PART_SIZE.$_FILES["file"]["size"]);

		$PData = B_LoadFile($_FILES["file"]["tmp_name"]);
		if (!B_SaveFile_Part($fp_p, $PData, 0, $pos))
			die(ERR_WRITE_FAIL."fp_p");

		$sPart[$px-1] = "1";
		Rec_Data_Set($Data, "part", $sPart);
		if (!B_SaveFile($fp_pm, $Data))
			die(ERR_WRITE_FAIL."fp_pm");

B_Log_f($FP_LOG, "OK! px=$px/$pc, fs=".$_FILES["file"]["size"]."/".((($px-1)*$ps)+$_FILES["file"]["size"]).", sPart=$sPart");
		print "OK!";
	}

	function m_up_f_pl($page_dir, $page_url, $file_path, $name, $fmtime="", $act="new", $updfn="")
	{
$FP_LOG = "/data/HTTPD/htdocs/tools/logs/_up_f_pl.log";

		global $temp_dir;

		/* 檢查上傳權限 */
		$chk_file_path = $file_path;
		if ($act == "update")
			$chk_file_path .= "/".$updfn;
		$u_right = chk_upload_right($page_dir, $chk_file_path);
		if ($u_right != PASS)
			err_header($u_right);

		/* 檢查目前網站使用空間是否超出 quota,若已超出就不可上傳檔案 */
		list($site_acn, $other) = explode("/", $file_path, 2);
		$status = chk_site_quota($site_acn);
		if ($status === QUOTA_OVER)
			die(ERR_QUOTA_OVER);
		if ($status === SYSTEM_QUOTA_OVER)
			die(ERR_SYSTEM_QUOTA_OVER);

		$fp = B_Url_AddName($page_dir, B_Url_AddName($file_path, $name));
		$fn_n = md5($fp);
		$fp_pm = $temp_dir.$fn_n.".part.met";
		$fp_p = $temp_dir.$fn_n.".part";
		//echo "fp_pm = $fp_pm, fp_p = $fp_p<br>";
B_Log_f($FP_LOG, "fn=".$fn_n.".part, fp=$fp");

		$fs = (float)$_REQUEST['fs'];		// file size
		$ps = (int)$_REQUEST['ps'];		// part size
		if (!$ps) die(EMPTY_PS);

		if (file_exists($fp_pm)) 
		{
			$Data = B_LoadFile($fp_pm);
			$sPart = Rec_Data_GetPos($Data, "part");
			$Old_ps = Rec_Data_GetPos($Data, "ps");
			$Old_fs = (float)Rec_Data_GetPos($Data, "fs");
			//echo "Old_fs = $Old_fs, Old_fs = $Old_fs<br>";
			if ( !empty($sPart) && 		// 有片斷 info
				 $Old_ps == $ps && 		// part size
				 $Old_fs == $fs ) 		// size
			{
				// 完成
				if (strpos($sPart, "0") === false)
				{
B_Log_f($FP_LOG, "sPart=$sPart");
					if ($act == "update")
					{
						$fp = str_replace("//", "/", $file_path."/".$updfn);
						/* 取得原檔案 size */
						//$src_size = get_use_space($page_dir.$fp);
						$src_size = real_filesize($page_dir.$fp);
						/* 將原本的檔案建立新版本 */
						set_file_ver($page_dir.$fp);
						/* 取得檔案真實名稱 */
						$name = get_file_name($page_dir, $fp);

					}
					else
					{
						$fp = new_file($page_dir, $file_path, $name);
						if ($fp == false)
						{
							unlink($fp_p);
							unlink($fp_pm);
							die(ERR_CREATE_FILE);
						}
						$src_size = 0;
					}
					if (file_exists($page_dir.$fp)) @unlink($page_dir.$fp);
					rename($fp_p, $page_dir.$fp);
					unlink($fp_pm);

					/* 如果有傳入 fmtime 就要設定檔案的最後修改時間為 fmtime */
					if (!empty($fmtime))
						touch($page_dir.$fp, $fmtime);

					print $page_url.$fp;
B_Log_f($FP_LOG, "OK ufp=".$page_url.$fp);
					
					
					
					// *** whee test odb ***
					// odb 已經存在, 不須要在轉換了
					$read_file = $page_dir.$fp;
					if (!odb_api_upload_file_chk_exists($read_file))
					{
		
		

						/* 檢查是否為 video 檔,若是就進行轉 flv 檔 */
						chk_video_file($page_dir, $fp);

						/* 檢查是否為 image 檔,若是就建立縮圖 */
						set_img_tn($page_dir, $fp);

						/* 20150503 新增,檢查是否為 Audio 檔,若是就轉出 mp3 檔案 */
						audio2mp3($page_dir.$file);

						/* 2014/9/9 取消,改由 modify.list 紀錄進行處理 */
						/* 檢查是否為文件檔,若是就轉出 pdf 檔 */
						//chk_doc_file($page_dir, $fp);
					}

					/* 建立 record file */
					write_def_record($page_dir, $fp, $name, true);

					/* 更新使用的空間 */
					update_use_space($page_dir, $fp, MODE_UPDATE, $src_size);

					/* 檢查並上傳動態 share record */
					upload_dymanic_share_rec($page_dir, $fp, $act);

					/* 記錄 upload log */
					if ($act == "update")
						$moe = "update";
					else
						$mode = NULL;
					write_upload_log($page_url.$fp, $mode);

					/* 2014/9/5 新增,紀錄到 modify.list 中 */
					write_modify_list($act, $page_dir.$fp, "file");

					
					
					
					// *** whee odb ***
					odb_api_upload_file($read_file, $type);
				}
				// 還沒有完成, 傳回片斷資料
				else
				{
					print $sPart;
				}
				return;
			}
		}
		
		//echo "new:<br>";
		$pc = (int)($fs/$ps)+($fs%$ps ? 1 :0); // part count
		$sPart = str_repeat("0", $pc);
		$Data = "@\n";
		$Data .= "@p:$fp\n";
		$Data .= "@ps:$ps\n";
		$Data .= "@fs:$fs\n";
		$Data .= "@part:$sPart\n";
$FP_LOG2 = "/data/HTTPD/htdocs/tools/logs/_up_f_p_".$fn_n.".log";
B_Log_f($FP_LOG2, "Data=$Data");
		
		B_SaveFile($fp_pm, $Data);
		B_SaveFile($fp_p, "");

B_Log_f($FP_LOG, "sPart=$sPart");
		print $sPart;
	}
	

	function Rec_Data_GetPos(&$Data, $k, &$Pos=0, &$L=0, $bInt=true, $Start=0)
	{
		$k = "\n@$k:";
		$p1 = strpos($Data, $k, $Start);
		if ($p1 === false)
			return false;
		
		$lk = strlen($k);
		$p1 += $lk;
		$lk--;
		
		$p2 = strpos($Data, "\n@", $p1);
		if ($p2 === false)
			$p2 = strlen($Data) -1;
		
		$l = $p2 - $p1;
		$v = ($l ? substr($Data, $p1, $l) : "");
		if ($bInt) {
			$Pos = $p1;
			$L = $l;
		}
		else {
			$Pos = $p1 - $lk;
			$L = $l +$lk +1;
		}
		return $v;
	}

	function Rec_Data_Set(&$Data, $k, $v)
	{
		$Old_v = Rec_Data_GetPos($Data, $k, $Pos, $L);
		if ($Old_v === false)
			$Data .= "@{$k}:{$v}\n";
		else
			$Data = B_Replace_Pos($Data, $v, $Pos, $L);
	}

?>
