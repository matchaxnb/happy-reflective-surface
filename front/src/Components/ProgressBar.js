import styled from 'styled-components';
const ProgressBarWrapper = styled.div`
width: 100%;
height: 8px;
.pbBar {
  height: 100%;
  float: left;
  width: var(--currentProgress);
  background: rgb(192, 213, 249);
}
`;
export const ProgressBar = ({ children, ...props }) =>  (
  <ProgressBarWrapper>
    <div className="pbBar" style={'--currentProgress: ' + props.percentage + '%'} />
  </ProgressBarWrapper>
);
export default ProgressBar;