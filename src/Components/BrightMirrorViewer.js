import DOMPurify from 'dompurify';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import styled from 'styled-components';

export class BrightMirrorViewer extends Component {
  readingTime = (text) => {
    text = text || '';
    return Math.ceil(text.split(/\s/g).length / 200);
  };
  render() {
    const sane = DOMPurify.sanitize(this.props.story.body);
    const rt = this.readingTime(sane);
    return (<BrightMirrorViewerWrapper>
      <h1>{this.props.story.title}</h1>
      {this.props.story.image ? <img src={this.props.story.image} /> : null}
      <p>
        <Text id="reader.textBy">by </Text>{this.props.story.author}
      </p>
      <p>
        <Text id="reader.readingTime" plural={rt} fields={{ duration: rt }}>Reading time: {rt}
        </Text>
      </p>
      { /* eslint-disable-next-line react/no-danger */ }
      <div dangerouslySetInnerHTML={{ __html: sane }} />
    </BrightMirrorViewerWrapper>);
  }
}

const BrightMirrorViewerWrapper = styled.article`
img {
  max-width: 320px;
  max-height: 320px;
}
`;