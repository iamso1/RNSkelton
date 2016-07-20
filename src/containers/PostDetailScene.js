import React, {
    PropTypes
} from 'react';
import {
    ScrollView,
    View,
    Text,
    ListView,
    Image,
    InteractionManager,
    TouchableHighlight,
    TouchableWithoutFeedback,
    RefreshControl,
    Dimensions,
    StyleSheet,
} from 'react-native';
import {
    connect
} from 'react-redux';
import {
    TimeFormat
} from '../utils/TimeHandler';
import {
    getThumbLogo,
    getBBSPath,
    getThumbImage,
} from '../utils/apiWrapper';
import {
    getPostList,
    likePost,
    displayPostDeail,
} from '../actions/posts';
import {
    changeRoute
} from '../actions/route';
import {
    replace_mapping,
} from '../utils/buildVar';
import {
    randomString,
} from '../utils/OthersLib';
import ProgressBar from 'react-native-progress/CircleSnail';

import InfiniteScrollView from 'react-native-infinite-scroll-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import NavBar from '../components/NavBar';
import TextInput from '../components/TextInput';
import FileEntityView from '../components/FileEntityView';
import FileHanlderBase from '../components/FileHandlerBase';
import moment from 'moment';
import _ from 'lodash';
import PureRenderMixin from 'react-addons-pure-render-mixin';

let Immutable = require('immutable');
const queryString = require('query-string');

class PostDetailScene extends FileHanlderBase {
    static propTypes = {
      navigator: PropTypes.object.isRequired,
      name: PropTypes.string,
      path: PropTypes.string,
      csServer: PropTypes.string,
    };

    constructor(props){
        super(props);

        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            canLoadMore: true,
            isRefreshing: true,
        };
    }

    componentWillReceiveProps(nextProps) {
          const { posts } = nextProps;

    }

    renderLoadingBar(refreshing: bool){
        return <View style={styles.center}>
            <ProgressBar
                animating={refreshing}
                hidesWhenStopped={true}
                size={100} />
        </View>
    }

    splitAtcFiles(csServer: string, atc: string, author: string){
        let msg = atc.split('\n');
        msg = _.chunk(msg, 7);
        let files = msg.map(m => {
            const atts = _.drop(m);
            return atts.map(att => {
                return att.replace(/@Y:|@fp:|@fn:|@fS:|@T:|@tn:|\n/, matched => {
                    return replace_mapping[matched];
                }).trim();
            }).join('",');
        });

        return _.compact(files.map(newstr => {
            let d = JSON.parse(`{${newstr}"}`);

            if(d.type === 'Video'){
                const realServer = csServer.split('/Site')[0];
                d.thumb = getThumbImage(realServer, `/Site/${author}/.nuweb_forum/${d.path}`, 'Video');
            }else{
                d.thumb = (d.thumb === 'null') ? null : `${csServer}/${d.thumb}`;
            }
            d.path = `${csServer}/${d.path}`;
            return d;
        }));
    }

    likePost(post: Object){

        const { csServer } = this.props;
        const like = (post.get('bMyLike')) ? 'n' : 'y';
        this.props.dispatch(likePost(csServer, post.get('bbs_path'), like, post.get('acn'), post.get('path'), post.get('f')));
    }

    renderFileEntityView(file: Object, csServer: string){
        let data = {
            filename: file.get('fn'),
            url: `${csServer}/${file.get('fp')}`,
            type: file.get('Y'),
        };

        return (
        <View
            key={randomString(10)}
            style={styles.fileBlockRow}>
                <FileEntityView
                    file={Immutable.fromJS(data)}
                    onSelectDirectory={this.handleSelectDirectory}
                    onSelectImage={this.handleSelectImage}
                    onSelectVideo={this.handleSelectVideo}
                    onSelectAudio={this.handleSelectAudio}
                    onSelectLink={this.handleSelectLink}
                    onSelectDocument={this.handleSelectDocument}
                    onSelectHtml={this.handleSelectHtml} />
        </View>
        );
    }

    render(){
        const { posts } = this.props;
        const post = posts.get('detail');
        if(_.isUndefined(post)) return this.renderLoadingBar();

        let icon;

        const bMyLike = post.get('bMyLike');
        if(bMyLike) icon = 'thumbs-up';
        else icon = 'thumbs-o-up';
        const logo = getThumbLogo(this.props.csServer, post.get('acn'));

console.log(post.toObject());
        return(
            <View style={styles.container}>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name} />
              <ScrollView style={styles.container}>
                  <View style={styles.header}>
                      <View style={{flex: 1}}>
                          <Image
                              style={styles.userLogo}
                              source={{uri: logo}} />
                      </View>
                      <View style={{flex: 4, marginTop: 5,}}>
                          <Text style={styles.postBodyText}>{post.get('v_fp')}</Text>
                      </View>
                      <View>
                          <Text style={styles.postDateText}>{TimeFormat(post.get('t'))}</Text>
                      </View>
                  </View>
                  <View style={styles.postBody}>
                        <View>
                        <Text>{post.get('c')}</Text>
                      </View>
                      {post.get('atc').map(file => {
                        return this.renderFileEntityView(file, post.get('u_fp'));
                      })}
                  </View>
                  <View style={styles.postFooter}>
                      <View style={styles.postFooterBlock}>
                          <Icon.Button
                              onPress = {() => this.likePost(post)}
                              style={styles.postFooterText}
                              name={icon}
                              backgroundColor="#FFFFFF"
                              color="#0000ff"
                              size={18}>
                              <Text>讚({post.get('cnt_like')})</Text>
                          </Icon.Button>
                      </View>
                      <View style={styles.postFooterBlock}>
                          <Icon.Button
                              style={styles.postFooterText}
                              name="share-square-o"
                              backgroundColor="#FFFFFF"
                              color="#0000ff"
                              size={18}>
                              <Text>分享</Text>
                          </Icon.Button>
                      </View>
                  </View>

                  <View style={styles.postComment}>

                  </View>
              </ScrollView>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileBlockRow: {
        marginTop: 10,
    },
    fileRow: {
        marginLeft: 15,
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

function mapStateToProps(state) {
    const {
        posts
    } = state;
    return {
        posts,
    };
}

export default connect(mapStateToProps, null, null, {
    withRef: true
})(PostDetailScene);
