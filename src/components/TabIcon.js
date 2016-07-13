/**
    @flow
**/
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

class TabIcon extends React.Component{

    static propTypes = {
        goToPage: React.PropTypes.func,
        activeTab: React.PropTypes.number,
        tabs: React.PropTypes.array,
    };

    constructor(props){
        super(props);
        this.setAnimationValue = this.setAnimationValue.bind(this);
        this.tabIcons = [];
    }

    componentDidMount() {
      this._listener = this.props.scrollValue.addListener(this.setAnimationValue);
    }

    setAnimationValue({ value, }) {
        this.tabIcons.forEach((icon, i) => {
            const progress = (value - i >= 0 && value - i <= 1) ? value - i : 1;
            icon.setNativeProps({
              style: {
                color: this.iconColor(progress),
              },
            });
        });
    }
    //color between rgb(59,89,152) and rgb(204,204,204)
    iconColor(progress) {
      const red = 59 + (204 - 59) * progress;
      const green = 89 + (204 - 89) * progress;
      const blue = 152 + (204 - 152) * progress;
      return `rgb(${red}, ${green}, ${blue})`;
    }

    render() {
      return <View style={[styles.tabs, this.props.style, ]}>
        {this.props.tabs.map((tab, i) => {
          return <TouchableOpacity key={tab.icon} onPress={() => this.props.goToPage(i)} style={styles.tab}>
            <Icon
              name={tab.icon}
              size={20}
              color={this.props.activeTab === i ? 'rgb(59,89,152)' : 'rgb(204,204,204)'}
              ref={(icon) => { this.tabIcons[i] = icon; }} />
        <Text>{tab.name}</Text>
          </TouchableOpacity>;
        })}
      </View>;
    }

}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  tabs: {
    height: 45,
    flexDirection: 'row',
    paddingTop: 5,
    borderWidth: 1,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomColor: 'rgba(0,0,0,0.5)',
  },
});

export default TabIcon;
