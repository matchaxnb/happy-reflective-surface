import { Component } from 'preact';
import { Text, MarkupText } from 'preact-i18n';
import styled from 'styled-components';
import { BrightMirrorListSelect } from './BrightMirrorListSelect';
import { BrightMirrorViewer } from './BrightMirrorViewer';
import { BrightMirrorEditor } from './BrightMirrorEditor';
import DOMPurify from 'dompurify';

const LBM_STATUS_READY = 0b0001;
const LBM_STATUS_SUBMITTING = 0b0010;
const LBM_STATUS_SUBMITTED = 0b0100;
const LBM_STATUS_ERROR = 0b1000;

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
    const postBody = { ...this.state.story, ...this.props.postExtraData };
    const jsonBody = JSON.stringify(postBody);
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
        author: this.props.defaultAuthor || '',
        title: this.props.defaultTitle || '',
        body: this.props.defaultBody || '',
        summary: this.props.defaultSummary || '',
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
    // get list of bright mirror stories if we want to have a viewer
    if (this.props.showStoryPicker) {
      return fetch(this.readPostEndpoint, {
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
    this.state.appStatus = LBM_STATUS_READY;
  }
  render() {
    if (this.state.appStatus & LBM_STATUS_ERROR) {
      return (
        <BrightMirrorStyledContainer className="bmApp">
          <ErrorHasOccured contextInfo={JSON.stringify(this.state)} errorToDisplay={this.state.errorStatus} />
        </BrightMirrorStyledContainer>
      );
    }
    if (this.state.appStatus & LBM_STATUS_SUBMITTING) {
      return (
        <BrightMirrorStyledContainer className="bmApp">
          <LoadingSpinner loadingTextId="app.nowLoading" />
        </BrightMirrorStyledContainer>
      );
    }
    if (this.state.appStatus & LBM_STATUS_SUBMITTED) {
      return (
        <BrightMirrorStyledContainer className="bmApp">
          <BrightMirrorFinalScreen brightMirrorIndex={this.props.brightMirrorIndexPage} />
        </BrightMirrorStyledContainer>
      );
    }
    const cleanInstructions = DOMPurify.sanitize(this.props.instructions);
    return (<BrightMirrorStyledContainer className="bmApp">
      <h2 className="appTitle"><Text id="app.title">bright mirror app</Text></h2>
      <h3 className="brightMirrorTheme">{this.props.topic}</h3>
      { /* eslint-disable-next-line react/no-danger */ }
      <p className="brightMirrorThemeDescription" dangerouslySetInnerHTML={{ __html: cleanInstructions }} />
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
        disabled={this.props.hideEditor}
      />
      
      {
        this.props.showMirrorViewer &&
        <BrightMirrorViewer story={this.state.story} />
      }
      {
        this.props.showStoryPicker &&
        <>
          <h3><Text id="app.readExisting">Read an existing bright mirror</Text></h3>
          <input type="text" onChange={this.changeQueriedBrightMirrorHandler} value={this.state.brightMirrorToReadId} />
          <BrightMirrorListSelect
            options={this.state.brightMirrorList}
            value={this.state.brightMirrorToReadId}
            onChange={this.changeQueriedBrightMirrorHandler}
          />
          <BrightMirrorViewer story={this.state.brightMirrorToRead} />
        </>
      }
      {
        this.props.showAppStatus &&
        <>
          <div class="status">{this.state.appStatus}</div>
          <div class="error">{this.state.errorStatus}</div>
        </>
      }
    </BrightMirrorStyledContainer>);
  }
}
BrightMirror.defaultProps = {
  targetStoryLength: 350,
  targetTitleLength: 8,
  targetAuthorNicknameLength: 4,
  showMirrorViewer: false,
  showStoryPicker: false,
  showAppStatus: false,
  topic: 'example <b>bright mirror</b> topic',
  instructions: 'example <b>bright mirror</b> topic description',
  brightMirrorIndexPage: 'http://localhost:8001/bright-mirror/'
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
  display: none;
}
h3.brightMirrorTheme {
  color: black;
  font-size: 1.2em;
}
.helpText {
  font-size: 0.8em;
}
`;

const BrightMirrorFinalScreen = ({ children, ...props }) => (
  <div class="bmFinalScreen">
    <h1><Text id="app.storySubmittedTitle">Your story has been submitted</Text></h1>
    <p>
      <MarkupText id="app.storySubmittedBody" fields={{ site: props.brightMirrorIndex }}>
        It will be published shortly on <a href={props.brightMirrorIndex}>our Bright Mirror index page</a>.
      </MarkupText>
    </p>
  </div>
);

const ErrorHasOccured = ({ children, ...props }) => (
  <div class="bmError">
    <h1><Text id="app.errorTitle">Oops :(</Text></h1>
    <Text id="app.error">An error has occured. Please reload this page.</Text>
    <h2><Text id="app.errorTechData">Technical data</Text></h2>
    <textarea disabled="disabled" style="display: block; width: 100%; max-height: 300px;">{props.errorToDisplay}</textarea>
    <textarea disabled="disabled" style="display: block; width: 100%; min-height: 80vh;">{props.contextInfo}</textarea>
  </div>
);
const LoadingSpinner = ({ children, ...props }) => (
  <LoadingSpinnerWrapper>
    <div id="loading-spinner" class="lds-roller">
      <div class="lds-roller">
        <div /><div /><div /><div /><div /><div /><div /><div /></div>
    </div>
  </LoadingSpinnerWrapper>
);

LoadingSpinner.defaultProps = {
  loadingTextId: 'app.nowLoading'
};

const LoadingSpinnerWrapper = styled.div`
margin: 0 auto;
margin-top: 30vh;
width: fit-content;
.lds-roller {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 40px 40px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #000;
  margin: -4px 0 0 -4px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 63px;
  left: 63px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 68px;
  left: 56px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 71px;
  left: 48px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 72px;
  left: 40px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 71px;
  left: 32px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 68px;
  left: 24px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 63px;
  left: 17px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 56px;
  left: 12px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`;