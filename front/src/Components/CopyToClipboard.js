import { Component, createRef } from 'preact';

export class CopyToClipboard extends Component {
  ref = createRef();
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
  };
  render() {
    return (<>
      <input disabled="disabled" type="text" ref={this.ref} className="copy-to-clipboard" value={this.props.toCopy} />
      <button onclick={this.copyToClipboard}>{this.props.actionText}</button>
    </>);
  }
}
