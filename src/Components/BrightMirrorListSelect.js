export const BrightMirrorListSelect = ({ children, ...props }) => {
  const options = props.options;
  return (<select value={props.value} onChange={props.onChange}>
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