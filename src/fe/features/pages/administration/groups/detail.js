import { h } from 'preact';
import { Button, CircularProgress } from '@cpsdqs/yamdl';
import Segmented from '../../../../components/segmented';
import Page from '../../../../components/page';
import CODEHOLDER_FIELDS from '../../codeholders/table-fields';
import OverviewList from '../../../../components/overview-list';
import GlobalFilterNotice from '../../codeholders/global-filter-notice';
import Meta from '../../../meta';
import { connect } from '../../../../core/connection';
import { LinkButton } from '../../../../router';
import { adminGroups as locale, codeholders as codeholdersLocale } from '../../../../locale';
import { connectPerms } from '../../../../perms';
import PermsEditor from '../perms-editor';
import './detail.less';

export default connect(props => ['adminGroups/group', {
    id: props.match[1],
}])((item, core) => ({ item, core }))(connectPerms(class AdminGroupDetailPage extends Page {
    state = {
        tab: 'codeholders',
        // TODO: store these in navigation data because users might move to/from other pages a lot (e.g. codeholders)
        codeholdersOffset: 0,
        clientsOffset: 0,
        parameters: {
            limit: 10,
        },
    };

    render ({ item, match, perms, core }, { tab, parameters }) {
        if (!item) return (
            <div class="admin-group-detail-page is-loading">
                <CircularProgress indeterminate />
            </div>
        );
        const id = match[1];

        const itemsTask = tab === 'clients' ? 'adminGroups/listClients' : 'adminGroups/listCodeholders';
        const itemsView = tab === 'clients' ? 'clients/client' : 'codeholders/codeholder';
        const offsetKey = tab === 'clients' ? 'clientsOffset' : 'codeholdersOffset';
        const itemsOffset = this.state[offsetKey];
        const itemFields = tab === 'clients'
            ? [] // TODO
            : [{ id: 'code', sorting: 'asc' }, { id: 'name', sorting: 'asc' }];
        const itemFieldSpecs = tab === 'clients'
            ? {} // TODO
            : CODEHOLDER_FIELDS;
        const itemsLocale = tab === 'clients'
            ? {} // TODO
            : codeholdersLocale.fields;
        const onGetItemLink = tab === 'clients'
            ? null // TODO
            : id => `/membroj/${id}`;
        const itemsNotice = tab === 'clients'
            ? null
            : <GlobalFilterNotice perms={perms} />;

        const addItem = tab === 'clients'
            ? () => core.createTask('adminGroups/addClient', { group: id })
            : () => core.createTask('adminGroups/addCodeholder', { group: id });

        const actions = [];
        actions.push({
            overflow: true,
            label: locale.delete,
            action: () => core.createTask('adminGroups/delete', {}, { id }),
        });

        const permsTarget = `/administrado/grupoj/${id}/permesiloj`;

        return (
            <div class="admin-group-detail-page">
                <Meta
                    title={locale.detailTitle}
                    actions={actions} />
                <div class="group-header">
                    <div class="group-title">{item.name}</div>
                    <div class="group-description">{item.description}</div>
                </div>
                <Segmented selected={tab} onSelect={tab => this.setState({ tab })}>
                    {[
                        { id: 'codeholders', label: '[TMP CH]' },
                        { id: 'clients', label: '[TMP API]' },
                    ]}
                </Segmented>
                <LinkButton target={permsTarget}>
                    [[edit perms]]
                </LinkButton>
                <Button onClick={addItem}>
                    [[add one]]
                </Button>
                <OverviewList
                    task={itemsTask}
                    notice={itemsNotice}
                    view={itemsView}
                    options={{
                        group: id,
                    }}
                    fields={itemFieldSpecs}
                    useDeepCmp
                    parameters={{
                        ...parameters,
                        fields: itemFields,
                        offset: itemsOffset,
                    }}
                    onGetItemLink={onGetItemLink}
                    onSetOffset={offset => this.setState({ [offsetKey]: offset })}
                    onSetLimit={limit => this.setState({
                        parameters: { ...this.state.parameters, limit },
                    })}
                    locale={itemsLocale} />
            </div>
        );
    }
}));
