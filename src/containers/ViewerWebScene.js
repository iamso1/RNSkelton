/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
    StyleSheet,
    View,
    WebView,
    TouchableOpacity,
    InteractionManager,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  getFileUrlForViewerDocument,
  getContentForViewerHtml,
  resetViewerWeb,
} from '../actions/file';
import NavBar from '../components/NavBar';


var WEBVIEW_REF = 'webview';

export default class ViewerWebScene extends React.Component {
  constructor(props) {
    super(props);
    this.handleNavBack = this.handleNavBack.bind(this);
    this.handleNavForward = this.handleNavForward.bind(this);
    this.handleNavigationStateChange = this.handleNavigationStateChange.bind(this);
    this.state = {
      navBackEnabled: false,
      navForwardEnabled: false,
    };
  }

  static propTypes = {
    name: PropTypes.string,
    url: PropTypes.string,
    csServer: PropTypes.string,
    hash: PropTypes.string,
    type: PropTypes.oneOf(['document', 'link', 'html']),
  };

  static defaultProps = {
    type: 'link',
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      const { type } = this.props;
      if (type === 'document') {
        this.props.dispatch(getFileUrlForViewerDocument(this.props.csServer, this.props.url));
      } else if (type === 'html') {
        this.props.dispatch(getContentForViewerHtml(this.props.csServer, this.props.url));
      }
    });
  }

  componentWillUnmount() {
    this.props.dispatch(resetViewerWeb());
  }

  handleNavBack() {
    this.refs[WEBVIEW_REF].goBack();
  }

  handleNavForward() {
    this.refs[WEBVIEW_REF].goForward();
  }

  handleNavigationStateChange(navState) {
    this.setState({
      navBackEnabled: navState.canGoBack,
      navForwardEnabled: navState.canGoForward,
    });
  }

  renderNavBackView() {
    if (this.state.navBackEnabled) {
      return (
        <TouchableOpacity onPress={this.handleNavBack}>
          <Icon
            name="chevron-left"
            size={25}
            color="#62c4ff"
            style={styles.navIcon}
          />
        </TouchableOpacity>
      );
    } else {
      return (
        <Icon
          name="chevron-left"
          size={25}
          color="#ccc"
          style={styles.navIcon}
        />
      );
    }
  }

  renderNavForwardView() {
    if (this.state.navForwardEnabled) {
      return (
        <TouchableOpacity onPress={this.handleNavForward}>
          <Icon
            name="chevron-right"
            size={25}
            color="#62c4ff"
            style={styles.navIcon}
          />
        </TouchableOpacity>
      );
    } else {
      return (
        <Icon
          name="chevron-right"
          size={25}
          color="#ccc"
          style={styles.navIcon}
        />
      );
    }
  }

  render() {
    const { type } = this.props;

    let webviewSource = null;
    let controlsView = null;
    if (type === 'document') {
      webviewSource = { uri: this.props.viewerWeb.get('url') };
    } else if (type === 'link') {
        const { hash } = this.props;
        let url;
        if(hash){
            url = `${this.props.url}/#${ hash }`;
        }else{
            url = `${this.props.url}/#${ hash }`;
        }

      webviewSource = { uri: this.props.url };
      controlsView = (
        <View style={styles.controlContainer}>
          {this.renderNavBackView()}
          {this.renderNavForwardView()}
        </View>
      );
    } else if (type === 'html') {
      webviewSource = { html: this.props.viewerWeb.get('content') };
      controlsView = (
        <View style={styles.controlContainer}>
          {this.renderNavBackView()}
          {this.renderNavForwardView()}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title={this.props.name}
        />

        <WebView
          source={webviewSource}
          style={styles.webview}
          onNavigationStateChange={this.handleNavigationStateChange}
          ref={WEBVIEW_REF}
        />
        {controlsView}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  controlContainer: {
    height: 50,
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#888',
    marginBottom: 49,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: 'center',
  },
  navIcon: {
    width: 80,
  },
});


function mapStateToProps(state) {
  const { viewerWeb } = state;
  return {
    viewerWeb,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(ViewerWebScene);
