# 中正雲 Application

API Domain : https://cloud.ccu.edu.tw

WebSocket : ws://nuweb.ddns.net:5701

## Auth

Headers

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| Cookie | String | nu_code=${sessionToken} |

### example

headers:
    { Cookie:'nu_code=p75C615B545E7702105C615B545E77040A1C210F0702395D5C56602A0B062C050940310501511903080F2150eE;' } }

## Routes

### getAccountSetting

    route: /API/chk_fun_set.php

    method: GET

#### Input

    None

#### Output

    type: json

#### Example

### Login

route : /tools/api_tools.php

method : GET

#### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| account | String |  |
| password | String |  |
| mode   | String | ssn_get2 |

#### Error

String : Error:**{Error Message}**

#### Response

type : XML

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| ssn | String |  |
| sca | String |  |
| domain | String | API domain |
| server_host | String | API Host |
| server_url | String | API URL |
| sun   | String | 帳號暱稱|
| acn | String | Server Access Token |
| mail | String | 信箱位址 |
| wns_ip   | String | Websocket IP |
| wns_port | String | Websocket Port |

#### Example :

##### Input

| 欄位名稱 | 欄位類別 |
| -------- | ------ |
| account | horsekit1982@gmail.com |
| password | xup6jo3fup6 |
| mode   | ssn_get2 |

##### Output

| 欄位名稱 | 欄位類別 |
| -------- | ------ |
| ssn | root |
| sca | 23185 |
| sun   | 7ab2c52d |
| acn | nu23185 |
| mail | horsekit1982@gmail.com |
| wns_ip   | 140.123.4.93 |
| wns_port | 8000 |

### 檢查Server User 是否被凍結

route : /API/chk_user_lock.php

method : GET

#### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| acn | String | Searver Access Token |

#### Output

String : enums("Y"(已凍結) || "N"(正常使用))

### 取回我的檔案列表

route : /tools/api_tools.php

method : GET

#### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| mode | String | "search" |
| file_path | String |  |
| p | String | index |
| ps | String | end |
| o_fields | String | 回傳欄位  |

**o_fields : url,filename,title,page_name,size,owner,last_acn,time,mtime,description,content,dir_type,type,tag,md5,link_url,view_path,pw,thumbs**

#### Output

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| page_name | String |  |
| owner | String | 創建者 |
| last_acn | String |  |
| filename | String | 名稱 |
| title | String | 暱稱 |
| time | String | 建立時間 |
| mtime | String | 修改時間|
| dir_type | String | |
| tag | String | 標籤|
| type | String | 資料類型 |
| description | String | 描述|
| pw | String | |
| url | String | |
| view_path | String | |

#### Example

#####Input

http://bach.ccu.edu.tw/tools/api_tools.php?mode=search&file_path=nu23185%2FDriver%2F&p=1&ps=1&o_fields=url%2Cfilename%2Ctitle%2Cpage_name%2Csize%2Cowner%2Clast_acn%2Ctime%2Cmtime%2Cdescription%2Ccontent%2Cdir_type%2Ctype%2Ctag%2Cmd5%2Clink_url%2Cview_path%2Cpw%2Cthumbs&dir=nu23185%2FDriver%2F

##### ouput

{
    "sort_dir": "",
    "cnt": 3,
    "recs": [{
        "page_name": "dir_Y8VUFO",
        "md5": "",
        "owner": "nu23185",
        "last_acn": "nu23185",
        "filename": "Mobile",
        "title": "Mobile",
        "size": "0",
        "time": "20160503212544",
        "mtime": "20160503212544",
        "dir_type": "OokonStorage",
        "tag": "",
        "type": "Directory",
        "description": "",
        "pw": "N",
        "url": "\/Site\/nu23185\/Driver\/dir_Y8VUFO",
        "view_path": "Tomas\/\u7db2\u8def\u786c\u789f\/Mobile"
    }],
    "debug_msg": "POWER_Manager=, USER_ACN=nu23185, Admin=1, Show=1, Download=1, Upload=1, Edit=1, Del=1"
}

## 取回動態列表

    route: /tools/api_user_info.php

    method: GET

### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| mode | get_global_dynamic2 | None|
| ps | Number | 每頁回傳幾筆 |
| ao | String | 指定哪個朋友的訊息 |
| as | String | 指定網站的訊息 |
| ts | String |  從哪個時間開始取回訊息 |
| au | String | 查某個目錄底下的所有訊息 (page_url) |
| kw | String | 關鍵字查詢 |
| id | String | 取某一筆 |

### Output

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| time | Number | TimeStamp |
| user | String | uid |
| user_mail | String | email |
| user_sun | String | nickname |
| recs | Array | Post List |

recs[0]

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| cnt | Number | 1 |
| t_first | Number | 建立時間 |
| t_last | Number | 最後修改時間 |
| u_fp | String | Server URL |
| v_fp | String | Nickname |
| files | Array | 附件列表 |

files[0]

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| allow | String | None |
| atn | String | 檔案資料字串 |
| author | String | 發布者 |
| cnt_like | String | 讚數 |
| cnt_view | String | 瀏覽數 |
| description | String | Content |
| filename | String | 檔案名稱 |
| mtime | String | 最後修改時間 |
| page_name | String | 頁面url prefix |
| site_id | String | 網頁ID |
| tag | String | Tag |
| type | String | 留言類型 [BBS, Html, Site]|
| view_path | String | 網頁prefix |

## Example

    取最新訊息：
    ?mode=get_global_dynamic2&act=&ps=20&as=all

    取最新訊息下一頁：
    ?mode=get_global_dynamic2&act=&pt=1464624449&ps=20&as=all

    取某個網站或社群的最新訊息：
    ?mode=get_global_dynamic2&act=&ps=20&as=whee-g7-28.ookon_test001

    取某個網站或社群的最新訊息下一頁：
    ?mode=get_global_dynamic2&act=&pt=1462860482&ps=20&as=whee-g7-28.ookon_test001

    取兩位朋友所發的訊息：
    ?mode=get_global_dynamic2&act=&ps=20&as=all&ao=nu12389,wheechen

## 文章按讚

    route : /tools/api_tools.php

    method : GET

### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| mode | String | default: file |
| act | String | default: GetComment |
| file_path | String | 檔案路徑 |
| like | String | enum: [y(讚) / n(取消讚)] |

### Output

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| cnt_like | Number | 總讚數 |
| bMyLike | String | 自己是否按讚 |
| us_like | Array | 按讚名單 |

## 動態按讚

    route: /Site/[site acn]/.nuweb_forum

    method: GET

### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| mode | String | enums:  [like(讚) / unlike(不喜歡)] |
| path | String | 版ID |
| f | String | 文章ID |
| like | String | enums: [y(讚) / n(回收)] |
| unlike | String | enums: [y(不喜歡) / n(回收)] |

### Output

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| cnt_like | Number | 總讚數 |
| cnt_unlike | Number | 不喜歡總數 |
| bMyLike | Boolean | 自己是否有按讚 |
| us_like | Array | 按讚的名單 |
| us_unlike | Array | 不喜歡的名單 |

## 取回留言的Comments

    route: /Site/{cid}/.nuweb_forum/index.php

    method: GET

### Input

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| mode | 'cmn_get': String |  無 |
| path | String  | 無 |
| f | String | 無 |
| p | Number | 頁數 |
| ps | Number | 幾筆資料 |

### Output

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| SYS_OS_WIN | Boolean | 無 |
| bManager | Boolean | 無 |
| bAdmin | Boolean | 無 |
| recs | Array | Comments |

#### recs<Json>

Json 結構

| 欄位名稱 | 欄位類別 | 備註 |
| -------- | ------ | ------ |
| c | String | 回文內容 |
| acn | String | 發文者id |
| t | String | 發文時間 |

## 檔案架構

```
├── src/
│   ├── Root.js
│   ├── App.js
│   ├── actions
│   │   ├── auth.js //登入, 登出, 檢查ServerSession
│   │   ├── file.js
│   │   ├── files.js
│   │   ├── notification.js
│   │   ├── route.js
│   │   ├── setting.js
│   ├── components
│   │   ├── Button.js
│   │   ├── FileEntityView.js
│   │   ├── ImageCarousell.js
│   │   ├── NavBar.js
│   │   ├── TextInput.js
│   ├── constants
│   │   ├── ActionTypes.js
│   │   ├── AppSessionState.js
│   │   ├── StorageKeys.js
│   ├── containers
│   │   ├── EntryScene.js //登入前檢查是否有沒有ServerSession Token進入Login 或 Home頁面
│   │   ├── FileGroupsScene.js //檔案分類
│   │   ├── FilesScene.js //我的檔案
│   │   ├── GridImageScene.js // 檔案分類 -> 所有圖片
│   │   ├── GridVideoScene.js// 檔案分類 -> 所有影片
│   │   ├── HomeScene.ios.js
│   │   ├── LoginScene.js
│   │   ├── NotificationsScene.js //通知
│   │   ├── SettingsScene.js// 設定
│   │   ├── TabViewContainer.js
│   │   ├── ViewerImageScene.js
│   │   ├── ViewerMediaScene.js
│   │   ├── ViewerWebScene.js
│   ├── reducers
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── index.js
│   │   ├── notifications.js
│   │   ├── route.js
│   │   ├── setting.js
│   │   ├── viewerImage.js
│   │   ├── viewerMedia.js
│   │   ├── viewerWeb.js
│   ├── routers
│   │   ├── auth.js
│   │   ├── base.js
│   │   ├── files.js
│   │   ├── home.js
│   │   ├── index.js
│   │   ├── notifications.js
│   │   ├── settings.js
│   │   ├── stubText.js
│   │   ├── viewer.js
│   ├── store
│   │   ├── configureStore.js
│   ├── utils
│   │   ├── apiWrapper.js
│   │   ├── AutoSyncManager.ios.js
│   │   ├── buildVar.js
│   │   ├── createReducer.js
│   │   ├── navigatorHelper.js
│   │   ├── sessionManager.js
│   │   ├── websocketManager.js

```
