import React, { PropTypes } from 'react';
import {
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
    QuerystringToObject,
} from '../utils/apiWrapper';
import {
    getPostList,
    likePost,
    displayPostDeail,
} from '../actions/posts';
import {
    changeRoute
} from '../actions/route';


import InfiniteScrollView from 'react-native-infinite-scroll-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import NavBar from '../components/NavBar';
import moment from 'moment';
import _ from 'lodash';
import PureRenderMixin from 'react-addons-pure-render-mixin';

let Immutable = require('immutable');

class PostListScene extends React.Component{
    static propTypes = {
      navigator: PropTypes.object.isRequired,
      name: PropTypes.string,
      path: PropTypes.string,
      csServer: PropTypes.string,
    };

    constructor(props){
        super(props);
        this.refresh = this.refresh.bind(this);
        this.renderPostEntityView = this.renderPostEntityView.bind(this);
        this.likePost = this.likePost.bind(this);
        this.dispalyDetail = this.dispalyDetail.bind(this);
        this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            canLoadMore: true,
            isRefreshing: false,
            act: '',
            as: '',
            comments: {},
        };
    }

    componentDidMount(){
        InteractionManager.runAfterInteractions(() => {
            const { path, csServer } = this.props;
            this.props.dispatch(getPostList(csServer, path, '', '', null, 20));
        });
    }

    componentWillReceiveProps(nextProps) {
          const { posts, path } = nextProps;

          let postsData = posts.get(path);
          let postsContent = postsData.get('content');
          const postCount = postsContent.size;
          let canLoadMore = postsData.get('hasNextPaging');
          let rowIds = (count => [...Array(count)].map((val, i) => i))(postCount);

          this.setState({
              dataSource: this.state.dataSource.cloneWithRows(postsContent, rowIds),
              canLoadMore: canLoadMore,
              isRefreshing: false,
              posts: posts.get(path),
              comments: postsData.get('comments') || {},
          });
    }

    loadMore(){
        if(this.state.isRefreshing) return ;
        const { path, posts } = this.props;
        //取回最後一篇文章
        const post = posts.get(path).get('content').toArray().pop();
        const t_first = post.get("t_first");
        this.props.dispatch(getPostList(this.props.csServer, path, '', 'all', t_first, 20));
    }

    refresh(){
        const { path } = this.props;
        this.props.dispatch(refreshPostList(this.props.csServer, path, '', 'all', null, 20));
    }

    dispalyDetail(post: Object){
        const { csServer } = this.props;
        this.props.dispatch(displayPostDeail(post, csServer));
        this.props.dispatch(changeRoute(`/postdetail/?name=詳情&csServer=${csServer}`, this.props.navigator.props.navKey));
    }

    likePost(post: Object, path: string){
        const bbs_path = getBBSPath(post.get('u_fp'));

        const query = QuerystringToObject(post.get('url'));

        const { csServer } = this.props;
        this.props.dispatch(likePost(csServer, query, bbs_path, 'n', post.get('id'), path))
        .catch(error => console.warn(error));
    }

    renderPostEntityView(post){
        let comments = [];
        const { path } = this.props;
        const logo = getThumbLogo(this.props.csServer, post.get('uid'));

        if(!_.isUndefined(post.get('comments'))) comments = post.get('comments').toArray();

        return(
            <View style={styles.postContainer} key={post.get('id')}>
                <View style={styles.postHeader}>
                    <View style={{flex: 1}}>
                        <Image
                            style={styles.userLogo}
                            source={{uri: logo}}/>

                    </View>
                    <View style={{flex: 4, marginTop: 5,}}>
                        <Text style={styles.postBodyText}>{post.get('v_fp')}</Text>
                    </View>
                    <View>
                        <Text style={styles.postDateText}>{TimeFormat(post.get('t_last'))}</Text>
                    </View>
                </View>

                <View style={styles.postBody}>
                    <Text style={styles.postBodyText}>{post.get('description')}</Text>
                </View>
                <View style={styles.postFooter}>
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
                    <View style={styles.postFooterBlock}>

                            <Icon.Button
                                onPress={() => this.dispalyDetail(post)}
                                style={styles.postFooterText}
                                name="angle-double-right"
                                backgroundColor="#FFFFFF"
                                color="#0000ff"
                                size={18}>
                                <Text>詳情</Text>
                            </Icon.Button>
                    </View>
                </View>
            </View>
        );
    }



    render(){
        return(
            <View style={styles.container}>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name}/>
                  <ListView
                      renderScrollComponent={props => <InfiniteScrollView
                          onLoadMoreAsync={this.loadMore}
                          refreshControl={
                              <RefreshControl
                                  onRefresh={this.refresh}
                                  refreshing={this.state.isRefreshing}
                                  />}
                              {...props}
                          />}
                          enableEmptySections={true}
                          style={styles.listView}

                          canLoadMore={this.state.canLoadMore}
                          dataSource={this.state.dataSource}
                          pageSize={30}
                          renderRow={this.renderPostEntityView}
                          renderFooter={() => <View style={styles.footerMargin} />}
                      />
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
    postHeader: {
        flexDirection: 'row',
        marginRight: 10,
        marginLeft: 10,
    },
    postContainer: {
        paddingTop: 10,
        marginTop: 10,
        marginLeft: 15,
        borderBottomWidth: 1,
        borderColor: '#CCCCCC',
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
  const { posts } = state;
  return {
    posts,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(PostListScene);
