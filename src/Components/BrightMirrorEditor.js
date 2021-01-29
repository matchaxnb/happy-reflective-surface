import { Component } from 'preact';
import { withText, Text } from 'preact-i18n';
import { ProgressBar } from './ProgressBar';
import { ImageCropperUploader } from './ImageCropperUploader';
import { CopyToClipboard } from './CopyToClipboard';
import { RichTextEditor } from './RichTextEditor';
import styled from 'styled-components';
@withText({
  titlePlaceholder: 'editor.storyTitle',
  storyBodyPlaceholder: 'editor.storyBody',
  yourNamePlaceholder: 'editor.yourName',
  submitStoryText: 'editor.submitStory',
  saveDraftText: 'editor.saveDraft',
  copyToClipboardText: 'editor.copyToClipboard',
  storySummaryPlaceholder: 'editor.storySummary'
})
export class BrightMirrorEditor extends Component {
  render() {
    const titlePlaceholder = this.props.titlePlaceholder;
    const storyBodyPlaceholder = this.props.storyBodyPlaceholder;
    const yourNamePlaceholder = this.props.yourNamePlaceholder;
    const submitStoryText = this.props.submitStoryText;
    const saveDraftText = this.props.saveDraftText;
    const copyToClipboardText = this.props.copyToClipboardText;
    const storySummaryPlaceholder = this.props.storySummaryPlaceholder;
    const disabled = this.props.disabled || false;
    if (disabled) {
      return (<></>);
    }
    return (<BrightMirrorEditorStyledContainer onSubmit={this.handleSubmit}>
      <ProgressBar percentage={this.props.percentage} />
      <section class="bmEditorMainSection">
        <input type="text"
          className="bmEditorTitle"
          placeholder={titlePlaceholder}
          name="title"
          value={this.props.story.title}
          onChange={this.props.inputHandler}
        />
        <RichTextEditor
          className="bmEditorBodyEditor"
          placeholder={storyBodyPlaceholder}
          name="body"
          value={this.props.story.body}
          onChange={this.props.storyInputHandler}
        />
      </section>
      <section class="bmEditorSummarySection">
        <div className="bmEditorTextBeforeSumUp">
          <p>
            <Text id="editor.summaryDescriptionText">What is the main message of your story or testimony?</Text>
          </p>
        </div>
        <RichTextEditor
          className="bmEditorSummaryTextEditor"
          placeholder={storySummaryPlaceholder}
          name="summary"
          value={this.props.story.summary}
          onChange={this.props.summaryInputHandler}
        />
      </section>
      <section class="bmEditorMetaSection">
        <input
          className="bmEditorYourName"
          name="author"
          type="text"
          value={this.props.story.author}
          placeholder={yourNamePlaceholder}
          onChange={this.props.inputHandler}
        />
        <p>
          <Text id="editor.featuredImage">Pick an image that will be featured on your story</Text><br />
          <em class="helpText"><Text id="editor.featuredImageHelp">It will be displayed as a 4:1 banner</Text></em>
        </p>
        
        <ImageCropperUploader
          initialImage={this.props.story.image}
          croppedContentHandler={this.props.croppedContentHandler}
        />
      </section>
      <section class="bmEditorActionButtonsSection">
        <BrightMirrorEditorSubmitButtons
          submitHandler={this.props.submitHandler}
          submitStoryText={submitStoryText}
          saveDraftHandler={this.props.saveDraftHandler}
          saveDraftText={saveDraftText}
          allowDrafts={false}
        />
        <BrightMirrorEditorLoadSaveForm
          render={false}
          copyToClipboardText={copyToClipboardText}
          editionLink={this.props.editionLink}
        />
      </section>

    </BrightMirrorEditorStyledContainer>);
  }
}

const BrightMirrorEditorStyledContainer = styled.form`
max-width: 100%;
.bmEditorTitle::placeholder {
  font-style: italic;
}
.bmEditorTitle {
  background: rgba(240, 240, 240, 0.8);
  width: 100%;
  padding: 0px;
  border: none;
  font-weight: bold;
  font-size: 2em;
  margin-bottom: 1em;
}
.bmEditorBodyEditor {
  background: rgba(240, 240, 240, 0.8);
  width: 100%;
  min-height: 10em;
  margin-bottom: 1em;
}
.bmEditorYourName {
  background: rgba(240, 240, 240, 0.8);
  font-size: 1em;
  border: none;
  padding: 0.2em;
  
}
.bmEditorYourName::placeholder {
  font-style: italic;
}
.bmEditorBodyEditor {
  width: 100%;
}
section {
  border-top: 4px solid #dddddd;
  padding-top: 1em;
}
input[type="submit"] {
  background: rgb(192, 213, 249);
  padding: 1em 2em;
  color: white;
}
.bmEditorButtonGroup {
  margin: 0 auto;
  width: fit-content;
}
input[type="submit"]:hover {
  background: rgb(0, 117, 196);
  padding: 1em 2em;
  color: white;
}
.
`;

const BrightMirrorEditorLoadSaveForm = ({ children, ...props }) => {
  if (props.render === true) {
    return (
      <div className="bmEditorEditLoadSaveGroup">
        <Text id="editor.yourEditLink">
          Your edit link will appear here when you have pressed one of the buttons
        </Text>
        <CopyToClipboard toCopy={props.editionLink} actionText={props.copyToClipboardText} />
      </div>
    );
  }
  
  return (
    <div className="bmEditorLoadSaveGroup" />
  );
  
};

const BrightMirrorEditorSubmitButtons = ({ children, ...props }) => {
  if (props.allowDrafts) {
    return (
      <div className="bmEditorButtonGroup" data-warning="not-implemented">
        <input type="submit" onClick={props.submitHandler} value={props.submitStoryText} />
        <input type="submit" onClick={props.saveDraftHandler} value={props.saveDraftText} />
      </div>
    );
  }
  return (
    <div className="bmEditorButtonGroup">
      <input type="submit" onClick={props.submitHandler} value={props.submitStoryText} />
    </div>
        
  );
};

BrightMirrorEditorSubmitButtons.defaultProps = {
  allowDrafts: false
};