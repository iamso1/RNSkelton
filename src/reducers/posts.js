/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';
import Immutable from 'immutable';
import _ from 'lodash';

const initialState = Immutable.Map();

export default createReducer(initialState, {
    [ActionTypes.DISPLAY_POST_DETAIL](state, action){
        return state.set('detail', Immutable.fromJS(action.post));
    },
    [ActionTypes.POST_PUSH_LIKE](state, action){
        return state.update(action.path, posts => {
            return posts.update('content', content => {
                return content.map(post => {

                    if(post.get('id') === action.p_id){
                        return post.set('cnt', action.cnt);
                    }else{
                        return post;
                    }
                });
            });
        });
    },
    [ActionTypes.GET_COMMETS_REQUEST](state, action) {
        const {
            uid,
            id
        } = action;

        let newState = state.update(uid, posts => {
            return posts.update('content', posts => {
                return posts.map(post => {
                    const p_id = post.get('id');

                    if (p_id === id) {

                        if (_.isUndefined(post.get('comments'))) {
                            return post.set('comments', Immutable.fromJS(action.comments))
                                .set('hasNextPaging', action.hasNextPaging);
                        } else {
                            return post.update('comments', c => {
                                return c.concat(Immutable.fromJS(action.comments));
                            });
                        }
                    } else {
                        return post;
                    }
                });
            }).set('hasNextPaging', action.hasNextPaging);
        });

        return newState;
    },
    [ActionTypes.POST_GET_LIST_REQUEST](state, action) {
        const {
            path,
            hasNextPaging
        } = action;

        let newState;

        const messages = state.get(path);

        if (messages) {
            const content = messages.get('content');

            if (content.size > 10) {
                newState = state.update(path, chat => {
                    let newchat = chat.update('hasNextPaging', hasNextPaging);
                    return newchat.update('content', messages => {
                        return messages.concat(Immutable.fromJS(action.message.content));
                    });
                });
            } else {

                let posts = Immutable.fromJS(action.message);
                posts.hasNextPaging = hasNextPaging;
                newState = state.set(path, posts);
            }

        } else {
            action.message.hasNextPaging = hasNextPaging;
            const posts = Immutable.fromJS(action.message);
            newState = state.set(path, posts);
        }

        return newState;
    },
    [ActionTypes.POST_GET_LIST_REFRESH](state, action) {
        const {
            path
        } = action;
        const hasNextPaging = action.message >= 20;
        const posts = Immutable.fromJS(action.message);
        return state.set(path, posts).set('hasNextPaging', hasNextPaging);
    }
});
