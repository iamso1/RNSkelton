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
import {connect} from 'react-redux';
import {
    getPostList
} from '../actions/posts';

import InfiniteScrollView from 'react-native-infinite-scroll-view';
import NavBar from '../components/NavBar';
import moment from 'moment';
import _ from 'lodash';

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
          console.log(posts.toObject());
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

    renderPostEntityView(post){
        let comments = [];
        console.log(post.toObject());
        const mtime = moment(post.get('mtime')).format('YYYY-MM-DD A hh:mm:ss');
        const Audio = post.get('Audio');
        const type = post.get('type');
        const Server = post.get('u_fp');
        const uid = post.get('uid');
        const p_id = post.get('id');

        if(!_.isUndefined(post.get('comments'))) comments = post.get('comments').toArray();

        return(
            <View style={styles.postContainer}>
                <Text>post11111111111</Text>
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
});

function mapStateToProps(state) {
  const { posts } = state;
  return {
    posts,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(PostListScene);
