/**
 * @flow
 */
import React, { PropTypes } from 'react';

import {
    View,
    Text,
    ListView,
    InteractionManager,
    TouchableWithoutFeedback,
    RefreshControl,
    StyleSheet,
} from 'react-native';

import {
  getFileList,
  cleanupFileListData,
  createDirectory,
  composeFilesKey,
} from '../actions/files';

import Menu, {
    MenuOptions,
    MenuOption,
    MenuTrigger
} from 'react-native-menu';

import InfiniteScrollView from 'react-native-infinite-scroll-view';
import Icon from 'react-native-vector-icons/FontAwesome';

import NavBar from '../components/NavBar';
import FileEntityView from '../components/FileEntityView';
import TextInput from '../components/TextInput';
import {changeRoute} from '../actions/route';
import {connect} from 'react-redux';

let Immutable = require('immutable');

class FilesScene extends React.Component {
    static propTypes = {
      navigator: PropTypes.object.isRequired,
      name: PropTypes.string,
      csServer: PropTypes.string,
      path: PropTypes.string,
      type: PropTypes.oneOf(['Image', 'Video', 'Audio', 'Html', 'Document,Text', 'Link', 'Other']),
    };

    static defaultProps = {
      path: null,
    };

    constructor(props) {
        super(props);
        this.loadMore = this.loadMore.bind(this);
        this.refresh = this.refresh.bind(this);
        this.renderFileEntityView = this.renderFileEntityView.bind(this);

        this.handleSelectDirectory = this.handleSelectDirectory.bind(this);
        this.handleSelectImage = this.handleSelectImage.bind(this);
        this.handleSelectVideo = this.handleSelectVideo.bind(this);
        this.handleSelectMedia = this.handleSelectMedia.bind(this);
        this.handleSelectAudio = this.handleSelectAudio.bind(this);
        this.handleSelectLink = this.handleSelectLink.bind(this);
        this.handleSelectDocument = this.handleSelectDocument.bind(this);
        this.handleMenuSelect = this.handleMenuSelect.bind(this);

        this.closeCreateDirDialog = this.closeCreateDirDialog.bind(this);
        this.renderCreateDirDialog = this.renderCreateDirDialog.bind(this);

        this.renderNavRightButtons = this.renderNavRightButtons.bind(this);

        this._page = 1;
        this._filesKey = composeFilesKey(this.props.type, this.props.path);

        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });


        this.state = {
          path: this.props.path,
          csServer: this.props.csServer,
          dataSource: dataSource.cloneWithRows(Immutable.List(), []),
          canLoadMore: true,
          isRefreshing: false,
          showCreateDirDialog: false,
          createDirName:  '',
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
          this.props.dispatch(getFileList(this.props.csServer, this.state.path, this.props.type, this._page));
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

    handleSelectMedia(type, name, csServer, url) {
      this.props.dispatch(changeRoute(`/viewers/media?name=${name}&type=${type}&csServer=${csServer}&path=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectAudio(name: string, csServer: string, url: string) {
      this.handleSelectMedia('audio', name, csServer, url);
    }

    handleSelectVideo(name: string, csServer: string, url: string) {
      this.handleSelectMedia('video', name, csServer, url);
    }

    handleSelectDirectory(name: ?string, csServer: string, url: string) {
      this.props.dispatch(changeRoute(`/files/?name=${name}&csServer=${csServer}&path=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectImage(name: string, csServer: string, url: string) {
      this.props.dispatch(changeRoute(`/viewers/image?name=${name}&csServer=${csServer}&path=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectLink(name: string, url: string) {
      this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=link&url=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectDocument(name: string, csServer: string, url: string) {
      this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=document&csServer=${csServer}&url=${url}`,
                                      this.props.navigator.props.navKey));
    }

    handleSelectHtml(name: string, csServer: string, url: string) {
      this.props.dispatch(changeRoute(`/viewers/web?name=${name}&type=html&csServer=${csServer}&url=${url}`,
                                      this.props.navigator.props.navKey));
    }

    loadMore() {
      this.props.dispatch(getFileList(this.props.csServer, this.state.path, this.props.type, ++this._page));
    }

    refresh() {
      this.setState({ isRefreshing: true });
      this._page = 0;
      this.props.dispatch(cleanupFileListData(this.state.path));
      this.props.dispatch(getFileList(this.props.csServer, this.state.path, this.props.type, ++this._page));
    }

    closeCreateDirDialog() {
      this.setState({ showCreateDirDialog: false });
    }
    
    renderCreateDirDialog() {
      if (!this.state.showCreateDirDialog) { return null; }

      return (
        <TouchableWithoutFeedback onPress={this.closeCreateDirDialog}>
          <View style={styles.overlay}>
            <View style={styles.createDirDialog}>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  autoFocus={true}
                  onChangeText={text => this.setState({ createDirName: text })}
                  value={this.state.createDirName}
                  placeholder="輸入資料夾名稱"
                  autoCapitalize="none"/>
              </View>
              <View style={styles.createDirDialogControls}>
                <View style={[styles.buttonTextContainer, styles.buttonTextContainerSeperator]}>
                  <Text style={styles.buttonText} onPress={this.closeCreateDirDialog}>取消</Text>
                </View>
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText} onPress={this.createDir}>確認</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    }

    renderFileEntityView(file) {
      return (
        <FileEntityView
          file={file}
          onSelectDirectory={this.handleSelectDirectory}
          onSelectImage={this.handleSelectImage}
          onSelectVideo={this.handleSelectVideo}
          onSelectAudio={this.handleSelectAudio}
          onSelectLink={this.handleSelectLink}
          onSelectDocument={this.handleSelectDocument}
          onSelectHtml={this.handleSelectHtml}
        />
      );
    }

    handleMenuSelect(value) {
      if (value === 'createDir') {
        this.setState({ showCreateDirDialog: true });
      } else if (value === 'uploadFile') {
            this.uploadFile();
      }else if(value === 'uploadVideo'){
            this.uploadVideo();
      }else if(value === 'setting'){
            this.props.dispatch(changeRoute(`/settings/`, this.props.navigator.props.navKey));
      }
    }

    renderNavRightButtons() {
      return (
        <View>
          <Menu onSelect={this.handleMenuSelect}>
            <MenuTrigger>
              <Icon
                name="ellipsis-h"
                size={20}
                color="#ffffff"
              />
            </MenuTrigger>
            <MenuOptions>
              <MenuOption value="createDir">
                <Text>新增資料夾</Text>
              </MenuOption>
              <MenuOption value="uploadFile">
                <Text>上傳相片</Text>
              </MenuOption>
              <MenuOption value="uploadVideo">
                <Text>上傳影片</Text>
              </MenuOption>
              <MenuOption value="setting">
                <Text>個人設定</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

      );
    }

    render() {
        return (
            <View style={styles.container}>
              <NavBar
                navigator={this.props.navigator}
                title={this.props.name}
                renderRightButtonsComponent={this.renderNavRightButtons}
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
                renderRow={this.renderFileEntityView}
                renderSeparator={(sectionID, rowID, adjacentRowHighlighted) => <View key={rowID} style={styles.separator} />}
                renderFooter={() => <View style={styles.footerMargin} />}
              />

              {this.renderCreateDirDialog()}
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
  separator: {
    backgroundColor: '#ccc',
    height: 1,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 50,
    marginRight: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createDirDialog: {
    backgroundColor: '#fff',
    borderRadius: 5,
    width: 300,
    height: 100,
  },
  createDirDialogControls: {
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  textInputContainer: {
    padding: 20,
  },
  textInput: {
    height: 20,
  },
  buttonText: {
    textAlign: 'center',
    color: '#0076ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    paddingBottom: 10,
  },
  buttonTextContainerSeperator: {
    borderRightWidth: 1,
  },
});


function mapStateToProps(state) {
  const { files } = state;

  return {
      files,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(FilesScene);
