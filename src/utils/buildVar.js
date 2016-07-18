/**
 * @flow
 */
export const API_URL_BASE = 'https://cloud.ccu.edu.tw';
export const WS_HOST = 'ws://nuweb.ddns.net:5701';
export const WS_IMAGE_HOST = 'http://nuweb.ddns.net:5701';
export const WS_API_HOST = 'http://nuweb.ddns.net:5701';
export const permisions = [
    {
        key: 'nuweb',
        icon: 'files-o',
        name: '我的檔案',
        navKey: 'files',
        initialRouteUrl: '/files/',
        ref: 'tab_0'
    },{
        key: 'member_dir',
        icon: 'th-list',
        name: '檔案列表',
        navKey: 'fileGroups',
        initialRouteUrl: '/fileGroups/',
        ref: 'tab_1'
    },{
        key: 'chatbox',
        icon: 'comments-o',
        name: '聊天室',
        navKey: 'chatbox',
        initialRouteUrl: '/chatroom/',
        ref: 'tab_2'
    },{
        key: 'notice',
        icon: 'bell-o',
        name: '通知',
        navKey: 'notifications',
        initialRouteUrl: '/notifications/',
        ref: 'tab_3'
    },{
        key: 'table',
        icon: 'feed',
        name: '通知',
        navKey: 'feed',
        initialRouteUrl: '/feed/',
        ref: 'tab_4'
    },{
        key: 'numail',
        icon: 'inbox',
        name: '信件',
        navKey: 'mail',
        initialRouteUrl: '/mail/',
        ref: 'tab_5'
    }
];
