import React from 'react';
import PropTypes from 'prop-types';
import SearchIcon from '@material-ui/icons/Search';

/** @jsx React.createElement */

/**
 * A predicate editor that uses inline “chips” to display predicates.
 *
 * The `value` prop must be an array of objects like `{ id, value }` containing search chips.
 * There is also an extra “appending” input at the end for adding new chips.
 */
export default class SearchInput extends React.PureComponent {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        value: PropTypes.array.isRequired,
        placeholder: PropTypes.string.isRequired
    };

    state = {
        /** The current value in the “appending” input */
        appendValue: ''
    };

    /** DOM refs to all chip input elements */
    chipInputs = [];
    /** The appending input node */
    appendInput = null;
    /** If set, will focus the input with the given index the next time the component updates. */
    focusInput = null;

    onAppendChange = e => {
        const value = e.target.value;
        if (value.endsWith(' ')) {
            const newValue = this.props.value.slice();
            newValue.push({
                id: value,
                value: ''
            });
            this.props.onChange(newValue);
            this.setState({ appendValue: '' });
            this.focusInput = newValue.length - 1;
        } else {
            this.setState({ appendValue: value });
        }
    }

    onAppendKeyDown = e => {
        this.onChipKeyDown(e, this.props.value.length);
    }

    onChipKeyDown = (e, index) => {
        const isCollapsed = e.target.selectionStart === e.target.selectionEnd;
        const isAtStart = e.target.selectionStart === 0;
        const isAtEnd = e.target.selectionEnd >= e.target.value.length;

        if (e.key === 'Backspace' && isCollapsed && isAtStart) {
            const value = this.props.value.slice();
            value.splice(Math.min(value.length - 1, index), 1);
            this.props.onChange(value);
            this.focusInput = index;
        } else if (e.key === 'ArrowLeft' && isCollapsed && isAtStart) {
            e.preventDefault();
            this.focusInput = Math.max(0, index - 1);
            this.forceUpdate();
        } else if (e.key === 'ArrowRight' && isCollapsed && isAtEnd) {
            e.preventDefault();
            this.focusInput = index + 1;
            this.forceUpdate();
        }
    }

    onContainerClick = e => {
        if (e.target === e.currentTarget) {
            // focus the appending input if the container itself was clicked
            this.appendInput.focus();
        }
    }

    componentDidUpdate () {
        if (this.focusInput !== null) {
            // focus the input with the given index
            if (this.focusInput < this.props.value.length) {
                this.chipInputs[this.focusInput].focus();
            } else {
                this.appendInput.focus();
            }
            this.focusInput = null;
        }
    }

    render () {
        const hasValue = this.props.value.length || this.state.appendValue;
        const chips = [];

        let i = 0;
        for (const chip of this.props.value) {
            const index = i++;
            chips.push(
                <span className="search-chip" key={index}>
                    <span className="chip-name">{chip.id}</span>
                    <ContentEditableInput
                        className="chip-input"
                        value={chip.value}
                        ref={node => this.chipInputs[index] = node}
                        onChange={e => {
                            const value = this.props.value.slice();
                            value[index].value = e.target.value;
                            this.props.onChange(value);
                        }}
                        onKeyDown={e => this.onChipKeyDown(e, index)} />
                </span>
            );
        }

        // garbage-collect chipInputs
        while (this.chipInputs.length > this.props.value.length) {
            this.chipInputs.pop();
        }

        return (
            <div className="search-input">
                <div className="search-icon-container">
                    <SearchIcon />
                </div>
                <div
                    className="search-input-inner"
                    data-placeholder={hasValue ? null : this.props.placeholder}
                    onClick={this.onContainerClick}>
                    {chips}
                    <ContentEditableInput
                        ref={node => this.appendInput = node}
                        className="search-input-append"
                        value={this.state.appendValue}
                        onChange={this.onAppendChange}
                        onKeyDown={this.onAppendKeyDown} />
                </div>
            </div>
        );
    }
}

class ContentEditableInput extends React.PureComponent {
    static propTypes = {
        value: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
        onKeyDown: PropTypes.func
    }

    node = null;
    selection = { start: 0, end: 0 };

    focus () {
        this.node.focus();
        this.restoreSelection();
    }

    /** @returns {number} - the offset in characters of the given child node */
    findTextOffsetOfChildNode (node) {
        let offset = 0;
        let currentNode = node;
        while (currentNode !== this.node) {
            const parentNode = currentNode.parentNode;
            let childNodesBefore = 0;
            for (const node of parentNode.childNodes) {
                if (node === currentNode) break;
                childNodesBefore++;
            }
            for (let i = 0; i < childNodesBefore; i++) {
                const node = parentNode.childNodes[i];
                offset += (node.innerText || node.textContent).replace(/\n/g, '').length;
            }
            currentNode = parentNode;
        }
        return offset;
    }

    /** @returns {[Node, number]} - the node and the inner offset for the given text offset */
    findChildNodeForTextOffset (offset, node = this.node) {
        for (const childNode of node.childNodes) {
            const contents = childNode.innerText || childNode.textContent;
            if (contents.length > offset) {
                if (childNode.nodeType === 3) {
                    return [childNode, offset];
                } else {
                    return this.findChildNodeForTextOffset(offset, childNode);
                }
            } else {
                offset -= contents.length;
            }
        }
        const endPos = node.nodeType === 3 ? node.textContent.length : node.childNodes.length;
        return [node, endPos];
    }

    /** Saves the contenteditable selection so it can be restored after the contents are changed. */
    saveSelection () {
        const range = window.getSelection().getRangeAt(0);
        const { startContainer, startOffset, endContainer, endOffset } = range;
        const startOffsetBefore = startContainer === this.node
            ? (startOffset === 1 ? this.node.innerText.replace(/\n/g, '').length : 0)
            : this.findTextOffsetOfChildNode(startContainer);
        const endOffsetBefore = endContainer === this.node
            ? (endOffset === 1 ? this.node.innerText.replace(/\n/g, '').length : 0)
            : this.findTextOffsetOfChildNode(endContainer);
        this.selection = {
            start: startOffsetBefore + startOffset,
            end: endOffsetBefore + endOffset
        };
    }

    /** Restores the previously saved contenteditable selection. */
    restoreSelection () {
        if (document.activeElement !== this.node) return;
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        const [startNode, startOffset] = this.findChildNodeForTextOffset(this.selection.start);
        const [endNode, endOffset] = this.findChildNodeForTextOffset(this.selection.end);
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        selection.addRange(range);
    }

    /**
     * Updates DOM props `selectionStart`, `selectionEnd`, `value` to imitate an <input> element.
     * Also saves the current selection.
     */
    updateDOMProps () {
        this.saveSelection();
        this.node.selectionStart = this.selection.start;
        this.node.selectionEnd = this.selection.end;
        this.node.value = this.node.innerText.replace(/\n/g, '').replace(/\u00a0/g, ' ');
    }

    onInput = e => {
        this.updateDOMProps();
        this.props.onChange(e);
    }

    onKeyDown = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }

        this.updateDOMProps();
        if (this.props.onKeyDown) this.props.onKeyDown(e);
    }

    componentDidUpdate () {
        this.restoreSelection();
    }

    render () {
        const html = this.props.value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/^ | (?= |$)/g, '\u00a0');

        const props = { ...this.props };
        delete props.onChange;

        return (
            <span
                {...this.props}
                ref={node => this.node = node}
                contentEditable={true}
                onInput={this.onInput}
                onKeyDown={this.onKeyDown}
                dangerouslySetInnerHTML={{ __html: html }} />
        );
    }
}
