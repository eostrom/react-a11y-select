import React, { Component } from 'react'
import Option from '../Option'
import OptionWrapper from '../OptionWrapper'
import SelectButton from '../SelectButton'
import PropTypes from 'prop-types'
import uniqueId from 'lodash/uniqueId'
import * as keycode from '../keycodes'

export default class Select extends Component {
  static propTypes = {
    label: (props, propName, componentName) => {
      if (!props.label && !props.labelledBy) {
        const msg = `One of props 'label' or 'labelledBy' was not specified in ${componentName}`
        return new Error(msg)
      }
      return null
    },
    labelledBy: (props, propName, componentName) => {
      const msg = `One of props 'label' or 'labelledBy' was not specified in ${componentName}`
      if (!props.label && !props.labelledBy) {
        return new Error(msg)
      }
      return null
    },
    placeholderText: PropTypes.string,
    initialValue: PropTypes.string,
    buttonId: PropTypes.string,
    listId: PropTypes.string,
    onChange: PropTypes.func,
  }
  static defaultProps = {
    placeholderText: 'Please choose...',
    buttonId: uniqueId('react-a11y-button-'),
    listId: uniqueId('react-a11y-list-'),
    onChange: (_value) => {},
  }

  constructor() {
    super()
    this.state = {
      open: false,
      selectedKey: null,
      highlightedKey: null,
    }
    this.options = []
  }

  componentWillMount() {
    const { children, initialValue } = this.props
    this.options = React.Children.toArray(children).filter((child) => child.type === Option)
    if (initialValue) {
      const initialOption = this.findOptionByValue(initialValue)
      if (initialOption) {
        this.setState({
          selectedKey: initialOption.key,
        })
      }
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  handleClick = (_e) => {
    const { open } = this.state
    this.setState({
      open: !open,
    })
  }

  handleClickOutside = (e) => {
    if (this.wrapperDiv && !this.wrapperDiv.contains(e.target)) {
      const { open } = this.state
      if (open) {
        this.setState({
          open: false,
        })
      }
    }
  }

  handleKeyDown = (e) => {
    const { open, highlightedKey } = this.state
    e.preventDefault()
    switch (e.keyCode) {
      case keycode.DOWN: {
        if (!open) {
          this.setState({
            open: true,
          })
        }
        this.highlightOption(this.nextKey(highlightedKey))
        break
      }
      case keycode.UP: {
        this.highlightOption(this.previousKey(highlightedKey))
        break
      }
      case keycode.ESC: {
        if (open) {
          this.setState({
            open: false,
          })
        }
        break
      }
      case keycode.SPACE:
      case keycode.ENTER: {
        if (open) {
          this.handleOptionSelect(e, highlightedKey)
        } else {
          this.setState({
            open: true,
            highlightedIndex: 0,
          })
        }
        break
      }
      case keycode.TAB: {
        if (open) {
          this.setState({
            open: false,
          })
        }
        break
      }
      default:
    }
  }

  handleOptionHover(e, hoverOverKey) {
    this.highlightOption(hoverOverKey)
  }

  handleOptionSelect(_e, clickedKey) {
    this.selectOption(clickedKey)
  }

  highlightOption(highlightedKey) {
    const candidate = this.findOptionByKey(highlightedKey)
    if (candidate.props.disabled) {
      return
    }
    this.setState({
      highlightedKey,
    })
  }

  selectOption(key) {
    const { onChange } = this.props
    this.setState({
      open: false,
      selectedKey: key,
      highlightedKey: null,
    })

    const selectedValue = this.findOptionByKey(key).props.value
    if (onChange) {
      onChange(selectedValue)
    }
  }

  findOptionByValue(value) {
    return this.options.find((option) => option.props.value === value)
  }

  findOptionByKey(key) {
    return this.options.find((option) => option.key === key)
  }

  nextKey(key) {
    const currentIndex = this.options.findIndex((option) => option.key === key)
    const lastIndex = this.options.length - 1
    let next
    if (currentIndex === -1) {
      next = this.options[0]
    } else if (currentIndex === lastIndex) {
      next = this.options[currentIndex]
    } else {
      next = this.options[currentIndex + 1]
    }

    if (next.props.disabled && currentIndex !== lastIndex) {
      return this.nextKey(next.key)
    }
    return next.key
  }

  previousKey(key) {
    const currentIndex = this.options.findIndex((option) => option.key === key)
    let previous
    if (currentIndex === 0) {
      previous = this.options[0]
    } else {
      previous = this.options[currentIndex - 1]
    }

    if (previous.props.disabled && currentIndex !== 0) {
      return this.previousKey(previous.key)
    }
    return previous.key
  }

  renderChildren() {
    const { highlightedKey, selectedKey } = this.state
    return this.options.map((option) =>
      <OptionWrapper
        key={`optionwrapper-${option.key}`}
        optionKey={option.key}
        selectedKey={selectedKey}
        optionId={`react-a11y-option-${option.key}`}
        highlightedKey={highlightedKey}
        label={option.props.label}
        value={option.props.value}
        disabled={option.props.disabled}
        onMouseOver={(e) => this.handleOptionHover(e, option.key)}
        onClick={(e) => this.handleOptionSelect(e, option.key)}
      >
        {option}
      </OptionWrapper>
    )
  }

  render() {
    const { open, highlightedKey, selectedKey } = this.state
    const { listId, buttonId, placeholderText } = this.props
    const highlightedId =
       highlightedKey ? `react-a11y-option-${highlightedKey}` : undefined

    return (
      <div
        className="ReactA11ySelect"
        ref={(wrapperDiv) => { this.wrapperDiv = wrapperDiv }}
      >
        <SelectButton
          buttonId={buttonId}
          listId={listId}
          highlightedId={highlightedId}
          open={open}
          onKeyDown={this.handleKeyDown}
          onClick={this.handleClick}
        >
          {!selectedKey && placeholderText}
          {!!selectedKey && this.findOptionByKey(selectedKey).props.children}
        </SelectButton>
        {this.state.open &&
          <ul id={listId} role="menu" className="ReactA11ySelect__ul">
            {this.renderChildren()}
          </ul>}
      </div>
    )
  }
}
