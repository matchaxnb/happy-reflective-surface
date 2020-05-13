import './style';
import { config as appConfig } from './config';
import definition from './i18n/fr-fr.json';
import { IntlProvider } from 'preact-i18n';
import { BrightMirror } from './Components/BrightMirror';



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