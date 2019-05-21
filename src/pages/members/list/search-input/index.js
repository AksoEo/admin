import React from 'react';
import PropTypes from 'prop-types';
import ResizeObserver from 'resize-observer-polyfill';
import Button from '@material-ui/core/Button';
import NativeSelect from '@material-ui/core/NativeSelect';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import PredicateEditor from './predicates';
import locale from '../../../../locale';
import { Spring, globalAnimator, lerp, clamp } from '../../../../animation';
import { SEARCHABLE_FIELDS } from './fields';
import './style';

/** Members’ page search input. */
export default class SearchInput extends React.PureComponent {
    static propTypes = {
        field: PropTypes.string.isRequired,
        query: PropTypes.any.isRequired,
        expanded: PropTypes.bool.isRequired,
        predicates: PropTypes.arrayOf(PropTypes.object).isRequired,
        onQueryChange: PropTypes.func.isRequired,
        onFieldChange: PropTypes.func.isRequired,
        onExpandedChange: PropTypes.func.isRequired,
        onPredicatesChange: PropTypes.func.isRequired,
        submitted: PropTypes.bool.isRequired,
        onUnsubmit: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
    };

    toggleExpanded = () => {
        this.props.onExpandedChange(!this.props.expanded);
    };

    onContainerClick = e => {
        if (this.props.submitted) {
            e.preventDefault();
            this.props.onUnsubmit();
        }
    }

    render () {
        let className = 'members-search';
        if (this.props.expanded) className += ' expanded';
        if (this.props.submitted) className += ' submitted';

        const filtersOnly = this.props.expanded && !this.props.query;

        const listItems = [{
            node: <PrimarySearch
                key="primary"
                value={this.props.query}
                onChange={this.props.onQueryChange}
                onKeyDown={e => {
                    if (e.key === 'Enter') {
                        this.props.onSubmit();
                    }
                }}
                submitted={this.props.submitted}
                expanded={this.props.expanded}
                toggleExpanded={this.toggleExpanded}
                searchableFields={SEARCHABLE_FIELDS}
                searchField={this.props.field}
                onSearchFieldChange={this.props.onFieldChange} />,
            hidden: false,
        }, {
            node: <div className="filters-title">{locale.members.search.filters}</div>,
            hidden: !this.props.expanded
                || this.props.submitted
                && !this.props.predicates.map(i => i.enabled).includes(true),
        }];

        const offset = listItems.length;

        for (const item of this.props.predicates) {
            const index = listItems.length - offset;
            let isLast = true;
            for (let j = index + 1; j < this.props.predicates.length; j++) {
                if (this.props.predicates[j].enabled) {
                    isLast = false;
                    break;
                }
            }

            listItems.push({
                node: <PredicateEditor
                    key={item.field}
                    field={item.field}
                    enabled={item.enabled}
                    submitted={this.props.submitted}
                    value={item.value}
                    onChange={value => {
                        const predicates = this.props.predicates.slice();
                        predicates[index].value = value;
                        predicates[index].enabled = true;
                        this.props.onPredicatesChange(predicates);
                    }}
                    isLast={isLast}
                    onEnabledChange={enabled => {
                        const predicates = this.props.predicates.slice();
                        predicates[index].enabled = enabled;
                        this.props.onPredicatesChange(predicates);
                    }} />,
                hidden: this.props.field === item.field
                    ? true
                    : this.props.submitted ? !item.enabled : false,
            });
        }

        return (
            <div className={className} onClick={this.onContainerClick} role="form">
                <PaperList className="search-contents" layout="flat">
                    {[
                        {
                            node: (
                                <div className="search-title">
                                    {filtersOnly
                                        ? locale.members.search.titleFilter
                                        : locale.members.search.title}
                                </div>
                            ),
                            hidden: this.props.submitted,
                        },
                        {
                            node: (
                                <PaperList
                                    className="search-box"
                                    layout={this.props.expanded ? 'flat' : 'collapsed'}>
                                    {listItems}
                                </PaperList>
                            ),
                            hidden: false,
                            staticHeight: true,
                        },
                        {
                            node: (
                                <footer className="search-footer">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        className="submit-button"
                                        onClick={this.props.onSubmit}>
                                        {filtersOnly
                                            ? locale.members.search.submitFilter
                                            : locale.members.search.submit}
                                    </Button>
                                </footer>
                            ),
                            hidden: this.props.submitted,
                        },
                    ]}
                </PaperList>
            </div>
        );
    }
}

/** Primary search field. */
class PrimarySearch extends React.PureComponent {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        toggleExpanded: PropTypes.func.isRequired,
        expanded: PropTypes.bool.isRequired,
        submitted: PropTypes.bool.isRequired,
        searchField: PropTypes.string.isRequired,
        searchableFields: PropTypes.arrayOf(PropTypes.string).isRequired,
        onSearchFieldChange: PropTypes.func.isRequired,
    };

    render () {
        const inputProps = { ...this.props };
        for (const key in PrimarySearch.propTypes) delete inputProps[key];

        return (
            <div className="search-primary">
                <div className="search-icon-container">
                    <SearchIcon />
                </div>
                <NativeSelect
                    className="search-field"
                    value={this.props.searchField}
                    onChange={e => this.props.onSearchFieldChange(e.target.value)}>
                    {this.props.searchableFields.map(field => (
                        <option value={field} key={field}>
                            {locale.members.search.fields[field]}
                        </option>
                    ))}
                </NativeSelect>
                <input
                    autoFocus={true}
                    className="search-input"
                    {...inputProps}
                    onChange={e => this.props.onChange(e.target.value)}
                    onClick={e => this.props.submitted && e.stopPropagation()}
                    placeholder={locale.members.search.fieldPlaceholders[this.props.searchField]} />
                {!this.props.submitted && (
                    <Button className="search-expand" onClick={this.props.toggleExpanded}>
                        {this.props.expanded
                            ? locale.members.search.collapse
                            : locale.members.search.expand}
                    </Button>
                )}
                {this.props.submitted && (
                    // seemingly useless button as a fake target for the container click
                    // event in the search input
                    <IconButton
                        className="search-expand"
                        aria-label={locale.members.search.expand}>
                        <KeyboardArrowDownIcon />
                    </IconButton>
                )}
            </div>
        );
    }
}

const DAMPING = 0.9;
const RESPONSE = 0.3;

/**
 * Renders a vertical array of animatable material paper.
 */
class PaperList extends React.PureComponent {
    static propTypes = {
        children: PropTypes.arrayOf(PropTypes.object).isRequired,
        layout: PropTypes.oneOf(['flat', 'collapsed']).isRequired,
    };

    /** ResizeObserver that observes all children. */
    resizeObserver = new ResizeObserver(() => this.update(0));

    childNodes = [];
    childStates = [];

    update (deltaTime) {
        // sync childStates count with child count
        while (this.childStates.length < this.props.children.length) {
            const lastState = this.childStates[this.childStates.length - 1];
            const child = this.props.children[this.childStates.length];

            const y = new Spring(DAMPING, RESPONSE);
            y.value = y.target = lastState ? lastState.y.value : 0;
            const height = new Spring(DAMPING, RESPONSE);
            height.value = height.target = 0;
            const hidden = new Spring(DAMPING, RESPONSE);
            hidden.value = hidden.target = child.hidden ? 1 : 0;

            const forceUpdate = () => this.forceUpdate();
            y.on('update', forceUpdate);
            height.on('update', forceUpdate);
            hidden.on('update', forceUpdate);

            const effectivelyHidden = false;

            this.childStates.push({ y, height, hidden, effectivelyHidden });
        }

        while (this.childStates.length > this.props.children.length) {
            this.childStates.pop();
        }

        let wantsUpdate = false;

        let yAccum = 0;
        let i = 0;
        for (const state of this.childStates) {
            const index = i++;
            const child = this.props.children[index];

            if (!this.childNodes[index]) {
                // FIXME: for some reason update is called even after the component was unmounted
                return;
            }

            state.hidden.target = child.hidden ? 1 : 0;
            state.effectivelyHidden = child.hidden;

            if (this.props.layout === 'collapsed') {
                state.y.target = 0;
                state.height.target = this.childNodes[0].offsetHeight;

                if (index !== 0) state.effectivelyHidden = true;
            } else if (this.props.layout === 'flat') {
                state.y.target = yAccum;
                state.height.target = this.childNodes[index].offsetHeight;

                yAccum += this.childNodes[index].offsetHeight * (1 - state.hidden.value);
            }

            state.y.update(deltaTime);
            state.height.update(deltaTime);
            state.hidden.update(deltaTime);

            if (!wantsUpdate && (state.y.wantsUpdate() || state.height.wantsUpdate()
                || state.hidden.wantsUpdate())) {
                wantsUpdate = true;
            }
        }

        if (!wantsUpdate) {
            globalAnimator.deregister(this);
        }
    }

    /** Returns the style object for a child at the given index. */
    getChildStyle (index) {
        if (!this.childStates[index]) return;
        const state = this.childStates[index];
        const childHeight = this.childNodes[index].offsetHeight;
        const scaleY = this.props.children[index].staticHeight
            ? 1
            : state.height.value / childHeight;

        return {
            transform: `translateY(${state.y.value}px) scaleY(${scaleY})`,
            zIndex: Math.round(lerp(this.childStates.length - index, -1, state.hidden.value)),
            opacity: clamp(1 - state.hidden.value, 0, 1),
            pointerEvents: state.hidden.value > 0.5 ? 'none' : '',
        };
    }

    componentDidMount () {
        this.update(0);
    }

    componentDidUpdate () {
        globalAnimator.register(this);
    }

    componentWillUnmount () {
        globalAnimator.deregister(this);
    }

    render () {
        const props = { ...this.props };
        delete props.layout;

        const items = [];
        for (let i = 0; i < this.props.children.length; i++) {
            const { node } = this.props.children[i];
            const hidden = this.childStates[i] ? this.childStates[i].effectivelyHidden : true;
            const style = this.getChildStyle(i);
            const index = i;
            items.push(
                <div
                    key={i}
                    className="paper-list-item"
                    style={style}
                    aria-hidden={hidden}
                    ref={node => {
                        this.childNodes[index] = node;
                        if (node) {
                            this.resizeObserver.observe(node);
                        }
                    }}>
                    {node}
                </div>
            );
        }

        // GC node refs
        while (this.childNodes.length > this.props.children.length) {
            this.childNodes.pop();
        }

        // find current total height
        const style = {};
        let lastStateIndex = this.childStates.length - 1;
        while (lastStateIndex > 0 && this.props.children[lastStateIndex].hidden) {
            lastStateIndex--;
        }
        const lastState = this.childStates[lastStateIndex];
        if (lastState) {
            style.height = lastState.y.value + lastState.height.value;
        }

        return (
            <div {...props} style={style}>
                {items}
            </div>
        );
    }
}
