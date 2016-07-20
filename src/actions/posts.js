/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import SessionManager from '../utils/sessionManager';
import _ from 'lodash';
import {
    request,
    getMyCsServer,
    QuerystringToObject,
    getBBSPath,
} from '../utils/apiWrapper';

export function getComments(csServer: string, bbs_path: string, path: string, f: string, p: number, ps: number): Function {

    return (dispatch, getState) => {
        let params = {
            mode: 'cmn_get',
            path,
            f,
            p,
            ps,
        };
        const uri = `${bbs_path}/index.php`;

        return request(uri, 'GET', params, SessionManager.sessionToken, csServer)
            .then(resp => resp.json())
            .then(resp => {
                dispatch({
                    type: ActionTypes.POST_GET_COMMENTS_LIST,
                    comments: resp.recs,
                });
            }).catch(error => console.warn(error));

    }
}

export function displayPostDeail(post: Object, csServer: string): Function {
    return (dispatch, getState) => {
        const bbs_path = getBBSPath(post.get('u_fp'));
        const {
            path,
            f,
            i
        } = QuerystringToObject(post.get('url'));

        let params = {
            mode: 'rec_get',
            path,
            f,
            i,
        };

        const uri = `${bbs_path}/index.php`;
        return request(uri, 'GET', params, SessionManager.sessionToken, csServer)
            .then(resp => resp.json())
            .then(resp => {
                resp.path = path;
                resp.f = f;
                resp.i = i;
                resp.bbs_path = bbs_path;
                resp.v_fp = post.get('v_fp');
                resp.comments = [];
                
                dispatch({
                    type: ActionTypes.DISPLAY_POST_DETAIL,
                    post: resp,
                });
                return resp;
            });
    }
}

export function likePost(csServer: string, bbs_path: string, like: string, p_id: string, path: string, f: string): Function {
    return (dispatch, getState) => {
        const uri = `${bbs_path}/index.php`;
        let params = {
            path: path,
            f: f,
            like: like,
            mode: 'like',
            act: 'GetComment',
        };

        return request(uri, 'GET', params, SessionManager.sessionToken, csServer)
            .then(resp => resp.json())
            .then(resp => {
                const {
                    cnt_like,
                    bMyLike
                } = resp;
                dispatch({
                    type: ActionTypes.POST_PUSH_LIKE,
                    cnt_like,
                    bMyLike,
                });
                return resp;
            });
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
            cnt_like: 'y',
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

                    let data = _.pick(msg, 'cnt', 't_first', 't_last', 'type', 'u_fp', 'v_fp', 'cnt_like');

                    data.files = msg.files.map((file) => {

                        data.id = file.id;
                        if (!data.url) data.url = file.url;
                        data.uid = file.owner;

                        let f = _.pick(file, 'type', 'filename', 'author', 'id', 'owner', 'owner_sun', 'tag', 'time', 'upload_time', 'url', 'cnt_like', 'cnt_share', 'atc', 'url', 'description', 'site_id', 'id');

                        if (!_.isEmpty(file.thumbs)) f.thumbs = `${data.u_fp}/${file.thumbs}`;
                        else f.thumbs = '';

                        data.type = file.type;
                        data.description = file.description;
                        return f;
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
