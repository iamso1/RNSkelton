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

import NavBar from '../components/NavBar';
import Immutable from 'immutable';
import {connect} from 'react-redux';

class FirstScene extends React.Component {
  constructor(props) {
    super(props);
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
      createDirName: '',
    };
  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
    name: PropTypes.string,
  };

  static defaultProps = {
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.dispatch(getFileList(this.props.csServer, this.state.path, this.props.type, this._page));
    });
  }

  componentWillReceiveProps(nextProps) {
    const {files} = nextProps;

    let pathFiles = files.get(this._filesKey);
    console.log(pathFiles);
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

  render() {
    return (
      <View style={styles.container}>
          <NavBar
              navigator={this.props.navigator}
              title={this.props.name}
              renderRightButtonsComponent={this.renderNavRightButtons}/>

          <Text style={{fontSize: 50, margin: 50}}>First Scene</Text>
          <Text style={{fontSize: 50, margin: 50}}>First Scene</Text>
          <Text style={{fontSize: 50, margin: 50}}>First Scene</Text>
          <Text style={{fontSize: 50, margin: 50}}>First Scene</Text>
          <Text style={{fontSize: 50, margin: 50}}>First Scene</Text>
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
  const {auth} = state;

  return {
      auth,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(FirstScene);
