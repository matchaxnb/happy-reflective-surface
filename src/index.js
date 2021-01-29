// let poly = require('preact-cli/lib/lib/webpack/polyfills');
import './style';
import habitat from 'preact-habitat';
import { config as appConfig } from './config';
import definitions from './i18n';
import { IntlProvider } from 'preact-i18n';
import { BrightMirror } from './Components/BrightMirror';


const IntlApp = ({ children, ...props }) => {
  const runtimeConfig = { ...appConfig, ...props };
  const language = runtimeConfig.language ? runtimeConfig.language : 'fr-nnv';
  return (<IntlProvider definition={definitions[language]}>
    <BrightMirror
      newPostEndpoint={runtimeConfig.api.newPostEndpoint}
      readPostEndpoint={runtimeConfig.api.readPostEndpoint}
      postExtraData={runtimeConfig.postExtraData}
      topic={runtimeConfig.editorial.topic}
      instructions={runtimeConfig.editorial.instructions}
      brightMirrorIndexPage={runtimeConfig.editorial.brightMirrorIndexPage}
      defaultAuthor={runtimeConfig.defaultAuthor || null}
      hideEditor={runtimeConfig.hideEditor || false}
    />
  </IntlProvider>
  );
};

const _habitat = habitat(IntlApp);
_habitat.render({
  selector: '[data-widget-host="habitat"]',
  clean: true
});
