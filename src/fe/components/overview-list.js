import { h } from 'preact';
import { Fragment, PureComponent } from 'preact/compat';
import { Checkbox, Button, CircularProgress, Spring, globalAnimator } from '@cpsdqs/yamdl';
import ArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ArrowLeftIcon from '@material-ui/icons/ChevronLeft';
import ArrowRightIcon from '@material-ui/icons/ChevronRight';
import { coreContext, connect } from '../core/connection';
import Select from './select';
import { LinkButton } from '../router';
import { search as locale, data as dataLocale } from '../locale';
import { deepEq } from '../../util';
import DisplayError from './error';
import DynamicHeightDiv, { layoutContext } from './dynamic-height-div';
import './overview-list.less';

const DEBOUNCE_TIME = 400; // ms
const DEFAULT_LIMITS = [10, 20, 50, 100];

function scrollToNode (node) {
    if (!node) return;
    node.scrollIntoView && node.scrollIntoView({ behavior: 'smooth' });
}

/// Renders an overview list over the items given by the specified task.
///
/// # Props
/// - task: task name. Output should adhere to a specific format (see e.g. codeholders/list)
/// - view: view name for detail views.
/// - options: task options
/// - parameters: task parameters. should adhere to a specific format (See e.g. codeholders/list)
///     - fields: objects may also have a `fixed` property to indicate fixed fields.
/// - expanded: bool, whether search/filters are expanded
/// - fields: field renderers
/// - onGetItemLink: should return a link to an item’s detail view
/// - onSetOffset: callback for changing the current page
/// - onSetLimit: callback for changing the current items per page
/// - onResult: result callback
/// - locale: localized field names
/// - notice: optional string to show below stats
/// - selection: if given will show checkboxes for selection. should have the Set interface, i.e.
///   add, delete, has
/// - updateView: argument list to create a data view that emits updates (if available)
/// - limits: available limit options. if not given, will use default
export default class OverviewList extends PureComponent {
    static contextType = coreContext;

    state = {
        /// same as #stale; why is this not one variable? because setState is asynchronous
        stale: true,
        /// true if a task is being run
        loading: false,
        /// current error
        error: null,
        /// current result
        result: null,
        /// if true, will animate in backwards
        animateBackwards: false,
    };

    /// whether the current data is stale (in relation to the options/parameters)
    #stale = true;

    /// currently loading task
    #currentTask = null;

    /// last time expanded was set to false
    #lastCollapseTime = 0;

    /// last time a page change button was pressed
    #lastPageChangeTime = 0;

    /// If true, will animate backwards and subsequently set this to false.
    #nextLoadIsBackwards = false;

    // node to scroll to on next load
    #scrollToNodeOnLoad = null;

    #listMetaNode = null;
    #compactPrevPageButton = null;
    #compactNextPageButton = null;

    load () {
        if (this.#currentTask) this.#currentTask.drop();
        const { task, options, parameters } = this.props;
        this.setState({ loading: true });
        const t = this.#currentTask = this.context.createTask(task, options || {}, parameters);
        this.#currentTask.runOnceAndDrop().then(result => {
            if (this.#currentTask !== t) return;
            this.setState({
                result,
                error: null,
                stale: false,
                loading: false,
                animateBackwards: this.#nextLoadIsBackwards,
            });
            if (this.props.onResult) this.props.onResult(result);

            if (this.#scrollToNodeOnLoad) {
                scrollToNode(this.#scrollToNodeOnLoad);
                this.#scrollToNodeOnLoad = null;
            }

            if (this.props.parameters.offset >= result.total && result.total !== 0) {
                // we’re out of bounds; adjust
                const limit = this.props.parameters.limit;
                this.props.onSetOffset(Math.floor(result.total / limit) * limit);
            } else {
                this.#nextLoadIsBackwards = false;
            }
        }).catch(error => {
            if (this.#currentTask !== t) return;
            this.#nextLoadIsBackwards = false;
            console.error(error); // eslint-disable-line no-console
            this.setState({ result: null, error, stale: false, loading: false });
        });
    }

    #reloadTimeout;
    #skipNextDebounce;

    /// Might trigger a reload.
    maybeReload () {
        if (this.#stale && !this.props.expanded) {
            if (this.#skipNextDebounce) {
                this.#skipNextDebounce = false;
                clearTimeout(this.#reloadTimeout);
                this.load();
            } else if (!this.#reloadTimeout) {
                this.#reloadTimeout = setTimeout(() => {
                    this.#reloadTimeout = null;
                    this.load();
                }, DEBOUNCE_TIME);
            }
            this.#stale = false;
        }
    }

    #updateView;

    bindUpdates () {
        if (this.#updateView) this.unbindUpdates();
        if (!this.props.updateView) return;
        this.#updateView = this.context.createDataView(...this.props.updateView);
        this.#updateView.on('update', () => {
            this.#stale = true;
            this.setState({ stale: true });
        });
    }

    unbindUpdates () {
        if (!this.#updateView) return;
        this.#updateView.drop();
        this.#updateView = null;
    }

    componentDidMount () {
        this.maybeReload();
        this.bindUpdates();
    }

    componentDidUpdate (prevProps) {
        const paramsDidChange = this.props.useDeepCmp
            ? !deepEq(prevProps.options, this.props.options) || !deepEq(prevProps.parameters, this.props.parameters)
            : prevProps.options !== this.props.options || prevProps.parameters !== this.props.parameters;

        if (paramsDidChange) {
            this.#stale = true;
            this.setState({ stale: true });
        }

        if (prevProps.expanded && !this.props.expanded) {
            this.#lastCollapseTime = Date.now();
            this.#nextLoadIsBackwards = false;
            this.setState({ animateBackwards: false });
        }

        if (!deepEq(prevProps.updateView, this.props.updateView)) {
            this.bindUpdates();
        }

        this.maybeReload();
    }

    componentWillUnmount () {
        clearTimeout(this.#reloadTimeout);
        this.unbindUpdates();
    }

    onPrevPageClick = e => {
        const isCompact = e.currentTarget.classList.contains('compact-page-button');
        const { parameters } = this.props;
        this.#skipNextDebounce = true;
        this.#nextLoadIsBackwards = true;
        this.props.onSetOffset(
            Math.max(0, Math.floor(parameters.offset / parameters.limit) - 1) * parameters.limit,
        );
        this.#lastPageChangeTime = Date.now();

        if (isCompact) {
            this.#scrollToNodeOnLoad = this.#compactNextPageButton.button;
        } else {
            this.#scrollToNodeOnLoad = this.#listMetaNode;
        }
    };

    onNextPageClick = e => {
        const isCompact = e.currentTarget.classList.contains('compact-page-button');
        const { parameters } = this.props;
        const { result } = this.state;
        if (!result) return;
        const maxPage = Math.floor((result.total - 1) / parameters.limit);
        this.#skipNextDebounce = true;
        this.props.onSetOffset(Math.min(
            maxPage,
            Math.floor(parameters.offset / parameters.limit) + 1
        ) * parameters.limit);
        this.#lastPageChangeTime = Date.now();

        if (isCompact) {
            this.#scrollToNodeOnLoad = this.#compactPrevPageButton.button;
        } else {
            this.#scrollToNodeOnLoad = this.#listMetaNode;
        }
    };

    render ({
        expanded,
        fields,
        parameters,
        onGetItemLink,
        locale: localizedFields,
        view,
        notice,
        selection,
    }, { error, result, stale, loading, animateBackwards }) {
        let className = 'overview-list';
        if (expanded) className += ' search-expanded';
        if (selection) className += ' is-selectable';
        if (stale) className += ' stale';

        let stats, contents, paginationText;
        let prevDisabled = true;
        let nextDisabled = true;
        if (error) {
            contents = (
                <Fragment>
                    <DisplayError error={error} />
                    <div class="retry-button-container">
                        <Button class="retry-button" onClick={() => {
                            this.#stale = true;
                            this.#skipNextDebounce = true;
                            this.maybeReload();
                        }}>
                            {dataLocale.retry}
                        </Button>
                    </div>
                </Fragment>
            );
        } else if (result) {
            const selectedFields = parameters.fields;
            const selectedFieldIds = selectedFields.map(x => x.id);
            let compiledFields = [];
            // first, push fixed fields
            for (const field of selectedFields) if (field.fixed) compiledFields.push(field);
            // then transient fields
            if (result.transientFields) {
                for (const id of result.transientFields) {
                    if (!selectedFieldIds.includes(id)) compiledFields.push({ id, transient: true });
                }
            }
            // finally, push user fields
            for (const field of selectedFields) if (!field.fixed) compiledFields.push(field);

            compiledFields = compiledFields.filter(({ id }) => !fields[id].hide);

            if (result.stats) {
                stats = locale.stats(
                    result.items.length,
                    result.stats.filtered,
                    result.total,
                    result.stats.time,
                );
            }

            paginationText = locale.paginationItems(
                Math.min(result.total, parameters.offset + 1),
                Math.min(result.total, parameters.offset + parameters.limit),
                result.total,
            );

            prevDisabled = parameters.offset === 0;
            nextDisabled = parameters.offset + parameters.limit >= result.total;

            contents = [
                <ListHeader
                    key="header"
                    selectedFields={compiledFields}
                    selection={selection}
                    fields={fields}
                    locale={localizedFields} />,
            ];

            contents.push(...result.items.map((id, i) => <ListItem
                view={view}
                cursed={result.cursed && result.cursed.includes(id)}
                key={id}
                id={id}
                selectedFields={compiledFields}
                fields={fields}
                onGetItemLink={onGetItemLink}
                index={animateBackwards ? result.items.length - i - 1 : i}
                animateBackwards={animateBackwards}
                skipAnimation={result.items.length > 100 && i > 30}
                selection={selection}
                expanded={expanded}
                lastCollapseTime={this.#lastCollapseTime}
                locale={localizedFields} />));
        }

        return (
            <div class={className}>
                <header class="list-meta" ref={node => this.#listMetaNode = node}>
                    <span>{stats}</span>
                    <CircularProgress class="loading-indicator" indeterminate={loading} small />
                </header>
                {notice ? <div class="list-notice">{notice}</div> : null}
                <Button
                    class="compact-page-button prev-page-button"
                    onClick={this.onPrevPageClick}
                    disabled={prevDisabled}
                    ref={node => this.#compactPrevPageButton = node}>
                    <ArrowUpIcon />
                    <div class="page-button-label">{locale.prevPage}</div>
                </Button>
                <DynamicHeightDiv
                    class="list-contents"
                    useCooldown
                    cooldown={PAGE_CHANGE_COOLDOWN}
                    lastChangeTime={this.#lastPageChangeTime}>
                    {contents}
                </DynamicHeightDiv>
                <Button
                    class="compact-page-button next-page-button"
                    onClick={this.onNextPageClick}
                    disabled={nextDisabled}
                    ref={node => this.#compactNextPageButton = node}>
                    <div class="page-button-label">{locale.nextPage}</div>
                    <ArrowDownIcon />
                </Button>
                <div class="compact-pagination">
                    {paginationText}
                </div>
                <div class="regular-pagination">
                    <div />
                    <div class="pagination-buttons">
                        <Select
                            value={parameters.limit}
                            onChange={value => {
                                this.props.onSetLimit(value | 0);
                            }}
                            items={(this.props.limits || DEFAULT_LIMITS).map(limit => ({
                                value: limit,
                                label: '' + limit,
                            }))} />
                        <Button class="page-button" icon onClick={this.onPrevPageClick} disabled={prevDisabled}>
                            <ArrowLeftIcon />
                        </Button>
                        <div class="pagination-text">{paginationText}</div>
                        <Button class="page-button" icon onClick={this.onNextPageClick} disabled={nextDisabled}>
                            <ArrowRightIcon />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

// time interval after changing page during which the results list will not change height
const PAGE_CHANGE_COOLDOWN = 400; // ms

function lineLayout (fields, selectedFields, selection) {
    const fieldWeights = selectedFields.map(x => fields[x.id].weight || 1);
    let weightSum = fieldWeights.reduce((a, b) => a + b, 0);
    if (selection) weightSum += 0.5;
    const actualUnit = 100 / weightSum;
    const unit = Math.max(10, actualUnit);

    const totalWidth = Math.round(weightSum * unit);

    const style = {
        gridTemplateColumns: fieldWeights.map(x => (x * actualUnit) + '%').join(' '),
        width: totalWidth > 100 ? `${totalWidth}%` : null,
    };
    if (selection) style.gridTemplateColumns = (actualUnit / 2) + '% ' + style.gridTemplateColumns;
    style.maxWidth = style.width;

    return style;
}

function ListHeader ({ fields, selectedFields, locale, selection }) {
    const style = lineLayout(fields, selectedFields, selection);

    const cells = selectedFields.map(({ id }) => (
        <div key={id} class="list-header-cell">
            <div class="cell-label">{locale[id]}</div>
            {/* sorting? */}
        </div>
    ));

    if (selection) {
        cells.unshift(<div key="selection" class="list-header-cell selection-cell"></div>);
    }

    return <div class="list-header" style={style}>{cells}</div>;
}

const ListItem = connect(props => ([props.view, {
    id: props.id,
    fields: props.selectedFields,
    noFetch: true,
}]))(data => ({ data }))(class ListItem extends PureComponent {
    #inTime = 0;
    #yOffset = new Spring(1, 0.5);
    #node = null;

    static contextType = layoutContext;

    componentDidMount () {
        if (this.props.lastCollapseTime > Date.now() - 500) this.#inTime = -0.5;

        globalAnimator.register(this);
    }

    getSnapshotBeforeUpdate (prevProps) {
        if (prevProps.index !== this.props.index) {
            return this.#node && this.#node.button ? this.#node.button.getBoundingClientRect() : null;
        }
        return null;
    }

    componentDidUpdate (prevProps, _, oldRect) {
        if (prevProps.index !== this.props.index && this.#node && oldRect) {
            const newRect = this.#node.button.getBoundingClientRect();
            this.#yOffset.value = oldRect.top - newRect.top;
            globalAnimator.register(this);
        }

        if (prevProps.expanded && !this.props.expanded) {
            this.#inTime = -0.5;
            globalAnimator.register(this);
        }

        if (!prevProps.data && this.props.data) this.context();
    }

    componentWillUnmount () {
        globalAnimator.deregister(this);
    }

    update (dt) {
        this.#inTime += dt;
        this.#yOffset.update(dt);

        if (this.props.skipAnimation) {
            this.#yOffset.finish();
            this.#inTime = 5;
        }

        if (!this.#yOffset.wantsUpdate() && this.#inTime >= 5) {
            this.#inTime = 5;
            globalAnimator.deregister(this);
        }

        this.forceUpdate();
    }

    render ({
        id,
        selectedFields,
        data,
        fields,
        onGetItemLink,
        index,
        locale,
        cursed,
        selection,
        animateBackwards,
    }) {
        if (!data) return null;

        const selectedFieldIds = selectedFields.map(x => x.id);

        const cells = selectedFields.map(({ id }) => {
            let Component;
            if (fields[id]) Component = fields[id].component;
            else Component = () => `unknown field ${id}`;

            return (
                <div key={id} class="list-item-cell">
                    <div class="cell-label">{locale[id]}</div>
                    <Component value={data[id]} item={data} fields={selectedFieldIds} />
                </div>
            );
        });

        if (selection) {
            cells.unshift(
                <div key="selection" class="list-item-cell selection-cell" onClick={e => {
                    // FIXME: hacky because we need to prevent the link from doing stuff
                    e.stopPropagation();
                    e.preventDefault();
                    if (selection.has(id)) selection.delete(id);
                    else selection.add(id);
                }}>
                    <Checkbox
                        checked={selection.has(id)} />
                </div>
            );
        }

        const style = lineLayout(fields, selectedFields, selection);

        const animScale = animateBackwards ? -1 : 1;
        const constOffset = this.#inTime === 5 ? 0 : 15 * Math.exp(-10 * this.#inTime);
        const spreadFactor = this.#inTime === 5 ? 0 : 4 * Math.exp(-10 * this.#inTime);
        const yOffset = this.#yOffset.value;

        Object.assign(style, {
            transform: `translateY(${animScale * (constOffset + spreadFactor * index) * 10 + yOffset}px)`,
            opacity: Math.max(0, Math.min(1 - spreadFactor * index / 2, 1)),
        });

        const itemLink = onGetItemLink ? onGetItemLink(id) : null;
        const ItemComponent = onGetItemLink ? LinkButton : 'div';

        return (
            <ItemComponent
                target={itemLink}
                class={'list-item' + (cursed ? ' is-cursed' : '')}
                style={style}
                ref={node => this.#node = node}
                onClick={e => {
                    // don’t keep focus on what is essentially button
                    e.currentTarget.blur();
                }}>
                {cells}
            </ItemComponent>
        );
    }
});
