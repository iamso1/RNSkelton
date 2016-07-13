/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
    StyleSheet,
    View,
    InteractionManager,
} from 'react-native';
import { connect } from 'react-redux';
import Media from 'react-native-video';
import Progress from 'react-native-progress';
import {
  getFileUrlForViewerVideo,
  getFileUrlForViewerAudio,
  resetViewerMedia,
} from '../actions/file';
import NavBar from '../components/NavBar';


export default class ViewerMediaScene extends React.Component {
  constructor(props) {
    super(props);
    this.handleError = this.handleError.bind(this);
  }

  static propTypes = {
    type: PropTypes.string.isRequired,
    csServer: PropTypes.string.isRequired,
    name: PropTypes.string,
    path: PropTypes.string.isRequired,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      const { type } = this.props;
      if (type === 'video') {

        this.props.dispatch(getFileUrlForViewerVideo(this.props.csServer, this.props.path));
      } else if (type === 'audio') {

        this.props.dispatch(getFileUrlForViewerAudio(this.props.csServer, this.props.path));
      }
    });
  }

  componentWillUnmount() {
    this.props.dispatch(resetViewerMedia());
  }

  handleError(e) {
    console.log('Unable to load video - ' + JSON.stringify(e));
  }

  renderLoadingView() {
    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title={this.props.name}
        />

        <View style={styles.spinner}>
          <Progress.Circle
            size={50}
            color="#00a5e6"
            animated={true}
            indeterminate={true}
            borderWidth={3}
          />
        </View>
      </View>
    );
  }

  render() {
    const mediaUrl = this.props.viewerMedia.get('url');

    if (mediaUrl == null) {
      return this.renderLoadingView();
    }

    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title={this.props.name}
        />

        <Media
          source={{uri: mediaUrl}}
          style={styles.video}
          resizeMode="contain"
          onError={this.handleError}
          repeat={false}
          controls={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  spinner: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  video: {
    position: 'absolute',
    top: 64,
    right: 0,
    bottom: 49,
    left: 0,
  },
});


function mapStateToProps(state) {
  const {
    viewerMedia,
  } = state;

  return {
    viewerMedia,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(ViewerMediaScene);
