/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  Text,
  Image,
  ListView,
  RefreshControl,
  InteractionManager,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import {
  getFileList,
  cleanupFileListData,
  composeFilesKey,
} from '../actions/files';
import NavBar from '../components/NavBar';
import ImageCarousell from '../components/ImageCarousell';


export default class GridImageScene extends React.Component {
  constructor(props) {
    super(props);
    this.handleCloseCarousell = this.handleCloseCarousell.bind(this);
    this.renderImageView = this.renderImageView.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.refresh = this.refresh.bind(this);
    this._page = 1;
    this._filesKey = composeFilesKey('Image', null);
    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
      getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
    });
    this.state = {
      dataSource: dataSource.cloneWithRows(Immutable.List(), []),
      canLoadMore: true,
      isRefreshing: false,
      showCarousell: false,
    };

  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.dispatch(getFileList(null, null, 'Image', this._page));
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

  handleSelectImage(image, index) {
    this.setState({
      showCarousell: true,
      carousellIndex: index,
    });
  }

  handleCloseCarousell() {
    this.setState({ showCarousell: false });
  }

  loadMore() {
    this.props.dispatch(getFileList(null, null, 'Image', ++this._page));
  }

  refresh() {
    this.setState({ isRefreshing: true });
    this._page = 0;
    this.props.dispatch(cleanupFileListData(this.state.path));
    this.props.dispatch(getFileList(null, null, 'Image', ++this._page));
  }

  renderImageView(image, sectionID, rowID) {
    return (
      <TouchableWithoutFeedback onPress={() => this.handleSelectImage(image, rowID)}>
        <Image
          style={styles.image}
          source={{uri: image.get('thumbUrl')}}
        />
      </TouchableWithoutFeedback>
    );
  }

  renderCarousellView() {
    return (
      <View style={styles.container}>
        <ImageCarousell
          initialIndex={this.state.carousellIndex}
          dataSource={this.state.dataSource}
        />
        <View style={styles.closeCarousellButton}>
          <Text
            onPress={this.handleCloseCarousell}
            style={styles.closeCarousellText}>關閉</Text>
        </View>
      </View>
    );
  }

  render() {
    if (this.state.showCarousell) {
      return this.renderCarousellView();
    }

    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title="所有圖片"
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
          renderRow={this.renderImageView}
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
  closeCarousellButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    width: 50,
    height: 30,
    right: 20,
    top: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderColor: '#808080',
  },
  closeCarousellText: {
    textAlign: 'center',
    color: '#fff',
  },
});


function mapStateToProps(state) {
  const { files } = state;

  return {
    files,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(GridImageScene);
