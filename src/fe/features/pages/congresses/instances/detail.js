import { h } from 'preact';
import { TextField } from '@cpsdqs/yamdl';
import EditIcon from '@material-ui/icons/Edit';
import Page from '../../../../components/page';
import DetailShell from '../../../../components/detail-shell';
import DynamicHeightDiv from '../../../../components/dynamic-height-div';
import TejoIcon from '../../../../components/tejo-icon';
import UeaIcon from '../../../../components/uea-icon';
import Tabs from '../../../../components/tabs';
import { date } from '../../../../components/data';
import Meta from '../../../meta';
import { coreContext } from '../../../../core/connection';
import { connectPerms } from '../../../../perms';
import { congressInstances as locale } from '../../../../locale';
import { FIELDS } from './fields';
import Map from '../map';
import './detail.less';

export default connectPerms(class CongressInstancePage extends Page {
    state = {
        edit: null,
        org: 'meow', // dummy placeholder
        tab: 'locations',
    };

    static contextType = coreContext;

    #commitTask = null;
    onCommit = changedFields => {
        if (!this.props.editing || this.#commitTask) return;
        if (!changedFields.length) {
            // nothing changed, so we can just pop the editing state
            this.props.editing.pop(true);
            return;
        }

        this.#commitTask = this.context.createTask('congresses/updateInstance', {
            id: this.props.match[1],
            _changedFields: changedFields,
        }, this.state.edit);
        this.#commitTask.on('success', this.onEndEdit);
        this.#commitTask.on('drop', () => this.#commitTask = null);
    };
    onEndEdit = () => {
        this.props.editing && this.props.editing.pop(true);
        this.setState({ edit: null });
    };

    get congress () {
        return +this.props.matches[this.props.matches.length - 3][1];
    }
    get id () {
        return +this.props.match[1];
    }

    render ({ perms, editing }, { org, tab }) {
        const { congress, id } = this;

        const actions = [];

        if (perms.hasPerm(`congress_instances.delete.${org}`)) {
            actions.push({
                label: locale.delete.menuItem,
                action: () => this.context.createTask('congresses/delete', {}, { id }),
                overflow: true,
            });
        }

        if (perms.hasPerm(`congress_instances.update.${org}`)) {
            actions.push({
                icon: <EditIcon style={{ verticalAlign: 'middle' }} />,
                label: locale.update.menuItem,
                action: () => this.props.push('redakti', true),
            });
        }

        return (
            <div class="congress-instance-detail-page">
                <Meta
                    title={locale.detailTitle}
                    actions={actions} />
                <DetailShell
                    view="congresses/instance"
                    id={id}
                    options={{ congress }}
                    editing={editing}
                    edit={this.state.edit}
                    onEditChange={edit => this.setState({ edit })}
                    onEndEdit={this.onEndEdit}
                    onCommit={this.onCommit}
                    locale={locale}
                    onDelete={() => this.props.pop()}>
                    {data => (
                        <div class="instance-inner">
                            <Header
                                editing={editing}
                                onItemChange={edit => this.setState({ edit })}
                                item={this.state.edit || data}
                                org={org}
                                tab={tab} 
                                onTabChange={tab => this.setState({ tab })} />
                        </div>
                    )}
                </DetailShell>
                <DetailShell
                    /* this is kind of a hack to get the org field */
                    view="congresses/congress"
                    id={congress}
                    fields={{}}
                    locale={{}}
                    onData={data => data && this.setState({ org: data.org })} />
            </div>
        );
    }
});

function Header ({ item, editing, onItemChange, org, tab, onTabChange }) {
    let orgIcon;
    if (org === 'tejo') orgIcon = <TejoIcon />;
    else if (org === 'uea') orgIcon = <UeaIcon />;

    return (
        <div class="instance-header">
            <DynamicHeightDiv useFirstHeight>
                <div class="header-title">
                    {!editing && <span class="org-icon">{orgIcon}</span>}
                    {editing ? (
                        <TextField
                            class="title-editor"
                            outline
                            label={locale.fields.name}
                            value={item.name}
                            onChange={e => onItemChange({ ...item, name: e.target.value })} />
                    ) : item.name}
                </div>
            </DynamicHeightDiv>
            <DynamicHeightDiv useFirstHeight>
                {editing ? (
                    <div class="header-timespan is-editing">
                        <date.editor
                            class="date-bound-editor"
                            outline
                            label={locale.fields.dateFrom}
                            value={item.dateFrom}
                            onChange={dateFrom => onItemChange({ ...item, dateFrom })} />
                        <date.editor
                            class="date-bound-editor"
                            outline
                            label={locale.fields.dateTo}
                            value={item.dateTo}
                            onChange={dateTo => onItemChange({ ...item, dateTo })} />
                    </div>
                ) : (
                    <div class="header-timespan">
                        <date.renderer value={item.dateFrom} />
                        {'–'}
                        <date.renderer value={item.dateTo} />
                    </div>
                )}
            </DynamicHeightDiv>
            <Tabs
                value={editing ? null : tab}
                onChange={!editing && onTabChange}
                tabs={locale.tabs} />
        </div>
    );
}

function Footer ({ item }) {
    if (!item) return null;

    return (
        <div class="instance-detail-footer">
            <Map
                center={item.locationCoords}
                zoom={10}
                markers={[
                    {
                        location: item.locationCoords,
                    },
                ]} />
        </div>
    );
}