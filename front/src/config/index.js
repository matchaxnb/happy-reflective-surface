// this is a default config that works for development.
export const config = {
  api: {
    newPostEndpoint: 'http://localhost:8001/wp-json/brightmirror/v1/stories',
    readPostEndpoint: 'http://localhost:8001/wp-json/brightmirror/v1/stories/'
  },
  editorial: {
    topic: 'Titre de thème du Bright Mirror en titre 2',
    instructions: 'Description de la <b>thématique</b>, et précision de comment contribuer.',
    brightMirrorIndexPage: 'http://localhost:8001/bright-mirror/'
  },
  postExtraData: {
    segment: 'histoires'
  }
//  language: 'tpl'
};
export default config;