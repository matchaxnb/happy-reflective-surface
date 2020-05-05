import './style';
require('medium-editor/dist/css/medium-editor.css');
require('cropperjs/dist/cropper.css');
require('medium-editor/dist/css/themes/default.css');
import DOMPurify from 'dompurify';
import definition from './i18n/fr-fr.json';
import MediumEditor from 'medium-editor';
import Cropper from 'cropperjs'
import { Component, createRef } from 'preact';
import { IntlProvider, Text, MarkupText, Localizer } from 'preact-i18n';

export default class IntlApp extends Component {
    render() {
        return (
            <IntlProvider definition={definition}>
                <BrightMirror />
            </IntlProvider>
        )
    }
}


class BrightMirror extends Component {
    constructor(props) {
        super(props)
        this.new_post_endpoint = 'http://localhost:8001/wp-json/brightmirror/v1/stories'
        this.read_post_endpoint = 'http://localhost:8001/wp-json/brightmirror/v1/stories/'
        this.state = {
            story: {
                author: "",
                title: "",
                body: "",
                image: null
            },
            editionLink: "#",
            brightMirrorToRead: {
                author: "",
                title: "",
                body: ""
            },
            brightMirrorToReadId: 0,
            brightMirrorList: [
                {id: "0", title: "-"}
            ]
        };
    }

    componentDidMount = () => {
        // get list of bright mirror stories
        fetch(this.read_post_endpoint,
            {
                method: 'GET',
            })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        brightMirrorList: result
                    });
                },
                (error) => {
                    console.log("NOK!");
                    console.log(error);
                }
            )


    }

    editorInputChangeHandler = (e) => {
        const target = e.target
        const name = target.name
        const value = target.value

        this.setState({
            story: {
                ...this.state.story,
                ...{[name]: value}
            }
        })
    }


    changeQueriedBrightMirrorHandler = (e) => {
        this.setState({
            brightMirrorToReadId: e.target.value
        });
        fetch(this.read_post_endpoint + e.target.value,
            {
                method: 'GET',
            })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log("OK!");
                    console.log(result);
                    this.setState({
                        brightMirrorToRead: result
                    });
                },
                (error) => {
                    console.log("NOK!");
                    console.log(result);
                }
            )
    }
    // special handler for RichText
    editorStoryInputHandler = (e) => {
        this.setState({story: { ...this.state.story, ...{body: e.target.innerHTML}}})
    }

    saveToServer = (asDraft) => {
        const json_body = JSON.stringify(this.state.story)
        console.log("sending", json_body)
        let endpoint = this.new_post_endpoint
        if (asDraft == true) {
            endpoint += '?as_draft=true'
        }
        fetch(endpoint,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: json_body,
            })
            .then(res => res.json())
            .then(
                (result) => {
                    console.log("OK!");
                    console.log(result);
                },
                (error) => {
                    console.log("NOK!");
                    console.log(result);
                }
            )
    }

    submitStoryHandler = (e) => {
        e.preventDefault()
        this.saveToServer(false)
    }

    saveDraftHandler = (e) => {
        e.preventDefault()
        this.saveToServer(true)
    }

    croppedContentHandler = (content) => {
        this.setState({
            story: {
                ...this.state.story,
                ...{image: content}
            }
        })
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
                <h3><Text id="app.read_existing">Read an existing bright mirror</Text></h3>
                <input type="text" onChange={this.changeQueriedBrightMirrorHandler} value={this.state.brightMirrorToReadId} />
                <BrightMirrorListSelect options={this.state.brightMirrorList} value={this.state.brightMirrorToReadId} onChange={this.changeQueriedBrightMirrorHandler} />
                <BrightMirrorViewer story={this.state.brightMirrorToRead} />
			</div>
		);
	}
}

class BrightMirrorEditor extends Component {
    render() {
        return (
        <form onSubmit={this.handleSubmit}>
            <label>
                <Localizer>
                <input type="text" className="bmEditorTitle" placeholder={<Text id="editor.story_title">Story Title</Text>} name="title" value={this.props.story.title} onChange={this.props.inputHandler} />
                </Localizer>
            </label>
            <label>
                <Localizer>
                <RichTextEditor className="bmEditorBodyEditor" placeholder={<Text id="editor.story_body">Your Story:</Text>} name="body" value={this.props.story.body} onChange={this.props.storyInputHandler} />
                </Localizer>
            </label>
            <label>
                <Localizer>
                    <input className="bmEditorYourName" name="author" type="text" value={this.props.story.author} placeholder={<Text id="editor.your_name">Your name</Text>} onChange={this.props.inputHandler} />
                </Localizer>
            </label>
            <ImageCropperUploader croppedContentHandler={this.props.croppedContentHandler} />
            <div className="bmEditorButtonGroup">
            <Localizer>
                <input type="submit" onClick={this.props.submitHandler} value={<Text id="editor.submit_story">Submit your story</Text>}/>
                <input type="submit" onClick={this.props.saveDraftHandler} value={<Text id="editor.save_draft">Save your draft</Text>}/>
            </Localizer>
            </div>
            <div className="bmEditorEditLink">
                <Text id="editor.your_edit_link">Your edit link will appear here when you have pressed one of the buttons</Text>
                <Localizer>
                <CopyToClipboard toCopy={this.props.editionLink} actionText={<Text id="editor.copy_to_clipboard">Copy to clipboard</Text>} />
                </Localizer>
            </div>

        </form>
        );
    }
}

class CopyToClipboard extends Component {
    ref = createRef()
    copyToClipboard = (e) => {
        e.preventDefault()
        this.ref.current.removeAttribute('disabled')
        this.ref.current.select()
        console.log(this.ref.current)
        document.execCommand('copy')
        this.ref.current.setAttribute('disabled', 'disabled')
        if (window.getSelection) {window.getSelection().removeAllRanges();}
        else if (document.selection) {document.selection.empty();}
    }
    render() {
        return (
        <>
            <input disabled="disabled" type="text"  ref={this.ref} className="copy-to-clipboard" value={this.props.toCopy} /><button onclick={this.copyToClipboard}>{this.props.actionText}</button>
        </>)
    }
}

class BrightMirrorViewer extends Component {
    ref = createRef()
    readingTime = (text) => {
        text = text || ""
        return Math.ceil(text.split(/\s/g).length / 200);
        // average reading time is 200 wpm
//        return Math.floor(Math.max(1, this.ref.current.wordCount() / 200));
    }
    render() {
        const sane = DOMPurify.sanitize(this.props.story.body)
        const rt = this.readingTime(sane)
        return (
          <article>
            <h1>{this.props.story.title}</h1>
            <p><Text id="reader.text_by">by</Text> {this.props.story.author}</p>
            <p><Text id="reader.reading_time" plural={rt} fields={{duration: rt}} />Reading time: {rt}</p>
            <div dangerouslySetInnerHTML={{ __html: sane }} />
          </article>
               );
    }
}


// I'm stupid and this component is tightly bound to the READ list API.
class BrightMirrorListSelect extends Component {
  constructor(props) {
    super(props)
    this.state = { value: props.value }
  }

  lOnChange = (e) => {
     this.setState({value: e.target.value})
     this.props.onChange(e)
  }

  render() {
    const options = this.props.options
    return (
        <select value={this.state.value} onChange={this.lOnChange}>
        <option key='option-none' value='0'>-</option>
        {options.map((option, i) => {
                const value = option.id
                const label = option.title

                return (
                    <option key={`option-${i}`} value={value}>
                        {label}
                    </option>
                )
        })}

        </select>
    );
  }
}

// rich text editor
class RichTextEditor extends Component {
  editor = null
  ref = createRef()
  componentDidMount () {
    this.editor = new MediumEditor('.richtexteditor',
    {
        toolbar: {
            fixed: true
        },
        placeholder: {
            text: this.props.placeholder
        }
    })
    this.editor.subscribe('editableInput', this.props.onChange)
  }

  render() {
    return (
      <div className="RichTextEditor">
        <div ref={this.ref} className="richtexteditor" />
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

    handleFileRead = (e) => {
        const content = this.fileReader.result
        const ref = this.imgRef
        var context = this.imgRef.current.getContext("2d")
        var that = this
        var img = new Image()
        img.onload = function() {
            context.canvas.height = img.height
            context.canvas.width = img.width
            context.drawImage(img, 0, 0)
            that.cropper = new Cropper(ref.current,
            {
                    aspectRatio: 1/1,
            }
            )
        }
        img.src = content
        this.setState({hasImage: true})
    }
    crop = (e) => {
        e.preventDefault()
        e.target.disabled="disabled"
        var croppedImageDataURL = this.cropper.getCroppedCanvas().toDataURL("image/png")
        this.props.croppedContentHandler(croppedImageDataURL)
        this.cropper.disable()
        const context = this.imgRef.current.getContext("2d")
        var img = new Image()
        img.onload = function() {
            context.canvas.height = img.height
            context.canvas.width = img.width
            context.drawImage(img, 0, 0)
        }
        img.src = croppedImageDataURL
        this.cropper.destroy()
        this.setState({cropped: true})

    }

    resetCrop = (e) => {
        e.preventDefault()
        this.cropper.reset()
        this.props.croppedContentHandler(null)
        this.fileReader.readAsDataURL(this.file)
        this.setState({cropped: false})
    }

    handleFileChosen = (e) => {
        const file = e.target.files[0];
        this.file = file
        this.fileReader = new FileReader()
        this.fileReader.onloadend = this.handleFileRead
        this.fileReader.readAsDataURL(file)
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
        )
    }
}
