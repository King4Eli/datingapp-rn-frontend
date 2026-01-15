import React, { PureComponent } from 'react';
import { View, ViewProps } from 'react-native';

interface LabelContainerProps extends ViewProps {
  renderContent: (value: number) => React.ReactNode;
  initialValue?: number;
}

interface LabelContainerState {
  value: number;
}

class LabelContainer extends PureComponent<LabelContainerProps, LabelContainerState> {
  constructor(props: LabelContainerProps) {
    super(props);
    this.state = {
      value: props.initialValue || Number.NaN,
    };
  }

  setValue = (value: number) => {
    this.setState({ value });
  };

  render() {
    const { renderContent, style, ...restProps } = this.props;
    const { value } = this.state;
    
    return (
      <View style={style} {...restProps}>
        {renderContent(value)}
      </View>
    );
  }
}

export default LabelContainer;