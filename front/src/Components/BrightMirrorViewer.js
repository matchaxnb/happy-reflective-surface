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
    const saneBody = DOMPurify.sanitize(this.props.story.body);
    const saneSummary = DOMPurify.sanitize(this.props.story.summary);
    const rt = this.readingTime(saneBody);
    return (<BrightMirrorViewerWrapper>
      <h1>{this.props.story.title}</h1>
      {this.props.story.image ? <img src={this.props.story.image} /> : null}
      <section name="viewerMeta">
        <p className="viewerAuthor">
          <Text id="reader.textBy">by </Text>{this.props.story.author}
        </p>
        <p className="viewerReadingTime">
          <Text id="reader.readingTime" plural={rt} fields={{ duration: rt }}>Reading time: {rt}
          </Text>
        </p>
      </section>
      <section name="summary">
        { /* eslint-disable-next-line react/no-danger */ }
        <p dangerouslySetInnerHTML={{ __html: saneSummary }} />
      </section>
      { /* eslint-disable-next-line react/no-danger */ }
      <section name="main" dangerouslySetInnerHTML={{ __html: saneBody }} />
      
      
    </BrightMirrorViewerWrapper>);
  }
}

const BrightMirrorViewerWrapper = styled.article`
img {
  max-width: 320px;
  max-height: 320px;
  display: block;
  margin: 0 auto;
  padding: 5px;
  border: 1px solid #909090;
}
section[name="viewerMeta"] {
  display: block;
  margin: 0 auto;
  width: fit-content;
}
section[name="summary"] > p {
  font-weight: bold;
}
.viewerAuthor, .viewerReadingTime {
  color: #909090;
  margin: 0 auto;
  display: inline-block;
}
.viewerReadingTime {
  margin-left: 1em;
}
h1 {
  font-weight: bold;
  font-size: 1.5em;
}
h1, h2, h3, p {
  color: #0a0a0a;
}

`;