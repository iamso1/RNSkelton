/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import SessionManager from '../utils/sessionManager';
import _ from 'lodash';
import {
    request,
    getMyCsServer,
} from '../utils/apiWrapper';

export function getComments(csServer: string, path: string, f: string, p: number = 1, ps: number = 10, id: string, uid: string) {

    return (dispatch, getState) => {

        let params = {
            mode: 'cmn_get',
            path,
            p,
            ps,
            f,
        };

        return Promise.resolve(csServer)
            .then(_csServer => _csServer || getMyCsServer())
            .then(_csServer => {

                return request(`/Site/${uid}/.nuweb_forum/index.php`, 'GET', params, SessionManager.sessionToken, _csServer);
            }).then(resp => {

                return resp.json();
            }).then(resp => {

                const comments = resp.recs.map(comment => {
                    return _.pick(comment, 't', 'c', 'acn');
                });
                const hasNextPaging = resp.recs.length >= ps;

                dispatch({
                    type: ActionTypes.GET_COMMETS_REQUEST,
                    comments,
                    hasNextPaging,
                    id,
                    uid,
                });

            });
    }
}

export function refreshPostList(csServer: string, path: string, act: string = '', as: string = 'all', t_first: number, pageSize: number = 1): Function {
    return (dispatch, getState) => {
        let params = {
            //		ao: SessionManager.acn,
            mode: 'get_global_dynamic2',
            act: act,
            ps: pageSize,
            as: as,
        };

        if (t_first) params.pt = t_first;

        return Promise.resolve(csServer)
            .then(_csServer => _csServer || getMyCsServer())
            .then(_csServer => {

                return request('/tools/api_user_info.php', 'GET', params, SessionManager.sessionToken, _csServer);
            }).then(resp => resp.json())
            .then(resp => {
                let {
                    recs,
                    cnt
                } = resp;
                let message = _.pick(resp, 'user', 'user_sun', 'user_mail', 'cnt_new');
                const hasNextPaging = cnt >= pageSize;

                message.content = _.map(recs, (msg) => {
                    let data = _.pick(msg, 'cnt', 't_first', 't_last', 'type', 'u_fp', 'v_fp');
                    msg.files.map((file) => {
                        let f = _.pick(file, 'type', 'filename', 'author', 'id', 'owner', 'owner_sun', 'tag', 'time', 'upload_time', 'url', 'cnt_like', 'cnt_share', 'atc', 'url', 'description', 'site_id', 'id');

                        if (!_.isEmpty(file.thumbs)) f.thumbs = `${data.u_fp}/${file.thumbs}`;
                        else f.thumbs = '';

                        const key = file.type;
                        if (_.isUndefined(data[key])) data[key] = new Array();

                        data[key].push(f);
                    });
                    return data;
                });


                dispatch({
                    type: ActionTypes.POST_GET_LIST_REFRESH,
                    message,
                    path,
                    hasNextPaging,
                });
                return message;
            }).catch(err => console.warn(err));
    }
}

export function getPostList(csServer: string, path: string, act: string = '', as: string = 'all', t_first: number, pageSize: number = 1): Function {
    return (dispatch, getState) => {

        let params = {
            //		ao: SessionManager.acn,
            mode: 'get_global_dynamic2',
            ps: pageSize,
            ao: path,
            as: as,
        };

        if (t_first) params.pt = t_first;

        let queryCsServer = null;
        return Promise.resolve(csServer)
            .then(_csServer => _csServer || getMyCsServer())
            .then(_csServer => {
                queryCsServer = _csServer;
                return request('/tools/api_user_info.php', 'GET', params, SessionManager.sessionToken, queryCsServer);
            }).then(resp => resp.json())
            .then(resp => {

                let {
                    recs,
                    cnt
                } = resp;
                let message = _.pick(resp, 'user', 'user_sun', 'user_mail', 'cnt_new');
                const hasNextPaging = recs.length >= pageSize;

                message.content = _.map(recs, (msg) => {
                    let data = _.pick(msg, 'cnt', 't_first', 't_last', 'type', 'u_fp', 'v_fp');

                    msg.files.map((file) => {
                        
                        data.id = file.id;
                        if (!data.url) data.url = file.url;
                        data.uid = file.owner;

                        let f = _.pick(file, 'type', 'filename', 'author', 'id', 'owner', 'owner_sun', 'tag', 'time', 'upload_time', 'url', 'cnt_like', 'cnt_share', 'atc', 'url', 'description', 'site_id', 'id');

                        if (!_.isEmpty(file.thumbs)) f.thumbs = `${data.u_fp}/${file.thumbs}`;
                        else f.thumbs = '';

                        const key = file.type;
                        if (_.isUndefined(data[key])) data[key] = new Array();


                        data[key].push(f);
                    });
                    return data;
                });

                dispatch({
                    type: ActionTypes.POST_GET_LIST_REQUEST,
                    message,
                    path,
                    hasNextPaging,
                });
                return message;
            }).catch(err => console.warn(err));
    }
}
