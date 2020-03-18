import { h } from 'preact';
import { useState, Fragment, PureComponent } from 'preact/compat';
import { AppBarProxy, Button, MenuIcon, Checkbox, Dialog, TextField } from '@cpsdqs/yamdl';
import Select from '../../../components/select';
import Segmented from '../../../components/segmented';
import { CardStackItem } from '../../../components/card-stack';
import { coreContext } from '../../../core/connection';
import { codeholders as locale } from '../../../locale';

export default function AddrLabelGenContainer ({
    open, lvIsCursed, options, onClose,
}) {
    const [showSuccess, setShowSuccess] = useState(false);

    return (
        <Fragment>
            <CardStackItem
                open={open}
                onClose={onClose}
                depth={0}
                appBar={
                    <AppBarProxy
                        menu={<Button icon small onClick={onClose}>
                            <MenuIcon type="close" />
                        </Button>}
                        title={locale.addrLabelGen.title}
                        priority={9} />
                }>
                <coreContext.Consumer>
                    {core => (
                        <AddrLabelGen
                            lvIsCursed={lvIsCursed}
                            options={options}
                            onSuccess={() => {
                                onClose();
                                setShowSuccess(true);
                            }}
                            core={core} />
                    )}
                </coreContext.Consumer>
            </CardStackItem>
            <Dialog
                backdrop
                open={showSuccess}
                onClose={() => setShowSuccess(false)}
                actions={[
                    {
                        label: locale.addrLabelGen.closeDialog,
                        action: () => setShowSuccess(false),
                    },
                ]}>
                {locale.addrLabelGen.success}
            </Dialog>
        </Fragment>
    );
}

function AddrLabelGen ({ lvIsCursed, onSuccess, options, core }) {
    const [settings, setSettings] = useState({
        language: 'eo',
        latin: false,
        includeCode: true,
        paper: 'A4',
        margins: {
            top: 72,
            left: 72,
            right: 72,
            bottom: 72,
        },
        cols: 2,
        rows: 5,
        colGap: 72,
        rowGap: 72,
        cellPadding: 8,
        fontSize: 12,
        drawOutline: false,
    });
    const [view, setView] = useState({
        unit: 'pt',
    });
    const [isLoading, setLoading] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);

    const sendRequest = () => {
        setLoading(true);

        core.createTask('codeholders/makeAddressLabels', options, settings)
            .runOnceAndDrop()
            .then(onSuccess).catch(err => {
                console.error(err); // eslint-disable-line no-console
                setResultOpen(true);
            }).then(() => setLoading(false));
    };

    return (
        <div class="codeholders-addr-label-gen">
            {lvIsCursed ? <div class="cursed-notice">
                {locale.addrLabelGen.cursedNotice}
            </div> : null}
            <div class="addr-label-gen-inner">
                <GenPreview value={settings} options={options} />
                <GenSettings
                    value={settings}
                    onChange={setSettings}
                    view={view}
                    onViewChange={setView} />
            </div>
            <footer class="addr-label-gen-footer">
                <span class="phantom" />
                <Button raised class="generate-btn" onClick={sendRequest} disabled={isLoading}>
                    {locale.addrLabelGen.generate}
                </Button>
            </footer>
            <Dialog
                backdrop
                open={!!resultOpen}
                onClose={() => setResultOpen(false)}
                actions={[
                    {
                        label: locale.addrLabelGen.closeDialog,
                        action: () => setResultOpen(false),
                    },
                ]}>
                {locale.addrLabelGen.genericError}
            </Dialog>
        </div>
    );
}

/* eslint-disable react/display-name */

const ValCheckbox = ({ value, onChange }) => <Checkbox checked={value} onChange={onChange} />;
const boundedNumber = (min, max, step, unit) => ({ value, onChange }) =>
    <TextField
        type="number"
        class={unit === 'mm' ? 'is-mm' : ''}
        step={step}
        trailing={unit}
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(+e.target.value)}
        onBlur={() => setImmediate(() => {
            const bounded = Math.max(min, Math.min(value | 0, max));
            if (bounded !== value) onChange(bounded);
        })} />;

function UnitSwitch ({ value, onChange }) {
    return (
        <div class="unit-switch">
            <Segmented
                selected={value.unit}
                onSelect={unit => onChange({ ...value, unit })}>
                {[
                    { id: 'pt', label: 'pt' },
                    { id: 'mm', label: 'mm' },
                ]}
            </Segmented>
        </div>
    );
}

const U16PtEditorRaw = boundedNumber(0, 65535, 1, 'pt');
const ptToIn = pt => pt / 72;
const ptFromIn = i => i * 72;
const ptToMm = pt => ptToIn(pt) * 25.4;
const ptFromMm = mm => ptFromIn(mm / 25.4);
const U16MmEditorRaw = boundedNumber(ptToMm(0), ptToMm(65535), 1e-15, 'mm');

function U16PtEditor ({ value, onChange, view }) {
    if (view.unit === 'pt') return <U16PtEditorRaw value={Math.round(value)} onChange={onChange} />;
    else if (view.unit === 'mm') {
        const projectedValue = ptToMm(value);
        const projectedOnChange = v => onChange(ptFromMm(v));
        return <U16MmEditorRaw value={projectedValue} onChange={projectedOnChange} />;
    }
    return '??';
}

const SETTINGS = {
    language: ({ value, onChange }) => (
        <Select
            value={value}
            onChange={onChange}
            items={Object.entries(locale.csvOptions.countryLocales)
                .map(([id, label]) => ({ value: id, label }))} />
    ),
    latin: ValCheckbox,
    includeCode: ValCheckbox,
    paper: ({ value, onChange }) => (
        <Select
            value={value}
            onChange={onChange}
            items={Object.entries(locale.addrLabelGen.paperSizes)
                .map(([id, label]) => ({ value: id, label }))} />
    ),
    _unitSwitch: UnitSwitch,
    margins: MarginsEditor,
    cols: boundedNumber(1, 20, 1),
    rows: boundedNumber(1, 50, 1),
    colGap: U16PtEditor,
    rowGap: U16PtEditor,
    cellPadding: U16PtEditor,
    fontSize: boundedNumber(8, 30, 1, 'pt'),
    drawOutline: ValCheckbox,
};

function GenSettings ({ value, onChange, view, onViewChange }) {
    const items = Object.entries(SETTINGS).map(([id, Editor]) => {
        if (id.startsWith('_')) {
            return (
                <div class="settings-item" key={id} data-id={id}>
                    <Editor value={view} onChange={onViewChange} />
                </div>
            );
        }
        return (
            <div class="settings-item" key={id} data-id={id}>
                <label class="item-label">{locale.addrLabelGen.labels[id]}</label>
                <Editor
                    value={value[id]}
                    onChange={v => onChange({ ...value, [id]: v })}
                    view={view} />
            </div>
        );
    });

    return <div class="gen-settings">{items}</div>;
}

function MarginsEditor ({ value, onChange, view }) {
    return (
        <div class="margins">
            <div class="margins-line">
                <U16PtEditor value={value.top} onChange={v => onChange({ ...value, top: v })} view={view} />
            </div>
            <div class="margins-line is-line-two">
                <U16PtEditor value={value.left} onChange={v => onChange({ ...value, left: v })} view={view} />
                <U16PtEditor value={value.right} onChange={v => onChange({ ...value, right: v })} view={view} />
            </div>
            <div class="margins-line">
                <U16PtEditor value={value.bottom} onChange={v => onChange({ ...value, bottom: v })} view={view} />
            </div>
        </div>
    );
}

// From: https://github.com/foliojs/pdfkit/blob/
// b13423bf0a391ed1c33a2e277bc06c00cabd6bf9/lib/page.coffee#L72-L122
const PAGE_SIZES = {
    A3: [841.89, 1190.55],
    A4: [595.28, 841.89],
    A5: [419.53, 595.28],
    LETTER: [612.00, 792.00],
    LEGAL: [612.00, 1008.00],
    FOLIO: [612.00, 936.00],
    EXECUTIVE: [521.86, 756.00],
};

function GenPreview ({ value, options }) {
    const [width, height] = PAGE_SIZES[value.paper];
    const viewBox = `0 0 ${width} ${height}`;

    const items = [];
    const itemWidth = (width - value.margins.left - value.margins.right
        - (value.cols - 1) * value.colGap) / value.cols;
    const itemHeight = (height - value.margins.top - value.margins.bottom
        - (value.rows - 1) * value.rowGap) / value.rows;
    for (let y = 0; y < value.rows; y++) {
        for (let x = 0; x < value.cols; x++) {
            const posX = value.margins.left + x * (value.colGap + itemWidth);
            const posY = value.margins.top + y * (value.rowGap + itemHeight);
            const key = `${posX}-${posY}`;

            items.push(
                <rect
                    key={key + 'r'}
                    x={posX}
                    y={posY}
                    width={itemWidth}
                    height={itemHeight}
                    stroke-width="3" // eslint-disable-line react/no-unknown-property
                    stroke-dasharray="20" // eslint-disable-line react/no-unknown-property
                    stroke="#ddd"
                    fill="none" />
            );

            items.push(
                <rect
                    key={key + 'ri'}
                    x={posX + value.cellPadding}
                    y={posY + value.cellPadding}
                    width={itemWidth - 2 * value.cellPadding}
                    height={itemHeight - 2 * value.cellPadding}
                    stroke-width="3" // eslint-disable-line react/no-unknown-property
                    stroke-dasharray={value.drawOutline ? null : '10'} // eslint-disable-line react/no-unknown-property
                    stroke={value.drawOutline ? '#000' : '#999'}
                    fill="none" />
            );

            const lines = [[4, 1], [9, 0], [7, 0], [4, 0], [5, 0]];

            if (!value.includeCode) {
                lines.shift(); // remove first line
            }

            const lineHeight = value.fontSize;
            const lineSpacing = Math.max(-lineHeight, Math.min(
                lineHeight / 2,
                (itemHeight - 2 * value.cellPadding
                    - lines.length * lineHeight) / (lines.length - 1)
            ));

            let dy = 0;
            for (const [lineLength, lineAlignment] of lines) {
                let x;
                const width = Math.min(itemWidth - 2 * value.cellPadding, lineHeight * lineLength);
                if (lineAlignment === 0) {
                    x = posX + value.cellPadding;
                } else {
                    x = posX + itemWidth - value.cellPadding - width;
                }

                items.push(
                    <rect
                        key={key + 'rl' + dy}
                        x={x}
                        y={posY + value.cellPadding + dy * (lineSpacing + lineHeight)}
                        width={width}
                        height={lineHeight}
                        fill="#000"
                        rx={lineHeight / 2} />
                );
                dy++;
            }
        }
    }

    return (
        <div class="gen-preview">
            <svg class="gen-preview-inner" viewBox={viewBox}>
                {items}
            </svg>
            <AddrLabelStats value={value} options={options} />
        </div>
    );
}

class AddrLabelStats extends PureComponent {
    state = {
        withAddresses: null,
        total: null,
    };

    static contextType = coreContext;

    updateMembersWithAddresses () {
        if (this.loadingMembers) return;
        this.loadingMembers = true;

        const options = { ...this.props.options };
        const addressFilter = { 'addressLatin.city': { $neq: null } };
        const jsonFilter = { ...(options.jsonFilter && options.jsonFilter.filter || {}) };
        options.jsonFilter = {
            filter: options.jsonFilter && !options.jsonFilter._disabled
                ? { $and: [jsonFilter, addressFilter] }
                : addressFilter,
        };
        options.offset = 0;
        options.limit = 1;

        this.context.createTask('codeholders/list', {}, options).runOnceAndDrop().then(({ total }) => {
            this.setState({ withAddresses: total });
        }).then(() => {
            const options = { ...this.props.options };
            options.offset = 0;
            options.limit = 1;
            return this.context.createTask('codeholders/list', {}, options).runOnceAndDrop();
        }).then(({ total }) => {
            this.setState({ total });
        }).catch(err => {
            console.error(err); // eslint-disable-line no-console
            this.reloadTimeout = setTimeout(() => this.updateMembersWithAddresses(), 1000);
        }).then(() => this.loadingMembers = false);
    }

    componentDidMount () {
        // do this a bit later so the url query filter can be decoded first
        // as we might get incongruent data otherwise
        setImmediate(() => this.updateMembersWithAddresses());
    }

    componentWillUnmount () {
        clearTimeout(this.reloadTimeout);
    }

    render () {
        if (this.state.total === null) return;
        const { value } = this.props;
        const { total, withAddresses } = this.state;
        return (
            <div class="stats">
                {locale.addrLabelGen.stats({
                    total,
                    withAddresses,
                    perPage: value.rows * value.cols,
                    pages: Math.ceil(withAddresses / (value.rows * value.cols)),
                })}
            </div>
        );
    }
}
