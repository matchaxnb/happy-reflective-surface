export default (config, env, helpers) => {
  delete config.entry.polyfills;
  config.output.filename = "[name].js";

//  let { plugin } = helpers.getPluginsByName(config, "ExtractTextPlugin")[0];
//  plugin.options.disable = true;
const { plugin: cssExtractPlugin } = helpers.getPluginsByName(config, 'MiniCssExtractPlugin')[0];
cssExtractPlugin.options.moduleFilename = () => 'bundle.css';
cssExtractPlugin.options.filename = 'bundle.css';


  if (env.production) {
    console.log("HEY GOING TO PROD");
    config.output.libraryTarget = "umd";
    env.ASSETS = "/wp-content/plugins/bright-mirror/webapp/assets/";
    config.output.publicPath = "/wp-content/plugins/bright-mirror/webapp/";
  console.log(config.output);
  }
};
