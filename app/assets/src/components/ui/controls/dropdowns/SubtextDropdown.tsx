import cx from "classnames";
import { kebabCase } from "lodash/fp";
import React from "react";
import { DropdownProps } from "semantic-ui-react";
import ColumnHeaderTooltip from "~ui/containers/ColumnHeaderTooltip";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import Dropdown from "./Dropdown";
import cs from "./subtext_dropdown.scss";

interface SubtextDropdownProps extends DropdownProps {
  className?: string;
  menuClassName?: string;
  options: Option[];
  onChange: $TSFixMeFunction;
  initialSelectedValue?: string | number;
  nullLabel?: string;
}

export interface Option {
  value?: number;
  text: string;
  subtext?: string;
  disabled?: boolean;
  tooltip?: string;
}

class SubtextDropdown extends React.Component<SubtextDropdownProps> {
  renderMenuItem(option: $TSFixMe) {
    const trigger = (
      <BareDropdown.Item
        onClick={(e: $TSFixMe) => {
          if (option.disabled) {
            e.stopPropagation();
          }
        }}
        className={cx(cs.option, option.disabled && cs.disabledOption)}
        data-testid={`dropdown-${kebabCase(option.text)}`}
      >
        <div className={cs.optionText}>{option.text}</div>
        <div className={cs.optionSubtext}>{option.subtext}</div>
      </BareDropdown.Item>
    );
    if (option.tooltip) {
      return (
        <ColumnHeaderTooltip
          trigger={trigger}
          content={option.tooltip}
          position="top center"
          mouseEnterDelay={600}
        />
      );
    } else {
      return trigger;
    }
  }

  renderMenuItems() {
    const { options } = this.props;

    return options.map((option: $TSFixMe) => ({
      text: option.text,
      value: option.value,
      subtext: option.subtext,

      customNode: option.customNode
        ? option.customNode
        : this.renderMenuItem(option),
    }));
  }

  render() {
    const renderedMenuItems = this.renderMenuItems();
    const {
      className,
      initialSelectedValue,
      menuClassName,
      onChange,
      nullLabel,
      ...props
    } = this.props;

    return (
      // @ts-expect-error Types of property 'search' are incompatible
      <Dropdown
        {...props}
        className={className}
        menuClassName={menuClassName}
        options={renderedMenuItems}
        value={initialSelectedValue}
        onChange={onChange}
        nullLabel={nullLabel}
        usePortal
        withinModal={true}
      />
    );
  }
}

export default SubtextDropdown;
