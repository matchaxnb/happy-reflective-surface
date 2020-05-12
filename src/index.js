import './style';
import { config as appConfig } from './config';
import definition from './i18n/fr-fr.json';
import { IntlProvider } from 'preact-i18n';
import { BrightMirror } from './Components/BrightMirror';

export const LBM_STATUS_READY = 'Ready';
export const LBM_STATUS_SUBMITTED = 'Submitted';
export const LBM_STATUS_ERROR = 'Error';


const IntlApp = ({ children, ...props }) => (
  <IntlProvider definition={definition}>
    <BrightMirror
      newPostEndpoint={appConfig.api.newPostEndpoint}
      readPostEndpoint={appConfig.api.readPostEndpoint}
      topic={appConfig.editorial.topic}
      instructions={appConfig.editorial.instructions}
    />
  </IntlProvider>
);

export default IntlApp;