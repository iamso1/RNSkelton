/*
 * @flow
 */
import React, {
    PropTypes
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';
import {
    randomString,
} from '../utils/OthersLib';
import {
    getComments,
} from '../actions/posts';
import {
    getThumbLogo,
} from '../utils/apiWrapper';

import Button from 'react-native-button';

let Immutable = require('immutable');

export default class Comments extends React.Component{
    static propTypes = {
        comments: PropTypes.instanceOf(Immutable.List).isRequired,
        post: PropTypes.instanceOf(Immutable.Map).isRequired,
        cnt_cmn: PropTypes.number.isRequired,
        csServer: PropTypes.string.isRequired,
        dispatch: PropTypes.func.isRequired,
    };

    constructor(props){
        super(props);
        this.loadComments = this.loadComments.bind(this);
    }

    loadComments(post: Object){
        const { csServer } = this.props;
        this.props.dispatch(getComments(csServer, post.get('bbs_path'), post.get('path'), post.get('f'), this._page, this._pageSize));
    }

    render(){
        let commentsBTN;

        const {
            comments,
            cnt_cmn,
            csServer,
            post,
        } = this.props;

        if(comments.size < cnt_cmn){
            commentsBTN = <Button
                onPress={() => this.loadComments(post)}>下載更多留言({cnt_cmn})...</Button>;
        }

        return(
            <View style={styles.postComment}>
                {comments.map(comment => {
                    const logo = getThumbLogo(csServer, comment.get('acn'));
                    return (
                        <View
                            key={randomString(10)}
                            style={styles.container}>
                            <View style={styles.header}>
                                <View style={{flex: 1}}>
                                    <Image
                                        style={styles.userLogo}
                                        source={{uri: logo}} />
                                </View>
                                <View style={{flex: 4, marginTop: 5,}}>
                                    <Text style={styles.postBodyText}></Text>
                                </View>
                                <View>
                                    <Text style={styles.postDateText}>{comment.get('t')}</Text>
                                </View>
                            </View>
                            <View style={styles.postBody}>
                              <View>
                                  <Text style={styles.postBodyText}>{comment.get('c')}</Text>
                              </View>
                            </View>
                        </View>
                    );
                })}
                {commentsBTN}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    userLogo: {
        height: 40,
        width: 40,
        marginLeft: 5,
        borderRadius: 20,
    },
    header: {
        flexDirection: 'row',
        marginRight: 10,
        marginLeft: 10,
        marginTop: 20,
        marginBottom: 10,
    },
    postBody: {
        paddingLeft: 25,
        paddingTop: 10,
        marginBottom: 10,
    },
    postBodyText: {
        fontSize: 18,
        color: '#000000',
    },
    postDateText: {
        fontSize: 12,
        color: '#CCCCCC'
    },
    postFooter: {
        flexDirection: 'row',
        marginBottom: 15,
        paddingTop: 5,
        paddingBottom: 5,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#CCCCCC',
    },
    postFooterBlock: {
        flex: 1,
    },
    postFooterText: {
        alignItems: 'center',
        justifyContent: 'center',
    },

});
