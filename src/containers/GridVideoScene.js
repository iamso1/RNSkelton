/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  Image,
  ListView,
  RefreshControl,
  InteractionManager,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import _ from 'lodash';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import {
  getFileList,
  cleanupFileListData,
  composeFilesKey,
} from '../actions/files';
import { changeRoute } from '../actions/route';
import NavBar from '../components/NavBar';
import { getThumbImage } from '../utils/apiWrapper';

export default class GridVideoScene extends React.Component {
  constructor(props) {
    super(props);
    this.renderVideoView = this.renderVideoView.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.refresh = this.refresh.bind(this);
    this._page = 1;
    this._filesKey = composeFilesKey('Video', null);
    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
      getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
    });
    this.state = {
      dataSource: dataSource.cloneWithRows(Immutable.List(), []),
      canLoadMore: true,
      isRefreshing: false,
    };

  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.dispatch(getFileList(null, null, 'Video', this._page));
    });
  }

  componentWillReceiveProps(nextProps) {
    const {files} = nextProps;

    let pathFiles = files.get(this._filesKey);
    if (pathFiles != null && this.props.files.get(this._filesKey) !== pathFiles) {
      let fileCount = pathFiles.get('files').size;
      let canLoadMore = pathFiles.get('hasNextPaging');
      let rowIds = (count => [...Array(count)].map((val, i) => i))(fileCount);
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(pathFiles.get('files'), rowIds),
        canLoadMore: canLoadMore,
        isRefreshing: false,
      });
    }
  }

  componentWillBlur() {
    this.props.dispatch(cleanupFileListData(this._filesKey));
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state !== nextState ||
      this.props.files !== nextProps.files &&
      this.props.files.get(this._filesKey) !== nextProps.files.get(this._filesKey)
    );
  }

  handleSelectVideo(video) {
    this.props.dispatch(changeRoute(`/viewers/media?name=${video.get('name')}&type=video&csServer=${video.get('csServer')}&path=${video.get('url')}`,
                                    this.props.navigator.props.navKey));
  }

  loadMore() {
    this.props.dispatch(getFileList(null, null, 'Video', ++this._page));
  }

  refresh() {
    this.setState({ isRefreshing: true });
    this._page = 0;
    this.props.dispatch(cleanupFileListData(this.state.path));
    this.props.dispatch(getFileList(null, null, 'Video', ++this._page));
  }

  renderVideoView(video, sectionID, rowID) {
    let thumb = video.get('thumbUrl');
    if(_.isNull(thumb)){
        thumb = getThumbImage(video.get('csServer'), video.get('url'), video.get('type'));
    }
    return (
      <TouchableWithoutFeedback onPress={() => this.handleSelectVideo(video)}>
        <Image
          style={styles.image}
          source={{uri: thumb}}
        />
      </TouchableWithoutFeedback>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title="所有影片"
        />
        <ListView
          renderScrollComponent={props =>
            <InfiniteScrollView
              refreshControl={
                <RefreshControl
                  onRefresh={this.refresh}
                  refreshing={this.state.isRefreshing}
                />
              }
              {...props}
            />
          }
          enableEmptySections={true}
          onLoadMoreAsync={this.loadMore}
          dataSource={this.state.dataSource}
          canLoadMore={this.state.canLoadMore}
          pageSize={30}
          style={styles.listView}
          contentContainerStyle={styles.gridView}
          renderRow={this.renderVideoView}
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
  listView: {
    marginTop: 10,
  },
  footerMargin: {
    marginBottom: 10,
  },
  gridView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  image: {
    width: 120,
    height: 120,
    marginTop: 10,
  },
});


function mapStateToProps(state) {
  const { files } = state;

  return {
    files,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(GridVideoScene);
