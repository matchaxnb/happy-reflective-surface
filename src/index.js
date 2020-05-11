import './style';
import definition from './i18n/fr-fr.json';
import { IntlProvider } from 'preact-i18n';
import { BrightMirror } from './Components/BrightMirror';

// FIXME: move this to config management or something
const LBM_NEW_POST_ENDPOINT = 'http://localhost:8001/wp-json/brightmirror/v1/stories';
const LBM_READ_POST_ENDPOINT = 'http://localhost:8001/wp-json/brightmirror/v1/stories/';

export const LBM_STATUS_READY = 'Ready';
export const LBM_STATUS_SUBMITTED = 'Submitted';
export const LBM_STATUS_ERROR = 'Error';


const IntlApp = ({ children, ...props }) => (
  <IntlProvider definition={definition}>
    <BrightMirror
      newPostEndpoint={LBM_NEW_POST_ENDPOINT}
      readPostEndpoint={LBM_READ_POST_ENDPOINT}
    />
  </IntlProvider>
);

export default IntlApp;