const BrightMirrorListSelect = ({ children, ...props }) => {
  const options = this.props.options;
  return (<select value={this.props.value} onChange={this.props.onChange}>
    <option key="option-none" value="0">-</option>
    {options.map((option, i) => {
      const value = option.id;
      const label = option.title;
      return (<option key={`option-${i}`} value={value}>
        {label}
      </option>);
    })}

  </select>);
};
export default BrightMirrorListSelect;