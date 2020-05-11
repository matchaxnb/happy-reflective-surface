import DOMPurify from 'dompurify';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
export class BrightMirrorViewer extends Component {
  readingTime = (text) => {
    text = text || '';
    return Math.ceil(text.split(/\s/g).length / 200);
  };
  render() {
    const sane = DOMPurify.sanitize(this.props.story.body);
    const rt = this.readingTime(sane);
    return (<article>
      <h1>{this.props.story.title}</h1>
      {this.props.story.image ? <img src={this.props.story.image} /> : null}
      <p>
        <Text id="reader.textBy">by </Text>{this.props.story.author}
      </p>
      <p>
        <Text id="reader.readingTime" plural={rt} fields={{ duration: rt }}>Reading time: {rt}
        </Text>
      </p>

      <div dangerouslySetInnerHTML={{ __html: sane }} />
    </article>);
  }
}
