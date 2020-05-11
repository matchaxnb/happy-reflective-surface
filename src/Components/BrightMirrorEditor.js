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
  copyToClipboardText: 'editor.copyToClipboard'
})
export class BrightMirrorEditor extends Component {
  render() {
    const titlePlaceholder = this.props.titlePlaceholder;
    const storyBodyPlaceholder = this.props.storyBodyPlaceholder;
    const yourNamePlaceholder = this.props.yourNamePlaceholder;
    const submitStoryText = this.props.submitStoryText;
    const saveDraftText = this.props.saveDraftText;
    const copyToClipboardText = this.props.copyToClipboardText;
    return (<BrightMirrorEditorStyledContainer onSubmit={this.handleSubmit}>
      <ProgressBar percentage={this.props.percentage} />
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
      <input
        className="bmEditorYourName"
        name="author"
        type="text"
        value={this.props.story.author}
        placeholder={yourNamePlaceholder}
        onChange={this.props.inputHandler}
      />
      <ImageCropperUploader
        initialImage={this.props.story.image}
        croppedContentHandler={this.props.croppedContentHandler}
      />
      <div className="bmEditorButtonGroup">
        <input type="submit" onClick={this.props.submitHandler} value={submitStoryText} />
        <input type="submit" onClick={this.props.saveDraftHandler} value={saveDraftText} />
      </div>
      <div className="bmEditorEditLink">
        <Text id="editor.yourEditLink">
          Your edit link will appear here when you have pressed one of the buttons
        </Text>
        <CopyToClipboard toCopy={this.props.editionLink} actionText={copyToClipboardText} />
      </div>

    </BrightMirrorEditorStyledContainer>);
  }
}

const BrightMirrorEditorStyledContainer = styled.form`
border: 1px solid black;
max-width: 100%;
.bmEditorTitle {
  background: rgba(240, 240, 240, 0.8);
  width: 100%;
  padding: 0px;
  border: none;
  font-weight: bold;
  font-size: 2rem;
  margin-bottom: 1em;
}
.bmEditorBodyEditor {
  background: rgba(240, 240, 240, 0.8);
  width: 100%;
  min-height: 10em;
  margin-bottom: 1em;
}
.bmEditorBodyEditor {
  width: 100%;
}
.
`;
