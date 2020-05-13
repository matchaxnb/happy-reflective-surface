let poly = require("preact-cli/lib/lib/webpack/polyfills");
import './style';
import habitat from 'preact-habitat';
import { config as appConfig } from './config';
import definition from './i18n/fr-fr.json';
import { IntlProvider } from 'preact-i18n';
import { BrightMirror } from './Components/BrightMirror';



const IntlApp = ({ children, ...props }) => {
  const runtimeConfig = { ...appConfig, ...props };
  return (<IntlProvider definition={definition}>
    <BrightMirror
      newPostEndpoint={runtimeConfig.api.newPostEndpoint}
      readPostEndpoint={runtimeConfig.api.readPostEndpoint}
      topic={runtimeConfig.editorial.topic}
      instructions={runtimeConfig.editorial.instructions}
    />
  </IntlProvider>
  );
};

const _habitat = habitat(IntlApp);
_habitat.render({
  selector: '[data-widget-host="habitat"]',
  clean: true
});
