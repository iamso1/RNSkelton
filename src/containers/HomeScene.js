/**
 * @flow
 */
import React,{ PropTypes } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    InteractionManager,
} from 'react-native';

import { connect } from 'react-redux';
import { permisions } from '../utils/buildVar';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';
import TabViewContainer from './TabViewContainer';
import TabIcon from '../components/TabIcon';
import ScrollableTabView from 'react-native-scrollable-tab-view';

export default class HomeScene extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          page: 'files',
          csServer: '',
        };
      }

    static propTypes = {
        tabIndex: PropTypes.number,
    };

    static defaultProps = {
        tabIndex: 0,
    };

    componentWillReceiveProps(nextProps){
        const { settings } = nextProps;
        if(_.isEmpty(this.state.csServer) && settings.get('permision')){
            this.setState({
                csServer: settings.get('permision').get('csServer')
            });
        }
    }

    render() {
        const { settings } = this.props;
        if(_.isUndefined(settings.get('permision'))){
            return <View />;
        }else{
            const self = this;
            return (
              <View style={styles.container}>
                <ScrollableTabView
                    initialPage={0}
                    tabBarPosition='bottom'
                    renderTabBar= {() => <TabIcon />}>
                    {permisions.map(permision => {
                        const { name } = permision;

                        return(
                            <View key={permision.ref}
                                tabLabel={{
                                    icon: permision.icon,
                                    name: permision.name
                                }} style={styles.card}>
                                <TabViewContainer
                                    navKey={permision.navKey}
                                    initialRouteUrl={`${permision.initialRouteUrl}?csServer=${self.state.csServer}&name=${name}`}
                                    navigator={self.props.navigator}
                                    ref={permision.ref}/>
                            </View>
                        );
                    })}
                </ScrollableTabView>
              </View>
            );
        }


    }
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection: 'column',
    backgroundColor: '#eee',
  },
  card: {
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.1)',

    flex: 1,
  },
});


function mapStateToProps(state) {
    const {
        settings,
    } = state;

    return {
        settings,
    };
}

export default connect(mapStateToProps, null, null, { withRef: true })(HomeScene);
