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
export const ProgressBar = ({ children, ...props }) =>  (
  <ProgressBarWrapper>
    <div className="pbBar" style={'--currentProgress: ' + props.percentage + '%'} />
  </ProgressBarWrapper>
);
export default ProgressBar;