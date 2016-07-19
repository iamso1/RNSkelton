/*
 * @flow
 */
import React, { View, Text, StyleSheet } from 'react-native';
import { shallow } from 'enzyme';
import Button, {styles} from '../../../src/components/Button';
import { expect } from 'chai';

describe('<Button text="test" />', () => {
  it('should render stuff', (done) => {
    const button = shallow(<Button
                                text='Test'
                                onPress={() => {return 1}}
                                disabled={true}/>);
    done();
  });
});
