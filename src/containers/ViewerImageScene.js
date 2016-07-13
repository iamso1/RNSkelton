/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  Image,
  ScrollView,
  Dimensions,
  InteractionManager,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import {
  getFileUrlForViewerImage,
  resetViewerImage,
} from '../actions/file';
import NavBar from '../components/NavBar';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

export default class ViewerImageScene extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    csServer: PropTypes.string.isRequired,
    name: PropTypes.string,
    path: PropTypes.string.isRequired,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.dispatch(getFileUrlForViewerImage(this.props.csServer, this.props.path));
    });
  }

  componentWillUnmount() {
    this.props.dispatch(resetViewerImage());
  }

  render() {
    const { viewerImage } = this.props;
    if (viewerImage.size === 0) { return null; }
    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title={this.props.name}
        />
        <ScrollView
          maximumZoomScale={3.0}
          horizontal={true}>
          <Image
            source={{uri: viewerImage.get('url')}}
            style={styles.image}
            resizeMode="contain"
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: deviceWidth,
    height: deviceHeight,
  },
});


function mapStateToProps(state) {
  const {
    viewerImage,
  } = state;

  return {
    viewerImage,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(ViewerImageScene);
