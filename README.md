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

#### Output

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
