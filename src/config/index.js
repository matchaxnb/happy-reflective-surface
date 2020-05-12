// TODO: make this somewhat more modular (or provide something at runtime)

export const config = {
  api: {
    newPostEndpoint: 'http://localhost:8001/wp-json/brightmirror/v1/stories',
    readPostEndpoint: 'http://localhost:8001/wp-json/brightmirror/v1/stories/'
  },
  editorial: {
    topic: 'Titre de thème du Bright Mirror en titre 2',
    instructions: 'Description de la thématique, et précision de comment contribuer.'
  }
    
};
export default config;