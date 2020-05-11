require('cropperjs/dist/cropper.css');
import Cropper from 'cropperjs';
import { Component, createRef } from 'preact';
import { Text } from 'preact-i18n';
export class ImageCropperUploader extends Component {
  imgRef = createRef();
  cropper = null;
  fileReader = null;
  file = null;
  state = {
    cropped: false,
    hasImage: false
  };
  consumeContent = (content) => {
    const ref = this.imgRef;
    let context = this.imgRef.current.getContext('2d');
    let img = new Image();
    img.onload = () => {
      context.canvas.height = img.height;
      context.canvas.width = img.width;
      context.drawImage(img, 0, 0);
      this.cropper = new Cropper(ref.current, {
        aspectRatio: 1 / 1
      });
    };
    img.src = content;
    if (content) {
      this.setState({ hasImage: true });
    }
    else {
      this.setState({ hasImage: false });
    }
  };
  handleFileRead = (e) => {
    const content = this.fileReader.result;
    return this.consumeContent(content);
  };
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
  };
  resetCrop = (e) => {
    e.preventDefault();
    this.cropper.reset();
    this.props.croppedContentHandler(null);
    this.fileReader.readAsDataURL(this.file);
    this.setState({ cropped: false });
  };
  handleFileChosen = (e) => {
    const file = e.target.files[0];
    this.file = file;
    this.fileReader = new FileReader();
    this.fileReader.onloadend = this.handleFileRead;
    this.fileReader.readAsDataURL(file);
  };
  componentDidMount() {
    this.consumeContent(this.state.initialImage);
  }
  render() {
    return (<div class="imageUploader">
      <input className="imageUploaderFile" type="file" accept="image/*" onChange={this.handleFileChosen} />
      <canvas ref={this.imgRef} />
      <button disabled={!this.state.hasImage || this.state.cropped} onClick={this.crop}>
        <Text id="imageUploader.crop">Crop image</Text>
      </button>
      <button disabled={!(this.state.cropped)} onClick={this.resetCrop}>
        <Text id="imageUploader.resetCrop">Reset crop</Text>
      </button>
    </div>);
  }
}
