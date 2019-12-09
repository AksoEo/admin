//! This file contains code for both memberships and roles, because they’re really similar.

import { h } from 'preact';
import { PureComponent } from 'preact/compat';
import AddIcon from '@material-ui/icons/Add';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Page from '../../../components/page';
import DataList from '../../../components/data-list';
import data from '../../../components/data';
import { coreContext } from '../../../core/connection';
import { codeholders as locale } from '../../../locale';
import Meta from '../../meta';
import { LinkButton } from '../../../router';
import './membership.less';

function makeInDetailView (task, signal, render, empty, target) {
    return class MRInDetailView extends PureComponent {
        state = {
            preview: [],
        };

        static contextType = coreContext;

        loadPreview () {
            this.context.createTask(task, { id: this.props.id }, {
                offset: 0,
                limit: 20,
            }).runOnceAndDrop().then(res => {
                this.setState({ preview: res.items });
            }).catch(err => {
                console.error('Failed to fetch membership/roles', err); // eslint-disable-line no-console
            });
        }

        #sigView;
        bindSigView () {
            if (this.#sigView) this.#sigView.drop();
            this.#sigView = this.context.createDataView(signal, {
                id: this.props.id,
            });
            this.#sigView.on('update', () => this.loadPreview());
        }

        componentDidMount () {
            this.loadPreview();
            this.bindSigView();
        }
        componentDidUpdate (prevProps) {
            if (prevProps.id !== this.props.id) {
                this.loadPreview();
                this.bindSigView();
            }
        }

        render () {
            const memberships = this.state.preview.map(render);

            let noMemberships = false;
            if (!memberships.length) {
                noMemberships = true;
                memberships.push(
                    <span key={0} class="membership-empty">
                        {empty}
                    </span>
                );
            }

            return (
                <div class="membership-editor">
                    <div class={'memberships' + (noMemberships ? ' is-empty' : '')}>
                        {memberships}
                    </div>
                    <LinkButton
                        icon
                        small
                        class="membership-edit-button"
                        style={{ lineHeight: '36px' }} // FIXME: weird
                        target={`/membroj/${this.props.id}/${target}`}>
                        <MoreHorizIcon style={{ verticalAlign: 'middle' }} />
                    </LinkButton>
                </div>
            );
        }
    };
}

export const MembershipInDetailView = makeInDetailView(
    'codeholders/listMemberships',
    'codeholders/codeholderSigMemberships',
    item => {
        let className = 'membership';
        if (item.givesMembership) className += ' gives-membership';
        if (item.lifetime) className += ' lifetime';
        return (
            <span key={item.id} class={className}>
                <span class="membership-name">{item.nameAbbrev}</span>
                <span class="membership-year">{item.year}</span>
            </span>
        );
    },
    locale.noMemberships,
    'membrecoj',
);

export const RolesInDetailView = makeInDetailView(
    'codeholders/listRoles',
    'codeholders/codeholderSigRoles',
    item => {
        return (
            <span key={item.id} class="role">
                {item.role.name}
            </span>
        );
    },
    locale.noRoles,
    'roloj',
);

function makePage (createTask, signal, listTask, deleteTask, deleteKey, renderItem, title, add, empty) {
    return class MRPage extends Page {
        static contextType = coreContext;

        render () {
            const canEdit = true; // TODO

            // get codeholder id from the match above
            const id = +this.props.matches[this.props.matches.length - 2][1];

            return (
                <div class="codeholder-memberships-page">
                    <Meta
                        title={title}
                        priority={9}
                        actions={[canEdit && {
                            label: add,
                            icon: <AddIcon />,
                            action: () => {
                                this.context.createTask(createTask, { id }); // task view
                            },
                        }].filter(x => x)} />
                    <DataList
                        updateView={[signal, { id }]}
                        onLoad={(offset, limit) =>
                            this.context.createTask(listTask, {
                                id,
                            }, { offset, limit }).runOnceAndDrop()}
                        emptyLabel={empty}
                        itemHeight={56}
                        onRemove={canEdit && (item =>
                            this.context.createTask(deleteTask, {
                                id,
                            }, { [deleteKey]: item.id }).runOnceAndDrop())}
                        renderItem={renderItem} />
                </div>
            );
        }
    };
}

export const MembershipPage = makePage(
    'codeholders/addMembership',
    'codeholders/codeholderSigMemberships',
    'codeholders/listMemberships',
    'codeholders/deleteMembership',
    'membership',
    item => (
        <div class="membership-item">
            <div class="item-name">
                {item.name}
                {item.nameAbbrev ? ` (${item.nameAbbrev})` : null}
            </div>
            <div class="item-desc">
                {item.year}
                {', '}
                {locale.membership.lifetime[item.lifetime ? 'yes' : 'no']}
                {', '}
                {locale.membership.givesMembership[item.givesMembership ? 'yes' : 'no']}
                {/* TODO: more stuff */}
            </div>
        </div>
    ),
    locale.memberships,
    locale.addMembership,
    locale.noMemberships,
);

export const RolesPage = makePage(
    'codeholders/addRole',
    'codeholders/codeholderSigRoles',
    'codeholders/listRoles',
    'codeholders/deleteRole',
    'role',
    item => (
        <div class="role-item">
            <div class="item-name">
                {item.role.name}
            </div>
            <div class="item-desc">
                <data.date.inlineRenderer value={item.durationFrom * 1000} />
                {'–'}
                <data.date.inlineRenderer value={item.durationTo * 1000} />
            </div>
        </div>
    ),
    locale.roles,
    locale.addRole,
    locale.noRoles,
);
