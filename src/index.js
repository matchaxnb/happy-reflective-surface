import './style';
require('medium-editor/dist/css/medium-editor.css');
require('cropperjs/dist/cropper.css');
require('medium-editor/dist/css/themes/default.css');
import DOMPurify from 'dompurify';
import definition from './i18n/fr-fr.json';
import MediumEditor from 'medium-editor';
import Cropper from 'cropperjs';
import { Component, createRef } from 'preact';
import { IntlProvider, withText, Text } from 'preact-i18n';

// FIXME: move this to config management or something
const LBM_NEW_POST_ENDPOINT = 'http://localhost:8001/wp-json/brightmirror/v1/stories';
const LBM_READ_POST_ENDPOINT = 'http://localhost:8001/wp-json/brightmirror/v1/stories/';

const LBM_STATUS_READY = 'Ready';
const LBM_STATUS_SUBMITTED = 'Submitted';
const LBM_STATUS_ERROR = 'Error';


export default class IntlApp extends Component {
  render() {
    return (
      <IntlProvider definition={definition}>
        <BrightMirror
	newPostEndpoint={LBM_NEW_POST_ENDPOINT}
	readPostEndpoint={LBM_READ_POST_ENDPOINT}
        />
      </IntlProvider>
    );

  }
}


class BrightMirror extends Component {

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
	}


	changeQueriedBrightMirrorHandler = (e) => {
	  this.setState({
	    brightMirrorToReadId: e.target.value
	  });
	  fetch(this.readPostEndpoint + e.target.value,
	    {
	      method: 'GET'
	    })
	    .then(res => res.json())
	    .then(
	      (result) => {
	        this.setState({
	          brightMirrorToRead: result
	        });
	      },
	      (error) => {
	        this.setState({ errorStatus: error });
	      }
	    );
	}
	// special handler for RichText
	editorStoryInputHandler = (e) => {
	  this.setState({ story: { ...this.state.story, ...{ body: e.target.innerHTML } } });
	}

	saveToServer = (asDraft) => {
	  const jsonBody = JSON.stringify(this.state.story);
	  let endpoint = this.newPostEndpoint;
	  if (asDraft === true) {
	    endpoint += '?as_draft=true';
	  }
	  fetch(endpoint,
	    {
	      method: 'POST',
	      headers: {
	        'Content-Type': 'application/json'
	      },
	      body: jsonBody
	    })
	    .then(res => res.json())
	    .then(
	      (result) => {
	        this.setState({ appStatus: LBM_STATUS_SUBMITTED });
	      },
	      (error) => {
	        this.setState({
	          errorStatus: error,
	          appStatus: LBM_STATUS_ERROR
	        });
	      }
	    );
	}

	submitStoryHandler = (e) => {
	  e.preventDefault();
	  this.saveToServer(false);
	}

	saveDraftHandler = (e) => {
	  e.preventDefault();
	  this.saveToServer(true);
	}

	croppedContentHandler = (content) => {
	  this.setState({
	    story: {
	      ...this.state.story,
	      ...{ image: content }
	    }
	  });
	}

	constructor(props) {
	  super(props);
	  this.newPostEndpoint = props.newPostEndpoint;
	  this.readPostEndpoint = props.readPostEndpoint;
	  this.state = {
	    story: {
	      author: '',
	      title: '',
	      body: '',
	      image: null
	    },
	    editionLink: '#',
	    brightMirrorToRead: {
	      author: '',
	      title: '',
	      body: ''
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
	  fetch(this.readPostEndpoint,
	    {
	      method: 'GET'
	    })
	    .then(res => res.json())
	    .then(
	      (result) => {
	        this.setState({
	          brightMirrorList: result,
	          appStatus: LBM_STATUS_READY
	        });
	      },
	      (error) => {
	        this.setState({
	          appStatus: LBM_STATUS_ERROR,
	          errorStatus: error
	        });
	      }
	    );
	}

	render() {
	  return (
	    <div>
	      <h2><Text id="app.title">bright mirror app</Text></h2>
	      <BrightMirrorEditor
		story={this.state.story}
		inputHandler={this.editorInputChangeHandler}
		storyInputHandler={this.editorStoryInputHandler}
		submitHandler={this.submitStoryHandler}
		croppedContentHandler={this.croppedContentHandler}
		saveDraftHandler={this.saveDraftHandler}
		editionLink={this.state.editionLink}
	      />
	      <BrightMirrorViewer story={this.state.story} />
	      <h3><Text id="app.readExisting">Read an existing bright mirror</Text></h3>
	      <input type="text" onChange={this.changeQueriedBrightMirrorHandler} value={this.state.brightMirrorToReadId} />
	      <BrightMirrorListSelect options={this.state.brightMirrorList} value={this.state.brightMirrorToReadId} onChange={this.changeQueriedBrightMirrorHandler} />
	      <BrightMirrorViewer story={this.state.brightMirrorToRead} />
	      <div class="status">{this.state.appStatus}</div>
	      <div class="error">{this.state.errorStatus}</div>
	    </div>
	  );
	}
}

@withText({
  titlePlaceholder: 'editor.storyTitle',
  storyBodyPlaceholder: 'editor.storyBody',
  yourNamePlaceholder: 'editor.yourName',
  submitStoryText: 'editor.submitStory',
  saveDraftText: 'editor.saveDraft',
  copyToClipboardText: 'editor.copyToClipboard'

})
class BrightMirrorEditor extends Component {
  render() {
    const titlePlaceholder = this.props.titlePlaceholder;
    const storyBodyPlaceholder = this.props.storyBodyPlaceholder;
    const yourNamePlaceholder = this.props.yourNamePlaceholder;
    const submitStoryText = this.props.submitStoryText;
    const saveDraftText = this.props.saveDraftText;
    const copyToClipboardText = this.props.copyToClipboardText;
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          <input type="text" className="bmEditorTitle" placeholder={titlePlaceholder} name="title" value={this.props.story.title} onChange={this.props.inputHandler} />
        </label>
        <label>
          <RichTextEditor className="bmEditorBodyEditor" placeholder={storyBodyPlaceholder} name="body" value={this.props.story.body} onChange={this.props.storyInputHandler} />
        </label>
        <label>
          <input className="bmEditorYourName" name="author" type="text" value={this.props.story.author} placeholder={yourNamePlaceholder} onChange={this.props.inputHandler} />
        </label>
        <ImageCropperUploader initialImage={this.props.story.image} croppedContentHandler={this.props.croppedContentHandler} />
        <div className="bmEditorButtonGroup">
          <input type="submit" onClick={this.props.submitHandler} value={submitStoryText} />
          <input type="submit" onClick={this.props.saveDraftHandler} value={saveDraftText} />
        </div>
        <div className="bmEditorEditLink">
          <Text id="editor.yourEditLink">Your edit link will appear here when you have pressed one of the buttons</Text>
          <CopyToClipboard toCopy={this.props.editionLink} actionText={copyToClipboardText} />
        </div>

      </form>
    );
  }
}

class CopyToClipboard extends Component {
	ref = createRef()
	copyToClipboard = (e) => {
	  e.preventDefault();
	  this.ref.current.removeAttribute('disabled');
	  this.ref.current.select();
	  document.execCommand('copy');
	  this.ref.current.setAttribute('disabled', 'disabled');
	  if (window.getSelection) {
	    window.getSelection().removeAllRanges();
	  }
	  else if (document.selection) {
	    document.selection.empty();
	  }
	}
	render() {
	  return (
	    <>
	      <input disabled="disabled" type="text" ref={this.ref} className="copy-to-clipboard" value={this.props.toCopy} />
	      <button onclick={this.copyToClipboard}>{this.props.actionText}</button>
	    </>);
	}
}

class BrightMirrorViewer extends Component {
	readingTime = (text) => {
	  text = text || '';
	  return Math.ceil(text.split(/\s/g).length / 200);
	}
	render() {
	  const sane = DOMPurify.sanitize(this.props.story.body);
	  const rt = this.readingTime(sane);
	  return (
	    <article>
	      <h1>{this.props.story.title}</h1>
	      {this.props.story.image ? <img src={this.props.story.image} /> : null}
	      <p><Text id="reader.textBy">by</Text> {this.props.story.author}</p>
	      <p><Text id="reader.readingTime" plural={rt} fields={{ duration: rt }}>Reading time: {rt}</Text></p>
	      {
	        // eslint-disable-next-line react/no-danger
	      }<div dangerouslySetInnerHTML={{ __html: sane }} />
	    </article>
	  );
	}
}


// I'm stupid and this component is tightly bound to the READ list API.
class BrightMirrorListSelect extends Component {
  render() {
    const options = this.props.options;
    return (
      <select value={this.props.value} onChange={this.props.onChange}>
        <option key="option-none" value="0">-</option>
        {options.map((option, i) => {
          const value = option.id;
          const label = option.title;

          return (
            <option key={`option-${i}`} value={value}>
              {label}
            </option>
          );
        })}

      </select>
    );
  }
}

// rich text editor
class RichTextEditor extends Component {
	editor = null
	componentDidMount() {
	  this.editor = new MediumEditor('.richtexteditor',
	    {
	      toolbar: {
	        fixed: true
	      },
	      placeholder: {
	        text: this.props.placeholder
	      }
	    });
	  this.editor.subscribe('editableInput', this.props.onChange);
	}

	render() {
	  return (
	    <div className="RichTextEditor">
	      <div className="richtexteditor" />
	    </div>
	  );
	}
}

class ImageCropperUploader extends Component {
	imgRef = createRef()
	cropper = null
	fileReader = null
	file = null
	state = {
	  cropped: false,
	  hasImage: false
	}

	consumeContent = (content) => {
	  const ref = this.imgRef;
	  let context = this.imgRef.current.getContext('2d');
	  let img = new Image();
	  img.onload = () => {
	    context.canvas.height = img.height;
	    context.canvas.width = img.width;
	    context.drawImage(img, 0, 0);
	    this.cropper = new Cropper(
	      ref.current,
	      {
	        aspectRatio: 1 / 1
	      }
	    );
	  };
	  img.src = content;
	  if (content) {
	    this.setState({ hasImage: true });
	  }
	  else {
	    this.setState({ hasImage: false });
	  }

	}
	handleFileRead = (e) => {
	  const content = this.fileReader.result;
	  return this.consumeContent(content);
	}

	crop = (e) => {
	  e.preventDefault();
	  e.target.disabled = 'disabled';
	  let croppedImageDataURL = this.cropper.getCroppedCanvas().toDataURL('image/png');
	  this.props.croppedContentHandler(croppedImageDataURL);
	  this.cropper.disable();
	  const context = this.imgRef.current.getContext('2d');
	  let img = new Image();
	  img.onload = function () {
	    context.canvas.height = img.height;
	    context.canvas.width = img.width;
	    context.drawImage(img, 0, 0);
	  };
	  img.src = croppedImageDataURL;
	  this.cropper.destroy();
	  this.setState({ cropped: true });

	}

	resetCrop = (e) => {
	  e.preventDefault();
	  this.cropper.reset();
	  this.props.croppedContentHandler(null);
	  this.fileReader.readAsDataURL(this.file);
	  this.setState({ cropped: false });
	}

	handleFileChosen = (e) => {
	  const file = e.target.files[0];
	  this.file = file;
	  this.fileReader = new FileReader();
	  this.fileReader.onloadend = this.handleFileRead;
	  this.fileReader.readAsDataURL(file);
	}

	componentDidMount() {
	  this.consumeContent(this.state.initialImage);
	}

	render() {
	  return (
	    <div class="imageUploader">
	      <input
		className="imageUploaderFile"
		type="file" accept="image/*"
		onChange={this.handleFileChosen}
	      />
	      <canvas ref={this.imgRef} />
	      <button disabled={!this.state.hasImage || this.state.cropped} onClick={this.crop}><Text id="imageUploader.crop">Crop image</Text></button>
	      <button disabled={!(this.state.cropped)} onClick={this.resetCrop}><Text id="imageUploader.resetCrop">Reset crop</Text></button>
	    </div>
	  );
	}
}
