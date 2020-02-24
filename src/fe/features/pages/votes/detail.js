import { h } from 'preact';
import EditIcon from '@material-ui/icons/Edit';
import DetailView from '../../../components/detail';
import Page from '../../../components/page';
import Meta from '../../meta';
import { coreContext } from '../../../core/connection';
import { connectPerms } from '../../../perms';
import { votes as locale } from '../../../locale';
import {
    voterCodeholders,
    voterCodeholdersMemberFilter,
    viewerCodeholders,
    viewerCodeholdersMemberFilter,
    ballotsSecret,
    type,
    config,
} from './config';
import FIELDS from './fields';

const DETAIL_FIELDS = {
    ...FIELDS,
    type: { component: type },
    ballotsSecret: { component: ballotsSecret },
    config: { component: config },
    voterCodeholders: { component: voterCodeholders },
    voterCodeholdersMemberFilter: { component: voterCodeholdersMemberFilter, shouldHide: (_, editing) => editing },
    viewerCodeholders: { component: viewerCodeholders },
    viewerCodeholdersMemberFilter: { component: viewerCodeholdersMemberFilter, shouldHide: (_, editing) => editing },
};

export default connectPerms(class VoteDetailpage extends Page {
    static contextType = coreContext;

    state = {
        edit: null,
        org: null,
    };

    onEndEdit = () => {
        this.props.editing && this.props.editing.pop(true);
        this.setState({ edit: null });
    };

    #commitTask = null;
    onCommit = changedFields => {
        if (!this.props.editing || this.#commitTask) return;
        if (!changedFields.length) {
            // nothing changed, so we can just pop the editing state
            this.props.editing.pop(true);
            return;
        }

        this.#commitTask = this.context.createTask('votes/update', {
            id: this.props.match[1],
            _changedFields: changedFields,
        }, this.state.edit);
        this.#commitTask.on('success', this.onEndEdit);
        this.#commitTask.on('drop', () => this.#commitTask = null);
    };

    componentWillUnmount () {
        if (this.#commitTask) this.#commitTask.drop();
    }

    /// Mildly hacky function for getting the org so we can check for perms
    setOrg (org) {
        if (this.state.org !== org) this.setState({ org });
    }

    render ({ match, perms, editing }, { edit, org }) {
        const id = match[1];

        const actions = [];

        if (perms.hasPerm(`votes.delete.${org}`)) {
            actions.push({
                label: locale.delete.menuItem,
                action: () => this.context.createTask('votes/delete', {}, { id }),
                overflow: true,
            });
        }

        if (perms.hasPerm(`votes.update.${org}`)) {
            actions.push({
                icon: <EditIcon style={{ verticalAlign: 'middle' }} />,
                label: locale.update,
                action: () => this.props.push('redakti', true),
            });
        }

        const headerComponent = makeHeader(this);

        return (
            <div class="client-detail-page">
                <Meta
                    title={locale.detailTitle}
                    actions={actions} />

                <DetailView
                    view="votes/vote"
                    id={id}
                    options={{
                        fields: Object.keys(DETAIL_FIELDS),
                    }}
                    header={headerComponent}
                    fields={DETAIL_FIELDS}
                    locale={locale}
                    edit={edit}
                    onEditChange={edit => this.setState({ edit })}
                    editing={editing}
                    onEndEdit={this.onEndEdit}
                    onCommit={this.onCommit}
                    onDelete={() => this.props.pop()} />
            </div>
        );
    }
});

const makeHeader = (owner) => function Header ({ item, editing }) {
    if (editing) return null;
    owner.setOrg(item.org);

    return (
        <div class="client-header">
            <h1>{item.name}</h1>
        </div>
    );
};
