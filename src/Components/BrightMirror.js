import { Component } from 'preact';
import { Text } from 'preact-i18n';
import styled from 'styled-components';
import { LBM_STATUS_SUBMITTED, LBM_STATUS_ERROR, LBM_STATUS_READY } from '../index';
import { BrightMirrorListSelect } from './BrightMirrorListSelect';
import { BrightMirrorViewer } from './BrightMirrorViewer';
import { BrightMirrorEditor } from './BrightMirrorEditor';
import DOMPurify from 'dompurify';

export class BrightMirror extends Component {
  editorInputChangeHandler = (e) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    this.setState({
      story: {
        ...this.state.story,
        ...{ [name]: value }
      }
    });
  };
  changeQueriedBrightMirrorHandler = (e) => {
    this.setState({
      brightMirrorToReadId: e.target.value
    });
    fetch(this.readPostEndpoint + e.target.value, {
      method: 'GET'
    })
      .then(res => res.json())
      .then((result) => {
        this.setState({
          brightMirrorToRead: result
        });
      }, (error) => {
        this.setState({ errorStatus: error });
      });
  };
  // special handler for RichText
  editorRichTextInputHandler  = (e) => {
    const fieldName = e.target.getAttribute('name');
    this.setState(
      { story: { ...this.state.story, ...{ [fieldName]: e.target.innerHTML } } },
      () => { this.recomputePercentage(); });
  };
  saveToServer = async (asDraft) => {
    const jsonBody = JSON.stringify(this.state.story);
    let endpoint = this.newPostEndpoint;
    if (asDraft === true) {
      endpoint += '?as_draft=true';
    }
    this.setState({ appStatus: LBM_STATUS_SUBMITTING });
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonBody
    })
      .then(res => res.json())
      .then((result) => {
        this.setState({ appStatus: LBM_STATUS_SUBMITTED });
      }, (error) => {
        this.setState({
          errorStatus: error,
          appStatus: LBM_STATUS_ERROR
        });
      });
  };
  submitStoryHandler = (e) => {
    e.preventDefault();
    this.saveToServer(false);
  };
  saveDraftHandler = (e) => {
    e.preventDefault();
    this.saveToServer(true);
  };
  croppedContentHandler = (content) => {
    this.setState({
      story: {
        ...this.state.story,
        ...{ image: content }
      }
    });
  };
  recomputePercentage = () => {
    const curPer = this.state.progressPercentage;
    let newPer = 0;
    // story title: 5% if you match, 0% otherwise
    const story = this.state.story;
    if (story.title && story.title.length >= this.props.targetTitleLength) {
      newPer += 5;
    }
    // your nickname: 5%
    if (story.author && story.author.length >= this.props.targetAuthorNicknameLength) {
      newPer += 5;
    }
    // summary: 10%
    if (story.summary) {
      newPer += 10;
    }
    // picture: 10%
    if (story.image) {
      newPer += 10;
    }
    // story body: max 70%; each (targetLength / 7) chars gets you 10%
    if (story.body) {
      const pureTextBody = DOMPurify.sanitize(story.body, { ALLOWED_TAGS: [] });
      const storyLen = pureTextBody.length;
      const score = Math.min(70, Math.ceil(storyLen / (this.props.targetStoryLength / 7)) * 10);
      newPer += score;
    }
    if (newPer !== curPer) {
      this.setState({ progressPercentage: newPer });
    }
  };

  constructor(props) {
    super(props);
    this.newPostEndpoint = props.newPostEndpoint;
    this.readPostEndpoint = props.readPostEndpoint;
    this.state = {
      story: {
        author: '',
        title: '',
        body: '',
        summary: '',
        image: null
      },
      editionLink: '#',
      brightMirrorToRead: {
        author: '',
        title: '',
        body: '',
        summary: ''
      },
      brightMirrorToReadId: 0,
      brightMirrorList: [
        { id: '0', title: '-' }
      ],
      errorStatus: null,
      appStatus: null
    };
  }
  componentDidMount() {
    // get list of bright mirror stories
    fetch(this.readPostEndpoint, {
      method: 'GET'
    })
      .then(res => res.json())
      .then((result) => {
        this.setState({
          brightMirrorList: result,
          appStatus: LBM_STATUS_READY
        });
      }, (error) => {
        this.setState({
          appStatus: LBM_STATUS_ERROR,
          errorStatus: error
        });
      });
  }
  render() {
    return (<BrightMirrorStyledContainer className="bmApp">
      <h2 className="appTitle"><Text id="app.title">bright mirror app</Text></h2>
      <h3 className="brightMirrorTheme">{this.props.topic}</h3>
      <p className="brightMirrorThemeDescription">{this.props.instructions}</p>
      <BrightMirrorEditor
        story={this.state.story}
        inputHandler={this.editorInputChangeHandler}
        storyInputHandler={this.editorRichTextInputHandler}
        summaryInputHandler={this.editorRichTextInputHandler}
        submitHandler={this.submitStoryHandler}
        croppedContentHandler={this.croppedContentHandler}
        saveDraftHandler={this.saveDraftHandler}
        editionLink={this.state.editionLink}
        percentage={this.state.progressPercentage}
      />
      <BrightMirrorViewer story={this.state.story} />
      <h3><Text id="app.readExisting">Read an existing bright mirror</Text></h3>
      <input type="text" onChange={this.changeQueriedBrightMirrorHandler} value={this.state.brightMirrorToReadId} />
      <BrightMirrorListSelect
        options={this.state.brightMirrorList}
        value={this.state.brightMirrorToReadId}
        onChange={this.changeQueriedBrightMirrorHandler}
      />
      <BrightMirrorViewer story={this.state.brightMirrorToRead} />
      <div class="status">{this.state.appStatus}</div>
      <div class="error">{this.state.errorStatus}</div>
    </BrightMirrorStyledContainer>);
  }
}
BrightMirror.defaultProps = {
  targetStoryLength: 350,
  targetTitleLength: 8,
  targetAuthorNicknameLength: 4,
  topic: 'example bright mirror topic',
  instructions: 'example bright mirror topic description'
};
const BrightMirrorStyledContainer = styled.div`
display: block;
margin: 0 auto;
place-items: center;
max-width: 800px;
width: 100%;
.appTitle {
  font-weight: bold;
  color: black;
  font-size: 2em;
}
h3.brightMirrorTheme {
  color: black;
  font-size: 1.2em;
}
`;
