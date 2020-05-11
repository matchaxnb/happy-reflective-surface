require('medium-editor/dist/css/medium-editor.css');
require('medium-editor/dist/css/themes/default.css');
import MediumEditor from 'medium-editor';
import { Component } from 'preact';
// rich text editor
export class RichTextEditor extends Component {
  editor = null;
  componentDidMount() {
    this.editor = new MediumEditor(`.${this.props.className}`, {
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
    return (<div className={this.props.className} />);
  }
}
RichTextEditor.defaultProps = {
  className: 'richTextEditor'
};
