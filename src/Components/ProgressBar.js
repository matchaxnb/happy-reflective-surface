import { Component } from 'preact';
import styled from 'styled-components';
const ProgressBarWrapper = styled.div`
width: 100%;
height: 1em;
.pbBar {
  height: 100%;
  float: left;
  width: var(--currentProgress);
  background: lightgreen;
}
`;
export class ProgressBar extends Component {
  render() {
    return (<ProgressBarWrapper>
      <div className="pbBar" style={"--currentProgress: " + this.props.percentage + "%"} />
    </ProgressBarWrapper>);
  }
}
