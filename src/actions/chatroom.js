/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import WebsocketManager from '../utils/websocketManager';
import moment from 'moment';
import {
    randomString
} from '../utils/OthersLib';
import {
    uploadFile
} from '../utils/apiWrapper';

export function getRoomDetail(cid: string, page: number = 1, pageSize: number = 9999): Function {
    return (dispatch, getState) => {
        return WebsocketManager.send('cb_msg_getList', {
                cid: cid,
                ps: pageSize,
            })
            .then((resp) => {
                dispatch({
                    type: ActionTypes.CHATROOM_GET_DETAIL_REQUEST,
                    detail: resp.recs,
                    canLoadMore: resp.recs < pageSize
                });
                return resp.recs;
            }).catch(err => console.error(err));
    };
}

export function getRoomsList(page: number = 1, pageSize: number = 1): Function {
    return (dispatch, getState) => {
        return WebsocketManager.send("cb_getList").then((resp) => {
            console.log(resp.recs);
            dispatch({
                type: ActionTypes.CHATROOM_GET_LIST_REQUEST,
                rooms: resp.recs,
                hasNextPaging: resp.recs < pageSize,
            });
            return resp;
        }).catch((err) => console.error(err));
    }
}

export function sendMessage(msgData: Object): Function {
    return (dispatch, getState) => {
        return WebsocketManager.send('cb_msg_add', msgData)
            .then(resp => {
                dispatch({
                    type: ActionTypes.CHATROOM_REFRESH_DETAIL_REQUEST,
                    newMsg: resp.rec,
                });
            }).then(resp => {


            }).catch(err => console.warn(err));
    }
}

export function uploadChatFile(nu_code: string, cid: string, fn: string, fs: number, path: string): Function {
    return (dispatch, getState) => {

        const fid = randomString(10);

        let args = {
            nu_code,
            fn,
            cid,
            fid,
            fs,
            mtime: moment().format('YYYYMMDDhhmmss'),
        };
        let form = new FormData();
        form.append('file', {
            uri: path,
            name: fn
        });
        form.append('data', JSON.stringify(args));

        return uploadFile(form);
    }
}
